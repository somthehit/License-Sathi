package com.example.data

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

@JsonClass(generateAdapter = true)
data class AskExpertRequest(
    @Json(name = "user_id") val userId: String,
    @Json(name = "question") val question: String,
    @Json(name = "category") val category: String,
    @Json(name = "topic_id") val topicId: String? = null,
    @Json(name = "is_pro") val isPro: Boolean = false,
    @Json(name = "ssv_token") val ssvToken: String? = null
)

@JsonClass(generateAdapter = true)
data class AskExpertResponse(
    @Json(name = "answer") val answer: String,
    @Json(name = "citations") val citations: List<String>? = null,
    @Json(name = "cache_hit") val cacheHit: Boolean? = null,
    @Json(name = "question_id") val questionId: String? = null
)

interface AskExpertApiService {
    @POST("api/ask-expert")
    suspend fun askExpert(@Body request: AskExpertRequest): AskExpertResponse
}

object RetrofitAskExpertClient {
    /**
     * Backend URL for the Ask Expert API.
     *
     * Emulator  → 10.0.2.2 maps to host's 127.0.0.1
     * Physical  → Use your host machine's LAN IP (e.g. 192.168.x.x)
     *
     * For production, replace with your deployed URL (e.g. https://your-app.vercel.app/)
     */
    // Emulator → 10.0.2.2 maps to host's 127.0.0.1
    // private const val BASE_URL = "http://10.0.2.2:3000/"

    // Physical device → use the host machine's LAN IP
    // Run `ipconfig` on Windows to get your IP. Found: 192.168.1.65
    private const val BASE_URL = "http://192.168.1.65:3000/"

    // ── For production, replace with your deployed URL:
    // private const val BASE_URL = "https://your-app.vercel.app/"

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val moshi = Moshi.Builder()
        .addLast(KotlinJsonAdapterFactory())
        .build()

    val service: AskExpertApiService by lazy {
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
        retrofit.create(AskExpertApiService::class.java)
    }
}
