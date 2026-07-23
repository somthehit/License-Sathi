package com.example.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface AppDao {

  // Categories
  @Query("SELECT * FROM categories")
  fun getAllCategories(): Flow<List<Category>>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertCategory(category: Category)

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertCategories(categories: List<Category>)

  // Questions
  @Query("SELECT * FROM questions WHERE isArchived = 0")
  fun getAllActiveQuestions(): Flow<List<Question>>

  @Query("SELECT * FROM questions WHERE categoryId = :categoryId OR categoryId = 'ALL' AND isArchived = 0")
  fun getQuestionsForCategory(categoryId: String): Flow<List<Question>>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertQuestion(question: Question)

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertQuestions(questions: List<Question>)

  @Update
  suspend fun updateQuestion(question: Question)

  @Query("DELETE FROM questions WHERE id = :id")
  suspend fun deleteQuestionById(id: Int)

  // Road Signs
  @Query("SELECT * FROM road_signs")
  fun getAllRoadSigns(): Flow<List<RoadSign>>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertRoadSign(sign: RoadSign)

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertRoadSigns(signs: List<RoadSign>)

  @Update
  suspend fun updateRoadSign(sign: RoadSign)

  // Rule Articles
  @Query("SELECT * FROM rule_articles")
  fun getAllRuleArticles(): Flow<List<RuleArticle>>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertRuleArticle(article: RuleArticle)

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertRuleArticles(articles: List<RuleArticle>)

  @Update
  suspend fun updateRuleArticle(article: RuleArticle)

  // Fines
  @Query("SELECT * FROM fines")
  fun getAllFines(): Flow<List<FinePenalty>>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertFines(fines: List<FinePenalty>)

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertFine(fine: FinePenalty)

  // User Progress
  @Query("SELECT * FROM user_progress WHERE id = 1")
  fun getUserProgressFlow(): Flow<UserProgress?>

  @Query("SELECT * FROM user_progress WHERE id = 1")
  suspend fun getUserProgressDirect(): UserProgress?

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun saveUserProgress(progress: UserProgress)

  // VideoGuides
  @Query("SELECT * FROM video_guides WHERE isPublished = 1 ORDER BY id ASC")
  fun getAllVideoGuides(): Flow<List<VideoGuide>>

  @Query("SELECT * FROM video_guides WHERE category = :category AND isPublished = 1 ORDER BY id ASC")
  fun getVideoGuidesForCategory(category: String): Flow<List<VideoGuide>>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertVideoGuide(video: VideoGuide)

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertVideoGuides(videos: List<VideoGuide>)

  @Update
  suspend fun updateVideoGuide(video: VideoGuide)

  @Query("DELETE FROM video_guides WHERE id = :id")
  suspend fun deleteVideoGuideById(id: Int)

  // Attempts
  @Query("SELECT * FROM attempts ORDER BY completedAt DESC")
  fun getAllAttempts(): Flow<List<Attempt>>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertAttempt(attempt: Attempt)

  @Query("DELETE FROM attempts WHERE userEmail = :email")
  suspend fun deleteAttemptsByUser(email: String)

  @Query("DELETE FROM attempts WHERE userEmail IS NULL OR userEmail = 'mock_user'")
  suspend fun deleteMockAttempts()

  // Badges
  @Query("SELECT * FROM badges")
  fun getAllBadges(): Flow<List<Badge>>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insertBadges(badges: List<Badge>)

  @Update
  suspend fun updateBadge(badge: Badge)
}
