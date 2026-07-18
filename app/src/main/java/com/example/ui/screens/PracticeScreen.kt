package com.example.ui.screens

import androidx.compose.animation.*
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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.Question
import com.example.ui.viewmodel.LicenseSathiViewModel
import com.example.ui.viewmodel.QuizState

@Composable
fun PracticeScreen(
  viewModel: LicenseSathiViewModel,
  onNavigateHome: () -> Unit,
  modifier: Modifier = Modifier
) {
  val lang by viewModel.activeLanguage.collectAsState()
  val quizState by viewModel.quizState.collectAsState()

  Box(
    modifier = modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
  ) {
    if (quizState == null) {
      // 1. Quiz Setup — sets grid or custom topic picker
      QuizSetupScreen(
        viewModel = viewModel,
        lang = lang,
        onStartSet = { setIndex -> viewModel.startQuizFromSet(setIndex, 20) },
        onStart = { topic, difficulty -> viewModel.startQuiz(topic, difficulty) }
      )
    } else {
      val state = quizState!!
      if (state.isCompleted) {
        // 2. Quiz Summary / Completed Screen
        QuizCompletedScreen(
          state = state,
          lang = lang,
          onClose = {
            viewModel.closeQuiz()
            onNavigateHome()
          },
          onRetake = {
            viewModel.closeQuiz()
            viewModel.startQuiz(if (state.topicName == "Daily Quiz") null else state.topicName, null)
          }
        )
      } else {
        // 3. Quiz Question Running Screen
        QuizRunningScreen(
          state = state,
          lang = lang,
          onSelectOption = { viewModel.selectQuizOption(it) },
          onSubmitAnswer = { viewModel.submitQuizAnswer() },
          onNext = { viewModel.nextQuizQuestion() },
          onQuit = { viewModel.closeQuiz() },
          onToggleBookmark = { viewModel.toggleQuestionBookmark(it) }
        )
      }
    }
  }
}

@Composable
fun QuizSetupScreen(
  viewModel: LicenseSathiViewModel,
  lang: String,
  onStartSet: (setIndex: Int) -> Unit,
  onStart: (topic: String?, difficulty: String?) -> Unit
) {
  val questions      by viewModel.questions.collectAsState()
  val cat            by viewModel.activeCategory.collectAsState()
  val firestoreSets  by viewModel.questionSets.collectAsState()
  val setsLoading    by viewModel.questionSetsLoading.collectAsState()

  // Fallback: local synthetic sets
  val availableQs = remember(questions, cat) {
    questions.filter { it.categoryId == cat || it.categoryId == "ALL" }
  }
  val setSize  = 20
  val localSetCount = maxOf(1, (availableQs.size + setSize - 1) / setSize)

  // Use Firestore sets if available, otherwise synthetic local sets
  val useFirestoreSets = firestoreSets.isNotEmpty()

  var activeTab by remember { mutableStateOf(0) } // 0 = Sets, 1 = Custom

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
  ) {
    // Header
    Column(modifier = Modifier.padding(start = 24.dp, end = 24.dp, top = 24.dp, bottom = 12.dp)) {
      Text(
        text = if (lang == "np") "अभ्यास सेट" else "Practice",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.ExtraBold,
        color = MaterialTheme.colorScheme.onBackground
      )
      Text(
        text = if (lang == "np") "सेट छान्नुहोस् वा आफ्नै बनाउनुहोस्" else "Pick a set or build your own",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
    }

    // Tab switcher
    Row(
      modifier = Modifier
        .padding(horizontal = 24.dp)
        .clip(RoundedCornerShape(12.dp))
        .background(MaterialTheme.colorScheme.surfaceVariant)
        .padding(4.dp),
      horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
      listOf(
        if (lang == "np") "सेट प्रश्नहरू" else "Question Sets",
        if (lang == "np") "आफ्नै छनोट" else "Custom"
      ).forEachIndexed { i, label ->
        Box(
          modifier = Modifier
            .weight(1f)
            .clip(RoundedCornerShape(10.dp))
            .background(if (activeTab == i) MaterialTheme.colorScheme.primary else Color.Transparent)
            .clickable { activeTab = i }
            .padding(vertical = 10.dp),
          contentAlignment = Alignment.Center
        ) {
          Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = if (activeTab == i) MaterialTheme.colorScheme.onPrimary
                    else MaterialTheme.colorScheme.onSurfaceVariant
          )
        }
      }
    }

    Spacer(modifier = Modifier.height(16.dp))

    when (activeTab) {
      0 -> {
        if (useFirestoreSets) {
          FirestoreQuestionSetsGrid(
            sets    = firestoreSets,
            lang    = lang,
            loading = setsLoading,
            onSetClick = { set -> viewModel.startQuizFromFirebaseSet(set) }
          )
        } else {
          QuestionSetsGrid(
            setCount   = localSetCount,
            setSize    = setSize,
            totalQs    = availableQs.size,
            lang       = lang,
            onSetClick = onStartSet
          )
        }
      }
      else -> CustomQuizSetup(lang = lang, onStart = onStart)
    }
  }
}

// ── Firestore Question Sets Grid ────────────────────────────────────────────────
@Composable
fun FirestoreQuestionSetsGrid(
  sets: List<com.example.data.FirestoreContentService.QuestionSet>,
  lang: String,
  loading: Boolean,
  onSetClick: (com.example.data.FirestoreContentService.QuestionSet) -> Unit
) {
  val setColors = listOf(
    Color(0xFF335AB4) to Color(0xFFDAE1FF),
    Color(0xFF16A34A) to Color(0xFFDCFCE7),
    Color(0xFFB1002C) to Color(0xFFFFDAD9),
    Color(0xFFA16207) to Color(0xFFFEF9C3),
    Color(0xFF6D28D9) to Color(0xFFEDE9FE),
    Color(0xFF0891B2) to Color(0xFFCFFAFE),
  )

  if (loading) {
    androidx.compose.foundation.lazy.LazyColumn(
      contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
      modifier = Modifier.fillMaxSize()
    ) {
      items(4) {
        Surface(shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.fillMaxWidth()) {
          Box(modifier = Modifier.padding(20.dp).height(70.dp))
        }
      }
    }
    return
  }

  if (sets.isEmpty()) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
      Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = "📂", fontSize = 40.sp)
        Spacer(Modifier.height(8.dp))
        Text(
          text = if (lang == "np") "कुनै सेट उपलब्ध छैन" else "No sets available yet",
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )
      }
    }
    return
  }

  androidx.compose.foundation.lazy.LazyColumn(
    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 24.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
    modifier = Modifier.fillMaxSize()
  ) {
    items(sets.size) { i ->
      val set = sets[i]
      val (fg, bg) = setColors[i % setColors.size]
      val displayName = if (lang == "np" && set.nameNp.isNotBlank()) set.nameNp else set.name

      Surface(
        onClick = { onSetClick(set) },
        shape = RoundedCornerShape(18.dp),
        color = bg,
        modifier = Modifier.fillMaxWidth()
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
          // Set number circle
          Box(
            modifier = Modifier.size(48.dp).clip(CircleShape).background(fg),
            contentAlignment = Alignment.Center
          ) {
            Text(text = "${i + 1}", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
          }

          Column(modifier = Modifier.weight(1f)) {
            Text(text = displayName, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = fg)
            if (set.description.isNotBlank()) {
              Text(
                text = set.description,
                fontSize = 12.sp,
                color = fg.copy(alpha = 0.7f),
                maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
              )
            }
          }

          Column(horizontalAlignment = Alignment.End) {
            Text(text = "${set.questionCount}", fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = fg)
            Text(text = if (lang == "np") "प्रश्नहरू" else "questions", fontSize = 11.sp, color = fg.copy(alpha = 0.7f))
          }
        }
      }
    }
  }
}

// ── Fallback Local Question Sets Grid ─────────────────────────────────────────

@Composable
fun QuestionSetsGrid(
  setCount: Int,
  setSize: Int,
  totalQs: Int,
  lang: String,
  onSetClick: (Int) -> Unit
) {
  val setColors = listOf(
    Color(0xFF335AB4) to Color(0xFFDAE1FF),
    Color(0xFF16A34A) to Color(0xFFDCFCE7),
    Color(0xFFB1002C) to Color(0xFFFFDAD9),
    Color(0xFFA16207) to Color(0xFFFEF9C3),
    Color(0xFF6D28D9) to Color(0xFFEDE9FE),
    Color(0xFF0891B2) to Color(0xFFCFFAFE),
  )

  androidx.compose.foundation.lazy.LazyColumn(
    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 0.dp, bottom = 24.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
    modifier = Modifier.fillMaxSize()
  ) {
    items(setCount) { i ->
      val start  = i * setSize + 1
      val end    = minOf((i + 1) * setSize, totalQs)
      val (fg, bg) = setColors[i % setColors.size]

      Surface(
        onClick = { onSetClick(i) },
        shape = RoundedCornerShape(18.dp),
        color = bg,
        modifier = Modifier.fillMaxWidth()
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
          // Set number circle
          Box(
            modifier = Modifier
              .size(48.dp)
              .clip(CircleShape)
              .background(fg),
            contentAlignment = Alignment.Center
          ) {
            Text(
              text = "${i + 1}",
              color = Color.White,
              fontWeight = FontWeight.ExtraBold,
              fontSize = 18.sp
            )
          }

          Column(modifier = Modifier.weight(1f)) {
            Text(
              text = if (lang == "np") "सेट ${i + 1}" else "Set ${i + 1}",
              fontWeight = FontWeight.ExtraBold,
              fontSize = 16.sp,
              color = fg
            )
            Text(
              text = if (lang == "np") "प्रश्न $start – $end" else "Questions $start – $end",
              fontSize = 12.sp,
              color = fg.copy(alpha = 0.7f)
            )
          }

          Column(horizontalAlignment = Alignment.End) {
            Text(
              text = "${end - start + 1}",
              fontWeight = FontWeight.ExtraBold,
              fontSize = 22.sp,
              color = fg
            )
            Text(
              text = if (lang == "np") "प्रश्नहरू" else "questions",
              fontSize = 11.sp,
              color = fg.copy(alpha = 0.7f)
            )
          }
        }
      }
    }
  }
}

// ── Custom Quiz Setup (original topic + difficulty picker) ────────────────────
@Composable
fun CustomQuizSetup(
  lang: String,
  onStart: (topic: String?, difficulty: String?) -> Unit
) {
  var selectedTopic      by remember { mutableStateOf<String?>(null) }
  var selectedDifficulty by remember { mutableStateOf<String?>(null) }

  val topics = listOf(
    "Traffic Rules"    to if (lang == "np") "सडक अनुशासन (Traffic Rules)"           else "Traffic Rules",
    "Road Signs"       to if (lang == "np") "ट्राफिक चिन्हहरू (Road Signs)"         else "Road Signs",
    "Right of Way"     to if (lang == "np") "प्राथमिकता नियम (Right of Way)"        else "Right of Way",
    "Vehicle Knowledge" to if (lang == "np") "सवारी सम्बन्धी ज्ञान (Vehicle Knowledge)" else "Vehicle Knowledge"
  )
  val difficulties = listOf(
    "Easy"   to if (lang == "np") "सजिलो (Easy)"   else "Easy",
    "Medium" to if (lang == "np") "मध्यम (Medium)" else "Medium",
    "Hard"   to if (lang == "np") "कठिन (Hard)"    else "Hard"
  )

  Column(
    modifier = Modifier
      .fillMaxSize()
      .verticalScroll(rememberScrollState())
      .padding(horizontal = 24.dp),
    verticalArrangement = Arrangement.spacedBy(20.dp)
  ) {
    Spacer(modifier = Modifier.height(4.dp))

    // Topic Selection
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
      Text(
        text = if (lang == "np") "अभ्यासको शीर्षक (Topic)" else "Select Practice Topic",
        style = MaterialTheme.typography.bodyMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
      topics.forEach { (topicKey, topicLabel) ->
        val isSelected = selectedTopic == topicKey
        Surface(
          onClick = { selectedTopic = if (isSelected) null else topicKey },
          shape = RoundedCornerShape(16.dp),
          border = androidx.compose.foundation.BorderStroke(
            width = if (isSelected) 2.dp else 1.dp,
            color = if (isSelected) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
          ),
          color = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)
                  else MaterialTheme.colorScheme.surface,
          modifier = Modifier.fillMaxWidth().testTag("practice_topic_$topicKey")
        ) {
          Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
          ) {
            Box(
              modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(
                  if (isSelected) MaterialTheme.colorScheme.primary
                  else MaterialTheme.colorScheme.surfaceVariant
                ),
              contentAlignment = Alignment.Center
            ) {
              Icon(
                imageVector = when (topicKey) {
                  "Road Signs"        -> Icons.Default.Category
                  "Right of Way"      -> Icons.Default.AltRoute
                  "Vehicle Knowledge" -> Icons.Default.Build
                  else                -> Icons.Default.MenuBook
                },
                contentDescription = "Topic Icon",
                tint = if (isSelected) Color.White else MaterialTheme.colorScheme.primary
              )
            }
            Text(
              text = topicLabel,
              style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                color = if (isSelected) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.onSurface
              )
            )
          }
        }
      }
    }

    // Difficulty Options
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
      Text(
        text = if (lang == "np") "कठिनाइ स्तर (Difficulty)" else "Choose Difficulty (Optional)",
        style = MaterialTheme.typography.bodyMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        difficulties.forEach { (diffKey, diffLabel) ->
          val isSelected = selectedDifficulty == diffKey
          Box(
            modifier = Modifier
              .weight(1f)
              .clip(RoundedCornerShape(12.dp))
              .background(
                if (isSelected) MaterialTheme.colorScheme.primaryContainer
                else MaterialTheme.colorScheme.surfaceVariant
              )
              .clickable { selectedDifficulty = if (isSelected) null else diffKey }
              .border(
                width = 1.dp,
                color = if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent,
                shape = RoundedCornerShape(12.dp)
              )
              .padding(vertical = 12.dp),
            contentAlignment = Alignment.Center
          ) {
            Text(
              text = diffLabel,
              style = MaterialTheme.typography.labelMedium.copy(
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer
                        else MaterialTheme.colorScheme.onSurfaceVariant
              ),
              textAlign = TextAlign.Center
            )
          }
        }
      }
    }

    Spacer(modifier = Modifier.height(8.dp))

    // Start Button
    Button(
      onClick = { onStart(selectedTopic, selectedDifficulty) },
      modifier = Modifier
        .fillMaxWidth()
        .height(56.dp)
        .testTag("start_practice_quiz_btn"),
      shape = RoundedCornerShape(16.dp),
      colors = ButtonDefaults.buttonColors(
        containerColor = MaterialTheme.colorScheme.primary,
        contentColor = Color.White
      )
    ) {
      Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
      ) {
        Icon(imageVector = Icons.Default.PlayArrow, contentDescription = "Start")
        Text(
          text = if (lang == "np") "शुरु गर्नुहोस्" else "Start Practice Quiz",
          style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
        )
      }
    }

    Spacer(modifier = Modifier.height(16.dp))
  }
}

@Composable
fun QuizRunningScreen(
  state: QuizState,
  lang: String,
  onSelectOption: (Int) -> Unit,
  onSubmitAnswer: () -> Unit,
  onNext: () -> Unit,
  onQuit: () -> Unit,
  onToggleBookmark: (Int) -> Unit
) {
  val currentQ = state.questions[state.currentIndex]
  val options = currentQ.getOptions(lang)

  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    // Top Stats bar
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      IconButton(onClick = onQuit) {
        Icon(imageVector = Icons.Default.Close, contentDescription = "Quit Quiz")
      }

      Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
          text = if (lang == "np") "प्रश्न ${state.currentIndex + 1} / ${state.questions.size}" else "Question ${state.currentIndex + 1} of ${state.questions.size}",
          style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold)
        )
        Text(
          text = currentQ.topic,
          style = MaterialTheme.typography.labelSmall,
          color = MaterialTheme.colorScheme.primary
        )
      }

      Box(
        modifier = Modifier
          .clip(RoundedCornerShape(8.dp))
          .background(MaterialTheme.colorScheme.primaryContainer)
          .padding(horizontal = 10.dp, vertical = 6.dp)
      ) {
        Text(
          text = "${state.correctCount * 10} pts",
          style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
          color = MaterialTheme.colorScheme.onPrimaryContainer
        )
      }
    }

    // Progress Bar
    LinearProgressIndicator(
      progress = { (state.currentIndex.toFloat() / state.questions.size) },
      modifier = Modifier
        .fillMaxWidth()
        .height(8.dp)
        .clip(CircleShape),
      color = MaterialTheme.colorScheme.primary,
      trackColor = MaterialTheme.colorScheme.surfaceVariant
    )

    // Question Card Box
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .weight(1f)
        .verticalScroll(rememberScrollState()),
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
      ) {
        Column(
          modifier = Modifier.padding(20.dp),
          verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Text(
              text = if (lang == "np") "अभ्यास प्रश्न" else "Practice Question",
              style = MaterialTheme.typography.labelSmall,
              color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
            )
            IconButton(
              onClick = { onToggleBookmark(currentQ.id) },
              modifier = Modifier.size(36.dp).testTag("bookmark_toggle_btn")
            ) {
              Icon(
                imageVector = if (currentQ.isBookmarked) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                contentDescription = "Bookmark Question",
                tint = if (currentQ.isBookmarked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(24.dp)
              )
            }
          }

          // If question references a sign graphic, render it
          if (currentQ.imageRef != null) {
            Box(
              modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .size(100.dp)
                .background(Color.White, CircleShape)
                .padding(12.dp)
            ) {
              RoadSignGraphic(iconName = currentQ.imageRef, modifier = Modifier.fillMaxSize())
            }
          }

          Text(
            text = currentQ.getQuestion(lang),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.ExtraBold,
            lineHeight = 26.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
          )
        }
      }

      // Options List
      Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        options.forEachIndexed { index, optionText ->
          val isSelected = state.selectedOptionIndex == index
          val isCorrectAnswer = index == currentQ.correctOptionIndex

          // Color tokens for post-submit feedback
          val cardColor = when {
            state.isAnswered && isCorrectAnswer -> Color(0xFFEAF9ED) // Green
            state.isAnswered && isSelected && !isCorrectAnswer -> Color(0xFFFCEBEB) // Red
            isSelected -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
            else -> MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)
          }

          val borderStrokeColor = when {
            state.isAnswered && isCorrectAnswer -> Color(0xFF52C41A)
            state.isAnswered && isSelected && !isCorrectAnswer -> Color(0xFFF5222D)
            isSelected -> MaterialTheme.colorScheme.primary
            else -> MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
          }

          val textColor = when {
            state.isAnswered && isCorrectAnswer -> Color(0xFF1B5E20)
            state.isAnswered && isSelected && !isCorrectAnswer -> Color(0xFFC62828)
            isSelected -> MaterialTheme.colorScheme.primary
            else -> MaterialTheme.colorScheme.onSurface
          }

          Surface(
            onClick = { onSelectOption(index) },
            shape = RoundedCornerShape(16.dp),
            color = cardColor,
            border = androidx.compose.foundation.BorderStroke(if (isSelected || state.isAnswered) 2.dp else 1.dp, borderStrokeColor),
            modifier = Modifier.fillMaxWidth().testTag("quiz_option_$index")
          ) {
            Row(
              modifier = Modifier.padding(16.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
              Box(
                modifier = Modifier
                  .size(28.dp)
                  .background(
                    if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                    CircleShape
                  ),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = (index + 1).toString(),
                  style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                  color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                )
              }

              Text(
                text = optionText,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                color = textColor,
                modifier = Modifier.weight(1f)
              )

              if (state.isAnswered) {
                if (isCorrectAnswer) {
                  Icon(imageVector = Icons.Default.CheckCircle, contentDescription = "Correct", tint = Color(0xFF52C41A))
                } else if (isSelected) {
                  Icon(imageVector = Icons.Default.Cancel, contentDescription = "Incorrect", tint = Color(0xFFF5222D))
                }
              }
            }
          }
        }
      }

      // Bilingual Explanation Card shown instantly after answering
      if (state.isAnswered) {
        Card(
          modifier = Modifier.fillMaxWidth().animateContentSize(),
          shape = RoundedCornerShape(16.dp),
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.05f))
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
              Icon(imageVector = Icons.Default.Info, contentDescription = "Info", tint = MaterialTheme.colorScheme.primary)
              Text(
                text = if (lang == "np") "उत्तर स्पष्टीकरण (Explanation):" else "Explanation Guide:",
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
              )
            }
            Text(
              text = currentQ.getExplanation(lang),
              style = MaterialTheme.typography.bodyMedium,
              lineHeight = 20.sp
            )
          }
        }
      }
    }

    // Bottom Action Buttons
    if (!state.isAnswered) {
      Button(
        onClick = onSubmitAnswer,
        enabled = state.selectedOptionIndex != null,
        modifier = Modifier
          .fillMaxWidth()
          .height(56.dp)
          .testTag("quiz_submit_btn"),
        shape = RoundedCornerShape(16.dp)
      ) {
        Text(
          text = if (lang == "np") "उत्तर बुझाउनुहोस्" else "Check Answer",
          style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold)
        )
      }
    } else {
      Button(
        onClick = onNext,
        modifier = Modifier
          .fillMaxWidth()
          .height(56.dp)
          .testTag("quiz_next_btn"),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary, contentColor = Color.White)
      ) {
        Text(
          text = if (state.currentIndex + 1 < state.questions.size) {
            if (lang == "np") "अर्को प्रश्न" else "Next Question"
          } else {
            if (lang == "np") "अभ्यास पुरा गरौं" else "Complete Practice"
          },
          style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold)
        )
      }
    }
  }
}

@Composable
fun QuizCompletedScreen(
  state: QuizState,
  lang: String,
  onClose: () -> Unit,
  onRetake: () -> Unit
) {
  val totalQs = state.questions.size
  val correct = state.correctCount
  val pct = if (totalQs > 0) ((correct.toDouble() / totalQs) * 100).toInt() else 0
  val pointsEarned = correct * 10 + if (pct >= 70) 50 else 0

  Column(
    modifier = Modifier
      .fillMaxSize()
      .verticalScroll(rememberScrollState())
      .padding(24.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.spacedBy(24.dp)
  ) {
    Spacer(modifier = Modifier.height(24.dp))

    Icon(
      imageVector = Icons.Default.EmojiEvents,
      contentDescription = "Success",
      tint = Color(0xFFFFB74D),
      modifier = Modifier.size(100.dp)
    )

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
      Text(
        text = if (lang == "np") "बधाई छ! अभ्यास समाप्त भयो" else "Practice Complete!",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.ExtraBold,
        textAlign = TextAlign.Center
      )
      Text(
        text = if (lang == "np") "तपाईंले सफलतापुर्वक सडक ज्ञान अभ्यास गर्नुभयो।" else "You have successfully completed this set.",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center
      )
    }

    // Circle Score representation
    Card(
      modifier = Modifier.size(160.dp),
      shape = CircleShape,
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
      Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
      ) {
        Text(
          text = "$pct%",
          style = MaterialTheme.typography.headlineLarge,
          fontWeight = FontWeight.ExtraBold,
          color = MaterialTheme.colorScheme.onPrimaryContainer
        )
        Text(
          text = if (lang == "np") "मिलाएको ($correct/$totalQs)" else "$correct / $totalQs Correct",
          style = MaterialTheme.typography.labelMedium,
          color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
        )
      }
    }

    // Points Summary
    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .padding(20.dp),
        horizontalArrangement = Arrangement.SpaceAround,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
          Text(text = "+$pointsEarned", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
          Text(text = if (lang == "np") "अर्जित अंकहरू" else "Points Earned", style = MaterialTheme.typography.labelSmall)
        }

        VerticalDivider(modifier = Modifier.height(40.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
          Text(text = if (pct >= 70) "PASS" else "FAIL", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = if (pct >= 70) Color(0xFF52C41A) else Color(0xFFF5222D))
          Text(text = if (lang == "np") "नतिजा" else "Result Status", style = MaterialTheme.typography.labelSmall)
        }
      }
    }

    Spacer(modifier = Modifier.height(16.dp))

    // Action buttons
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      OutlinedButton(
        onClick = onRetake,
        modifier = Modifier
          .weight(1f)
          .height(56.dp)
          .testTag("quiz_retake_btn"),
        shape = RoundedCornerShape(16.dp)
      ) {
        Text(text = if (lang == "np") "पुनः प्रयास गर्नुहोस्" else "Try Again")
      }

      Button(
        onClick = onClose,
        modifier = Modifier
          .weight(1f)
          .height(56.dp)
          .testTag("quiz_home_btn"),
        shape = RoundedCornerShape(16.dp)
      ) {
        Text(text = if (lang == "np") "होम स्क्रिन" else "Go Home")
      }
    }
  }
}
