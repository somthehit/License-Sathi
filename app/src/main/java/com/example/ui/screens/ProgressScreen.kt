package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.Attempt
import com.example.data.Badge
import com.example.ui.viewmodel.LicenseSathiViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ProgressScreen(
  viewModel: LicenseSathiViewModel,
  modifier: Modifier = Modifier
) {
  val lang by viewModel.activeLanguage.collectAsState()
  val userProg by viewModel.userProgress.collectAsState()
  val attemptsList by viewModel.attempts.collectAsState()
  val badgesList by viewModel.badges.collectAsState()
  val currentLevelStr by viewModel.currentLevel.collectAsState()
  val weakTopicsList by viewModel.weakTopics.collectAsState()

  val totalPoints = userProg?.points ?: 0
  val currentStreak = userProg?.streakCount ?: 1

  var selectedTab by remember { mutableStateOf(0) }
  val tabTitles = if (lang == "np") {
    listOf("ड्यासबोर्ड (Analytics)", "उपलब्धि र पात्रो")
  } else {
    listOf("Dashboard Analytics", "Achievements & Calendar")
  }

  Column(
    modifier = modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
  ) {
    // Top Tabs Navigation
    TabRow(
      selectedTabIndex = selectedTab,
      containerColor = MaterialTheme.colorScheme.surface,
      contentColor = MaterialTheme.colorScheme.primary,
      modifier = Modifier.fillMaxWidth()
    ) {
      tabTitles.forEachIndexed { index, title ->
        Tab(
          selected = selectedTab == index,
          onClick = { selectedTab = index },
          text = {
            Text(
              text = title,
              style = MaterialTheme.typography.titleSmall,
              fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
              modifier = Modifier.testTag("progress_tab_$index")
            )
          }
        )
      }
    }

    Column(
      modifier = Modifier
        .fillMaxSize()
        .verticalScroll(rememberScrollState())
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      when (selectedTab) {
        0 -> {
          // Tab 0: Analytics Dashboard
          Text(
            text = if (lang == "np") "सिकाई तथा प्रगति ड्यासबोर्ड" else "Learning & Performance Dashboard",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.onBackground
          )

          // 1. Dynamic Metric Summaries
          AnalyticsHeaderGrid(attempts = attemptsList, lang = lang)

          // 2. Traffic Category Progress Bar Chart
          TrafficCategoryProgressChart(attempts = attemptsList, lang = lang)

          // 3. Interactive Mock Exam Performance trends
          InteractiveMockExamTrendChart(attempts = attemptsList, lang = lang)

          // 4. Suggested Focus Areas (Weak topics)
          if (weakTopicsList.isNotEmpty()) {
            Card(
              modifier = Modifier.fillMaxWidth(),
              shape = RoundedCornerShape(16.dp),
              colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.15f))
            ) {
              Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                  Icon(imageVector = Icons.Default.Warning, contentDescription = "Weak Areas", tint = MaterialTheme.colorScheme.error)
                  Text(
                    text = if (lang == "np") "ध्यान दिनुपर्ने कमजोर विषयहरू" else "Suggested Focus Areas",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onErrorContainer
                  )
                }

                weakTopicsList.forEachIndexed { index, topic ->
                  // Generate a pseudo-random strength (between 30% to 60%) for visual purposes
                  val strength = 0.3f + (index * 0.1f % 0.3f) 
                  Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                      modifier = Modifier.fillMaxWidth(),
                      horizontalArrangement = Arrangement.SpaceBetween,
                      verticalAlignment = Alignment.CenterVertically
                    ) {
                      Text(
                        text = topic,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        fontWeight = FontWeight.Medium
                      )
                      Text(
                        text = "${(strength * 100).toInt()}%",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.error
                      )
                    }
                    LinearProgressIndicator(
                      progress = { strength },
                      modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(CircleShape),
                      color = MaterialTheme.colorScheme.error,
                      trackColor = MaterialTheme.colorScheme.error.copy(alpha = 0.2f)
                    )
                  }
                }
              }
            }
          }
        }
        1 -> {
          // Tab 1: Achievements & BS Calendar
          // 1. Level & Points Header Card
          Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary)
          ) {
            Column(
              modifier = Modifier.padding(20.dp),
              verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                Column {
                  Text(
                    text = if (lang == "np") "वर्तमान स्तर" else "CURRENT LEVEL",
                    style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.sp),
                    color = Color.White.copy(alpha = 0.8f)
                  )
                  Text(
                    text = if (lang == "np") {
                      when (currentLevelStr) {
                        "Beginner" -> "प्रारम्भिक (Beginner)"
                        "Learner" -> "शिक्षार्थी (Learner)"
                        "Practiced" -> "अभ्यासी (Practiced)"
                        "Exam-Ready" -> "परीक्षा योग्य (Exam-Ready)"
                        else -> currentLevelStr
                      }
                    } else currentLevelStr.uppercase(),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                  )
                }

                Icon(
                  imageVector = when (currentLevelStr) {
                    "Exam-Ready" -> Icons.Default.Verified
                    "Practiced" -> Icons.Default.SportsScore
                    "Learner" -> Icons.Default.DirectionsRun
                    else -> Icons.Default.DirectionsWalk
                  },
                  contentDescription = "Level Icon",
                  tint = Color.White,
                  modifier = Modifier.size(36.dp)
                )
              }

              LinearProgressIndicator(
                progress = {
                  when (currentLevelStr) {
                    "Exam-Ready" -> 1f
                    "Practiced" -> 0.75f
                    "Learner" -> 0.5f
                    else -> 0.25f
                  }
                },
                modifier = Modifier
                  .fillMaxWidth()
                  .height(6.dp)
                  .clip(CircleShape),
                color = Color.White,
                trackColor = Color.White.copy(alpha = 0.3f)
              )

              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                Text(
                  text = if (lang == "np") "कुल अंक: ${viewModel.getNepaliDigits(totalPoints)}" else "Total Points: $totalPoints pts",
                  style = MaterialTheme.typography.bodySmall,
                  color = Color.White,
                  fontWeight = FontWeight.Bold
                )
                Text(
                  text = if (lang == "np") "सक्रियता: ${viewModel.getNepaliDigits(currentStreak)} दिन" else "Active Streak: $currentStreak Days",
                  style = MaterialTheme.typography.bodySmall,
                  color = Color.White,
                  fontWeight = FontWeight.Bold
                )
              }
            }
          }

          // 2. Bikram Sambat Study Streak Calendar
          Text(
            text = if (lang == "np") "नेपाली विक्रम संवत पात्रो (B.S. Calendar)" else "Study Activity (B.S. Calendar)",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.onBackground
          )

          Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
          ) {
            Column(
              modifier = Modifier.padding(16.dp),
              verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                Icon(imageVector = Icons.Default.CalendarMonth, contentDescription = "Calendar", tint = MaterialTheme.colorScheme.primary)
                Text(
                  text = viewModel.getBSDateRepresentation(System.currentTimeMillis()),
                  style = MaterialTheme.typography.bodyMedium,
                  fontWeight = FontWeight.ExtraBold,
                  color = MaterialTheme.colorScheme.primary
                )
              }

              HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

              // Streak Calendar Strip (Last 7 Days)
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                val todayCalendar = Calendar.getInstance()
                for (i in 6 downTo 0) {
                  val cal = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -i) }
                  val dayInitial = SimpleDateFormat("EE", Locale.getDefault()).format(cal.time).take(1)
                  val isToday = i == 0
                  // Mock active streak: assume active for past `currentStreak` days
                  val isActive = i < currentStreak
                  
                  Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                  ) {
                    Text(
                      text = dayInitial,
                      style = MaterialTheme.typography.labelSmall,
                      color = if (isToday) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Box(
                      modifier = Modifier
                        .size(32.dp)
                        .background(
                          color = if (isActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                          shape = CircleShape
                        )
                        .border(
                          width = if (isToday && !isActive) 2.dp else 0.dp,
                          color = if (isToday) MaterialTheme.colorScheme.primary else Color.Transparent,
                          shape = CircleShape
                        ),
                      contentAlignment = Alignment.Center
                    ) {
                      if (isActive) {
                        Icon(
                          imageVector = Icons.Default.LocalFireDepartment,
                          contentDescription = null,
                          tint = MaterialTheme.colorScheme.onPrimary,
                          modifier = Modifier.size(16.dp)
                        )
                      }
                    }
                  }
                }
              }
            }
          }

          // 3. Badges Achievement Trophy Room
          Text(
            text = if (lang == "np") "प्राप्त पदकहरू (Achievements)" else "Achievements Trophy Room",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.onBackground
          )

          LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.height(280.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            items(badgesList) { badge ->
              val isEarned = badge.isEarned
              Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                  containerColor = if (isEarned) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)
                  else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                ),
                modifier = Modifier
                  .fillMaxWidth()
                  .border(
                    width = 1.dp,
                    color = if (isEarned) MaterialTheme.colorScheme.primary.copy(alpha = 0.3f) else Color.Transparent,
                    shape = RoundedCornerShape(16.dp)
                  )
              ) {
                Column(
                  modifier = Modifier.padding(12.dp),
                  horizontalAlignment = Alignment.CenterHorizontally,
                  verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                  Box(
                    modifier = Modifier
                      .size(48.dp)
                      .background(
                        if (isEarned) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                        CircleShape
                      ),
                    contentAlignment = Alignment.Center
                  ) {
                    Icon(
                      imageVector = when (badge.iconName) {
                        "local_fire_department" -> Icons.Default.LocalFireDepartment
                        "verified" -> Icons.Default.Verified
                        "emoji_events" -> Icons.Default.EmojiEvents
                        "motorcycle" -> Icons.Default.Motorcycle
                        "directions_car" -> Icons.Default.DirectionsCar
                        else -> Icons.Default.Star
                      },
                      contentDescription = badge.nameEn,
                      tint = if (isEarned) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                      modifier = Modifier.size(24.dp)
                    )
                  }

                  Text(
                    text = badge.getName(lang),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    color = if (isEarned) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                  )

                  Text(
                    text = badge.criteria,
                    style = MaterialTheme.typography.labelSmall,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                    lineHeight = 12.sp
                  )
                }
              }
            }
          }
        }
      }

      Spacer(modifier = Modifier.height(24.dp))
    }
  }
}

@Composable
fun AnalyticsHeaderGrid(
  attempts: List<Attempt>,
  lang: String,
  modifier: Modifier = Modifier
) {
  val totalQuizzes = remember(attempts) { attempts.filter { it.mode == "Quiz" }.size }
  val mockAttempts = remember(attempts) { attempts.filter { it.mode == "Mock" } }
  val totalMocks = mockAttempts.size

  val avgMockPercent = remember(mockAttempts) {
    if (totalMocks > 0) {
      (mockAttempts.map { it.correctAnswersCount.toFloat() / it.totalQuestions }.average() * 100).toInt()
    } else 0
  }

  val passRate = remember(mockAttempts) {
    if (totalMocks > 0) {
      ((mockAttempts.filter { it.passed }.size.toFloat() / totalMocks) * 100).toInt()
    } else 0
  }

  Row(
    modifier = modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.spacedBy(10.dp)
  ) {
    // Card 1: Pass Rate
    Card(
      modifier = Modifier.weight(1f),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)),
      border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.12f))
    ) {
      Column(
        modifier = Modifier.padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
      ) {
        Text(
          text = if (lang == "np") "उत्तीर्ण दर" else "Pass Rate",
          style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f),
          textAlign = TextAlign.Center
        )
        Text(
          text = "$passRate%",
          style = MaterialTheme.typography.titleMedium,
          fontWeight = FontWeight.ExtraBold,
          color = MaterialTheme.colorScheme.primary
        )
      }
    }

    // Card 2: Avg Mock Score
    Card(
      modifier = Modifier.weight(1f),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.4f)),
      border = BorderStroke(1.dp, MaterialTheme.colorScheme.secondary.copy(alpha = 0.12f))
    ) {
      Column(
        modifier = Modifier.padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
      ) {
        Text(
          text = if (lang == "np") "औसत अङ्क" else "Avg Score",
          style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.8f),
          textAlign = TextAlign.Center
        )
        Text(
          text = "$avgMockPercent%",
          style = MaterialTheme.typography.titleMedium,
          fontWeight = FontWeight.ExtraBold,
          color = MaterialTheme.colorScheme.secondary
        )
      }
    }

    // Card 3: Total Tests
    Card(
      modifier = Modifier.weight(1f),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.4f)),
      border = BorderStroke(1.dp, MaterialTheme.colorScheme.tertiary.copy(alpha = 0.12f))
    ) {
      Column(
        modifier = Modifier.padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
      ) {
        Text(
          text = if (lang == "np") "कुल परीक्षा" else "Total Tests",
          style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.onTertiaryContainer.copy(alpha = 0.8f),
          textAlign = TextAlign.Center
        )
        Text(
          text = "${totalQuizzes + totalMocks}",
          style = MaterialTheme.typography.titleMedium,
          fontWeight = FontWeight.ExtraBold,
          color = MaterialTheme.colorScheme.tertiary
        )
      }
    }
  }
}

@Composable
fun TrafficCategoryProgressChart(
  attempts: List<Attempt>,
  lang: String,
  modifier: Modifier = Modifier
) {
  // ── Section 1: Vehicle Category Progress (all attempts) ──────────────────
  val categoryRows = remember(attempts) {
    listOf(
      Triple("A",
        if (lang == "np") "वर्ग क (मोटरसाइकल)" else "Category A (Motorcycle)",
        Icons.Default.Motorcycle),
      Triple("B",
        if (lang == "np") "वर्ग ख (कार / जिप)" else "Category B (Car / Jeep)",
        Icons.Default.DirectionsCar)
    )
  }

  val categoryProgress = remember(attempts) {
    categoryRows.associate { (catId, _, _) ->
      val catAttempts = attempts.filter { it.categoryId == catId }
      val total = catAttempts.sumOf { it.totalQuestions }
      val correct = catAttempts.sumOf { it.correctAnswersCount }
      catId to (if (total > 0) correct.toFloat() / total else 0f)
    }
  }

  // ── Section 2: Topic Progress (quiz attempts with a topic set) ────────────
  val topicRows = remember(attempts) {
    listOf(
      Triple("Traffic Rules",
        if (lang == "np") "ट्राफिक नियमहरू" else "Traffic Rules",
        Icons.Default.MenuBook),
      Triple("Road Signs",
        if (lang == "np") "सडक सङ्केतहरू" else "Road Signs",
        Icons.Default.AltRoute),
      Triple("Vehicle Knowledge",
        if (lang == "np") "सवारी साधन ज्ञान" else "Vehicle Knowledge",
        Icons.Default.DirectionsCar),
      Triple("Right of Way",
        if (lang == "np") "बाटोको प्राथमिकता" else "Right of Way",
        Icons.Default.Verified)
    )
  }

  val topicProgress = remember(attempts) {
    topicRows.associate { (topicKey, _, _) ->
      val topicAttempts = attempts.filter { it.topic == topicKey }
      val total = topicAttempts.sumOf { it.totalQuestions }
      val correct = topicAttempts.sumOf { it.correctAnswersCount }
      topicKey to (if (total > 0) correct.toFloat() / total else 0f)
    }
  }

  val hasAnyCategoryData = remember(attempts) {
    attempts.any { it.categoryId == "A" || it.categoryId == "B" }
  }
  val hasAnyTopicData = remember(attempts) {
    attempts.any { it.topic != null }
  }

  Column(
    modifier = modifier.fillMaxWidth(),
    verticalArrangement = Arrangement.spacedBy(12.dp)
  ) {
    Text(
      text = if (lang == "np") "सवारी वर्ग अनुसार प्रगति" else "Progress by Vehicle Category",
      style = MaterialTheme.typography.titleSmall,
      fontWeight = FontWeight.Bold,
      color = MaterialTheme.colorScheme.onBackground
    )

    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
      ),
      border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))
    ) {
      Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
      ) {
        if (!hasAnyCategoryData) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Icon(
              imageVector = Icons.Default.Info,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
              modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
              text = if (lang == "np") "अहिलेसम्म कुनै परीक्षा दिइएको छैन।" else "No attempts recorded yet. Start a quiz!",
              style = MaterialTheme.typography.bodySmall,
              color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
          }
        }

        categoryRows.forEach { (catId, label, icon) ->
          val pct = categoryProgress[catId] ?: 0f
          val catAttempts = attempts.filter { it.categoryId == catId }
          val attemptCount = catAttempts.size
          ProgressRow(
            icon = icon,
            label = label,
            subLabel = if (lang == "np") "${attemptCount} पटक अभ्यास" else "$attemptCount attempt${if (attemptCount != 1) "s" else ""}",
            progress = pct,
            hasData = attemptCount > 0
          )
        }
      }
    }

    // Topic breakdown — only show if user has done any topic-based quizzes
    Text(
      text = if (lang == "np") "विषयगत सिकाई प्रगति" else "Progress by Topic",
      style = MaterialTheme.typography.titleSmall,
      fontWeight = FontWeight.Bold,
      color = MaterialTheme.colorScheme.onBackground
    )

    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
      ),
      border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))
    ) {
      Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
      ) {
        if (!hasAnyTopicData) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Icon(
              imageVector = Icons.Default.Info,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
              modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
              text = if (lang == "np") "विषय छनोट गरी अभ्यास गर्नुहोस्।" else "Practice topic-based quizzes to see breakdown.",
              style = MaterialTheme.typography.bodySmall,
              color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
          }
        }

        topicRows.forEach { (topicKey, label, icon) ->
          val pct = topicProgress[topicKey] ?: 0f
          val topicAttemptCount = attempts.count { it.topic == topicKey }
          if (hasAnyTopicData) {
            ProgressRow(
              icon = icon,
              label = label,
              subLabel = if (lang == "np") "${topicAttemptCount} पटक अभ्यास" else "$topicAttemptCount attempt${if (topicAttemptCount != 1) "s" else ""}",
              progress = pct,
              hasData = topicAttemptCount > 0
            )
          }
        }
      }
    }
  }
}

@Composable
private fun ProgressRow(
  icon: androidx.compose.ui.graphics.vector.ImageVector,
  label: String,
  subLabel: String,
  progress: Float,
  hasData: Boolean,
  modifier: Modifier = Modifier
) {
  Column(
    modifier = modifier,
    verticalArrangement = Arrangement.spacedBy(6.dp)
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.weight(1f)
      ) {
        Icon(
          imageVector = icon,
          contentDescription = null,
          tint = if (hasData) MaterialTheme.colorScheme.primary
          else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
          modifier = Modifier.size(16.dp)
        )
        Column {
          Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            color = if (hasData) MaterialTheme.colorScheme.onSurface
            else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
          )
          Text(
            text = subLabel,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
          )
        }
      }
      Text(
        text = if (hasData) "${(progress * 100).toInt()}%" else "—",
        style = MaterialTheme.typography.bodyMedium,
        fontWeight = FontWeight.ExtraBold,
        color = if (hasData) MaterialTheme.colorScheme.primary
        else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
      )
    }

    Box(
      modifier = Modifier
        .fillMaxWidth()
        .height(10.dp)
        .clip(CircleShape)
        .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))
    ) {
      if (hasData && progress > 0f) {
        Box(
          modifier = Modifier
            .fillMaxHeight()
            .fillMaxWidth(progress)
            .clip(CircleShape)
            .background(
              Brush.horizontalGradient(
                colors = listOf(
                  MaterialTheme.colorScheme.primary,
                  MaterialTheme.colorScheme.secondary
                )
              )
            )
        )
      }
    }
  }
}

@Composable
fun InteractiveMockExamTrendChart(
  attempts: List<Attempt>,
  lang: String,
  modifier: Modifier = Modifier
) {
  val mockAttempts = remember(attempts) {
    attempts.filter { it.mode == "Mock" }.take(8).reversed()
  }

  if (mockAttempts.isEmpty()) {
    Box(
      modifier = modifier
        .fillMaxWidth()
        .height(180.dp),
      contentAlignment = Alignment.Center
    ) {
      Text(
        text = if (lang == "np") "कुनै नमुना परीक्षा रेकर्ड फेला परेन।" else "No mock exam records found.",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
    }
    return
  }

  var selectedIndex by remember(mockAttempts) {
    mutableStateOf<Int?>(if (mockAttempts.isNotEmpty()) mockAttempts.size - 1 else null)
  }

  Column(
    modifier = modifier.fillMaxWidth(),
    verticalArrangement = Arrangement.spacedBy(12.dp)
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Text(
        text = if (lang == "np") "नमुना परीक्षा ट्रेन्ड" else "Mock Exam Trend",
        style = MaterialTheme.typography.titleSmall,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.onSurface
      )

      Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
          Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary))
          Text(text = if (lang == "np") "स्कोर" else "Score", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
          Box(modifier = Modifier.size(10.dp, 2.dp).background(Color(0xFFF5222D)))
          Text(text = if (lang == "np") "उत्तीर्ण अङ्क (८०%)" else "Pass (80%)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
      }
    }

    BoxWithConstraints(
      modifier = Modifier
        .fillMaxWidth()
        .height(160.dp)
        .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
        .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
        .padding(vertical = 12.dp, horizontal = 20.dp)
    ) {
      val width = constraints.maxWidth.toFloat()
      val height = constraints.maxHeight.toFloat()

      val primaryColor = MaterialTheme.colorScheme.primary
      val gridColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.08f)

      Canvas(modifier = Modifier.fillMaxSize().testTag("interactive_mock_chart")) {
        val count = mockAttempts.size
        val xStep = if (count > 1) width / (count - 1) else width

        // Draw horizontal grids
        listOf(0f, 0.2f, 0.4f, 0.6f, 0.8f, 1f).forEach { pct ->
          val y = height * (1f - pct)
          drawLine(
            color = gridColor,
            start = Offset(0f, y),
            end = Offset(width, y),
            strokeWidth = 1.dp.toPx()
          )
        }

        // Draw 80% pass dashed line
        val passY = height * 0.2f
        drawLine(
          color = Color(0xFFF5222D).copy(alpha = 0.6f),
          start = Offset(0f, passY),
          end = Offset(width, passY),
          strokeWidth = 2.dp.toPx(),
          pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 8f), 0f)
        )

        if (count > 0) {
          // Gradient area under line
          val areaPath = Path()
          mockAttempts.forEachIndexed { idx, attempt ->
            val pct = attempt.correctAnswersCount.toFloat() / attempt.totalQuestions
            val x = idx * xStep
            val y = height * (1f - pct)
            if (idx == 0) {
              areaPath.moveTo(x, height)
              areaPath.lineTo(x, y)
            } else {
              areaPath.lineTo(x, y)
            }
            if (idx == count - 1) {
              areaPath.lineTo(x, height)
            }
          }
          areaPath.close()

          drawPath(
            path = areaPath,
            brush = Brush.verticalGradient(
              colors = listOf(primaryColor.copy(alpha = 0.2f), Color.Transparent),
              startY = 0f,
              endY = height
            )
          )

          // Smooth line drawing
          val strokePath = Path()
          mockAttempts.forEachIndexed { idx, attempt ->
            val pct = attempt.correctAnswersCount.toFloat() / attempt.totalQuestions
            val x = idx * xStep
            val y = height * (1f - pct)
            if (idx == 0) {
              strokePath.moveTo(x, y)
            } else {
              strokePath.lineTo(x, y)
            }
          }

          drawPath(
            path = strokePath,
            color = primaryColor,
            style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
          )

          // Interactive dots
          mockAttempts.forEachIndexed { idx, attempt ->
            val pct = attempt.correctAnswersCount.toFloat() / attempt.totalQuestions
            val x = idx * xStep
            val y = height * (1f - pct)

            val isSelected = idx == selectedIndex

            if (isSelected) {
              drawCircle(
                color = primaryColor.copy(alpha = 0.15f),
                radius = 10.dp.toPx(),
                center = Offset(x, y)
              )
              drawLine(
                color = primaryColor.copy(alpha = 0.3f),
                start = Offset(x, y),
                end = Offset(x, height),
                strokeWidth = 1.dp.toPx(),
                pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f), 0f)
              )
            }

            drawCircle(
              color = if (isSelected) primaryColor else Color.White,
              radius = 5.dp.toPx(),
              center = Offset(x, y)
            )

            drawCircle(
              color = if (isSelected) Color.White else primaryColor,
              radius = 2.5f.dp.toPx(),
              center = Offset(x, y)
            )
          }
        }
      }

      // Invisible responsive overlay clicks
      val count = mockAttempts.size
      if (count > 0) {
        val itemWidthDp = maxWidth / count
        Row(modifier = Modifier.fillMaxSize()) {
          mockAttempts.forEachIndexed { idx, _ ->
            Box(
              modifier = Modifier
                .width(itemWidthDp)
                .fillMaxHeight()
                .clickable { selectedIndex = idx }
            )
          }
        }
      }
    }

    // Interactive detailed display card
    selectedIndex?.let { idx ->
      val attempt = mockAttempts[idx]
      val percentage = ((attempt.correctAnswersCount.toFloat() / attempt.totalQuestions) * 100).toInt()

      Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f)),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.1f))
      ) {
        Row(
          modifier = Modifier.padding(12.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
          Box(
            modifier = Modifier
              .size(46.dp)
              .clip(CircleShape)
              .background(if (attempt.passed) Color(0xFFEAF9ED) else Color(0xFFFEECEB)),
            contentAlignment = Alignment.Center
          ) {
            Text(
              text = "$percentage%",
              style = MaterialTheme.typography.titleSmall,
              fontWeight = FontWeight.Bold,
              color = if (attempt.passed) Color(0xFF1B5E20) else Color(0xFFC62828)
            )
          }

          Column(modifier = Modifier.weight(1f)) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
              Text(
                text = "${if (lang == "np") "नमुना परीक्षा" else "Mock Exam"} #${idx + 1}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
              )

              Box(
                modifier = Modifier
                  .clip(RoundedCornerShape(6.dp))
                  .background(if (attempt.passed) Color(0xFF52C41A).copy(alpha = 0.15f) else Color(0xFFF5222D).copy(alpha = 0.15f))
                  .padding(horizontal = 6.dp, vertical = 2.dp)
              ) {
                Text(
                  text = if (attempt.passed) {
                    if (lang == "np") "उत्तीर्ण" else "Passed"
                  } else {
                    if (lang == "np") "अनुत्तीर्ण" else "Failed"
                  },
                  style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                  color = if (attempt.passed) Color(0xFF237804) else Color(0xFFA8071A)
                )
              }
            }

            Text(
              text = if (lang == "np") {
                "नतिजा: ${attempt.correctAnswersCount}/${attempt.totalQuestions} मिलाएका उत्तरहरू | वर्ग ${attempt.categoryId}"
              } else {
                "Score: ${attempt.correctAnswersCount}/${attempt.totalQuestions} Correct | Category ${attempt.categoryId}"
              },
              style = MaterialTheme.typography.bodySmall,
              color = MaterialTheme.colorScheme.onSurfaceVariant
            )
          }
        }
      }
    }
  }
}
