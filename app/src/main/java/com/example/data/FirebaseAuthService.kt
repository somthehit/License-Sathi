package com.example.data

import android.app.Activity
import android.util.Log
import com.google.firebase.FirebaseException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import java.util.concurrent.TimeUnit

object FirebaseAuthService {
  private const val TAG = "FirebaseAuthService"
  
  // Lazy access so if Firebase is not fully initialized it won't crash immediately on load
  val auth: FirebaseAuth? by lazy {
    try {
      FirebaseAuth.getInstance()
    } catch (e: Exception) {
      Log.w(TAG, "Firebase Auth not available: ${e.message}")
      null
    }
  }

  val firestore: FirebaseFirestore? by lazy {
    try {
      FirebaseFirestore.getInstance()
    } catch (e: Exception) {
      Log.w(TAG, "Firebase Firestore not available: ${e.message}")
      null
    }
  }

  // Session user profile stored in Firestore
  data class UserProfile(
    val uid: String = "",
    val phoneNumber: String = "",
    val email: String = "",
    val name: String = "",
    val preferredCategory: String = "A",
    val categoryPreferences: List<String> = listOf("A"),
    val lastActiveDate: String = "",
    val points: Int = 0,
    val streakCount: Int = 1
  ) {
    fun toMap(): Map<String, Any?> {
      return mapOf(
        "uid" to uid,
        "phoneNumber" to phoneNumber,
        "email" to email,
        "name" to name,
        "preferredCategory" to preferredCategory,
        "categoryPreferences" to categoryPreferences,
        "lastActiveDate" to lastActiveDate,
        "points" to points,
        "streakCount" to streakCount
      )
    }
  }

  interface VerificationCallback {
    fun onCodeSent(verificationId: String, token: PhoneAuthProvider.ForceResendingToken?)
    fun onVerificationCompleted(credential: PhoneAuthCredential)
    fun onVerificationFailed(e: Exception)
  }

  /**
   * Starts the phone number verification process using Firebase Phone Auth.
   * If Firebase is unavailable, falls back gracefully.
   */
  fun verifyPhoneNumber(
    activity: Activity,
    phoneNumber: String,
    callback: VerificationCallback
  ) {
    val firebaseAuth = auth
    if (firebaseAuth == null) {
      Log.i(TAG, "Firebase Auth not initialized. Using simulated verification flow.")
      // Simulate success callback
      callback.onCodeSent("simulated_verification_id_12345", null)
      return
    }

    try {
      val options = PhoneAuthOptions.newBuilder(firebaseAuth)
        .setPhoneNumber(phoneNumber)
        .setTimeout(60L, TimeUnit.SECONDS)
        .setActivity(activity)
        .setCallbacks(object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
          override fun onVerificationCompleted(credential: PhoneAuthCredential) {
            Log.d(TAG, "onVerificationCompleted: $credential")
            callback.onVerificationCompleted(credential)
          }

          override fun onVerificationFailed(e: FirebaseException) {
            Log.e(TAG, "onVerificationFailed: ", e)
            callback.onVerificationFailed(e)
          }

          override fun onCodeSent(
            verificationId: String,
            token: PhoneAuthProvider.ForceResendingToken
          ) {
            Log.d(TAG, "onCodeSent: $verificationId")
            callback.onCodeSent(verificationId, token)
          }
        })
        .build()
      
      PhoneAuthProvider.verifyPhoneNumber(options)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to start phone verification: ", e)
      callback.onVerificationFailed(e)
    }
  }

  /**
   * Verifies the OTP code and completes authentication.
   * After sign-in, it stores/updates the user profile in Firestore.
   */
  suspend fun signInWithOtp(
    verificationId: String,
    otpCode: String,
    name: String,
    categories: List<String>,
    dateStr: String
  ): UserProfile {
    val firebaseAuth = auth
    val firebaseFirestore = firestore

    if (firebaseAuth == null || verificationId == "simulated_verification_id_12345") {
      Log.i(TAG, "Firebase Auth unavailable or simulated verification. Signing in simulated user.")
      // Generate simulated user profile
      val simUid = "simulated_uid_${otpCode.hashCode()}"
      val profile = UserProfile(
        uid = simUid,
        phoneNumber = "Simulated Phone",
        name = name.ifEmpty { "Nabin" },
        preferredCategory = categories.firstOrNull() ?: "A",
        categoryPreferences = categories,
        lastActiveDate = dateStr
      )
      return profile
    }

    // Real Firebase Auth flow
    val credential = PhoneAuthProvider.getCredential(verificationId, otpCode)
    val authResult = firebaseAuth.signInWithCredential(credential).await()
    val firebaseUser = authResult.user ?: throw Exception("User is null after successful authentication")

    val userProfile = UserProfile(
      uid = firebaseUser.uid,
      phoneNumber = firebaseUser.phoneNumber ?: "",
      name = name.ifEmpty { "Nabin" },
      preferredCategory = categories.firstOrNull() ?: "A",
      categoryPreferences = categories,
      lastActiveDate = dateStr
    )

    // Store in Firestore
    if (firebaseFirestore != null) {
      try {
        firebaseFirestore.collection("users")
          .document(firebaseUser.uid)
          .set(userProfile.toMap())
          .await()
        Log.d(TAG, "User profile successfully saved to Firestore.")
      } catch (e: Exception) {
        Log.e(TAG, "Error saving user profile to Firestore: ", e)
        // We still return the profile since Auth succeeded
      }
    }

    return userProfile
  }

  /**
   * Saves updated category preferences in Firestore.
   */
  suspend fun savePreferencesToFirestore(uid: String, preferredCategory: String, categories: List<String>) {
    val firebaseFirestore = firestore ?: return
    try {
      val updates = mapOf(
        "preferredCategory" to preferredCategory,
        "categoryPreferences" to categories
      )
      firebaseFirestore.collection("users")
        .document(uid)
        .update(updates)
        .await()
      Log.d(TAG, "User preferences updated in Firestore.")
    } catch (e: Exception) {
      Log.e(TAG, "Error updating preferences in Firestore: ", e)
    }
  }

  /**
   * Sign up with email and password.
   */
  suspend fun signUpWithEmail(
    email: String,
    password: String,
    name: String,
    categories: List<String>,
    dateStr: String
  ): UserProfile {
    val firebaseAuth = auth
    val firebaseFirestore = firestore

    if (firebaseAuth == null) {
      Log.i(TAG, "Firebase Auth unavailable. Simulating email sign-up.")
      val simUid = "sim_email_uid_${email.hashCode()}"
      return UserProfile(
        uid = simUid,
        email = email,
        name = name.ifEmpty { "User" },
        preferredCategory = categories.firstOrNull() ?: "A",
        categoryPreferences = categories,
        lastActiveDate = dateStr
      )
    }

    val authResult = firebaseAuth.createUserWithEmailAndPassword(email, password).await()
    val firebaseUser = authResult.user ?: throw Exception("User is null after successful email sign-up")

    val userProfile = UserProfile(
      uid = firebaseUser.uid,
      email = firebaseUser.email ?: email,
      name = name.ifEmpty { "User" },
      preferredCategory = categories.firstOrNull() ?: "A",
      categoryPreferences = categories,
      lastActiveDate = dateStr
    )

    // Store in Firestore
    if (firebaseFirestore != null) {
      try {
        firebaseFirestore.collection("users")
          .document(firebaseUser.uid)
          .set(userProfile.toMap())
          .await()
      } catch (e: Exception) {
        Log.e(TAG, "Error saving user profile to Firestore: ", e)
      }
    }

    return userProfile
  }

  /**
   * Sign in with email and password.
   */
  suspend fun signInWithEmail(
    email: String,
    password: String,
    dateStr: String
  ): UserProfile {
    val firebaseAuth = auth
    val firebaseFirestore = firestore

    if (firebaseAuth == null) {
      Log.i(TAG, "Firebase Auth unavailable. Simulating email sign-in.")
      val simUid = "sim_email_uid_${email.hashCode()}"
      return UserProfile(
        uid = simUid,
        email = email,
        name = "Nabin",
        preferredCategory = "A",
        categoryPreferences = listOf("A"),
        lastActiveDate = dateStr
      )
    }

    val authResult = firebaseAuth.signInWithEmailAndPassword(email, password).await()
    val firebaseUser = authResult.user ?: throw Exception("User is null after successful email sign-in")

    val existingProfile = fetchProfileFromFirestore(firebaseUser.uid)
    if (existingProfile != null) {
      return existingProfile
    }

    return UserProfile(
      uid = firebaseUser.uid,
      email = firebaseUser.email ?: email,
      name = firebaseUser.displayName ?: "User",
      preferredCategory = "A",
      categoryPreferences = listOf("A"),
      lastActiveDate = dateStr
    )
  }

  /**
   * Sign in with Google (Simulated/OAuth integration)
   */
  suspend fun signInWithGoogle(
    googleIdToken: String,
    name: String,
    email: String,
    dateStr: String
  ): UserProfile {
    val firebaseAuth = auth
    val firebaseFirestore = firestore

    if (firebaseAuth == null || googleIdToken == "simulated_google_token") {
      Log.i(TAG, "Firebase Auth unavailable or simulated Google login.")
      val simUid = "sim_google_uid_${email.hashCode()}"
      return UserProfile(
        uid = simUid,
        email = email,
        name = name.ifEmpty { "Google User" },
        preferredCategory = "A",
        categoryPreferences = listOf("A"),
        lastActiveDate = dateStr
      )
    }

    // Real Firebase Auth with Google Credential
    val credential = com.google.firebase.auth.GoogleAuthProvider.getCredential(googleIdToken, null)
    val authResult = firebaseAuth.signInWithCredential(credential).await()
    val firebaseUser = authResult.user ?: throw Exception("User is null after successful Google authentication")

    val existingProfile = fetchProfileFromFirestore(firebaseUser.uid)
    if (existingProfile != null) {
      return existingProfile
    }

    val userProfile = UserProfile(
      uid = firebaseUser.uid,
      email = firebaseUser.email ?: email,
      name = firebaseUser.displayName ?: name.ifEmpty { "Google User" },
      preferredCategory = "A",
      categoryPreferences = listOf("A"),
      lastActiveDate = dateStr
    )

    // Store in Firestore
    if (firebaseFirestore != null) {
      try {
        firebaseFirestore.collection("users")
          .document(firebaseUser.uid)
          .set(userProfile.toMap())
          .await()
        Log.d(TAG, "Google User profile successfully saved to Firestore.")
      } catch (e: Exception) {
        Log.e(TAG, "Error saving Google user profile to Firestore: ", e)
      }
    }

    return userProfile
  }

  /**
   * Retrieves profile data from Firestore.
   */
  suspend fun fetchProfileFromFirestore(uid: String): UserProfile? {
    val firebaseFirestore = firestore ?: return null
    try {
      val doc = firebaseFirestore.collection("users")
        .document(uid)
        .get()
        .await()
      if (doc.exists()) {
        val prefs = doc.get("categoryPreferences") as? List<*>
        val categoriesList = prefs?.mapNotNull { it?.toString() } ?: listOf("A")
        
        return UserProfile(
          uid = doc.getString("uid") ?: uid,
          phoneNumber = doc.getString("phoneNumber") ?: "",
          email = doc.getString("email") ?: "",
          name = doc.getString("name") ?: "",
          preferredCategory = doc.getString("preferredCategory") ?: "A",
          categoryPreferences = categoriesList,
          lastActiveDate = doc.getString("lastActiveDate") ?: "",
          points = doc.getLong("points")?.toInt() ?: 0,
          streakCount = doc.getLong("streakCount")?.toInt() ?: 1
        )
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error fetching profile from Firestore: ", e)
    }
    return null
  }

  /**
   * Saves an attempt to Firestore.
   */
  suspend fun saveAttemptToFirestore(uid: String, attempt: Attempt) {
    val firebaseFirestore = firestore ?: return
    try {
      val data = mapOf(
        "mode" to attempt.mode,
        "categoryId" to attempt.categoryId,
        "score" to attempt.score,
        "totalQuestions" to attempt.totalQuestions,
        "passed" to attempt.passed,
        "startedAt" to attempt.startedAt,
        "completedAt" to attempt.completedAt,
        "topic" to attempt.topic,
        "correctAnswersCount" to attempt.correctAnswersCount
      )
      firebaseFirestore.collection("users")
        .document(uid)
        .collection("attempts")
        .document(attempt.completedAt.toString())
        .set(data)
        .await()
      Log.d(TAG, "Attempt successfully saved to Firestore.")
    } catch (e: Exception) {
      Log.e(TAG, "Error saving attempt to Firestore: ", e)
    }
  }

  /**
   * Fetches user's attempts from Firestore.
   */
  suspend fun fetchAttemptsFromFirestore(uid: String): List<Attempt> {
    val firebaseFirestore = firestore ?: return emptyList()
    return try {
      val snapshot = firebaseFirestore.collection("users")
        .document(uid)
        .collection("attempts")
        .get()
        .await()
      snapshot.documents.mapNotNull { doc ->
        Attempt(
          mode = doc.getString("mode") ?: "Quiz",
          categoryId = doc.getString("categoryId") ?: "A",
          score = doc.getLong("score")?.toInt() ?: 0,
          totalQuestions = doc.getLong("totalQuestions")?.toInt() ?: 10,
          passed = doc.getBoolean("passed") ?: false,
          startedAt = doc.getLong("startedAt") ?: 0L,
          completedAt = doc.getLong("completedAt") ?: 0L,
          topic = doc.getString("topic"),
          correctAnswersCount = doc.getLong("correctAnswersCount")?.toInt() ?: 0
        )
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error fetching attempts from Firestore: ", e)
      emptyList()
    }
  }

  /**
   * Updates user points and streak in Firestore.
   */
  suspend fun syncProfileToFirestore(uid: String, points: Int, streakCount: Int) {
    val firebaseFirestore = firestore ?: return
    try {
      val updates = mapOf(
        "points" to points,
        "streakCount" to streakCount
      )
      firebaseFirestore.collection("users")
        .document(uid)
        .update(updates)
        .await()
      Log.d(TAG, "User points and streak updated in Firestore.")
    } catch (e: Exception) {
      Log.e(TAG, "Error updating profile in Firestore: ", e)
    }
  }

  /**
   * Clears all attempts from Firestore.
   */
  suspend fun clearAttemptsFromFirestore(uid: String) {
    val firebaseFirestore = firestore ?: return
    try {
      val snapshot = firebaseFirestore.collection("users")
        .document(uid)
        .collection("attempts")
        .get()
        .await()
      for (doc in snapshot.documents) {
        doc.reference.delete().await()
      }
      Log.d(TAG, "All attempts cleared from Firestore.")
    } catch (e: Exception) {
      Log.e(TAG, "Error clearing attempts from Firestore: ", e)
    }
  }
}
