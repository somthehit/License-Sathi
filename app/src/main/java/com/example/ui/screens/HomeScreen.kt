package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.FirestoreContentService
import com.example.ui.viewmodel.LicenseSathiViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun HomeScreen(
  viewModel: LicenseSathiViewModel,
  onNavigateToStudy: () -> Unit,
  onNavigateToPractice: () -> Unit,
  onNavigateToMock: () -> Unit,
  modifier: Modifier = Modifier
) {
  val userProg by viewModel.userProgress.collectAsState()
  val lang by viewModel.activeLanguage.collectAsState()
  val catId by viewModel.activeCategory.collectAsState()
  val readinessPercent by viewModel.readinessScore.collectAsState()
  val currentLevelStr by viewModel.currentLevel.collectAsState()
  val attemptsList by viewModel.attempts.collectAsState()
  val allQuestions by viewModel.questions.collectAsState()
  val noticesList by viewModel.notices.collectAsState()
  val noticesLoading by viewModel.noticesLoading.collectAsState()

  // Category picker state
  var showCategoryPicker by remember { mutableStateOf(false) }

  // Notice bottom sheet state
  var selectedNotice by remember { mutableStateOf<FirestoreContentService.AppNotice?>(null) }

  val userName = userProg?.name ?: "Nabin"
  val streak = userProg?.streakCount ?: 1

  // Dynamic practiced calculation
  // Total practiced questions is sum of questions in all previous attempts
  val totalPracticedQuestions = attemptsList.sumOf { it.totalQuestions }
  val totalQuestionsInBank = allQuestions.filter { it.categoryId == catId || it.categoryId == "ALL" }.size

  Column(
    modifier = modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
      .verticalScroll(rememberScrollState())
      .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    // 1. Top Greeting Bar
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Column {
        Text(
          text = if (lang == "np") "नमस्ते, $userName!" else "Namaste, $userName!",
          style = MaterialTheme.typography.labelLarge.copy(
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp
          )
        )
        Text(
          text = if (lang == "np") "लाइसेन्स साथी" else "License Sathi",
          style = MaterialTheme.typography.headlineMedium.copy(
            fontWeight = FontWeight.ExtraBold,
            color = MaterialTheme.colorScheme.onBackground
          )
        )
      }

      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        // Theme Quick Toggle
        val isDarkTheme by viewModel.isDarkMode.collectAsState()
        IconButton(
          onClick = { viewModel.toggleDarkMode() },
          modifier = Modifier.testTag("home_theme_toggle")
        ) {
          Icon(
            imageVector = if (isDarkTheme) Icons.Default.DarkMode else Icons.Default.LightMode,
            contentDescription = "Toggle Dark Mode",
            tint = MaterialTheme.colorScheme.primary
          )
        }

        // Category Pill (Interactive — opens a picker)
        val catPrefs = remember(userProg) {
          userProg?.getCategoryPreferencesList()?.takeIf { it.isNotEmpty() } ?: listOf("A", "B", "K", "G")
        }
        val catLabels = mapOf(
          "A" to (if (lang == "np") "A - मोटरसाइकल" else "A - Motorcycle"),
          "B" to (if (lang == "np") "B - कार" else "B - Car"),
          "K" to (if (lang == "np") "K - स्कुटर" else "K - Scooter"),
          "G" to (if (lang == "np") "G - ट्रक" else "G - Truck")
        )
        val catIcons = mapOf(
          "A" to Icons.Default.Motorcycle,
          "B" to Icons.Default.DirectionsCar,
          "K" to Icons.Default.TwoWheeler,
          "G" to Icons.Default.LocalShipping
        )
        Box(
          modifier = Modifier
            .clip(RoundedCornerShape(24.dp))
            .background(MaterialTheme.colorScheme.secondary)
            .clickable { showCategoryPicker = true }
            .border(
              width = 1.dp,
              color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f),
              shape = RoundedCornerShape(24.dp)
            )
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .testTag("home_category_toggle"),
          contentAlignment = Alignment.Center
        ) {
          Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
          ) {
            Icon(
              imageVector = catIcons[catId] ?: Icons.Default.DirectionsCar,
              contentDescription = "Category Icon",
              modifier = Modifier.size(18.dp),
              tint = MaterialTheme.colorScheme.onSecondary
            )
            Text(
              text = "CAT $catId",
              style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
              color = MaterialTheme.colorScheme.onSecondary
            )
            Icon(
              imageVector = Icons.Default.KeyboardArrowDown,
              contentDescription = null,
              modifier = Modifier.size(14.dp),
              tint = MaterialTheme.colorScheme.onSecondary
            )
          }
        }

        // Category picker dropdown (AlertDialog as menu)
        if (showCategoryPicker) {
          androidx.compose.material3.AlertDialog(
            onDismissRequest = { showCategoryPicker = false },
            title = {
              Text(
                text = if (lang == "np") "सवारी वर्ग चुन्नुहोस्" else "Select Vehicle Category",
                fontWeight = FontWeight.ExtraBold
              )
            },
            text = {
              Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("A", "B", "K", "G").forEach { cat ->
                  val isSelected = cat == catId
                  Surface(
                    onClick = {
                      viewModel.setCategory(cat)
                      showCategoryPicker = false
                    },
                    shape = RoundedCornerShape(12.dp),
                    color = if (isSelected) MaterialTheme.colorScheme.primaryContainer
                            else MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                  ) {
                    Row(
                      modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                      horizontalArrangement = Arrangement.spacedBy(12.dp),
                      verticalAlignment = Alignment.CenterVertically
                    ) {
                      Icon(
                        imageVector = catIcons[cat] ?: Icons.Default.DirectionsCar,
                        contentDescription = null,
                        tint = if (isSelected) MaterialTheme.colorScheme.primary
                               else MaterialTheme.colorScheme.onSurfaceVariant
                      )
                      Column(modifier = Modifier.weight(1f)) {
                        Text(
                          text = catLabels[cat] ?: "Cat $cat",
                          fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium,
                          color = if (isSelected) MaterialTheme.colorScheme.primary
                                  else MaterialTheme.colorScheme.onSurface
                        )
                      }
                      if (isSelected) {
                        Icon(
                          imageVector = Icons.Default.CheckCircle,
                          contentDescription = null,
                          tint = MaterialTheme.colorScheme.primary,
                          modifier = Modifier.size(20.dp)
                        )
                      }
                    }
                  }
                }
              }
            },
            confirmButton = {},
            dismissButton = {
              TextButton(onClick = { showCategoryPicker = false }) {
                Text(if (lang == "np") "रद्द गर्नुहोस्" else "Cancel")
              }
            }
          )
        }
      }
    }

    // 2. Exam Readiness Card
    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(28.dp),
      colors = CardDefaults.cardColors(
        containerColor = Color(0xFFD3E3FD), // InfoBlueContainer
        contentColor = Color(0xFF041E49)   // InfoBlueText
      )
    ) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(24.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Column(modifier = Modifier.weight(1f)) {
          Text(
            text = if (lang == "np") "परीक्षा तत्परता (Readiness)" else "Exam Readiness",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Medium,
            color = Color(0xFF041E49).copy(alpha = 0.8f)
          )
          Row(
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            modifier = Modifier.padding(vertical = 4.dp)
          ) {
            Text(
              text = readinessPercent.toString(),
              style = MaterialTheme.typography.headlineLarge.copy(
                fontSize = 44.sp,
                fontWeight = FontWeight.ExtraBold
              ),
              color = Color(0xFF041E49)
            )
            Text(
              text = "%",
              style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
              color = Color(0xFF041E49),
              modifier = Modifier.padding(bottom = 6.dp)
            )
          }

          val npLvl = when (currentLevelStr) {
            "Beginner" -> "प्रारम्भिक (Beginner)"
            "Learner" -> "शिक्षार्थी (Learner)"
            "Practiced" -> "अभ्यासी (Practiced)"
            "Exam-Ready" -> "परीक्षा तयारी पुरा (Exam-Ready)"
            else -> currentLevelStr
          }

          Text(
            text = if (lang == "np") "स्तर: $npLvl" else "LEVEL: ${currentLevelStr.uppercase()}",
            style = MaterialTheme.typography.labelMedium.copy(
              fontWeight = FontWeight.Bold,
              letterSpacing = 0.5.sp
            ),
            color = Color(0xFF041E49)
          )
        }

        // Circular readiness meter (Animated)
        Box(
          modifier = Modifier.size(80.dp),
          contentAlignment = Alignment.Center
        ) {
          val progressColor = Color(0xFF041E49)
          
          val animatedProgress by animateFloatAsState(
            targetValue = readinessPercent.toFloat() / 100f,
            animationSpec = tween(durationMillis = 1500, delayMillis = 300),
            label = "readinessAnimation"
          )
          
          Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
              color = Color.White.copy(alpha = 0.4f),
              radius = size.minDimension / 2 - 8,
              style = Stroke(width = 8.dp.toPx())
            )
            drawArc(
              color = progressColor,
              startAngle = -90f,
              sweepAngle = animatedProgress * 360f,
              useCenter = false,
              style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
            )
          }
          Icon(
            imageVector = Icons.Default.Verified,
            contentDescription = "Verified",
            tint = Color(0xFF041E49),
            modifier = Modifier.size(24.dp)
          )
        }
      }
    }

    // 3. Stats Grid
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      // Streak Stat Box
      Box(
        modifier = Modifier
          .weight(1f)
          .clip(RoundedCornerShape(16.dp))
          .background(MaterialTheme.colorScheme.surfaceVariant)
          .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
          .padding(16.dp),
        contentAlignment = Alignment.Center
      ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
          Icon(
            imageVector = Icons.Default.LocalFireDepartment,
            contentDescription = "Streak",
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(28.dp)
          )
          Spacer(modifier = Modifier.height(4.dp))
          Text(
            text = if (lang == "np") "${viewModel.getNepaliDigits(streak)} दिन" else "$streak Days",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
          )
          Text(
            text = if (lang == "np") "सक्रियता (Streak)" else "Streak",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
        }
      }

      // Practiced Questions Stat Box
      Box(
        modifier = Modifier
          .weight(1f)
          .clip(RoundedCornerShape(16.dp))
          .background(MaterialTheme.colorScheme.surfaceVariant)
          .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
          .padding(16.dp),
        contentAlignment = Alignment.Center
      ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
          Icon(
            imageVector = Icons.Default.TaskAlt,
            contentDescription = "Questions",
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(28.dp)
          )
          Spacer(modifier = Modifier.height(4.dp))
          Text(
            text = if (lang == "np") {
              "${viewModel.getNepaliDigits(totalPracticedQuestions)}/${viewModel.getNepaliDigits(totalQuestionsInBank)}"
            } else {
              "$totalPracticedQuestions/$totalQuestionsInBank"
            },
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
          )
          Text(
            text = if (lang == "np") "प्रश्नहरू (Practiced)" else "Questions",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
        }
      }
    }

    // 4. Notices Section
    if (noticesLoading || noticesList.isNotEmpty()) {
      NoticesSection(
        notices = noticesList,
        loading = noticesLoading,
        lang = lang,
        onNoticeClick = { selectedNotice = it }
      )
    }

    // 5. Main Actions
    Column(
      modifier = Modifier.fillMaxWidth(),
      verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      // Study Guide
      ActionRowItem(
        title = if (lang == "np") "अध्ययन सामग्री (Study Guide)" else "Study Guide",
        subtitle = if (lang == "np") "सडक नियमहरू, ट्राफिक सङ्केत र जरिवाना" else "Rules, Signs & Fine Schedules",
        icon = Icons.Default.MenuBook,
        bgColor = MaterialTheme.colorScheme.surfaceVariant,
        iconColor = MaterialTheme.colorScheme.primary,
        onClick = onNavigateToStudy,
        modifier = Modifier.testTag("action_study_guide")
      )

      // Quick Quiz
      ActionRowItem(
        title = if (lang == "np") "छिटो अभ्यास (Quick Practice)" else "Quick Practice",
        subtitle = if (lang == "np") "नयाँ दैनिक १५ प्रश्नहरू" else "Daily 15 Questions practice set",
        icon = Icons.Default.Quiz,
        bgColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.2f),
        iconColor = MaterialTheme.colorScheme.onSecondary,
        onClick = onNavigateToPractice,
        modifier = Modifier.testTag("action_quick_practice")
      )

      // Mock Exam (High contrast theme callout!)
      ActionRowItem(
        title = if (lang == "np") "प्रयोगात्मक परीक्षा (Mock Exam)" else "Mock Exam",
        subtitle = if (lang == "np") "लिखित परीक्षा ढाँचा अनुरूप" else "Simulate Official Test conditions",
        icon = Icons.Default.Timer,
        bgColor = MaterialTheme.colorScheme.primary,
        iconColor = Color.White,
        textColor = Color.White,
        subtextColor = Color.White.copy(alpha = 0.8f),
        onClick = onNavigateToMock,
        badgeText = if (lang == "np") "नयाँ" else "NEW",
        modifier = Modifier.testTag("action_mock_exam")
      )
    }

    Spacer(modifier = Modifier.height(24.dp))
  }

  // Notice detail bottom sheet
  selectedNotice?.let { notice ->
    NoticeDetailSheet(
      notice = notice,
      lang = lang,
      onDismiss = { selectedNotice = null }
    )
  }
}

// ── Notice colours ───────────────────────────────────────────────────────────
private val noticeTypeColor = mapOf(
    "info"    to Color(0xFF335AB4),
    "warning" to Color(0xFFA16207),
    "urgent"  to Color(0xFFB1002C),
    "update"  to Color(0xFF16A34A),
)
private val noticeTypeBg = mapOf(
    "info"    to Color(0xFFDAE1FF),
    "warning" to Color(0xFFFEF9C3),
    "urgent"  to Color(0xFFFFDAD9),
    "update"  to Color(0xFFDCFCE7),
)
private val noticeTypeIcon = mapOf(
    "info"    to Icons.Default.Info,
    "warning" to Icons.Default.Warning,
    "urgent"  to Icons.Default.NotificationsActive,
    "update"  to Icons.Default.SystemUpdate,
)

// ── Notices Section ───────────────────────────────────────────────────────────
@Composable
fun NoticesSection(
    notices: List<FirestoreContentService.AppNotice>,
    loading: Boolean,
    lang: String,
    onNoticeClick: (FirestoreContentService.AppNotice) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // Section header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Campaign,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = if (lang == "np") "सूचनाहरू" else "Notices",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.ExtraBold),
                    color = MaterialTheme.colorScheme.onBackground
                )
                if (notices.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "${notices.size}",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                }
            }
        }

        if (loading) {
            // Skeleton loader
            repeat(2) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(64.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                )
            }
        } else {
            notices.forEach { notice ->
                NoticeCard(notice = notice, lang = lang, onClick = { onNoticeClick(notice) })
            }
        }
    }
}

@Composable
fun NoticeCard(
    notice: FirestoreContentService.AppNotice,
    lang: String,
    onClick: () -> Unit
) {
    val color  = noticeTypeColor[notice.type] ?: Color(0xFF335AB4)
    val bg     = noticeTypeBg[notice.type]    ?: Color(0xFFDAE1FF)
    val icon   = noticeTypeIcon[notice.type]  ?: Icons.Default.Info
    val title  = if (lang == "np" && notice.titleNp.isNotBlank()) notice.titleNp else notice.titleEn

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(bg.copy(alpha = 0.35f))
            .border(1.dp, color.copy(alpha = 0.25f), RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(bg),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(18.dp))
        }
        Text(
            text = title,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f),
            maxLines = 2
        )
        Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null,
            tint = color, modifier = Modifier.size(18.dp))
    }
}

// ── Notice Detail Bottom Sheet ────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoticeDetailSheet(
    notice: FirestoreContentService.AppNotice,
    lang: String,
    onDismiss: () -> Unit
) {
    val color   = noticeTypeColor[notice.type] ?: Color(0xFF335AB4)
    val bg      = noticeTypeBg[notice.type]    ?: Color(0xFFDAE1FF)
    val icon    = noticeTypeIcon[notice.type]  ?: Icons.Default.Info
    val title   = if (lang == "np" && notice.titleNp.isNotBlank()) notice.titleNp else notice.titleEn
    val content = if (lang == "np" && notice.contentNp.isNotBlank()) notice.contentNp else notice.contentEn
    val typeLabel = notice.type.replaceFirstChar { it.uppercase() }

    val dateFmt = remember {
        SimpleDateFormat("MMM d, yyyy", Locale.getDefault())
    }
    val dateStr = notice.publishedAt?.let { dateFmt.format(Date(it)) } ?: ""

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Type chip + date
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(bg)
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(14.dp))
                    Text(typeLabel, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold), color = color)
                }
                if (dateStr.isNotEmpty()) {
                    Text(dateStr, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Title
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                color = MaterialTheme.colorScheme.onSurface
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))

            // Content
            if (content.isNotBlank()) {
                Text(
                    text = content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 22.sp
                )
            } else {
                Text(
                    text = if (lang == "np") "थप विवरण उपलब्ध छैन।" else "No additional details available.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )
            }

            // Close button
            Button(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = color)
            ) {
                Text(if (lang == "np") "बन्द गर्नुहोस्" else "Close", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ActionRowItem(
  title: String,
  subtitle: String,
  icon: androidx.compose.ui.graphics.vector.ImageVector,
  bgColor: Color,
  iconColor: Color,
  textColor: Color = MaterialTheme.colorScheme.onSurface,
  subtextColor: Color = MaterialTheme.colorScheme.onSurfaceVariant,
  onClick: () -> Unit,
  badgeText: String? = null,
  modifier: Modifier = Modifier
) {
  Row(
    modifier = modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(20.dp))
      .background(bgColor)
      .clickable(onClick = onClick)
      .padding(16.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    Box(
      modifier = Modifier
        .size(48.dp)
        .clip(RoundedCornerShape(12.dp))
        .background(if (bgColor == MaterialTheme.colorScheme.primary) Color.White.copy(alpha = 0.2f) else MaterialTheme.colorScheme.primaryContainer),
      contentAlignment = Alignment.Center
    ) {
      Icon(
        imageVector = icon,
        contentDescription = "Action Icon",
        tint = if (bgColor == MaterialTheme.colorScheme.primary) Color.White else iconColor,
        modifier = Modifier.size(24.dp)
      )
    }

    Spacer(modifier = Modifier.width(16.dp))

    Column(modifier = Modifier.weight(1f)) {
      Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = textColor
      )
      Text(
        text = subtitle,
        style = MaterialTheme.typography.bodySmall,
        color = subtextColor
      )
    }

    if (badgeText != null) {
      Box(
        modifier = Modifier
          .clip(RoundedCornerShape(8.dp))
          .background(if (bgColor == MaterialTheme.colorScheme.primary) Color.White.copy(alpha = 0.2f) else MaterialTheme.colorScheme.primary)
          .padding(horizontal = 8.dp, vertical = 4.dp)
      ) {
        Text(
          text = badgeText,
          style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
          color = if (bgColor == MaterialTheme.colorScheme.primary) Color.White else MaterialTheme.colorScheme.onPrimary
        )
      }
    } else {
      Icon(
        imageVector = Icons.Default.ChevronRight,
        contentDescription = "Arrow",
        tint = if (textColor == Color.White) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
      )
    }
  }
}
