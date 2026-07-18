package com.example.data

import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.nio.charset.StandardCharsets

object JwtHelper {
  fun generateToken(emailOrPhone: String, name: String, categories: List<String>): String {
    val headerJson = JSONObject().apply {
      put("alg", "HS256")
      put("typ", "JWT")
    }
    
    val iat = System.currentTimeMillis() / 1000
    val exp = iat + (7 * 24 * 60 * 60) // 7 days
    
    val payloadJson = JSONObject().apply {
      put("iss", "license-sathi-auth")
      put("sub", emailOrPhone)
      put("name", name)
      put("iat", iat)
      put("exp", exp)
      
      val catArray = JSONArray()
      categories.forEach { catArray.put(it) }
      put("category_preferences", catArray)
    }
    
    val headerBytes = headerJson.toString().toByteArray(StandardCharsets.UTF_8)
    val payloadBytes = payloadJson.toString().toByteArray(StandardCharsets.UTF_8)
    
    val headerBase64 = Base64.encodeToString(headerBytes, Base64.NO_WRAP or Base64.URL_SAFE or Base64.NO_PADDING)
    val payloadBase64 = Base64.encodeToString(payloadBytes, Base64.NO_WRAP or Base64.URL_SAFE or Base64.NO_PADDING)
    
    // Simple mock signature to complete the token structure
    val rawSignature = "$headerBase64.$payloadBase64.license-sathi-secret-key-2026"
    val signatureBytes = rawSignature.toByteArray(StandardCharsets.UTF_8)
    val signatureBase64 = Base64.encodeToString(signatureBytes, Base64.NO_WRAP or Base64.URL_SAFE or Base64.NO_PADDING)
    
    return "$headerBase64.$payloadBase64.$signatureBase64"
  }
  
  data class DecodedToken(
    val header: String,
    val payload: String,
    val issuer: String,
    val emailOrPhone: String,
    val name: String,
    val issuedAt: Long,
    val expiration: Long,
    val categories: List<String>,
    val isValid: Boolean
  )
  
  fun decodeToken(token: String): DecodedToken? {
    try {
      val parts = token.split(".")
      if (parts.size != 3) return null
      
      val headerBytes = Base64.decode(parts[0], Base64.DEFAULT)
      val payloadBytes = Base64.decode(parts[1], Base64.DEFAULT)
      
      val headerStr = String(headerBytes, StandardCharsets.UTF_8)
      val payloadStr = String(payloadBytes, StandardCharsets.UTF_8)
      
      val payloadJson = JSONObject(payloadStr)
      val sub = payloadJson.optString("sub", "")
      val name = payloadJson.optString("name", "")
      val iss = payloadJson.optString("iss", "")
      val iat = payloadJson.optLong("iat", 0)
      val exp = payloadJson.optLong("exp", 0)
      
      val catArray = payloadJson.optJSONArray("category_preferences")
      val categories = mutableListOf<String>()
      if (catArray != null) {
        for (i in 0 until catArray.length()) {
          categories.add(catArray.getString(i))
        }
      }
      
      // Simple verification of signature part
      val expectedSignatureRaw = "${parts[0]}.${parts[1]}.license-sathi-secret-key-2026"
      val expectedSignatureBytes = expectedSignatureRaw.toByteArray(StandardCharsets.UTF_8)
      val expectedSignatureBase64 = Base64.encodeToString(expectedSignatureBytes, Base64.NO_WRAP or Base64.URL_SAFE or Base64.NO_PADDING)
      
      val isSignatureValid = parts[2] == expectedSignatureBase64
      val isExpired = (System.currentTimeMillis() / 1000) > exp
      
      return DecodedToken(
        header = headerStr,
        payload = payloadStr,
        issuer = iss,
        emailOrPhone = sub,
        name = name,
        issuedAt = iat,
        expiration = exp,
        categories = categories,
        isValid = isSignatureValid && !isExpired
      )
    } catch (e: Exception) {
      return null
    }
  }
}
