package com.example.data

import android.content.Context
import kotlinx.coroutines.flow.Flow

class AppRepository(private val dao: AppDao, context: Context? = null) {

  /** Null-safe sync manager – only available when a Context is supplied. */
  val contentSync: ContentSyncManager? = context?.let { ContentSyncManager(it, dao) }

  val allCategories: Flow<List<Category>> = dao.getAllCategories()
  val allQuestions: Flow<List<Question>> = dao.getAllActiveQuestions()
  val allRoadSigns: Flow<List<RoadSign>> = dao.getAllRoadSigns()
  val allRuleArticles: Flow<List<RuleArticle>> = dao.getAllRuleArticles()
  val allFines: Flow<List<FinePenalty>> = dao.getAllFines()
  val userProgressFlow: Flow<UserProgress?> = dao.getUserProgressFlow()
  val allAttempts: Flow<List<Attempt>> = dao.getAllAttempts()
  val allBadges: Flow<List<Badge>> = dao.getAllBadges()
  val allVideoGuides: Flow<List<VideoGuide>> = dao.getAllVideoGuides()

  fun getQuestionsForCategory(categoryId: String): Flow<List<Question>> =
    dao.getQuestionsForCategory(categoryId)

  suspend fun getUserProgressDirect(): UserProgress? = dao.getUserProgressDirect()

  suspend fun saveUserProgress(progress: UserProgress) {
    dao.saveUserProgress(progress)
  }

  suspend fun insertCategory(category: Category) {
    dao.insertCategory(category)
  }

  suspend fun insertQuestion(question: Question) {
    dao.insertQuestion(question)
  }

  suspend fun updateQuestion(question: Question) {
    dao.updateQuestion(question)
  }

  suspend fun deleteQuestionById(id: Int) {
    dao.deleteQuestionById(id)
  }

  suspend fun insertRoadSign(sign: RoadSign) {
    dao.insertRoadSign(sign)
  }

  suspend fun updateRoadSign(sign: RoadSign) {
    dao.updateRoadSign(sign)
  }

  suspend fun insertRuleArticle(article: RuleArticle) {
    dao.insertRuleArticle(article)
  }

  suspend fun updateRuleArticle(article: RuleArticle) {
    dao.updateRuleArticle(article)
  }

  suspend fun insertFine(fine: FinePenalty) {
    dao.insertFine(fine)
  }

  suspend fun insertAttempt(attempt: Attempt) {
    dao.insertAttempt(attempt)
  }

  suspend fun deleteAttemptsByUser(email: String) {
    dao.deleteAttemptsByUser(email)
  }

  suspend fun deleteMockAttempts() {
    dao.deleteMockAttempts()
  }

  suspend fun updateBadge(badge: Badge) {
    dao.updateBadge(badge)
  }
}
