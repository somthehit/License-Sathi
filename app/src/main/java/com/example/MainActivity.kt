package com.example

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.screens.*
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodel.LicenseSathiViewModel
import com.google.firebase.FirebaseApp

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Firebase is initialized automatically via google-services.json + the google-services plugin.
    // Manual programmatic init is no longer needed.
    try {
      if (FirebaseApp.getApps(this).isEmpty()) {
        FirebaseApp.initializeApp(this)
        Log.i("MainActivity", "Firebase initialized via google-services.json")
      }
    } catch (e: Exception) {
      Log.e("MainActivity", "Firebase initialization failed: ${e.message}", e)
    }

    enableEdgeToEdge()
    setContent {
      val viewModel: LicenseSathiViewModel = viewModel()
      val isDarkTheme by viewModel.isDarkMode.collectAsState()

      MyApplicationTheme(darkTheme = isDarkTheme) {
        val userProgressState by viewModel.userProgress.collectAsState()
        val lang by viewModel.activeLanguage.collectAsState()

        val hasOnboarded = userProgressState?.hasOnboarded == true
        if (!hasOnboarded) {
          // Show onboarding first
          OnboardingScreen(
            viewModel = viewModel,
            onFinished = { /* State transitions automatically via Flow */ },
            modifier = Modifier.fillMaxSize()
          )
        } else {
          // Main layout with bottom navigation bar
          var activeTab by remember { mutableStateOf("home") }

          val quizState by viewModel.quizState.collectAsState()
          val showPracticeSetup by viewModel.showPracticeSetup.collectAsState()
          val mockState by viewModel.mockState.collectAsState()
          val activeVideo by viewModel.activeVideo.collectAsState()
          var showEyeTest by remember { mutableStateOf(false) }

          // Handle physical/system back button presses
          androidx.activity.compose.BackHandler(enabled = activeTab != "home" || quizState != null || showPracticeSetup || mockState != null || activeVideo != null || showEyeTest) {
              if (activeVideo != null) {
                  viewModel.closeVideo()
              } else if (showEyeTest) {
                  showEyeTest = false
              } else if (quizState != null || showPracticeSetup) {
                  viewModel.exitPracticeSetup()
                  viewModel.closeQuiz()
                  activeTab = "home"
              } else if (mockState != null) {
                  viewModel.closeMockExam()
                  activeTab = "home"
              } else if (activeTab != "home") {
                  activeTab = "home"
              }
          }

          // Hide bottom bar if a timed quiz or mock exam is actively running (to focus user attention)
          val hideBottomBar = quizState != null || showPracticeSetup || mockState != null || activeVideo != null || showEyeTest

          Scaffold(
            modifier = Modifier.fillMaxSize(),
            bottomBar = {
              if (!hideBottomBar) {
                NavigationBar(
                  modifier = Modifier
                    .navigationBarsPadding()
                    .testTag("main_bottom_nav"),
                  containerColor = MaterialTheme.colorScheme.surfaceVariant,
                  tonalElevation = 8.dp
                ) {
                  // Home Tab
                  NavigationBarItem(
                    selected = activeTab == "home",
                    onClick = { activeTab = "home" },
                    icon = { Icon(imageVector = Icons.Default.Home, contentDescription = "Home") },
                    label = { Text(if (lang == "np") "होम" else "Home") },
                    colors = NavigationBarItemDefaults.colors(
                      selectedIconColor = MaterialTheme.colorScheme.onSecondary,
                      selectedTextColor = MaterialTheme.colorScheme.onBackground,
                      indicatorColor = MaterialTheme.colorScheme.secondary,
                      unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                      unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    ),
                    modifier = Modifier.testTag("nav_tab_home")
                  )

                  // Study Tab
                  NavigationBarItem(
                    selected = activeTab == "study",
                    onClick = { activeTab = "study" },
                    icon = { Icon(imageVector = Icons.Default.MenuBook, contentDescription = "Study") },
                    label = { Text(if (lang == "np") "अध्ययन" else "Study") },
                    colors = NavigationBarItemDefaults.colors(
                      selectedIconColor = MaterialTheme.colorScheme.onSecondary,
                      selectedTextColor = MaterialTheme.colorScheme.onBackground,
                      indicatorColor = MaterialTheme.colorScheme.secondary,
                      unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                      unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    ),
                    modifier = Modifier.testTag("nav_tab_study")
                  )

                  // Progress Tab
                  NavigationBarItem(
                    selected = activeTab == "progress",
                    onClick = { activeTab = "progress" },
                    icon = { Icon(imageVector = Icons.Default.BarChart, contentDescription = "Progress") },
                    label = { Text(if (lang == "np") "प्रगति" else "Progress") },
                    colors = NavigationBarItemDefaults.colors(
                      selectedIconColor = MaterialTheme.colorScheme.onSecondary,
                      selectedTextColor = MaterialTheme.colorScheme.onBackground,
                      indicatorColor = MaterialTheme.colorScheme.secondary,
                      unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                      unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    ),
                    modifier = Modifier.testTag("nav_tab_progress")
                  )

                  // Profile/CMS Tab
                  NavigationBarItem(
                    selected = activeTab == "profile",
                    onClick = { activeTab = "profile" },
                    icon = { Icon(imageVector = Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text(if (lang == "np") "प्रोफाइल" else "Profile") },
                    colors = NavigationBarItemDefaults.colors(
                      selectedIconColor = MaterialTheme.colorScheme.onSecondary,
                      selectedTextColor = MaterialTheme.colorScheme.onBackground,
                      indicatorColor = MaterialTheme.colorScheme.secondary,
                      unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                      unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    ),
                    modifier = Modifier.testTag("nav_tab_profile")
                  )
                }
              }
            }
          ) { innerPadding ->
            Box(
              modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
            ) {
              // Priority Screens overlay
              when {
                activeVideo != null -> {
                  com.example.ui.screens.VideoPlayerScreen(
                    videoUrl = activeVideo!!.videoUrl,
                    title = activeVideo!!.getTitle(lang),
                    onNavigateBack = { viewModel.closeVideo() }
                  )
                }

                quizState != null || showPracticeSetup -> {
                  PracticeScreen(
                    viewModel = viewModel,
                    onNavigateHome = {
                      viewModel.exitPracticeSetup()
                      viewModel.closeQuiz()
                      activeTab = "home"
                    }
                  )
                }

                mockState != null -> {
                  MockExamScreen(
                    viewModel = viewModel,
                    onNavigateHome = { activeTab = "home" }
                  )
                }

                showEyeTest -> {
                  EyeTestScreen(
                    viewModel = viewModel,
                    onNavigateBack = { showEyeTest = false }
                  )
                }

                else -> {
                  // Standard bottom-nav tab switching
                  when (activeTab) {
                    "home" -> HomeScreen(
                      viewModel = viewModel,
                      onNavigateToStudy = { activeTab = "study" },
                      onNavigateToPractice = { viewModel.enterPracticeSetup() },
                      onNavigateToMock = { viewModel.startMockExam() },
                      onNavigateToEyeTest = { showEyeTest = true }
                    )

                    "study" -> StudyScreen(viewModel = viewModel, onNavigateToEyeTest = { showEyeTest = true })

                    "progress" -> ProgressScreen(viewModel = viewModel)

                    "profile" -> ProfileScreen(viewModel = viewModel)
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
