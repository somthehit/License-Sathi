package com.example.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.BuildConfig
import com.example.data.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class LicenseSathiViewModel(application: Application) : AndroidViewModel(application) {

  private val database = AppDatabase.getDatabase(application, viewModelScope)
  private val repository = AppRepository(database.appDao(), application.applicationContext)

  // ── Sync Status ──────────────────────────────────────────────────────────
  private val _isSyncing = MutableStateFlow(false)
  val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

  private val _syncError = MutableStateFlow<String?>(null)
  val syncError: StateFlow<String?> = _syncError.asStateFlow()

  /** Triggers a Firestore -> Room content sync. Skipped if within throttle window. */
  fun syncContent(force: Boolean = false) {
    viewModelScope.launch {
      val sync = repository.contentSync ?: return@launch
      if (!force && !sync.isSyncDue()) return@launch
      _isSyncing.value = true
      _syncError.value = null
      try {
        sync.syncContent(forceSync = force)
      } catch (e: Exception) {
        _syncError.value = e.localizedMessage ?: "Content sync failed"
        android.util.Log.e("LicenseSathiVM", "Content sync error", e)
      } finally {
        _isSyncing.value = false
      }
    }
  }

  // ── Notices ──────────────────────────────────────────────────────────────
  private val _notices = MutableStateFlow<List<FirestoreContentService.AppNotice>>(emptyList())
  val notices: StateFlow<List<FirestoreContentService.AppNotice>> = _notices.asStateFlow()

  private val _noticesLoading = MutableStateFlow(false)
  val noticesLoading: StateFlow<Boolean> = _noticesLoading.asStateFlow()

  fun fetchNotices() {
    viewModelScope.launch {
      _noticesLoading.value = true
      try {
        _notices.value = FirestoreContentService.fetchNotices()
      } catch (e: Exception) {
        android.util.Log.e("LicenseSathiVM", "Notice fetch error", e)
      } finally {
        _noticesLoading.value = false
      }
    }
  }

  // ── Question Sets (Firestore) ───────────────────────────────────────────
  private val _questionSets = MutableStateFlow<List<FirestoreContentService.QuestionSet>>(emptyList())
  val questionSets: StateFlow<List<FirestoreContentService.QuestionSet>> = _questionSets.asStateFlow()

  private val _questionSetsLoading = MutableStateFlow(false)
  val questionSetsLoading: StateFlow<Boolean> = _questionSetsLoading.asStateFlow()

  fun fetchQuestionSets() {
    viewModelScope.launch {
      _questionSetsLoading.value = true
      try {
        _questionSets.value = FirestoreContentService.fetchQuestionSets()
      } catch (e: Exception) {
        android.util.Log.e("LicenseSathiVM", "Question sets fetch error", e)
      } finally {
        _questionSetsLoading.value = false
      }
    }
  }

  init {
    // Kick off a background content sync on startup (throttled to once per hour)
    syncContent(force = false)
    fetchNotices()
    fetchQuestionSets()
  }

  // Raw DB flows
  val categories = repository.allCategories.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
  val questions = repository.allQuestions.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
  val roadSigns = repository.allRoadSigns.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
  val ruleArticles = repository.allRuleArticles.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
  val fines = repository.allFines.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
  val attempts = repository.allAttempts.combine(repository.userProgressFlow) { allAttempts, progress ->
    if (progress != null && progress.isLoggedIn && !progress.email.isNullOrEmpty()) {
      allAttempts.filter { it.userEmail == progress.email }
    } else {
      allAttempts.filter { it.userEmail == null || it.userEmail == "mock_user" }
    }
  }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
  val badges = repository.allBadges.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
  val userProgress = repository.userProgressFlow.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

  // Quiz Mode State
  private val _quizState = MutableStateFlow<QuizState?>(null)
  val quizState: StateFlow<QuizState?> = _quizState.asStateFlow()

  // Practice Setup State
  private val _showPracticeSetup = MutableStateFlow(false)
  val showPracticeSetup: StateFlow<Boolean> = _showPracticeSetup.asStateFlow()

  fun enterPracticeSetup() {
    _showPracticeSetup.value = true
    _quizState.value = null
  }

  fun exitPracticeSetup() {
    _showPracticeSetup.value = false
  }

  // Dark Mode preference
  private val sharedPrefs = application.getSharedPreferences("license_sathi_prefs", android.content.Context.MODE_PRIVATE)
  private val _isDarkMode = MutableStateFlow(sharedPrefs.getBoolean("dark_mode", false))
  val isDarkMode: StateFlow<Boolean> = _isDarkMode.asStateFlow()

  fun toggleDarkMode() {
    val newValue = !_isDarkMode.value
    sharedPrefs.edit().putBoolean("dark_mode", newValue).apply()
    _isDarkMode.value = newValue
  }

  // Mock Exam State
  private val _mockState = MutableStateFlow<MockState?>(null)
  val mockState: StateFlow<MockState?> = _mockState.asStateFlow()
  private var mockTimerJob: Job? = null

  // Active user selections
  val activeLanguage = userProgress.map { it?.selectedLanguage ?: "np" }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "np")

  val activeCategory = userProgress.map { it?.selectedCategory ?: "A" }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "A")

  // Readiness Score, Weak Topics, Streak list computed dynamically
  val readinessScore = combine(attempts, questions, activeCategory) { attemptsList, questionsList, catId ->
    val relevantAttempts = attemptsList.filter { it.categoryId == catId }
    if (relevantAttempts.isEmpty()) return@combine 0

    // Average correct % of last 5 attempts
    val slice = relevantAttempts.take(5)
    val totalAnswered = slice.sumOf { it.totalQuestions }
    val totalCorrect = slice.sumOf { it.correctAnswersCount }

    if (totalAnswered == 0) 0 else ((totalCorrect.toDouble() / totalAnswered) * 100).toInt()
  }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

  val currentLevel = combine(attempts, readinessScore) { attemptsList, readiness ->
    val quizAttempts = attemptsList.filter { it.mode == "Quiz" }
    val mockAttempts = attemptsList.filter { it.mode == "Mock" }

    when {
      mockAttempts.isNotEmpty() && readiness >= 80 && mockAttempts.take(2).all { it.passed } -> "Exam-Ready"
      quizAttempts.size >= 5 && quizAttempts.map { (it.score.toDouble() / (it.totalQuestions * 10)) * 100 }.average() >= 70.0 -> "Practiced"
      quizAttempts.size >= 3 && quizAttempts.map { (it.score.toDouble() / (it.totalQuestions * 10)) * 100 }.average() >= 50.0 -> "Learner"
      else -> "Beginner"
    }
  }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "Beginner")

  val weakTopics = combine(attempts, questions) { attemptsList, allQs ->
    // Quick heuristic: find topics with low scores in recent attempts
    // Or scan quiz answers. Since we store scores, we can group questions by topic
    // and flag topics where mistakes were made.
    val wrongTopics = mutableMapOf<String, Int>()
    val correctTopics = mutableMapOf<String, Int>()

    // Let's analyze attempts. If average score of attempts with topics is low
    attemptsList.filter { it.topic != null }.forEach { attempt ->
      val topic = attempt.topic ?: return@forEach
      val wrongCount = attempt.totalQuestions - attempt.correctAnswersCount
      wrongTopics[topic] = (wrongTopics[topic] ?: 0) + wrongCount
      correctTopics[topic] = (correctTopics[topic] ?: 0) + attempt.correctAnswersCount
    }

    wrongTopics.keys.filter { topic ->
      val wrong = wrongTopics[topic] ?: 0
      val correct = correctTopics[topic] ?: 0
      val total = wrong + correct
      total > 0 && (correct.toDouble() / total) < 0.7
    }.take(3)
  }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

  // Onboarding
  fun completeOnboarding(userName: String, categoryId: String, language: String) {
    viewModelScope.launch {
      val dateStr = getTodayADDate()
      val profile = UserProgress(
        id = 1,
        name = userName.trim().ifEmpty { "Nabin" },
        selectedCategory = categoryId,
        selectedLanguage = language,
        points = 0,
        streakCount = 1,
        lastActiveDateStr = dateStr,
        hasOnboarded = true,
        phoneNumber = null,
        jwtToken = null,
        isLoggedIn = false,
        categoryPreferences = categoryId
      )
      repository.saveUserProgress(profile)
    }
  }

  // JWT / Authentication State
  private val _loginError = MutableStateFlow<String?>(null)
  val loginError: StateFlow<String?> = _loginError.asStateFlow()

  private val _isAuthenticating = MutableStateFlow(false)
  val isAuthenticating: StateFlow<Boolean> = _isAuthenticating.asStateFlow()

  fun loginWithEmail(email: String, password: String, categories: List<String>) {
    viewModelScope.launch {
      _isAuthenticating.value = true
      _loginError.value = null
      val dateStr = getTodayADDate()
      try {
        if (email.trim().isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
          throw Exception("कृपया वैध इमेल प्रविष्ट गर्नुहोस् (Please enter a valid email)")
        }
        if (password.length < 6) {
          throw Exception("पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ (Password must be at least 6 characters)")
        }

        val userProfile = FirebaseAuthService.signInWithEmail(email, password, dateStr)
        val jwtToken = JwtHelper.generateToken(email, userProfile.name, categories)

        val currentProgress = repository.getUserProgressDirect() ?: UserProgress()
        val updatedProfile = currentProgress.copy(
          name = userProfile.name,
          email = userProfile.email.ifEmpty { email },
          jwtToken = jwtToken,
          isLoggedIn = true,
          selectedCategory = userProfile.preferredCategory,
          categoryPreferences = userProfile.categoryPreferences.joinToString(","),
          hasOnboarded = true,
          lastActiveDateStr = dateStr,
          points = userProfile.points,
          streakCount = userProfile.streakCount
        )
        repository.saveUserProgress(updatedProfile)

        // Sync attempts from Firestore
        val currentUser = FirebaseAuthService.auth?.currentUser
        if (currentUser != null) {
          val firestoreAttempts = FirebaseAuthService.fetchAttemptsFromFirestore(currentUser.uid)
          firestoreAttempts.forEach { attempt ->
            repository.insertAttempt(attempt.copy(userEmail = userProfile.email.ifEmpty { email }))
          }
        }

        // Force a fresh content sync after login
        syncContent(force = true)

        _isAuthenticating.value = false
      } catch (e: Exception) {
        _loginError.value = e.localizedMessage ?: "इमेल वा पासवर्ड मिलेन (Invalid email or password)"
        _isAuthenticating.value = false
      }
    }
  }

  fun signUpWithEmail(email: String, password: String, name: String, categories: List<String>) {
    viewModelScope.launch {
      _isAuthenticating.value = true
      _loginError.value = null
      val dateStr = getTodayADDate()
      try {
        if (email.trim().isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
          throw Exception("कृपया वैध इमेल प्रविष्ट गर्नुहोस् (Please enter a valid email)")
        }
        if (password.length < 6) {
          throw Exception("पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ (Password must be at least 6 characters)")
        }
        if (name.trim().isEmpty()) {
          throw Exception("कृपया आफ्नो नाम प्रविष्ट गर्नुहोस् (Please enter your name)")
        }

        val userProfile = FirebaseAuthService.signUpWithEmail(email, password, name, categories, dateStr)
        val jwtToken = JwtHelper.generateToken(email, name, categories)

        val currentProgress = repository.getUserProgressDirect() ?: UserProgress()
        val updatedProfile = currentProgress.copy(
          name = name,
          email = email,
          jwtToken = jwtToken,
          isLoggedIn = true,
          selectedCategory = userProfile.preferredCategory,
          categoryPreferences = userProfile.categoryPreferences.joinToString(","),
          hasOnboarded = true,
          lastActiveDateStr = dateStr
        )
        repository.saveUserProgress(updatedProfile)
        _isAuthenticating.value = false
      } catch (e: Exception) {
        _loginError.value = e.localizedMessage ?: "साइन अप त्रुटि (Sign up error)"
        _isAuthenticating.value = false
      }
    }
  }

  fun loginWithGoogle(email: String, name: String, idToken: String, categories: List<String>) {
    viewModelScope.launch {
      _isAuthenticating.value = true
      _loginError.value = null
      val dateStr = getTodayADDate()
      try {
        if (email.trim().isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
          throw Exception("अमान्य गुगल इमेल (Invalid Google email)")
        }
        val userProfile = FirebaseAuthService.signInWithGoogle(idToken, name, email, dateStr)
        val jwtToken = JwtHelper.generateToken(email, name, categories)

        val currentProgress = repository.getUserProgressDirect() ?: UserProgress()
        val updatedProfile = currentProgress.copy(
          name = name,
          email = email,
          jwtToken = jwtToken,
          isLoggedIn = true,
          selectedCategory = userProfile.preferredCategory,
          categoryPreferences = userProfile.categoryPreferences.joinToString(","),
          hasOnboarded = true,
          lastActiveDateStr = dateStr,
          points = userProfile.points,
          streakCount = userProfile.streakCount
        )
        repository.saveUserProgress(updatedProfile)

        // Sync attempts from Firestore
        val currentUser = FirebaseAuthService.auth?.currentUser
        if (currentUser != null) {
          val firestoreAttempts = FirebaseAuthService.fetchAttemptsFromFirestore(currentUser.uid)
          firestoreAttempts.forEach { attempt ->
            repository.insertAttempt(attempt.copy(userEmail = email))
          }
        }

        // Force a fresh content sync after login
        syncContent(force = true)

        _isAuthenticating.value = false
      } catch (e: Exception) {
        _loginError.value = e.localizedMessage ?: "गुगल लगइन त्रुटि (Google login error)"
        _isAuthenticating.value = false
      }
    }
  }

  fun loginWithGoogleFederated(activity: android.app.Activity, categories: List<String>) {
    val auth = FirebaseAuthService.auth
    if (auth == null) {
      _loginError.value = "Firebase Auth component is not available."
      return
    }
    _isAuthenticating.value = true
    _loginError.value = null

    val provider = com.google.firebase.auth.OAuthProvider.newBuilder("google.com")
    provider.addCustomParameter("prompt", "select_account")

    auth.startActivityForSignInWithProvider(activity, provider.build())
      .addOnSuccessListener { authResult ->
        viewModelScope.launch {
          val firebaseUser = authResult.user
          if (firebaseUser != null) {
            val email = firebaseUser.email ?: ""
            val displayName = firebaseUser.displayName ?: "Google User"
            val uid = firebaseUser.uid
            val dateStr = getTodayADDate()

            try {
              // Fetch or construct profile
              val existingProfile = FirebaseAuthService.fetchProfileFromFirestore(uid)
              val userProfile = existingProfile ?: FirebaseAuthService.UserProfile(
                uid = uid,
                email = email,
                name = displayName,
                preferredCategory = categories.firstOrNull() ?: "A",
                categoryPreferences = categories,
                lastActiveDate = dateStr
              )

              // If profile is new, write to Firestore
              if (existingProfile == null && FirebaseAuthService.firestore != null) {
                FirebaseAuthService.firestore!!.collection("users")
                  .document(uid)
                  .set(userProfile.toMap())
                  .addOnFailureListener { e ->
                    android.util.Log.e("ViewModel", "Firestore user save failed", e)
                  }
              }

              val jwtToken = JwtHelper.generateToken(email, displayName, userProfile.categoryPreferences)
              val currentProgress = repository.getUserProgressDirect() ?: UserProgress()
              val updatedProfile = currentProgress.copy(
                name = displayName,
                email = email,
                jwtToken = jwtToken,
                isLoggedIn = true,
                selectedCategory = userProfile.preferredCategory,
                categoryPreferences = userProfile.categoryPreferences.joinToString(","),
                hasOnboarded = true,
                lastActiveDateStr = dateStr,
                points = userProfile.points,
                streakCount = userProfile.streakCount
              )
              repository.saveUserProgress(updatedProfile)

              // Sync attempts from Firestore
              val firestoreAttempts = FirebaseAuthService.fetchAttemptsFromFirestore(uid)
              firestoreAttempts.forEach { attempt ->
                repository.insertAttempt(attempt.copy(userEmail = email))
              }

              // Force a fresh content sync after login
              syncContent(force = true)

              _isAuthenticating.value = false
            } catch (e: Exception) {
              _loginError.value = e.localizedMessage ?: "गुगल लगइन त्रुटि (Google login error)"
              _isAuthenticating.value = false
            }
          } else {
            _loginError.value = "Sign-in failed: empty authentication payload"
            _isAuthenticating.value = false
          }
        }
      }
      .addOnFailureListener { e ->
        android.util.Log.e("ViewModel", "Google Federated Web Login failed", e)
        _loginError.value = e.localizedMessage ?: "गुगल लगइन रद्द वा असफल भयो (Google Sign-In canceled or failed)"
        _isAuthenticating.value = false
      }
  }

  fun setLoginError(error: String) {
    _loginError.value = error
  }

  // --- Ask the Expert State ---
  private val _expertLoading = MutableStateFlow(false)
  val expertLoading: StateFlow<Boolean> = _expertLoading.asStateFlow()

  private val _expertExplanation = MutableStateFlow<String?>(null)
  val expertExplanation: StateFlow<String?> = _expertExplanation.asStateFlow()

  private val _expertError = MutableStateFlow<String?>(null)
  val expertError: StateFlow<String?> = _expertError.asStateFlow()

  fun clearExpertState() {
    _expertExplanation.value = null
    _expertError.value = null
    _expertLoading.value = false
  }

  fun askExpert(type: String, title: String, content: String, lang: String) {
    viewModelScope.launch {
      _expertLoading.value = true
      _expertExplanation.value = null
      _expertError.value = null

      val systemPrompt = """
        You are a highly experienced and friendly Traffic Police Inspector and Transport Expert from Nepal. 
        Your task is to simplify traffic rules, road signs, or fines for driving license aspirants.
        Always explain in a professional yet extremely clear and supportive tone.
        Include:
        1. A simplified "In simple words" (सरल शब्दमा) explanation.
        2. A real-life scenario or practical example of how this applies on Nepalese roads.
        3. A critical safety tip or warning.
        Keep the response well-formatted using standard Markdown (bullet points, bold text, etc.).
        You MUST respond entirely in the requested language: ${if (lang == "np") "Nepali (नेपाली)" else "English"}.
      """.trimIndent()

      val userPrompt = """
        Item Type: $type
        Title/Subject: $title
        Original content or description: $content
        
        Please provide a simplified explanation and a practical example in ${if (lang == "np") "Nepali (नेपाली)" else "English"}.
      """.trimIndent()

      try {
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isEmpty() || apiKey == "MY_GEMINI_API_KEY") {
          throw Exception(
            if (lang == "np") {
              "जेमिनी एपीआई कुञ्जी (GEMINI_API_KEY) सेट गरिएको छैन। कृपया यसलाई एआई स्टुडियोको सेक्रेट्स (Secrets) प्यानलमा कन्फिगर गर्नुहोस्।"
            } else {
              "Gemini API key is not configured. Please set GEMINI_API_KEY in the Secrets panel in AI Studio."
            }
          )
        }

        val request = GenerateContentRequest(
          contents = listOf(Content(parts = listOf(Part(text = userPrompt)))),
          systemInstruction = Content(parts = listOf(Part(text = systemPrompt))),
          generationConfig = GenerationConfig(temperature = 0.7f)
        )

        val response = RetrofitGeminiClient.service.generateContent(apiKey, request)
        val textResult = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text

        if (textResult != null) {
          _expertExplanation.value = textResult
        } else {
          _expertError.value = if (lang == "np") {
            "विज्ञबाट कुनै प्रतिक्रिया प्राप्त भएन। कृपया पुनः प्रयास गर्नुहोस्।"
          } else {
            "No explanation could be generated by the expert. Please try again."
          }
        }
      } catch (e: Exception) {
        _expertError.value = e.localizedMessage ?: e.message ?: "An unexpected error occurred."
      } finally {
        _expertLoading.value = false
      }
    }
  }

  fun updateCategoryPreferences(preferences: List<String>) {
    viewModelScope.launch {
      val current = repository.getUserProgressDirect() ?: return@launch
      val updatedPrefs = preferences.joinToString(",")
      
      val newToken = if (current.isLoggedIn && current.email != null) {
        JwtHelper.generateToken(current.email, current.name, preferences)
      } else {
        current.jwtToken
      }
      
      repository.saveUserProgress(
        current.copy(
          categoryPreferences = updatedPrefs,
          jwtToken = newToken
        )
      )

      // Sync updated category preferences to Firestore if Firebase user session is active
      val currentUser = FirebaseAuthService.auth?.currentUser
      if (currentUser != null) {
        FirebaseAuthService.savePreferencesToFirestore(
          uid = currentUser.uid,
          preferredCategory = current.selectedCategory,
          categories = preferences
        )
      }
    }
  }

  fun logout() {
    viewModelScope.launch {
      val current = repository.getUserProgressDirect() ?: return@launch
      repository.saveUserProgress(
        current.copy(
          phoneNumber = null,
          email = null,
          jwtToken = null,
          isLoggedIn = false,
          hasOnboarded = false // Reset onboarding so login is prompted again
        )
      )
      // Sign out from Firebase Auth
      FirebaseAuthService.auth?.signOut()
    }
  }

  // Profile Toggles
  fun setLanguage(lang: String) {
    viewModelScope.launch {
      val current = repository.getUserProgressDirect() ?: UserProgress()
      repository.saveUserProgress(current.copy(selectedLanguage = lang))
    }
  }

  fun setCategory(catId: String) {
    viewModelScope.launch {
      val current = repository.getUserProgressDirect() ?: UserProgress()
      repository.saveUserProgress(current.copy(selectedCategory = catId))
    }
  }

  fun updateProfileName(name: String) {
    viewModelScope.launch {
      val current = repository.getUserProgressDirect() ?: UserProgress()
      val trimmed = name.trim().ifEmpty { current.name }
      repository.saveUserProgress(current.copy(name = trimmed))

      // Sync name update to Firestore if Firebase user session is active
      val currentUser = FirebaseAuthService.auth?.currentUser
      if (currentUser != null) {
        try {
          FirebaseAuthService.firestore?.collection("users")
            ?.document(currentUser.uid)
            ?.update("name", trimmed)
            ?.let { task ->
              // Use non-blocking listener or standard coroutine call
              task.addOnFailureListener { e ->
                android.util.Log.e("LicenseSathiVM", "Failed to sync name: ${e.message}")
              }
            }
        } catch (e: Exception) {
          android.util.Log.e("LicenseSathiVM", "Failed to sync name to Firestore", e)
        }
      }
    }
  }

  // Star / Bookmarks
  fun toggleStarRoadSign(sign: RoadSign) {
    viewModelScope.launch {
      repository.updateRoadSign(sign.copy(isStarred = !sign.isStarred))
    }
  }

  fun toggleStarRuleArticle(article: RuleArticle) {
    viewModelScope.launch {
      repository.updateRuleArticle(article.copy(isStarred = !article.isStarred))
    }
  }

  fun toggleQuestionBookmark(questionId: Int) {
    viewModelScope.launch {
      val allQs = questions.value
      val target = allQs.find { it.id == questionId } ?: return@launch
      val updated = target.copy(isBookmarked = !target.isBookmarked)
      repository.updateQuestion(updated)

      _quizState.value?.let { state ->
        val updatedQuestions = state.questions.map { q ->
          if (q.id == questionId) updated else q
        }
        _quizState.value = state.copy(questions = updatedQuestions)
      }

      _mockState.value?.let { state ->
        val updatedQuestions = state.questions.map { q ->
          if (q.id == questionId) updated else q
        }
        _mockState.value = state.copy(questions = updatedQuestions)
      }
    }
  }

  /**
   * Starts a quiz from a Firestore Question Set by fetching the set's questions from Firestore.
   * Falls back to local Room DB questions filtered by setId string if Firestore fails.
   */
  fun startQuizFromFirebaseSet(set: FirestoreContentService.QuestionSet) {
    viewModelScope.launch {
      _showPracticeSetup.value = false
      try {
        // Try fetching questions directly from Firestore for this set
        val fsQuestions = FirestoreContentService.fetchQuestionsForSet(set.id)
        val setQuestions: List<com.example.data.Question> = if (fsQuestions.isNotEmpty()) {
          fsQuestions
        } else {
          // Fallback: use locally synced questions that match setId (stored as hashCode)
          questions.value.filter { it.categoryId == set.id || it.categoryId == "ALL" }.take(20)
        }
        if (setQuestions.isNotEmpty()) {
          _quizState.value = QuizState(
            questions           = setQuestions,
            currentIndex        = 0,
            selectedOptionIndex = null,
            isAnswered          = false,
            answers             = emptyMap(),
            correctCount        = 0,
            isCompleted         = false,
            topicName           = set.name.ifEmpty { "Set Quiz" }
          )
        }
      } catch (e: Exception) {
        android.util.Log.e("LicenseSathiVM", "startQuizFromFirebaseSet error", e)
      }
    }
  }

  /**
   * Starts a quiz from a specific set (0-indexed) using locally synced questions.
   * Kept for fallback/offline use.
   */
  fun startQuizFromSet(setIndex: Int, setSize: Int = 20) {
    viewModelScope.launch {
      val cat = activeCategory.value
      val allQs = questions.value
        .filter { it.categoryId == cat || it.categoryId == "ALL" }

      val start = setIndex * setSize
      val slice = allQs.drop(start).take(setSize)
      val selected = if (slice.isNotEmpty()) slice else allQs.take(setSize) // fallback

      if (selected.isNotEmpty()) {
        _quizState.value = QuizState(
          questions        = selected,
          currentIndex     = 0,
          selectedOptionIndex = null,
          isAnswered       = false,
          answers          = emptyMap(),
          correctCount     = 0,
          isCompleted      = false,
          topicName        = "Set ${setIndex + 1}"
        )
        _showPracticeSetup.value = false
      }
    }
  }

  fun startQuiz(topic: String?, difficulty: String?, count: Int = 10) {
    viewModelScope.launch {
      val allQs = questions.value
      val cat = activeCategory.value
      var filtered = allQs.filter { it.categoryId == cat || it.categoryId == "ALL" }

      if (topic != null) {
        val topicFiltered = filtered.filter { it.topic.equals(topic, ignoreCase = true) }
        if (topicFiltered.isNotEmpty()) {
          filtered = topicFiltered
        }
      }
      if (difficulty != null) {
        val diffFiltered = filtered.filter { it.difficulty.equals(difficulty, ignoreCase = true) }
        if (diffFiltered.isNotEmpty()) {
          filtered = diffFiltered
        }
      }

      val selected = filtered.shuffled().take(count)
      if (selected.isNotEmpty()) {
        _quizState.value = QuizState(
          questions = selected,
          currentIndex = 0,
          selectedOptionIndex = null,
          isAnswered = false,
          answers = emptyMap(),
          correctCount = 0,
          isCompleted = false,
          topicName = topic ?: "Daily Quiz"
        )
        _showPracticeSetup.value = false
      } else {
        // Fallback: relax filters to ensure the user gets a functional session and is never stuck
        val fallbackQs = allQs.filter { it.categoryId == cat || it.categoryId == "ALL" }.shuffled().take(count)
        if (fallbackQs.isNotEmpty()) {
          _quizState.value = QuizState(
            questions = fallbackQs,
            currentIndex = 0,
            selectedOptionIndex = null,
            isAnswered = false,
            answers = emptyMap(),
            correctCount = 0,
            isCompleted = false,
            topicName = topic ?: "Daily Practice"
          )
          _showPracticeSetup.value = false
        }
      }
    }
  }

  fun selectQuizOption(index: Int) {
    val state = _quizState.value ?: return
    if (state.isAnswered) return
    _quizState.value = state.copy(selectedOptionIndex = index)
  }

  fun submitQuizAnswer() {
    val state = _quizState.value ?: return
    val selected = state.selectedOptionIndex ?: return
    if (state.isAnswered) return

    val currentQ = state.questions[state.currentIndex]
    val isCorrect = selected == currentQ.correctOptionIndex
    val newAnswers = state.answers.toMutableMap().apply { put(state.currentIndex, selected) }
    val newCorrectCount = if (isCorrect) state.correctCount + 1 else state.correctCount

    _quizState.value = state.copy(
      isAnswered = true,
      answers = newAnswers,
      correctCount = newCorrectCount
    )

    // Award immediate points
    if (isCorrect) {
      awardPoints(10)
    }
  }

  fun nextQuizQuestion() {
    val state = _quizState.value ?: return
    if (!state.isAnswered) return

    if (state.currentIndex + 1 < state.questions.size) {
      _quizState.value = state.copy(
        currentIndex = state.currentIndex + 1,
        selectedOptionIndex = null,
        isAnswered = false
      )
    } else {
      finishQuiz()
    }
  }

  private fun finishQuiz() {
    val state = _quizState.value ?: return
    val totalQs = state.questions.size
    val score = state.correctCount * 10
    val passed = state.correctCount.toDouble() / totalQs >= 0.70

    viewModelScope.launch {
      // Save attempt log
      val currentProg = repository.getUserProgressDirect()
      val userEmail = if (currentProg?.isLoggedIn == true) currentProg.email else null
      val newAttempt = Attempt(
        mode = "Quiz",
        categoryId = activeCategory.value,
        score = score,
        totalQuestions = totalQs,
        passed = passed,
        startedAt = System.currentTimeMillis() - 60000,
        completedAt = System.currentTimeMillis(),
        topic = state.topicName,
        correctAnswersCount = state.correctCount,
        userEmail = userEmail
      )
      repository.insertAttempt(newAttempt)

      // Sync attempt to Firestore if user is logged in
      val currentUser = FirebaseAuthService.auth?.currentUser
      if (currentUser != null && userEmail != null) {
        FirebaseAuthService.saveAttemptToFirestore(currentUser.uid, newAttempt)
      }

      _quizState.value = state.copy(isCompleted = true)

      // Points rewards
      awardPoints(state.correctCount * 5 + if (passed) 50 else 0)

      // Verify badges
      checkAchievements()
    }
  }

  fun closeQuiz() {
    _quizState.value = null
  }

  // Mock Exam Operations
  /**
   * Start a mock exam from a specific question set (0-indexed, 20 questions per set).
   * Uses the same timer and scoring as the regular mock exam.
   */
  fun startMockExamFromSet(setIndex: Int, setSize: Int = 20) {
    viewModelScope.launch {
      val catId   = activeCategory.value
      val allQs   = questions.value.filter { it.categoryId == catId || it.categoryId == "ALL" }
      val catList = categories.value
      val activeCat = catList.find { it.id == catId }
        ?: Category("A", "Category A", "Category A", "motorcycle", 20, 30, 80)

      val start    = setIndex * setSize
      val selected = allQs.drop(start).take(setSize).ifEmpty { allQs.take(setSize) }

      if (selected.isNotEmpty()) {
        mockTimerJob?.cancel()
        _mockState.value = MockState(
          questions        = selected,
          currentIndex     = 0,
          answers          = emptyMap(),
          timeLeftSeconds  = activeCat.timeLimitMinutes * 60,
          isTimerRunning   = true,
          isCompleted      = false
        )
        startMockTimer()
      }
    }
  }

  fun startMockExam() {
    viewModelScope.launch {
      val catId = activeCategory.value
      val allQs = questions.value
      val catList = categories.value
      val activeCat = catList.find { it.id == catId } ?: Category("A", "Category A", "Category A", "motorcycle", 20, 30, 80)

      // Nepal DoTM written mock exam questions selection:
      // Target: Weight 70% from Category specific, 30% from general 'ALL'
      val catQs = allQs.filter { it.categoryId == catId }
      val generalQs = allQs.filter { it.categoryId == "ALL" }

      val examQsCount = activeCat.questionCount // 20
      val targetCatCount = (examQsCount * 0.7).toInt() // 14
      val actualCatTake = minOf(targetCatCount, catQs.size)
      val targetGenCount = examQsCount - actualCatTake

      val examQuestions = (catQs.shuffled().take(actualCatTake) + generalQs.shuffled().take(targetGenCount))
        .shuffled()
        .take(examQsCount)

      if (examQuestions.isNotEmpty()) {
        mockTimerJob?.cancel()
        val limitSeconds = activeCat.timeLimitMinutes * 60

        _mockState.value = MockState(
          questions = examQuestions,
          currentIndex = 0,
          answers = emptyMap(),
          timeLeftSeconds = limitSeconds,
          isTimerRunning = true,
          isCompleted = false
        )

        startMockTimer()
      }
    }
  }

  private fun startMockTimer() {
    mockTimerJob = viewModelScope.launch {
      while (true) {
        delay(1000)
        val state = _mockState.value ?: break
        if (!state.isTimerRunning || state.isCompleted) break

        if (state.timeLeftSeconds > 0) {
          _mockState.value = state.copy(timeLeftSeconds = state.timeLeftSeconds - 1)
        } else {
          submitMockExam()
          break
        }
      }
    }
  }

  fun selectMockOption(index: Int) {
    val state = _mockState.value ?: return
    if (state.isCompleted) return

    val newAnswers = state.answers.toMutableMap().apply { put(state.currentIndex, index) }
    _mockState.value = state.copy(answers = newAnswers)
  }

  fun nextMockQuestion() {
    val state = _mockState.value ?: return
    if (state.currentIndex + 1 < state.questions.size) {
      _mockState.value = state.copy(currentIndex = state.currentIndex + 1)
    }
  }

  fun prevMockQuestion() {
    val state = _mockState.value ?: return
    if (state.currentIndex > 0) {
      _mockState.value = state.copy(currentIndex = state.currentIndex - 1)
    }
  }

  fun selectMockQuestionDirect(index: Int) {
    val state = _mockState.value ?: return
    if (index in state.questions.indices) {
      _mockState.value = state.copy(currentIndex = index)
    }
  }

  fun submitMockExam() {
    mockTimerJob?.cancel()
    val state = _mockState.value ?: return
    if (state.isCompleted) return

    var correctCount = 0
    state.questions.forEachIndexed { index, question ->
      val answer = state.answers[index]
      if (answer == question.correctOptionIndex) {
        correctCount++
      }
    }

    val totalQs = state.questions.size
    val correctPercentage = (correctCount.toDouble() / totalQs) * 100
    // Passing criteria is 80% per DoTM spec in PRD
    val passed = correctPercentage >= 80.0

    val finalScore = correctCount * 10

    viewModelScope.launch {
      val currentProg = repository.getUserProgressDirect()
      val userEmail = if (currentProg?.isLoggedIn == true) currentProg.email else null
      val newAttempt = Attempt(
        mode = "Mock",
        categoryId = activeCategory.value,
        score = finalScore,
        totalQuestions = totalQs,
        passed = passed,
        startedAt = System.currentTimeMillis() - ((activeCategory.value.let { if (it == "A") 15 else 20 } * 60) - state.timeLeftSeconds) * 1000,
        completedAt = System.currentTimeMillis(),
        topic = "Full Mock Exam",
        correctAnswersCount = correctCount,
        userEmail = userEmail
      )
      repository.insertAttempt(newAttempt)

      // Sync attempt to Firestore if user is logged in
      val currentUser = FirebaseAuthService.auth?.currentUser
      if (currentUser != null && userEmail != null) {
        FirebaseAuthService.saveAttemptToFirestore(currentUser.uid, newAttempt)
      }

      _mockState.value = state.copy(
        isCompleted = true,
        isTimerRunning = false,
        finalScore = finalScore,
        passed = passed
      )

      // Award points
      awardPoints(correctCount * 15 + if (passed) 150 else 0)

      // Check achievements
      checkAchievements()
    }
  }

  fun closeMockExam() {
    _mockState.value = null
  }

  // Points and Levels internal helper
  private fun awardPoints(pts: Int) {
    viewModelScope.launch {
      val current = repository.getUserProgressDirect() ?: return@launch
      val newPoints = current.points + pts
      repository.saveUserProgress(current.copy(points = newPoints))
      
      // Sync to Firestore if logged in
      val currentUser = FirebaseAuthService.auth?.currentUser
      if (currentUser != null && current.isLoggedIn) {
        FirebaseAuthService.syncProfileToFirestore(
          uid = currentUser.uid,
          points = newPoints,
          streakCount = current.streakCount
        )
      }
    }
  }

  // Badges check logic
  private suspend fun checkAchievements() {
    val progress = repository.getUserProgressDirect() ?: return
    val attemptsList = database.appDao().getAllAttempts().first()
    val allBadges = database.appDao().getAllBadges().first()

    val levelStr = currentLevel.value

    allBadges.forEach { badge ->
      if (badge.isEarned) return@forEach

      var meetsCriteria = false
      when (badge.id) {
        "streak_3" -> if (progress.streakCount >= 3) meetsCriteria = true
        "streak_7" -> if (progress.streakCount >= 7) meetsCriteria = true
        "sign_master" -> {
          // Score 100% in a road sign topic quiz
          val signQuizzes = attemptsList.filter { it.mode == "Quiz" && it.topic == "Road Signs" }
          if (signQuizzes.any { it.correctAnswersCount == it.totalQuestions }) meetsCriteria = true
        }
        "mock_pass" -> {
          val passedMocks = attemptsList.filter { it.mode == "Mock" && it.passed }
          if (passedMocks.isNotEmpty()) meetsCriteria = true
        }
        "cat_a_ready" -> {
          if (progress.selectedCategory == "A" && levelStr == "Exam-Ready") meetsCriteria = true
        }
        "cat_b_ready" -> {
          if (progress.selectedCategory == "B" && levelStr == "Exam-Ready") meetsCriteria = true
        }
      }

      if (meetsCriteria) {
        repository.updateBadge(
          badge.copy(
            isEarned = true,
            earnedAt = System.currentTimeMillis()
          )
        )
      }
    }
  }

  // Streak Tracker and Firebase Auth session synchronization on app start
  init {
    viewModelScope.launch {
      // 1. Sync / Restore Firebase Auth Session
      val currentUser = FirebaseAuthService.auth?.currentUser
      var profile = repository.getUserProgressDirect()
      val todayStr = getTodayADDate()
      
      if (currentUser != null) {
        // User is logged into Firebase. Make sure local database knows they are logged in and has up-to-date details
        val firebaseProfile = FirebaseAuthService.fetchProfileFromFirestore(currentUser.uid)
        if (firebaseProfile != null) {
          val jwtToken = JwtHelper.generateToken(firebaseProfile.email, firebaseProfile.name, firebaseProfile.categoryPreferences)
          val restoredProgress = (profile ?: UserProgress()).copy(
            name = firebaseProfile.name,
            email = firebaseProfile.email,
            jwtToken = jwtToken,
            isLoggedIn = true,
            selectedCategory = firebaseProfile.preferredCategory,
            categoryPreferences = firebaseProfile.categoryPreferences.joinToString(","),
            hasOnboarded = true,
            lastActiveDateStr = todayStr,
            points = firebaseProfile.points,
            streakCount = firebaseProfile.streakCount
          )
          repository.saveUserProgress(restoredProgress)
          profile = restoredProgress

          // Restore attempts from Firestore on startup
          val firestoreAttempts = FirebaseAuthService.fetchAttemptsFromFirestore(currentUser.uid)
          firestoreAttempts.forEach { attempt ->
            repository.insertAttempt(attempt.copy(userEmail = firebaseProfile.email))
          }
        } else if (profile != null && !profile.isLoggedIn) {
          // Fallback if Firestore fetch is delayed but Firebase Auth is active
          val restoredProgress = profile.copy(
            isLoggedIn = true,
            hasOnboarded = true,
            lastActiveDateStr = todayStr
          )
          repository.saveUserProgress(restoredProgress)
          profile = restoredProgress
        }
      } else if (profile?.isLoggedIn == true) {
        // If local profile says logged in but Firebase has no current user session, sign out locally to keep sessions synchronized
        if (FirebaseAuthService.auth != null) {
          val loggedOutProgress = profile.copy(
            isLoggedIn = false,
            hasOnboarded = false,
            jwtToken = null
          )
          repository.saveUserProgress(loggedOutProgress)
          profile = loggedOutProgress
        }
      }

      // 2. Streak Tracker logic
      if (profile != null) {
        val lastActiveStr = profile.lastActiveDateStr

        if (lastActiveStr.isNotEmpty() && lastActiveStr != todayStr) {
          val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
          try {
            val lastDate = sdf.parse(lastActiveStr)
            val todayDate = sdf.parse(todayStr)
            if (lastDate != null && todayDate != null) {
              val diffMs = todayDate.time - lastDate.time
              val diffDays = diffMs / (1000 * 60 * 60 * 24)

              val newStreak = if (diffDays == 1L) {
                profile.streakCount + 1
              } else if (diffDays > 1L) {
                1 // Streak broken
              } else {
                profile.streakCount // Same day
              }

              repository.saveUserProgress(
                profile.copy(
                  streakCount = newStreak,
                  lastActiveDateStr = todayStr
                )
              )
            }
          } catch (e: Exception) {
            // Keep existing streak if date parsing fails
          }
        } else if (lastActiveStr.isEmpty()) {
          repository.saveUserProgress(profile.copy(lastActiveDateStr = todayStr))
        }
      }
    }
  }

  // Dynamic Content Editor CMS functions (Admin Panel)
  fun addQuestion(q: Question) {
    viewModelScope.launch {
      repository.insertQuestion(q)
    }
  }

  fun updateQuestionAdmin(q: Question) {
    viewModelScope.launch {
      repository.updateQuestion(q)
    }
  }

  fun deleteQuestionAdmin(id: Int) {
    viewModelScope.launch {
      repository.deleteQuestionById(id)
    }
  }

  fun addRoadSign(sign: RoadSign) {
    viewModelScope.launch {
      repository.insertRoadSign(sign)
    }
  }

  fun addRuleArticle(article: RuleArticle) {
    viewModelScope.launch {
      repository.insertRuleArticle(article)
    }
  }

  fun addFinePenalty(fine: FinePenalty) {
    viewModelScope.launch {
      repository.insertFine(fine)
    }
  }

  // Helpers
  private fun getTodayADDate(): String {
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    return sdf.format(Date())
  }

  // Bikram Sambat Calendar conversion
  fun getBSDateRepresentation(timestamp: Long = System.currentTimeMillis()): String {
    // Gregorian to Bikram Sambat conversion:
    // BS calendar is approximately 56 years, 8 months, 17 days ahead of Gregorian AD.
    // Let's do a safe approximate calendar conversion for user presentation:
    // 2026-07-13 corresponds to 2083-Ashad-29.
    // Month mapping:
    // July (approx. Ashad / Shrawan)
    val cal = Calendar.getInstance().apply { timeInMillis = timestamp }
    val adYear = cal.get(Calendar.YEAR)
    val adMonth = cal.get(Calendar.MONTH) // 0-indexed
    val adDay = cal.get(Calendar.DAY_OF_MONTH)

    var bsYear = adYear + 56
    var bsMonthNameNp = "श्रावण"
    var bsMonthNameEn = "Shrawan"

    // Custom approximation calendar offsets
    // Jan: Poush/Magh, Feb: Magh/Fagun, Mar: Fagun/Chaitra, Apr: Chaitra/Baisakh, May: Baisakh/Jestha, Jun: Jestha/Ashad
    // Jul: Ashad/Shrawan, Aug: Shrawan/Bhadra, Sep: Bhadra/Ashwin, Oct: Ashwin/Kartik, Nov: Kartik/Mangsir, Dec: Mangsir/Poush
    when (adMonth) {
      0 -> { bsMonthNameNp = "पौष"; bsMonthNameEn = "Poush"; if (adDay < 15) bsYear-- }
      1 -> { bsMonthNameNp = "माघ"; bsMonthNameEn = "Magh"; if (adDay < 13) bsYear-- }
      2 -> { bsMonthNameNp = "फाल्गुन"; bsMonthNameEn = "Fagun"; if (adDay < 14) bsYear-- }
      3 -> { bsMonthNameNp = "चैत्र"; bsMonthNameEn = "Chaitra"; if (adDay < 13) bsYear-- }
      4 -> { bsMonthNameNp = "बैशाख"; bsMonthNameEn = "Baisakh" }
      5 -> { bsMonthNameNp = "जेठ"; bsMonthNameEn = "Jestha" }
      6 -> { bsMonthNameNp = "असार"; bsMonthNameEn = "Ashad" }
      7 -> { bsMonthNameNp = "साउन"; bsMonthNameEn = "Shrawan" }
      8 -> { bsMonthNameNp = "भदौ"; bsMonthNameEn = "Bhadra" }
      9 -> { bsMonthNameNp = "असोज"; bsMonthNameEn = "Ashwin" }
      10 -> { bsMonthNameNp = "कात्तिक"; bsMonthNameEn = "Kartik" }
      11 -> { bsMonthNameNp = "मंसिर"; bsMonthNameEn = "Mangsir" }
    }

    // Dynamic offset calculations for day
    val bsDay = (adDay + 15) % 31 + 1

    return if (activeLanguage.value == "np") {
      "२०${getNepaliDigits(bsYear % 100)} $bsMonthNameNp ${getNepaliDigits(bsDay)}"
    } else {
      "${bsYear} ${bsMonthNameEn} ${bsDay}"
    }
  }

  fun getNepaliDigits(num: Int): String {
    val nepaliDigits = arrayOf('०', '१', '२', '३', '४', '५', '६', '७', '८', '९')
    return num.toString().map { char ->
      if (char.isDigit()) nepaliDigits[char - '0'] else char
    }.joinToString("")
  }

  fun resetProgress() {
    viewModelScope.launch {
      val current = repository.getUserProgressDirect() ?: return@launch
      if (current.isLoggedIn && !current.email.isNullOrEmpty()) {
        // Real authenticated user: Delete only their attempts from Room
        repository.deleteAttemptsByUser(current.email)

        // Reset points to 0, streakCount to 1 in local progress
        val resetProfile = current.copy(points = 0, streakCount = 1)
        repository.saveUserProgress(resetProfile)

        // Sync points and streak to Firestore
        val currentUser = FirebaseAuthService.auth?.currentUser
        if (currentUser != null) {
          FirebaseAuthService.syncProfileToFirestore(
            uid = currentUser.uid,
            points = 0,
            streakCount = 1
          )
          // Clear attempts in Firestore
          FirebaseAuthService.clearAttemptsFromFirestore(currentUser.uid)
        }
      } else {
        // Guest user: Clear mock attempts and reset guest points/streaks
        repository.deleteMockAttempts()
        val resetProfile = current.copy(points = 0, streakCount = 1)
        repository.saveUserProgress(resetProfile)
      }
    }
  }
}

// States
data class QuizState(
  val questions: List<Question>,
  val currentIndex: Int,
  val selectedOptionIndex: Int?,
  val isAnswered: Boolean,
  val answers: Map<Int, Int>, // Index -> SelectedOptionIndex
  val correctCount: Int,
  val isCompleted: Boolean,
  val topicName: String
)

data class MockState(
  val questions: List<Question>,
  val currentIndex: Int,
  val answers: Map<Int, Int?>, // Index -> SelectedOptionIndex
  val timeLeftSeconds: Int,
  val isTimerRunning: Boolean,
  val isCompleted: Boolean,
  val finalScore: Int = 0,
  val passed: Boolean = false
)
