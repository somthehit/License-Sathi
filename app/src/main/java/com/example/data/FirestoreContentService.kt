package com.example.data

import android.util.Log
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.QueryDocumentSnapshot
import kotlinx.coroutines.tasks.await

/**
 * Fetches content (questions, study materials) from Firestore and maps them
 * to local Room entities. The admin panel writes to these same collections.
 *
 * Firestore collections:
 *   - "questions"       → Question entities
 *   - "study_materials" → RoadSign, RuleArticle, FinePenalty entities
 *                         (distinguished by contentType field)
 */
object FirestoreContentService {

    private const val TAG = "FirestoreContentSvc"

    private val db: FirebaseFirestore?
        get() = FirebaseAuthService.firestore

    // ── Questions ────────────────────────────────────────────────────────────

    /**
     * Fetches all Active questions from Firestore.
     * Returns an empty list if Firestore is unavailable or the fetch fails.
     */
    suspend fun fetchQuestions(): List<Question> {
        val firestore = db ?: run {
            Log.w(TAG, "Firestore not available – skipping question sync")
            return emptyList()
        }
        return try {
            val snapshot = firestore.collection("questions")
                .whereEqualTo("status", "Active")
                .get()
                .await()

            snapshot.documents.mapNotNull { doc -> mapDocToQuestion(doc.id, doc.data) }
                .also { Log.d(TAG, "Fetched ${it.size} questions from Firestore") }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch questions", e)
            emptyList()
        }
    }

    private fun mapDocToQuestion(docId: String, data: Map<String, Any?>?): Question? {
        if (data == null) return null
        return try {
            // Admin panel uses "category" field; local DB uses "categoryId"
            val categoryId = (data["category"] as? String)
                ?: (data["categoryId"] as? String)
                ?: "ALL"

            // Options: stored either as pipe-separated string or as a List
            val optionsNp = resolveOptions(data["optionsNp"])
            val optionsEn = resolveOptions(data["optionsEn"])

            // correctOptionIndex can be stored as Long (Firestore number) or Int
            val correctIndex = when (val raw = data["correctOptionIndex"]) {
                is Long   -> raw.toInt()
                is Int    -> raw
                is String -> raw.toIntOrNull() ?: 0
                else      -> 0
            }

            Question(
                // Use a stable numeric ID derived from Firestore doc ID so Room REPLACE works
                id              = docId.hashCode().let { if (it < 0) -it else it },
                categoryId      = categoryId,
                topic           = (data["topic"] as? String) ?: "General",
                questionNp      = (data["questionNp"] as? String) ?: "",
                questionEn      = (data["questionEn"] as? String) ?: "",
                optionsNp       = optionsNp,
                optionsEn       = optionsEn,
                correctOptionIndex = correctIndex,
                explanationNp   = (data["explanationNp"] as? String) ?: "",
                explanationEn   = (data["explanationEn"] as? String) ?: "",
                difficulty      = (data["difficulty"] as? String) ?: "Medium",
                imageRef        = data["imageRef"] as? String,
                isArchived      = false,
                isFlagged       = (data["isFlagged"] as? Boolean) ?: false,
                isBookmarked    = false
            )
        } catch (e: Exception) {
            Log.w(TAG, "Skipping malformed question doc $docId: ${e.message}")
            null
        }
    }

    /** Accepts either a pipe-separated String or a List<*> of options. */
    private fun resolveOptions(raw: Any?): String = when (raw) {
        is String -> raw
        is List<*> -> raw.joinToString("|") { it?.toString()?.trim() ?: "" }
        else       -> ""
    }

    // ── Study Materials ───────────────────────────────────────────────────────

    // ── Question Sets ─────────────────────────────────────────────────────────

    data class QuestionSet(
        val id: String,
        val name: String,
        val nameNp: String,
        val description: String,
        val questionCount: Int = 0,
    )

    /**
     * Fetches all question sets from Firestore.
     * Returns an empty list if Firestore is unavailable or the fetch fails.
     */
    suspend fun fetchQuestionSets(): List<QuestionSet> {
        val firestore = db ?: run {
            Log.w(TAG, "Firestore not available – skipping question sets fetch")
            return emptyList()
        }
        return try {
            val setsSnap = firestore.collection("question_sets").get().await()
            val sets = setsSnap.documents.mapNotNull { doc ->
                val d = doc.data ?: return@mapNotNull null
                QuestionSet(
                    id          = doc.id,
                    name        = (d["name"] as? String) ?: "",
                    nameNp      = (d["nameNp"] as? String) ?: "",
                    description = (d["description"] as? String) ?: "",
                )
            }

            // For each set, count its questions
            val setsWithCount = sets.map { set ->
                try {
                    val countSnap = firestore.collection("questions")
                        .whereEqualTo("setId", set.id)
                        .get()
                        .await()
                    set.copy(questionCount = countSnap.size())
                } catch (e: Exception) {
                    Log.w(TAG, "Could not count questions for set ${set.id}: ${e.message}")
                    set
                }
            }.filter { it.questionCount > 0 } // Only show sets that have questions

            Log.d(TAG, "Fetched ${setsWithCount.size} question sets from Firestore")
            setsWithCount
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch question sets", e)
            emptyList()
        }
    }

    /**
     * Fetches all Active questions belonging to a specific set.
     */
    suspend fun fetchQuestionsForSet(setId: String): List<Question> {
        val firestore = db ?: return emptyList()
        return try {
            val snapshot = firestore.collection("questions")
                .whereEqualTo("setId", setId)
                .whereEqualTo("status", "Active")
                .get()
                .await()
            snapshot.documents.mapNotNull { doc -> mapDocToQuestion(doc.id, doc.data) }
                .also { Log.d(TAG, "Fetched ${it.size} questions for set $setId") }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch questions for set $setId", e)
            emptyList()
        }
    }

    // ── Notices ──────────────────────────────────────────────────────────────

    data class AppNotice(
        val id: String,
        val titleEn: String,
        val titleNp: String,
        val contentEn: String,
        val contentNp: String,
        val type: String,          // "info" | "warning" | "urgent" | "update"
        val targetCategory: List<String>,
        val publishedAt: Long?,    // epoch millis, null if not yet published
    )

    /**
     * Fetches all Published notices from Firestore, newest first.
     */
    suspend fun fetchNotices(): List<AppNotice> {
        val firestore = db ?: run {
            Log.w(TAG, "Firestore not available – skipping notice fetch")
            return emptyList()
        }
        return try {
            val snapshot = firestore.collection("notices")
                .whereEqualTo("status", "Published")
                .get()
                .await()

            snapshot.documents.mapNotNull { doc ->
                val d = doc.data ?: return@mapNotNull null
                AppNotice(
                    id              = doc.id,
                    titleEn         = (d["titleEn"]  as? String) ?: "",
                    titleNp         = (d["titleNp"]  as? String) ?: "",
                    contentEn       = (d["contentEn"] as? String) ?: "",
                    contentNp       = (d["contentNp"] as? String) ?: "",
                    type            = (d["type"]      as? String) ?: "info",
                    targetCategory  = @Suppress("UNCHECKED_CAST")
                                      (d["targetCategory"] as? List<String>) ?: listOf("all"),
                    publishedAt     = (d["publishedAt"] as? com.google.firebase.Timestamp)
                                          ?.toDate()?.time,
                )
            }.sortedByDescending { it.publishedAt ?: 0L }
                .also { Log.d(TAG, "Fetched ${it.size} notices from Firestore") }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch notices", e)
            emptyList()
        }
    }

    data class StudyMaterialBatch(
        val roadSigns: List<RoadSign>,
        val ruleArticles: List<RuleArticle>,
        val fines: List<FinePenalty>
    )

    /**
     * Fetches all Published study materials from Firestore and splits them
     * by contentType into RoadSign / RuleArticle / FinePenalty lists.
     */
    suspend fun fetchStudyMaterials(): StudyMaterialBatch {
        val firestore = db ?: run {
            Log.w(TAG, "Firestore not available – skipping study material sync")
            return StudyMaterialBatch(emptyList(), emptyList(), emptyList())
        }
        return try {
            val snapshot = firestore.collection("study_materials")
                .whereEqualTo("status", "Published")
                .get()
                .await()

            val roadSigns    = mutableListOf<RoadSign>()
            val ruleArticles = mutableListOf<RuleArticle>()
            val fines        = mutableListOf<FinePenalty>()

            for (doc in snapshot.documents) {
                val data = doc.data ?: continue
                when ((data["contentType"] as? String)?.lowercase()) {
                    "road sign", "roadsign", "road_sign", "sign", "traffic sign" -> {
                        mapDocToRoadSign(doc.id, data)?.let { roadSigns += it }
                    }
                    "rule", "rule article", "rule_article", "article", "traffic rule",
                    "road rule", "law", "road_rules" -> {
                        mapDocToRuleArticle(doc.id, data)?.let { ruleArticles += it }
                    }
                    "fine", "fine/penalty", "penalty", "fines" -> {
                        mapDocToFine(doc.id, data)?.let { fines += it }
                    }
                    "vehicle knowledge", "vehicle_knowledge", "vehicleknowledge" -> {
                        // Vehicle Knowledge questions are stored in the questions collection,
                        // but if seeded into study_materials, map them as rule articles
                        mapDocToRuleArticle(doc.id, data)?.let { ruleArticles += it }
                    }
                    else -> Log.d(TAG, "Unknown contentType for doc ${doc.id}: ${data["contentType"]}")
                }
            }

            Log.d(TAG, "Fetched ${roadSigns.size} signs, ${ruleArticles.size} articles, ${fines.size} fines")
            StudyMaterialBatch(roadSigns, ruleArticles, fines)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch study materials", e)
            StudyMaterialBatch(emptyList(), emptyList(), emptyList())
        }
    }

    private fun mapDocToRoadSign(docId: String, data: Map<String, Any?>): RoadSign? {
        return try {
            RoadSign(
                id             = docId.hashCode().let { if (it < 0) -it else it },
                type           = (data["type"] as? String) ?: "Informational",
                nameNp         = (data["nameNp"] as? String) ?: (data["titleNp"] as? String) ?: (data["title"] as? String) ?: "",
                nameEn         = (data["nameEn"] as? String) ?: (data["titleEn"] as? String) ?: "",
                descriptionNp  = (data["descriptionNp"] as? String) ?: (data["descNp"] as? String) ?: (data["description"] as? String) ?: "",
                descriptionEn  = (data["descriptionEn"] as? String) ?: (data["descEn"] as? String) ?: "",
                memoryTipNp    = (data["memoryTipNp"] as? String) ?: "",
                memoryTipEn    = (data["memoryTipEn"] as? String) ?: "",
                iconName       = (data["iconName"] as? String) ?: (data["imageUrl"] as? String) ?: "sign_info"
            )
        } catch (e: Exception) {
            Log.w(TAG, "Skipping malformed road sign doc $docId: ${e.message}")
            null
        }
    }

    private fun mapDocToRuleArticle(docId: String, data: Map<String, Any?>): RuleArticle? {
        return try {
            RuleArticle(
                id         = docId.hashCode().let { if (it < 0) -it else it },
                topic      = (data["topic"] as? String) ?: (data["topicEn"] as? String) ?: "general",
                titleNp    = (data["titleNp"] as? String) ?: (data["title"] as? String) ?: "",
                titleEn    = (data["titleEn"] as? String) ?: "",
                // descNp/descEn used by seeded materials; contentNp/contentEn used by older data
                contentNp  = (data["contentNp"] as? String) ?: (data["descNp"] as? String)
                             ?: (data["content"] as? String) ?: "",
                contentEn  = (data["contentEn"] as? String) ?: (data["descEn"] as? String) ?: "",
                categoryId = (data["vehicleCategory"] as? String) ?: (data["category"] as? String) ?: "ALL"
            )
        } catch (e: Exception) {
            Log.w(TAG, "Skipping malformed rule article doc $docId: ${e.message}")
            null
        }
    }

    private fun mapDocToFine(docId: String, data: Map<String, Any?>): FinePenalty? {
        return try {
            FinePenalty(
                id         = docId.hashCode().let { if (it < 0) -it else it },
                offenseNp  = (data["offenseNp"] as? String) ?: (data["offense"] as? String) ?: "",
                offenseEn  = (data["offenseEn"] as? String) ?: "",
                fineAmount = (data["fineAmount"] as? String) ?: "",
                category   = (data["category"] as? String) ?: "General"
            )
        } catch (e: Exception) {
            Log.w(TAG, "Skipping malformed fine doc $docId: ${e.message}")
            null
        }
    }

    // ── Video Guides ──────────────────────────────────────────────────────────

    /**
     * Fetches all Published video guides from Firestore.
     * Only returns guides where isPublished == true so drafts stay admin-side only.
     */
    suspend fun fetchVideoGuides(): List<VideoGuide> {
        val firestore = db ?: run {
            Log.w(TAG, "Firestore not available – skipping video guides sync")
            return emptyList()
        }
        return try {
            val snapshot = firestore.collection("video_guides")
                .whereEqualTo("isPublished", true)
                .get()
                .await()

            snapshot.documents.mapNotNull { doc -> mapDocToVideoGuide(doc.id, doc.data) }
                .also { Log.d(TAG, "Fetched ${it.size} video guides from Firestore") }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch video guides", e)
            emptyList()
        }
    }

    private fun mapDocToVideoGuide(docId: String, data: Map<String, Any?>?): VideoGuide? {
        if (data == null) return null
        return try {
            val durationRaw = data["durationSeconds"]
            val duration = when (durationRaw) {
                is Long   -> durationRaw.toInt()
                is Int    -> durationRaw
                is Double -> durationRaw.toInt()
                is String -> durationRaw.toIntOrNull() ?: 0
                else      -> 0
            }
            VideoGuide(
                id              = docId.hashCode().let { if (it < 0) -it else it },
                titleEn         = (data["titleEn"] as? String) ?: "",
                titleNp         = (data["titleNp"] as? String) ?: "",
                descriptionEn   = (data["descriptionEn"] as? String) ?: "",
                descriptionNp   = (data["descriptionNp"] as? String) ?: "",
                videoUrl        = (data["videoUrl"] as? String) ?: "",
                durationSeconds = duration,
                category        = (data["category"] as? String) ?: "ALL",
                isPublished     = (data["isPublished"] as? Boolean) ?: true
            )
        } catch (e: Exception) {
            Log.w(TAG, "Skipping malformed video guide doc $docId: ${e.message}")
            null
        }
    }
}
