package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.border
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.viewmodel.LicenseSathiViewModel

@Composable
fun ProfileScreen(
  viewModel: LicenseSathiViewModel,
  modifier: Modifier = Modifier
) {
  val keyboardController = androidx.compose.ui.platform.LocalSoftwareKeyboardController.current
  val focusManager = androidx.compose.ui.platform.LocalFocusManager.current

  val lang by viewModel.activeLanguage.collectAsState()
  val userProg by viewModel.userProgress.collectAsState()
  val catId by viewModel.activeCategory.collectAsState()
  val badgesList by viewModel.badges.collectAsState()
  val attemptsList by viewModel.attempts.collectAsState()

  var nameInput by remember { mutableStateOf("") }
  LaunchedEffect(userProg) {
    userProg?.let { nameInput = it.name }
  }

  var showResetConfirm by remember { mutableStateOf(false) }

  if (showResetConfirm) {
    AlertDialog(
      onDismissRequest = { showResetConfirm = false },
      title = {
        Text(
          text = if (lang == "np") "प्रगति रिसेट पुष्टि गर्नुहोस्" else "Confirm Reset Progress",
          fontWeight = FontWeight.Bold
        )
      },
      text = {
        Text(
          text = if (lang == "np") {
            "के तपाईं पक्का आफ्नो सम्पूर्ण परीक्षा र प्रगति विवरण रिसेट गर्न चाहनुहुन्छ? यो प्रक्रिया फिर्ता लिन सकिने छैन।"
          } else {
            "Are you sure you want to reset all your exam history, points, and study progress? This action cannot be undone."
          }
        )
      },
      confirmButton = {
        Button(
          onClick = {
            viewModel.resetProgress()
            showResetConfirm = false
          },
          colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
        ) {
          Text(text = if (lang == "np") "हो, रिसेट गर्नुहोस्" else "Yes, Reset All")
        }
      },
      dismissButton = {
        OutlinedButton(onClick = { showResetConfirm = false }) {
          Text(text = if (lang == "np") "रद्द गर्नुहोस्" else "Cancel")
        }
      }
    )
  }

  Column(
    modifier = modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
      .verticalScroll(rememberScrollState())
      .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    // 1. User Avatar Header
    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(20.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(20.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
      ) {
        Box(
          modifier = Modifier
            .size(64.dp)
            .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
          contentAlignment = Alignment.Center
        ) {
          Icon(imageVector = Icons.Default.Person, contentDescription = "User", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(36.dp))
        }

        Column(modifier = Modifier.weight(1f)) {
          Text(
            text = userProg?.name ?: "Nabin",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
          )
          Text(
            text = if (lang == "np") "सक्रिय प्रयोगकर्ता" else "Active Account Profile",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
        }
      }
    }

    // 2. Profile Settings & JWT Authentication Credentials Card
    Text(
      text = if (lang == "np") "खाता र प्रोफाइल सेटिङ्स" else "Account & Profile Settings",
      style = MaterialTheme.typography.titleMedium,
      fontWeight = FontWeight.ExtraBold,
      color = MaterialTheme.colorScheme.onBackground
    )

    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
      Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
      ) {
        // Edit name field
        OutlinedTextField(
          value = nameInput,
          onValueChange = {
            nameInput = it
            viewModel.updateProfileName(it)
          },
          label = { Text(if (lang == "np") "प्रयोगकर्ताको नाम" else "Profile Name") },
          singleLine = true,
          shape = RoundedCornerShape(12.dp),
          modifier = Modifier.fillMaxWidth().testTag("profile_name_field"),
          keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
            imeAction = androidx.compose.ui.text.input.ImeAction.Done
          ),
          keyboardActions = androidx.compose.foundation.text.KeyboardActions(
            onDone = {
              keyboardController?.hide()
              focusManager.clearFocus()
            }
          )
        )

        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

        // Licence Category Preferences Toggles
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
          Text(
            text = if (lang == "np") "तयारी गरिने सवारी अनुमति पत्र वर्गहरू" else "Licence Categories in Focus",
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
          )
          Text(
            text = if (lang == "np") "तपाईंको आवश्यकता अनुसार धेरै वर्गहरू छनोट गर्नुहोस्।" else "Select the licence categories you are preparing for.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )

          val currentPrefs = userProg?.getCategoryPreferencesList() ?: listOf("A")
          
          listOf(
            "A" to (if (lang == "np") "वर्ग क (मोटरसाइकल / स्कुटर)" else "Category A (2-Wheeler)"),
            "B" to (if (lang == "np") "वर्ग ख (कार / जिप / भ्यान)" else "Category B (4-Wheeler)")
          ).forEach { (code, name) ->
            val isChecked = currentPrefs.contains(code)
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .clickable {
                  val newPrefs = currentPrefs.toMutableList()
                  if (isChecked) {
                    if (newPrefs.size > 1) newPrefs.remove(code)
                  } else {
                    newPrefs.add(code)
                  }
                  viewModel.updateCategoryPreferences(newPrefs)
                }
                .padding(vertical = 4.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
              ) {
                Icon(
                  imageVector = if (code == "A") Icons.Default.Motorcycle else Icons.Default.DirectionsCar,
                  contentDescription = null,
                  tint = if (isChecked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(text = name, style = MaterialTheme.typography.bodyMedium)
              }
              Checkbox(
                checked = isChecked,
                onCheckedChange = { checked ->
                  val newPrefs = currentPrefs.toMutableList()
                  if (!checked) {
                    if (newPrefs.size > 1) newPrefs.remove(code)
                  } else {
                    newPrefs.add(code)
                  }
                  viewModel.updateCategoryPreferences(newPrefs)
                }
              )
            }
          }
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

        // Active Study Category Selection
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Column(modifier = Modifier.weight(1f)) {
            Text(text = if (lang == "np") "सक्रिय अध्ययन वर्ग" else "Active Focus Category", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
            Text(text = if (lang == "np") "हाल पढिरहेको मुख्य सवारी वर्ग" else "Primary category for home & quizzes", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
          }

          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("A", "B").forEach { cat ->
              val isSelected = catId == cat
              Box(
                modifier = Modifier
                  .clip(RoundedCornerShape(8.dp))
                  .background(if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant)
                  .clickable { viewModel.setCategory(cat) }
                  .padding(horizontal = 14.dp, vertical = 6.dp),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = "CAT $cat",
                  style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                  )
                )
              }
            }
          }
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

        // Toggle Language Row
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Text(text = if (lang == "np") "एपको भाषा" else "App Language", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)

          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("np" to "नेपाली", "en" to "English").forEach { (code, label) ->
              val isSelected = lang == code
              Box(
                modifier = Modifier
                  .clip(RoundedCornerShape(8.dp))
                  .background(if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant)
                  .clickable { viewModel.setLanguage(code) }
                  .padding(horizontal = 12.dp, vertical = 6.dp),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = label,
                  style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                  )
                )
              }
            }
          }
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

        // Toggle Theme Row
        val isDarkTheme by viewModel.isDarkMode.collectAsState()
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .testTag("profile_theme_toggle_row"),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Column(modifier = Modifier.weight(1f)) {
            Text(
              text = if (lang == "np") "नाइट मोड / डार्क थिम" else "Night Mode / Dark Theme",
              style = MaterialTheme.typography.bodyMedium,
              fontWeight = FontWeight.Bold
            )
            Text(
              text = if (lang == "np") "रात्रिकालीन अध्ययनको लागि उपयुक्त" else "Better visibility for nighttime study",
              style = MaterialTheme.typography.bodySmall,
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )
          }

          Switch(
            checked = isDarkTheme,
            onCheckedChange = { viewModel.toggleDarkMode() },
            modifier = Modifier.testTag("profile_theme_switch"),
            thumbContent = {
              Icon(
                imageVector = if (isDarkTheme) Icons.Default.DarkMode else Icons.Default.LightMode,
                contentDescription = null,
                modifier = Modifier.size(SwitchDefaults.IconSize)
              )
            }
          )
        }

        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

        // Account Status Section
        val isLoggedIn = userProg?.isLoggedIn == true
        val email = userProg?.email

        if (isLoggedIn && !email.isNullOrEmpty()) {
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .background(
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                RoundedCornerShape(12.dp)
              )
              .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            // Signed-in indicator
            Row(
              modifier = Modifier.fillMaxWidth(),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
              ) {
                Icon(
                  imageVector = Icons.Default.AccountCircle,
                  contentDescription = null,
                  tint = Color(0xFF52C41A),
                  modifier = Modifier.size(20.dp)
                )
                Column {
                  Text(
                    text = if (lang == "np") "साइन इन भएको खाता" else "Signed In",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                  )
                  Text(
                    text = email,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                  )
                }
              }
              Box(
                modifier = Modifier
                  .background(Color(0xFF52C41A).copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                  .padding(horizontal = 8.dp, vertical = 3.dp)
              ) {
                Text(
                  text = if (lang == "np") "सक्रिय" else "Active",
                  style = MaterialTheme.typography.labelSmall,
                  color = Color(0xFF52C41A),
                  fontWeight = FontWeight.ExtraBold
                )
              }
            }

            // Logout Button
            Button(
              onClick = { viewModel.logout() },
              modifier = Modifier
                .fillMaxWidth()
                .testTag("logout_button"),
              shape = RoundedCornerShape(10.dp),
              colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
            ) {
              Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
              ) {
                Icon(imageVector = Icons.Default.Logout, contentDescription = "Logout")
                Text(
                  text = if (lang == "np") "लगआउट गर्नुहोस्" else "Sign Out",
                  style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                )
              }
            }

            // Reset Progress Button
            OutlinedButton(
              onClick = { showResetConfirm = true },
              modifier = Modifier
                .fillMaxWidth()
                .testTag("reset_progress_button"),
              shape = RoundedCornerShape(10.dp),
              colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
            ) {
              Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
              ) {
                Icon(imageVector = Icons.Default.Delete, contentDescription = "Reset Progress")
                Text(
                  text = if (lang == "np") "प्रगति रिसेट गर्नुहोस्" else "Reset All Progress",
                  style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                )
              }
            }
          }
        } else {
          // Guest / Not logged in state
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .background(
                MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f),
                RoundedCornerShape(12.dp)
              )
              .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
          ) {
            Text(
              text = if (lang == "np") "लगइन नगरिएको प्रोफाइल" else "Not Signed In",
              style = MaterialTheme.typography.bodyMedium,
              fontWeight = FontWeight.Bold,
              color = MaterialTheme.colorScheme.error
            )
            Text(
              text = if (lang == "np") {
                "आफ्नो प्रगति सुरक्षित राख्न लगइन गर्नुहोस्।"
              } else {
                "Sign in to save your progress and sync across devices."
              },
              style = MaterialTheme.typography.bodySmall,
              textAlign = TextAlign.Center,
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Button(
              onClick = { viewModel.logout() },
              modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
              shape = RoundedCornerShape(8.dp),
              colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
              Text(
                text = if (lang == "np") "लगइन गर्नुहोस्" else "Sign In",
                fontWeight = FontWeight.Bold
              )
            }

            OutlinedButton(
              onClick = { showResetConfirm = true },
              modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp)
                .testTag("guest_reset_progress_button"),
              shape = RoundedCornerShape(8.dp),
              colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
            ) {
              Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
              ) {
                Icon(imageVector = Icons.Default.Delete, contentDescription = "Reset Progress")
                Text(
                  text = if (lang == "np") "प्रगति रिसेट गर्नुहोस्" else "Reset Progress",
                  style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                )
              }
            }
          }
        }
      }
    }

    // 3. Official Useful Links
    val uriHandler = LocalUriHandler.current

    Text(
      text = if (lang == "np") "उपयोगी सरकारी लिङ्कहरू" else "Official Useful Links",
      style = MaterialTheme.typography.titleMedium,
      fontWeight = FontWeight.ExtraBold,
      color = MaterialTheme.colorScheme.onBackground
    )

    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
      Column(modifier = Modifier.padding(8.dp)) {
        val links = listOf(
          Triple(
            if (lang == "np") "नेपाल यातायात व्यवस्था विभाग" else "Dept. of Transport Management",
            "https://www.dotm.gov.np",
            Icons.Default.DirectionsBus
          ),
          Triple(
            if (lang == "np") "लाइसेन्स परीक्षा तयारी पोर्टल" else "DOTM License Exam Portal",
            "https://www.dotm.gov.np/en/driving-license/",
            Icons.Default.Assignment
          ),
          Triple(
            if (lang == "np") "नेपाल सडक सुरक्षा परिषद" else "Nepal Road Safety Council",
            "https://www.nrsc.gov.np",
            Icons.Default.HealthAndSafety
          ),
          Triple(
            if (lang == "np") "सवारी दर्ता तथा नवीकरण" else "Vehicle Registration & Renewal",
            "https://www.dotm.gov.np/en/vehicle-registration/",
            Icons.Default.CarRental
          ),
          Triple(
            if (lang == "np") "ट्राफिक प्रहरी नेपाल" else "Nepal Traffic Police",
            "https://www.nepalpolice.gov.np/traffic-police",
            Icons.Default.LocalPolice
          )
        )

        links.forEachIndexed { index, (title, url, icon) ->
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .clip(RoundedCornerShape(10.dp))
              .clickable { uriHandler.openUri(url) }
              .padding(horizontal = 12.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            Box(
              modifier = Modifier
                .size(40.dp)
                .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f), CircleShape),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
              )
            }
            Column(modifier = Modifier.weight(1f)) {
              Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
              )
              Text(
                text = url.removePrefix("https://"),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.7f)
              )
            }
            Icon(
              imageVector = Icons.Default.OpenInNew,
              contentDescription = "Open link",
              tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
              modifier = Modifier.size(16.dp)
            )
          }
          if (index < links.lastIndex) {
            HorizontalDivider(
              modifier = Modifier.padding(horizontal = 12.dp),
              color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f)
            )
          }
        }
      }
    }

    // 3. Badges Collection
    Text(
      text = if (lang == "np") "मेरा ब्याजहरू" else "My Badges",
      style = MaterialTheme.typography.titleMedium,
      fontWeight = FontWeight.ExtraBold,
      color = MaterialTheme.colorScheme.onBackground
    )

    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
      if (badgesList.isEmpty()) {
        Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
          Text(text = if (lang == "np") "कुनै ब्याज प्राप्त भएको छैन" else "No badges earned yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
      } else {
        androidx.compose.foundation.lazy.LazyRow(
          contentPadding = PaddingValues(16.dp),
          horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
          items(badgesList.size) { i ->
            val badge = badgesList[i]
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(80.dp)) {
              Box(
                modifier = Modifier
                  .size(64.dp)
                  .background(MaterialTheme.colorScheme.secondaryContainer, CircleShape)
                  .border(2.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.5f), CircleShape),
                contentAlignment = Alignment.Center
              ) {
                Icon(
                  imageVector = when (badge.iconName) {
                    "local_fire_department" -> Icons.Default.LocalFireDepartment
                    "verified" -> Icons.Default.Verified
                    "emoji_events" -> Icons.Default.EmojiEvents
                    "motorcycle" -> Icons.Default.Motorcycle
                    "directions_car" -> Icons.Default.DirectionsCar
                    else -> Icons.Default.Star
                  },
                  contentDescription = badge.nameEn,
                  tint = MaterialTheme.colorScheme.primary,
                  modifier = Modifier.size(32.dp)
                )
              }
              Spacer(Modifier.height(8.dp))
              Text(
                text = badge.getName(lang),
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                maxLines = 2
              )
            }
          }
        }
      }
    }

    // 4. Attempt History Timeline
    Text(
      text = if (lang == "np") "परीक्षा इतिहास" else "Attempt History",
      style = MaterialTheme.typography.titleMedium,
      fontWeight = FontWeight.ExtraBold,
      color = MaterialTheme.colorScheme.onBackground
    )

    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
      if (attemptsList.isEmpty()) {
        Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
          Text(text = if (lang == "np") "कुनै परीक्षा इतिहास छैन" else "No attempt history available", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
      } else {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
          attemptsList.take(5).forEachIndexed { index, attempt ->
            val isPassed = attempt.score >= 10 // Assuming 10 is passing for now, normally depends on total
            Row(
              modifier = Modifier.fillMaxWidth(),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
              Box(
                modifier = Modifier
                  .size(40.dp)
                  .background(if (isPassed) Color(0xFFDCFCE7) else Color(0xFFFFDAD9), CircleShape),
                contentAlignment = Alignment.Center
              ) {
                Icon(
                  imageVector = if (isPassed) Icons.Default.Check else Icons.Default.Close,
                  contentDescription = null,
                  tint = if (isPassed) Color(0xFF16A34A) else Color(0xFFB1002C),
                  modifier = Modifier.size(20.dp)
                )
              }
              Column(modifier = Modifier.weight(1f)) {
                Text(
                  text = java.text.SimpleDateFormat("MMM dd, yyyy - hh:mm a", java.util.Locale.getDefault()).format(java.util.Date(attempt.completedAt)),
                  style = MaterialTheme.typography.bodySmall,
                  fontWeight = FontWeight.Bold
                )
                Text(
                  text = if (isPassed) (if (lang == "np") "उत्तीर्ण" else "Passed") else (if (lang == "np") "अनुत्तीर्ण" else "Failed"),
                  style = MaterialTheme.typography.labelSmall,
                  color = MaterialTheme.colorScheme.onSurfaceVariant
                )
              }
              Text(
                text = "${attempt.score}/${attempt.totalQuestions}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.ExtraBold,
                color = if (isPassed) Color(0xFF16A34A) else Color(0xFFB1002C)
              )
            }
            if (index < attemptsList.take(5).lastIndex) {
              HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
            }
          }
        }
      }
    }

    // 5. About / Developer Card
    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)
      )
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        horizontalAlignment = Alignment.CenterHorizontally
      ) {
        Box(
          modifier = Modifier
            .size(56.dp)
            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f), CircleShape),
          contentAlignment = Alignment.Center
        ) {
          Icon(
            imageVector = Icons.Default.Code,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(28.dp)
          )
        }

        Text(
          text = if (lang == "np") "लाइसेन्स साथी" else "License Sathi",
          style = MaterialTheme.typography.titleMedium,
          fontWeight = FontWeight.ExtraBold,
          color = MaterialTheme.colorScheme.onSurface,
          textAlign = TextAlign.Center
        )

        Text(
          text = if (lang == "np") {
            "नेपाल सरकारको यातायात व्यवस्था विभाग (DoTM) द्वारा निर्धारित मापदण्ड अनुसार तयार गरिएको\nड्राइभिङ लाइसेन्स परीक्षा तयारी एप।"
          } else {
            "Nepal's driving licence exam preparation app, aligned with DoTM standards and official traffic regulations."
          },
          style = MaterialTheme.typography.bodySmall,
          color = MaterialTheme.colorScheme.onSurfaceVariant,
          textAlign = TextAlign.Center,
          lineHeight = 18.sp
        )

        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

        // Developer row
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.Center,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Icon(
            imageVector = Icons.Default.Person,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(16.dp)
          )
          Spacer(modifier = Modifier.width(6.dp))
          Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
              text = if (lang == "np") "विकासकर्ता" else "Developer",
              style = MaterialTheme.typography.labelSmall,
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
              text = "Som P. Chaudhary",
              style = MaterialTheme.typography.bodyMedium,
              fontWeight = FontWeight.Bold,
              color = MaterialTheme.colorScheme.onSurface
            )
          }
        }

        // Email row — tappable
        Row(
          modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable { uriHandler.openUri("mailto:somthehit@gmail.com") }
            .padding(horizontal = 12.dp, vertical = 6.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Icon(
            imageVector = Icons.Default.Email,
            contentDescription = "Email developer",
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(16.dp)
          )
          Text(
            text = "somthehit@gmail.com",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.SemiBold
          )
        }

        Text(
          text = "v1.0.0",
          style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
        )
      }
    }

    Spacer(modifier = Modifier.height(24.dp))
  }
}
