package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "categories")
data class Category(
  @PrimaryKey val id: String, // "A", "B", "C", "D"
  val nameNp: String,
  val nameEn: String,
  val icon: String, // "motorcycle", "car", "bus"
  val questionCount: Int,
  val timeLimitMinutes: Int,
  val passMark: Int
)

@Entity(tableName = "questions")
data class Question(
  @PrimaryKey(autoGenerate = true) val id: Int = 0,
  val categoryId: String, // "A" or "B" or "ALL"
  val topic: String, // "Right of Way", "Road Signs", "Traffic Rules", "Vehicle Knowledge"
  val questionNp: String,
  val questionEn: String,
  val optionsNp: String, // Separated by '|', e.g. "बायाँ|दायाँ|सिधा|रोक्ने"
  val optionsEn: String, // Separated by '|', e.g. "Left|Right|Straight|Stop"
  val correctOptionIndex: Int, // 0, 1, 2, 3
  val explanationNp: String,
  val explanationEn: String,
  val difficulty: String, // "Easy", "Medium", "Hard"
  val imageRef: String? = null, // e.g. "sign_stop"
  val isArchived: Boolean = false,
  val isFlagged: Boolean = false,
  val flagReason: String? = null,
  val isBookmarked: Boolean = false
) {
  fun getOptions(lang: String): List<String> {
    val raw = if (lang == "np") optionsNp else optionsEn
    return raw.split("|").map { it.trim() }
  }

  fun getQuestion(lang: String): String = if (lang == "np") questionNp else questionEn
  fun getExplanation(lang: String): String = if (lang == "np") explanationNp else explanationEn
}

@Entity(tableName = "road_signs")
data class RoadSign(
  @PrimaryKey(autoGenerate = true) val id: Int = 0,
  val type: String, // "Mandatory", "Warning", "Informational"
  val nameNp: String,
  val nameEn: String,
  val descriptionNp: String,
  val descriptionEn: String,
  val memoryTipNp: String,
  val memoryTipEn: String,
  val iconName: String, // e.g. "sign_stop", "sign_no_entry", "sign_speed_limit_40"
  val isStarred: Boolean = false
) {
  fun getName(lang: String): String = if (lang == "np") nameNp else nameEn
  fun getDescription(lang: String): String = if (lang == "np") descriptionNp else descriptionEn
  fun getMemoryTip(lang: String): String = if (lang == "np") memoryTipNp else memoryTipEn
}

@Entity(tableName = "rule_articles")
data class RuleArticle(
  @PrimaryKey(autoGenerate = true) val id: Int = 0,
  val topic: String, // "general", "overtaking", "speed", "drink_driving", "documents"
  val titleNp: String,
  val titleEn: String,
  val contentNp: String, // Paragraphs separated by '\n'
  val contentEn: String,
  val categoryId: String = "ALL",
  val isStarred: Boolean = false
) {
  fun getTitle(lang: String): String = if (lang == "np") titleNp else titleEn
  fun getContent(lang: String): String = if (lang == "np") contentNp else contentEn
}

@Entity(tableName = "fines")
data class FinePenalty(
  @PrimaryKey(autoGenerate = true) val id: Int = 0,
  val offenseNp: String,
  val offenseEn: String,
  val fineAmount: String, // e.g. "Rs. 500 - 1500"
  val category: String // "Alcohol", "Over-speeding", "Lane Violation", "License Missing"
) {
  fun getOffense(lang: String): String = if (lang == "np") offenseNp else offenseEn
}

@Entity(tableName = "user_progress")
data class UserProgress(
  @PrimaryKey val id: Int = 1, // Single profile local database
  val name: String = "Nabin",
  val selectedCategory: String = "A", // Cat A (Motorcycle) by default
  val selectedLanguage: String = "np", // "np" or "en"
  val points: Int = 0,
  val streakCount: Int = 0,
  val lastActiveDateStr: String = "", // "YYYY-MM-DD"
  val hasOnboarded: Boolean = false,
  val phoneNumber: String? = null,
  val email: String? = null,
  val jwtToken: String? = null,
  val isLoggedIn: Boolean = false,
  val categoryPreferences: String = "A" // Comma-separated list like "A,B"
) {
  fun getCategoryPreferencesList(): List<String> {
    return categoryPreferences.split(",").map { it.trim() }.filter { it.isNotEmpty() }
  }
}

@Entity(tableName = "attempts")
data class Attempt(
  @PrimaryKey(autoGenerate = true) val id: Int = 0,
  val mode: String, // "Quiz" or "Mock"
  val categoryId: String,
  val score: Int,
  val totalQuestions: Int,
  val passed: Boolean,
  val startedAt: Long,
  val completedAt: Long,
  val topic: String? = null,
  val correctAnswersCount: Int,
  val userEmail: String? = null
)

@Entity(tableName = "badges")
data class Badge(
  @PrimaryKey val id: String, // "streak_7", "sign_master", "mock_pass", "ready_a"
  val nameNp: String,
  val nameEn: String,
  val criteria: String,
  val iconName: String, // "local_fire_department", "verified", "emoji_events", "military_tech"
  val isEarned: Boolean = false,
  val earnedAt: Long = 0L
) {
  fun getName(lang: String): String = if (lang == "np") nameNp else nameEn
}

@Entity(tableName = "video_guides")
data class VideoGuide(
  @PrimaryKey val id: Int = 0,
  val topic: String = "",
  val titleNp: String,
  val titleEn: String,
  val descriptionNp: String,
  val descriptionEn: String,
  val videoUrl: String,
  val localPath: String? = null,
  val isWatched: Boolean = false,
  val durationSeconds: Int = 0,
  val category: String = "ALL",    // Firestore field (replaces categoryId for sync)
  val isPublished: Boolean = true  // Mirrors Firestore isPublished flag
) {
  fun getTitle(lang: String): String = if (lang == "np") titleNp else titleEn
  fun getDescription(lang: String): String = if (lang == "np") descriptionNp else descriptionEn
}
