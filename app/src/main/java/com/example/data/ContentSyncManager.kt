package com.example.data

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Orchestrates syncing remote Firestore content (questions, study materials)
 * into the local Room database.
 *
 * Strategy:
 *   - On first run the Room DB is already seeded with hardcoded fallback data.
 *   - After a successful sync the timestamp is persisted; subsequent syncs are
 *     skipped unless [SYNC_INTERVAL_MS] has elapsed OR [forceSync] is true.
 *   - If Firestore returns 0 items (offline / empty collection) the existing
 *     local data is kept untouched so the app remains fully functional offline.
 */
class ContentSyncManager(
    private val context: Context,
    private val dao: AppDao
) {

    companion object {
        private const val TAG = "ContentSyncManager"
        private const val PREFS_NAME = "content_sync_prefs"
        private const val KEY_LAST_SYNC = "last_content_sync_ts"

        /** Minimum gap between automatic syncs (0 to always sync on launch). */
        private const val SYNC_INTERVAL_MS = 0L
    }

    private val prefs by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private val lastSyncTimestamp: Long
        get() = prefs.getLong(KEY_LAST_SYNC, 0L)

    private fun markSynced() {
        prefs.edit().putLong(KEY_LAST_SYNC, System.currentTimeMillis()).apply()
    }

    /** Returns true when a sync should be performed based on elapsed time. */
    fun isSyncDue(): Boolean =
        System.currentTimeMillis() - lastSyncTimestamp > SYNC_INTERVAL_MS

    /**
     * Performs a full content sync from Firestore → Room.
     *
     * @param forceSync  bypass the time-based throttle (e.g. after admin login).
     * @return           true if sync ran, false if it was skipped.
     */
    suspend fun syncContent(forceSync: Boolean = false): Boolean = withContext(Dispatchers.IO) {
        if (!forceSync && !isSyncDue()) {
            Log.d(TAG, "Sync skipped – not due yet")
            return@withContext false
        }

        Log.i(TAG, "Starting content sync from Firestore…")

        // ── 1. Questions ──────────────────────────────────────────────────────
        val questions = FirestoreContentService.fetchQuestions()
        if (questions.isNotEmpty()) {
            dao.insertQuestions(questions)
            Log.i(TAG, "Upserted ${questions.size} questions into Room")
        } else {
            Log.w(TAG, "No questions returned from Firestore – keeping local data")
        }

        // ── 2. Study Materials ────────────────────────────────────────────────
        val batch = FirestoreContentService.fetchStudyMaterials()

        if (batch.roadSigns.isNotEmpty()) {
            dao.insertRoadSigns(batch.roadSigns)
            Log.i(TAG, "Upserted ${batch.roadSigns.size} road signs into Room")
        }
        if (batch.ruleArticles.isNotEmpty()) {
            dao.insertRuleArticles(batch.ruleArticles)
            Log.i(TAG, "Upserted ${batch.ruleArticles.size} rule articles into Room")
        }
        if (batch.fines.isNotEmpty()) {
            dao.insertFines(batch.fines)
            Log.i(TAG, "Upserted ${batch.fines.size} fines into Room")
        }

        // ── 3. Video Guides ──────────────────────────────────────────────────
        val videoGuides = FirestoreContentService.fetchVideoGuides()
        if (videoGuides.isNotEmpty()) {
            dao.insertVideoGuides(videoGuides)
            Log.i(TAG, "Upserted ${videoGuides.size} video guides into Room")
        } else {
            Log.w(TAG, "No video guides returned from Firestore – keeping local data")
        }

        // Only stamp the timestamp if at least some data arrived (partial success is fine)
        val anyData = questions.isNotEmpty() ||
            batch.roadSigns.isNotEmpty() ||
            batch.ruleArticles.isNotEmpty() ||
            batch.fines.isNotEmpty() ||
            videoGuides.isNotEmpty()

        if (anyData) markSynced()

        Log.i(TAG, "Content sync complete. anyData=$anyData")
        true
    }
}
