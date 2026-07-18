package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.viewmodel.LicenseSathiViewModel
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import android.util.Log
import kotlinx.coroutines.launch
import com.example.BuildConfig

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun OnboardingScreen(
  viewModel: LicenseSathiViewModel,
  onFinished: () -> Unit,
  modifier: Modifier = Modifier
) {
  val keyboardController = LocalSoftwareKeyboardController.current
  val focusManager = LocalFocusManager.current
  val context = androidx.compose.ui.platform.LocalContext.current
  val scope = rememberCoroutineScope()
  val activity = remember(context) {
    var c = context
    while (c is android.content.ContextWrapper) {
      if (c is android.app.Activity) break
      c = c.baseContext
    }
    c as? android.app.Activity
  }

  var step by remember { mutableStateOf(1) } // 1: Language & Splash, 2: Email Login & Google, 3: Profile & Category Preferences
  
  var name by remember { mutableStateOf("") }
  var selectedLanguage by remember { mutableStateOf("np") }
  var email by remember { mutableStateOf("") }
  var password by remember { mutableStateOf("") }
  var isSignUpMode by remember { mutableStateOf(false) }
  var isGoogleLogin by remember { mutableStateOf(false) }
  
  // Category preferences: Multiple categories
  var prefCatA by remember { mutableStateOf(true) }
  var prefCatB by remember { mutableStateOf(false) }
  var prefCatK by remember { mutableStateOf(false) }
  var prefCatG by remember { mutableStateOf(false) }

  val isAuthenticating by viewModel.isAuthenticating.collectAsState()
  val loginError by viewModel.loginError.collectAsState()
  val userProgressState by viewModel.userProgress.collectAsState()

  // If already logged in / onboarded, automatically trigger finish
  LaunchedEffect(userProgressState) {
    if (userProgressState?.hasOnboarded == true) {
      onFinished()
    }
  }

  val containerColor = MaterialTheme.colorScheme.background

  Box(
    modifier = modifier
      .fillMaxSize()
      .background(containerColor)
      .padding(24.dp)
  ) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .verticalScroll(rememberScrollState()),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
      Spacer(modifier = Modifier.height(16.dp))

      // Logo/Header
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
      ) {
        Text(
          text = "लाइसेन्स साथी",
          style = MaterialTheme.typography.headlineLarge.copy(
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            fontSize = 32.sp
          ),
          textAlign = TextAlign.Center
        )
        Text(
          text = "License Sathi",
          style = MaterialTheme.typography.titleMedium.copy(
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
            letterSpacing = 1.sp
          ),
          textAlign = TextAlign.Center
        )
        
        // Progress Dots / Step Indicator
        Row(
          horizontalArrangement = Arrangement.spacedBy(8.dp),
          modifier = Modifier.padding(top = 12.dp)
        ) {
          repeat(3) { index ->
            val active = index + 1 == step
            Box(
              modifier = Modifier
                .size(width = if (active) 24.dp else 8.dp, height = 8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(
                  if (active) MaterialTheme.colorScheme.primary
                  else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                )
            )
          }
        }
      }

      Spacer(modifier = Modifier.height(12.dp))

      // Step Contents
      AnimatedContent(
        targetState = step,
        transitionSpec = {
          fadeIn() with fadeOut()
        },
        label = "OnboardingSteps"
      ) { targetStep ->
        when (targetStep) {
          1 -> {
            // STEP 1: Language Selection & Welcoming
            Column(
              verticalArrangement = Arrangement.spacedBy(16.dp),
              horizontalAlignment = Alignment.CenterHorizontally
            ) {
              Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
              ) {
                Column(
                  modifier = Modifier.padding(20.dp),
                  verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                  Text(
                    text = "भाषा छान्नुहोस् / Select Language",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                  )
                  
                  // Language Toggles
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                  ) {
                    val languages = listOf("np" to "नेपाली (Nepali)", "en" to "English")
                    languages.forEach { (code, label) ->
                      val isSelected = selectedLanguage == code
                      Box(
                        modifier = Modifier
                          .weight(1f)
                          .clip(RoundedCornerShape(12.dp))
                          .background(
                            if (isSelected) MaterialTheme.colorScheme.primaryContainer
                            else MaterialTheme.colorScheme.surfaceVariant
                          )
                          .clickable { selectedLanguage = code }
                          .padding(vertical = 16.dp, horizontal = 8.dp)
                          .testTag("lang_toggle_$code"),
                        contentAlignment = Alignment.Center
                      ) {
                        Text(
                          text = label,
                          style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant
                          )
                        )
                      }
                    }
                  }

                  Divider(modifier = Modifier.padding(vertical = 8.dp), color = MaterialTheme.colorScheme.outlineVariant)

                  Text(
                    text = if (selectedLanguage == "np") {
                      "आफ्नो सवारी चालक अनुमति पत्र (लाइसेन्स) लिखित परीक्षा र प्रयोगात्मक (ट्रायल) को तयारी अब सजिलै फोनबाटै गर्नुहोस्।"
                    } else {
                      "Prepare for your vehicle driver's licence written and trial exams directly from your smartphone, anytime, anywhere."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                  )
                }
              }

              Button(
                onClick = { step = 2 },
                modifier = Modifier
                  .fillMaxWidth()
                  .height(56.dp)
                  .testTag("onboarding_step1_next"),
                shape = RoundedCornerShape(16.dp)
              ) {
                Row(
                  horizontalArrangement = Arrangement.spacedBy(8.dp),
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Text(
                    text = if (selectedLanguage == "np") "अगाडि बढ्नुहोस्" else "Continue",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                  )
                  Icon(imageVector = Icons.Default.ArrowForward, contentDescription = "Next")
                }
              }
            }
          }

          2 -> {
            // STEP 2: Email and Password or Google Login
            var passwordVisible by remember { mutableStateOf(false) }

            Column(
              verticalArrangement = Arrangement.spacedBy(16.dp),
              horizontalAlignment = Alignment.CenterHorizontally
            ) {
              Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
              ) {
                Column(
                  modifier = Modifier.padding(20.dp),
                  verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                  // Tab selector: Log In vs Sign Up
                  Row(
                    modifier = Modifier
                      .fillMaxWidth()
                      .clip(RoundedCornerShape(12.dp))
                      .background(MaterialTheme.colorScheme.surfaceVariant)
                      .padding(4.dp)
                  ) {
                    Box(
                      modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (!isSignUpMode) MaterialTheme.colorScheme.primary else Color.Transparent)
                        .clickable { isSignUpMode = false }
                        .padding(vertical = 10.dp)
                        .testTag("login_mode_tab"),
                      contentAlignment = Alignment.Center
                    ) {
                      Text(
                        text = if (selectedLanguage == "np") "लगइन" else "Log In",
                        fontWeight = FontWeight.Bold,
                        color = if (!isSignUpMode) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                      )
                    }
                    Box(
                      modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isSignUpMode) MaterialTheme.colorScheme.primary else Color.Transparent)
                        .clickable { isSignUpMode = true }
                        .padding(vertical = 10.dp)
                        .testTag("signup_mode_tab"),
                      contentAlignment = Alignment.Center
                    ) {
                      Text(
                        text = if (selectedLanguage == "np") "साइन अप" else "Sign Up",
                        fontWeight = FontWeight.Bold,
                        color = if (isSignUpMode) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                      )
                    }
                  }

                  Text(
                    text = if (isSignUpMode) {
                      if (selectedLanguage == "np") "नयाँ खाता सिर्जना गर्नुहोस्" else "Create a New Account"
                    } else {
                      if (selectedLanguage == "np") "आफ्नो खातामा लगइन गर्नुहोस्" else "Sign In to Your Account"
                    },
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                  )

                  Text(
                    text = if (selectedLanguage == "np") {
                      "सुरक्षित र सहज रूपमा आफ्नो अध्ययन प्रगति सिंक राख्नुहोस्।"
                    } else {
                      "Keep your license preparation progress synced and secure."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                  )

                  // Email Input
                  OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text(if (selectedLanguage == "np") "इमेल ठेगाना" else "Email Address") },
                    placeholder = { Text("example@gmail.com") },
                    leadingIcon = { Icon(imageVector = Icons.Default.Email, contentDescription = "Email") },
                    keyboardOptions = KeyboardOptions(
                      keyboardType = KeyboardType.Email,
                      imeAction = ImeAction.Next
                    ),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                      .fillMaxWidth()
                      .testTag("onboarding_email_input"),
                    enabled = !isAuthenticating
                  )

                  // Password Input
                  OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text(if (selectedLanguage == "np") "पासवर्ड" else "Password") },
                    placeholder = { Text("••••••••") },
                    leadingIcon = { Icon(imageVector = Icons.Default.Lock, contentDescription = "Password") },
                    trailingIcon = {
                      val icon = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff
                      val desc = if (passwordVisible) "Hide password" else "Show password"
                      IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(imageVector = icon, contentDescription = desc)
                      }
                    },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(
                      keyboardType = KeyboardType.Password,
                      imeAction = if (isSignUpMode) ImeAction.Next else ImeAction.Done
                    ),
                    keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                      onDone = {
                        keyboardController?.hide()
                        focusManager.clearFocus()
                      }
                    ),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                      .fillMaxWidth()
                      .testTag("onboarding_password_input"),
                    enabled = !isAuthenticating
                  )

                  if (loginError != null) {
                    Text(
                      text = loginError ?: "",
                      color = MaterialTheme.colorScheme.error,
                      style = MaterialTheme.typography.bodySmall,
                      fontWeight = FontWeight.Medium
                    )
                  }

                  // Divider OR
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                  ) {
                    Divider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.outlineVariant)
                    Text(
                      text = if (selectedLanguage == "np") "वा" else "OR",
                      style = MaterialTheme.typography.bodySmall,
                      color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Divider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.outlineVariant)
                  }

                  // Google Login Button (Aesthetic and Functional)
                  Surface(
                    onClick = {
                      isGoogleLogin = true
                      scope.launch {
                        try {
                          val credentialManager = CredentialManager.create(context)
                          val webClientId = try {
                            BuildConfig.GOOGLE_WEB_CLIENT_ID
                          } catch (e: Exception) {
                            "210426294158-pgm2en84umfdmk6o4sllevnpqri7eo0o.apps.googleusercontent.com"
                          }
                          
                          if (webClientId.isEmpty() || webClientId.contains("YOUR_OAUTH_WEB_CLIENT_ID")) {
                            Log.w("OnboardingScreen", "Google Client ID is not configured. Using fallback.")
                          }
                          
                          val googleIdOption = GetGoogleIdOption.Builder()
                            .setFilterByAuthorizedAccounts(false)
                            .setServerClientId(webClientId)
                            .setAutoSelectEnabled(false)
                            .build()
                          
                          val request = GetCredentialRequest.Builder()
                            .addCredentialOption(googleIdOption)
                            .build()
                          
                          val result = credentialManager.getCredential(context, request)
                          val credential = result.credential
                          
                          if (credential is GoogleIdTokenCredential) {
                            val idToken = credential.idToken
                            val emailVal = credential.id
                            val displayName = credential.displayName ?: "Google User"
                            
                            viewModel.loginWithGoogle(
                              email = emailVal,
                              name = displayName,
                              idToken = idToken,
                              categories = listOf("A")
                            )
                          } else {
                            Log.e("OnboardingScreen", "Unexpected credential type: ${credential.type}")
                            if (activity != null) {
                              viewModel.loginWithGoogleFederated(activity, listOf("A"))
                            } else {
                              viewModel.setLoginError("Unexpected sign-in credential type")
                            }
                          }
                        } catch (e: Exception) {
                          Log.e("OnboardingScreen", "Google Sign In failed: ${e.message}, falling back to federated popup", e)
                          if (activity != null) {
                            viewModel.loginWithGoogleFederated(activity, listOf("A"))
                          } else {
                            viewModel.setLoginError(e.localizedMessage ?: "Google Sign-In failed")
                          }
                        }
                      }
                    },
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier
                      .fillMaxWidth()
                      .height(50.dp)
                      .testTag("google_login_button")
                  ) {
                    Row(
                      horizontalArrangement = Arrangement.Center,
                      verticalAlignment = Alignment.CenterVertically,
                      modifier = Modifier.fillMaxSize()
                    ) {
                      Icon(
                        imageVector = Icons.Default.AccountCircle,
                        contentDescription = "Google Icon",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                      )
                      Spacer(modifier = Modifier.width(12.dp))
                      Text(
                        text = if (selectedLanguage == "np") "गुगलबाट अगाडि बढ्नुहोस्" else "Continue with Google",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                      )
                    }
                  }
                }
              }

              // Navigation Buttons
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
              ) {
                OutlinedButton(
                  onClick = { step = 1 },
                  modifier = Modifier
                    .weight(0.4f)
                    .height(56.dp)
                    .testTag("onboarding_step2_back"),
                  shape = RoundedCornerShape(16.dp)
                ) {
                  Text(text = if (selectedLanguage == "np") "पछाडि" else "Back")
                }

                Button(
                  onClick = {
                    keyboardController?.hide()
                    focusManager.clearFocus()
                    if (isSignUpMode) {
                      // Validate simple inputs
                      if (email.trim().isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                        viewModel.loginWithEmail(email, password, listOf("A")) // Trigger validation error
                      } else if (password.length < 6) {
                        viewModel.loginWithEmail(email, password, listOf("A")) // Trigger validation error
                      } else {
                        isGoogleLogin = false
                        step = 3 // Go to configure name & categories
                      }
                    } else {
                      // Trigger Login
                      viewModel.loginWithEmail(email, password, listOf("A"))
                    }
                  },
                  modifier = Modifier
                    .weight(0.6f)
                    .height(56.dp)
                    .testTag("onboarding_step2_next"),
                  shape = RoundedCornerShape(16.dp),
                  enabled = email.trim().isNotEmpty() && password.isNotEmpty() && !isAuthenticating
                ) {
                  Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                  ) {
                    if (isAuthenticating) {
                      LoadingSpinner(size = 20.dp, color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                      Text(
                        text = if (isSignUpMode) {
                          if (selectedLanguage == "np") "अगाडि बढ्नुहोस्" else "Continue"
                        } else {
                          if (selectedLanguage == "np") "लगइन गर्नुहोस्" else "Log In"
                        },
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                      )
                      Icon(imageVector = Icons.Default.ArrowForward, contentDescription = "Continue")
                    }
                  }
                }
              }
            }
          }

          3 -> {
            // STEP 3: Profile Configuration & Category Preferences
            Column(
              verticalArrangement = Arrangement.spacedBy(16.dp),
              horizontalAlignment = Alignment.CenterHorizontally
            ) {
              Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
              ) {
                Column(
                  modifier = Modifier.padding(20.dp),
                  verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                  Text(
                    text = if (selectedLanguage == "np") "प्रोफाइल र सवारी प्राथमिकता" else "Profile & Licence Categories",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                  )

                  // Name Input
                  OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text(if (selectedLanguage == "np") "तपाईंको पूरा नाम" else "Your Full Name") },
                    placeholder = { Text("e.g. Nabin") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                      .fillMaxWidth()
                      .testTag("onboarding_name_input"),
                    enabled = !isAuthenticating,
                    keyboardOptions = KeyboardOptions(
                      imeAction = androidx.compose.ui.text.input.ImeAction.Done
                    ),
                    keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                      onDone = {
                        keyboardController?.hide()
                        focusManager.clearFocus()
                      }
                    )
                  )

                  Divider(modifier = Modifier.padding(vertical = 4.dp), color = MaterialTheme.colorScheme.outlineVariant)

                  // Category Preferences Toggle
                  Text(
                    text = if (selectedLanguage == "np") "सवारी अनुमति पत्र वर्गहरू (बहु-चयन उपलब्ध)" else "Preparation Licence Categories (Multi-select)",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                  )

                  // Category A Preference Card
                  PreferenceCategoryCard(
                    title = if (selectedLanguage == "np") "वर्ग क (मोटरसाइकल / स्कुटर)" else "Category A (Motorcycle / Scooter)",
                    description = if (selectedLanguage == "np") "२-पाङ्ग्रे सवारी लाइसेन्स तयारी" else "Preparation for 2-wheelers written & trials",
                    icon = { Icon(imageVector = Icons.Default.TwoWheeler, contentDescription = "Motorcycle") },
                    isSelected = prefCatA,
                    onCheckedChange = { prefCatA = it }
                  )

                  // Category B Preference Card
                  PreferenceCategoryCard(
                    title = if (selectedLanguage == "np") "वर्ग ख (कार / जिप / भ्यान)" else "Category B (Car / Jeep / Van)",
                    description = if (selectedLanguage == "np") "४-पाङ्ग्रे हल्का सवारी लाइसेन्स तयारी" else "Preparation for 4-wheelers written & trials",
                    icon = { Icon(imageVector = Icons.Default.DirectionsCar, contentDescription = "Car") },
                    isSelected = prefCatB,
                    onCheckedChange = { prefCatB = it }
                  )
                  
                  // Category K Preference Card
                  PreferenceCategoryCard(
                    title = if (selectedLanguage == "np") "वर्ग ट (स्कुटर)" else "Category K (Scooter)",
                    description = if (selectedLanguage == "np") "स्कुटर सवारी लाइसेन्स तयारी" else "Preparation for Scooter written & trials",
                    icon = { Icon(imageVector = Icons.Default.Moped, contentDescription = "Scooter") },
                    isSelected = prefCatK,
                    onCheckedChange = { prefCatK = it }
                  )
                  
                  // Category G Preference Card
                  PreferenceCategoryCard(
                    title = if (selectedLanguage == "np") "वर्ग छ (ट्याक्टर / पावर टिलर)" else "Category G (Tractor / Power Tiller)",
                    description = if (selectedLanguage == "np") "भारी तथा कृषि सवारी लाइसेन्स तयारी" else "Preparation for Tractor written & trials",
                    icon = { Icon(imageVector = Icons.Default.Agriculture, contentDescription = "Tractor") },
                    isSelected = prefCatG,
                    onCheckedChange = { prefCatG = it }
                  )

                  if (loginError != null) {
                    Text(
                      text = loginError ?: "",
                      color = MaterialTheme.colorScheme.error,
                      style = MaterialTheme.typography.bodySmall,
                      fontWeight = FontWeight.Medium
                    )
                  }
                }
              }

              // Action Buttons
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
              ) {
                OutlinedButton(
                  onClick = { step = 2 },
                  modifier = Modifier
                    .weight(0.4f)
                    .height(56.dp),
                  shape = RoundedCornerShape(16.dp)
                ) {
                  Text(text = if (selectedLanguage == "np") "पछाडि" else "Back")
                }

                Button(
                  onClick = {
                    keyboardController?.hide()
                    focusManager.clearFocus()
                    val prefs = mutableListOf<String>()
                    if (prefCatA) prefs.add("A")
                    if (prefCatB) prefs.add("B")
                    if (prefCatK) prefs.add("K")
                    if (prefCatG) prefs.add("G")
                    if (prefs.isEmpty()) prefs.add("A") // Fallback

                    if (isGoogleLogin) {
                      viewModel.loginWithGoogle(
                        email = if (email.isNotEmpty()) email else "google.user@gmail.com",
                        name = name,
                        idToken = "simulated_google_token",
                        categories = prefs
                      )
                    } else {
                      viewModel.signUpWithEmail(email, password, name, prefs)
                    }
                  },
                  modifier = Modifier
                    .weight(0.6f)
                    .height(56.dp)
                    .testTag("onboarding_submit_btn"),
                  shape = RoundedCornerShape(16.dp),
                  enabled = name.trim().isNotEmpty() && !isAuthenticating
                ) {
                  Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                  ) {
                    if (isAuthenticating) {
                      LoadingSpinner(size = 20.dp, color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                      Text(
                        text = if (selectedLanguage == "np") "तयारी सुरु गरौं" else "Complete & Start",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                      )
                      Icon(imageVector = Icons.Default.Done, contentDescription = "Done")
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      Spacer(modifier = Modifier.height(24.dp))
    }
  }
}

@Composable
fun PreferenceCategoryCard(
  title: String,
  description: String,
  icon: @Composable () -> Unit,
  isSelected: Boolean,
  onCheckedChange: (Boolean) -> Unit,
  modifier: Modifier = Modifier
) {
  val borderStroke = if (isSelected) {
    androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
  } else {
    androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
  }

  Surface(
    onClick = { onCheckedChange(!isSelected) },
    shape = RoundedCornerShape(16.dp),
    border = borderStroke,
    color = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f) else MaterialTheme.colorScheme.surface,
    modifier = modifier.fillMaxWidth()
  ) {
    Row(
      modifier = Modifier
        .padding(14.dp)
        .fillMaxWidth(),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      Box(
        modifier = Modifier
          .size(40.dp)
          .clip(RoundedCornerShape(10.dp))
          .background(
            if (isSelected) MaterialTheme.colorScheme.primaryContainer
            else MaterialTheme.colorScheme.surfaceVariant
          ),
        contentAlignment = Alignment.Center
      ) {
        CompositionLocalProvider(
          LocalContentColor provides (if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
        ) {
          icon()
        }
      }

      Column(modifier = Modifier.weight(1f)) {
        Text(
          text = title,
          style = MaterialTheme.typography.bodyMedium,
          fontWeight = FontWeight.Bold,
          color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
        )
        Text(
          text = description,
          style = MaterialTheme.typography.bodySmall,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      }

      Checkbox(
        checked = isSelected,
        onCheckedChange = onCheckedChange,
        colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary)
      )
    }
  }
}

@Composable
fun LoadingSpinner(size: androidx.compose.ui.unit.Dp, color: Color) {
  androidx.compose.material3.CircularProgressIndicator(
    modifier = Modifier.size(size),
    color = color,
    strokeWidth = 2.dp
  )
}
