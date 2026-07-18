package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
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
import com.example.data.Category
import com.example.data.Question
import com.example.ui.viewmodel.LicenseSathiViewModel
import com.example.ui.viewmodel.MockState

@Composable
fun MockExamScreen(
  viewModel: LicenseSathiViewModel,
  onNavigateHome: () -> Unit,
  modifier: Modifier = Modifier
) {
  val lang           by viewModel.activeLanguage.collectAsState()
  val catId          by viewModel.activeCategory.collectAsState()
  val mockState      by viewModel.mockState.collectAsState()
  val categoriesList by viewModel.categories.collectAsState()
  val allQuestions   by viewModel.questions.collectAsState()

  val activeCat = categoriesList.find { it.id == catId }
    ?: Category("A", "Category A", "Category A", "motorcycle", 15, 15, 80)

  // How many sets are available for this category
  val availableQs = remember(allQuestions, catId) {
    allQuestions.filter { it.categoryId == catId || it.categoryId == "ALL" }
  }
  val setSize  = 20
  val setCount = maxOf(1, (availableQs.size + setSize - 1) / setSize)

  Box(
    modifier = modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
  ) {
    if (mockState == null) {
      MockRulesScreen(
        lang     = lang,
        category = activeCat,
        setCount = setCount,
        setSize  = setSize,
        totalQs  = availableQs.size,
        onStartRandom  = { viewModel.startMockExam() },
        onStartFromSet = { setIndex -> viewModel.startMockExamFromSet(setIndex, setSize) }
      )
    } else {
      val state = mockState!!
      if (state.isCompleted) {
        MockResultsScreen(
          state  = state,
          lang   = lang,
          onClose = { viewModel.closeMockExam(); onNavigateHome() },
          onRetake = { viewModel.closeMockExam(); viewModel.startMockExam() }
        )
      } else {
        MockActiveScreen(
          state          = state,
          lang           = lang,
          onSelectOption = { viewModel.selectMockOption(it) },
          onNext         = { viewModel.nextMockQuestion() },
          onPrev         = { viewModel.prevMockQuestion() },
          onJumpTo       = { viewModel.selectMockQuestionDirect(it) },
          onSubmit       = { viewModel.submitMockExam() },
          onQuit         = { viewModel.closeMockExam() }
        )
      }
    }
  }
}

@Composable
fun MockRulesScreen(
  lang: String,
  category: Category,
  setCount: Int,
  setSize: Int,
  totalQs: Int,
  onStartRandom: () -> Unit,
  onStartFromSet: (Int) -> Unit,
) {
  // 0 = Random, 1 = From Set
  var selectedMode by remember { mutableStateOf(0) }

  val setColors = listOf(
    Color(0xFF335AB4) to Color(0xFFDAE1FF),
    Color(0xFF16A34A) to Color(0xFFDCFCE7),
    Color(0xFFB1002C) to Color(0xFFFFDAD9),
    Color(0xFFA16207) to Color(0xFFFEF9C3),
    Color(0xFF6D28D9) to Color(0xFFEDE9FE),
    Color(0xFF0891B2) to Color(0xFFCFFAFE),
  )

  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
  ) {
    // ── Header ────────────────────────────────────────────────────────────────
    Column(
      modifier = Modifier.padding(horizontal = 24.dp, vertical = 20.dp),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      Icon(
        imageVector = Icons.Default.Timer,
        contentDescription = null,
        tint = MaterialTheme.colorScheme.primary,
        modifier = Modifier.size(64.dp)
      )
      Spacer(modifier = Modifier.height(8.dp))
      Text(
        text = if (lang == "np") "आधिकारिक परीक्षा सिमुलेटर" else "Mock Written Exam",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.ExtraBold,
        textAlign = TextAlign.Center
      )
      Text(
        text = if (lang == "np") "प्रश्न प्रकार छान्नुहोस्" else "Choose your question source",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center
      )
    }

    // ── Mode switcher ─────────────────────────────────────────────────────────
    Row(
      modifier = Modifier
        .padding(horizontal = 24.dp)
        .clip(RoundedCornerShape(12.dp))
        .background(MaterialTheme.colorScheme.surfaceVariant)
        .padding(4.dp),
      horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
      listOf(
        if (lang == "np") "र्यान्डम (सबै)" else "Random — All",
        if (lang == "np") "सेटबाट" else "From a Set"
      ).forEachIndexed { i, label ->
        Box(
          modifier = Modifier
            .weight(1f)
            .clip(RoundedCornerShape(10.dp))
            .background(if (selectedMode == i) MaterialTheme.colorScheme.primary else Color.Transparent)
            .clickable { selectedMode = i }
            .padding(vertical = 10.dp),
          contentAlignment = Alignment.Center
        ) {
          Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = if (selectedMode == i) MaterialTheme.colorScheme.onPrimary
                    else MaterialTheme.colorScheme.onSurfaceVariant
          )
        }
      }
    }

    Spacer(modifier = Modifier.height(16.dp))

    // ── Mode content ──────────────────────────────────────────────────────────
    when (selectedMode) {
      // ── RANDOM MODE ─────────────────────────────────────────────────────────
      0 -> Column(
        modifier = Modifier
          .weight(1f)
          .verticalScroll(rememberScrollState())
          .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
      ) {
        Card(
          modifier = Modifier.fillMaxWidth(),
          shape = RoundedCornerShape(20.dp),
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
        ) {
          Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ExamConfigRow(Icons.Default.Category, if (lang == "np") "सवारी वर्ग" else "Category",
              if (lang == "np") category.nameNp else category.nameEn)
            ExamConfigRow(Icons.Default.Quiz, if (lang == "np") "कुल प्रश्न" else "Questions", "${category.questionCount} Qs")
            ExamConfigRow(Icons.Default.HourglassTop, if (lang == "np") "समय सीमा" else "Time Limit", "${category.timeLimitMinutes} mins")
            ExamConfigRow(Icons.Default.EmojiEvents, if (lang == "np") "उत्तीर्ण अंक" else "Pass Mark", "${category.passMark}%")
            ExamConfigRow(Icons.Default.Shuffle, if (lang == "np") "प्रश्न छनोट" else "Selection", if (lang == "np") "सबै सेटबाट र्यान्डम" else "Random from all sets")
          }
        }

        Card(
          modifier = Modifier.fillMaxWidth(),
          shape = RoundedCornerShape(16.dp),
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f))
        ) {
          Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.error)
            Text(
              text = if (lang == "np") "परीक्षा चलिरहेको बेला कुनै उत्तर प्रतिक्रिया देखाइने छैन।"
                     else "No answer feedback is shown during the active exam.",
              style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold,
              color = MaterialTheme.colorScheme.onErrorContainer
            )
          }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Button(
          onClick = onStartRandom,
          modifier = Modifier.fillMaxWidth().height(56.dp).testTag("start_mock_exam_btn"),
          shape = RoundedCornerShape(16.dp)
        ) {
          Icon(imageVector = Icons.Default.Shuffle, contentDescription = null, modifier = Modifier.size(20.dp))
          Spacer(modifier = Modifier.width(8.dp))
          Text(text = if (lang == "np") "र्यान्डम परीक्षा सुरु गरौं" else "Start Random Exam",
            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
        }

        Spacer(modifier = Modifier.height(16.dp))
      }

      // ── FROM SET MODE ────────────────────────────────────────────────────────
      else -> LazyColumn(
        modifier = Modifier.weight(1f),
        contentPadding = PaddingValues(start = 24.dp, end = 24.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
      ) {
        items(setCount) { i ->
          val start = i * setSize + 1
          val end   = minOf((i + 1) * setSize, totalQs)
          val (fg, bg) = setColors[i % setColors.size]

          Surface(
            onClick = { onStartFromSet(i) },
            shape = RoundedCornerShape(18.dp),
            color = bg,
            modifier = Modifier.fillMaxWidth()
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
              Box(
                modifier = Modifier.size(48.dp).clip(CircleShape).background(fg),
                contentAlignment = Alignment.Center
              ) {
                Text("${i + 1}", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
              }

              Column(modifier = Modifier.weight(1f)) {
                Text(
                  text = if (lang == "np") "सेट ${i + 1}" else "Set ${i + 1}",
                  fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = fg
                )
                Text(
                  text = if (lang == "np") "प्रश्न $start – $end" else "Questions $start – $end",
                  fontSize = 12.sp, color = fg.copy(alpha = 0.7f)
                )
              }

              Column(horizontalAlignment = Alignment.End) {
                Text("${end - start + 1}", fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = fg)
                Text(if (lang == "np") "प्रश्नहरू" else "questions", fontSize = 11.sp, color = fg.copy(alpha = 0.7f))
              }
            }
          }
        }
      }
    }
  }
}

@Composable
fun ExamConfigRow(
  icon: androidx.compose.ui.graphics.vector.ImageVector,
  label: String,
  value: String
) {
  Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.CenterVertically
  ) {
    Row(
      horizontalArrangement = Arrangement.spacedBy(10.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      Icon(imageVector = icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
      Text(text = label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
    Text(text = value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)
  }
}

@Composable
fun MockActiveScreen(
  state: MockState,
  lang: String,
  onSelectOption: (Int) -> Unit,
  onNext: () -> Unit,
  onPrev: () -> Unit,
  onJumpTo: (Int) -> Unit,
  onSubmit: () -> Unit,
  onQuit: () -> Unit
) {
  val currentQ = state.questions[state.currentIndex]
  val options = currentQ.getOptions(lang)

  // Timer formatted
  val minutes = state.timeLeftSeconds / 60
  val seconds = state.timeLeftSeconds % 60
  val timeFormatted = String.format("%02d:%02d", minutes, seconds)

  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
  ) {
    // Timer & Index header
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically
    ) {
      IconButton(onClick = onQuit) {
        Icon(imageVector = Icons.Default.Close, contentDescription = "Exit Exam")
      }

      Box(
        modifier = Modifier
          .clip(RoundedCornerShape(12.dp))
          .background(if (state.timeLeftSeconds < 120) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.primaryContainer)
          .padding(horizontal = 16.dp, vertical = 8.dp)
      ) {
        Row(
          horizontalArrangement = Arrangement.spacedBy(6.dp),
          verticalAlignment = Alignment.CenterVertically
        ) {
          Icon(
            imageVector = Icons.Default.HourglassEmpty,
            contentDescription = "Timer",
            tint = if (state.timeLeftSeconds < 120) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(18.dp)
          )
          Text(
            text = timeFormatted,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.ExtraBold,
            color = if (state.timeLeftSeconds < 120) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onPrimaryContainer
          )
        }
      }

      Text(
        text = "${state.currentIndex + 1} / ${state.questions.size}",
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.ExtraBold
      )
    }

    // Question content scroll container
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .weight(1f)
        .verticalScroll(rememberScrollState()),
      verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
      // Question Card
      Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
      ) {
        Column(
          modifier = Modifier.padding(20.dp),
          verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
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
            lineHeight = 24.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
          )
        }
      }

      // Clickable options (No instant evaluation feedback)
      Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        options.forEachIndexed { index, optionText ->
          val isSelected = state.answers[state.currentIndex] == index

          Surface(
            onClick = { onSelectOption(index) },
            shape = RoundedCornerShape(16.dp),
            color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f),
            border = androidx.compose.foundation.BorderStroke(
              width = if (isSelected) 2.dp else 1.dp,
              color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
            ),
            modifier = Modifier.fillMaxWidth().testTag("mock_option_$index")
          ) {
            Row(
              modifier = Modifier.padding(16.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
              Box(
                modifier = Modifier
                  .size(24.dp)
                  .background(
                    if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                    CircleShape
                  ),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = (index + 1).toString(),
                  style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                  color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                )
              }

              Text(
                text = optionText,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
              )
            }
          }
        }
      }

      HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f), modifier = Modifier.padding(vertical = 4.dp))

      // Question Navigator grid
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
          text = if (lang == "np") "प्रश्न नक्सा (Question Map)" else "Question Map Tracker",
          style = MaterialTheme.typography.labelMedium,
          fontWeight = FontWeight.Bold,
          color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        LazyVerticalGrid(
          columns = GridCells.Fixed(5),
          modifier = Modifier.height(80.dp),
          horizontalArrangement = Arrangement.spacedBy(6.dp),
          verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          itemsIndexed(state.questions) { index, _ ->
            val hasAnswered = state.answers[index] != null
            val isCurrent = state.currentIndex == index

            Box(
              modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(
                  when {
                    isCurrent -> MaterialTheme.colorScheme.primary
                    hasAnswered -> MaterialTheme.colorScheme.primaryContainer
                    else -> MaterialTheme.colorScheme.surfaceVariant
                  }
                )
                .clickable { onJumpTo(index) }
                .padding(vertical = 8.dp),
              contentAlignment = Alignment.Center
            ) {
              Text(
                text = (index + 1).toString(),
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                color = when {
                  isCurrent -> Color.White
                  hasAnswered -> MaterialTheme.colorScheme.onPrimaryContainer
                  else -> MaterialTheme.colorScheme.onSurfaceVariant
                }
              )
            }
          }
        }
      }
    }

    // Prev / Next / Submit row
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      if (state.currentIndex > 0) {
        OutlinedButton(
          onClick = onPrev,
          shape = RoundedCornerShape(12.dp),
          modifier = Modifier.weight(1f).height(48.dp)
        ) {
          Text(text = if (lang == "np") "अघिल्लो" else "Previous")
        }
      }

      val isLast = state.currentIndex == state.questions.size - 1
      if (isLast) {
        Button(
          onClick = onSubmit,
          colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF52C41A), contentColor = Color.White),
          shape = RoundedCornerShape(12.dp),
          modifier = Modifier.weight(1.5f).height(48.dp).testTag("mock_submit_btn")
        ) {
          Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
          ) {
            Icon(imageVector = Icons.Default.Send, contentDescription = "Submit", modifier = Modifier.size(16.dp))
            Text(text = if (lang == "np") "परीक्षा बुझाउनुहोस्" else "Submit Exam", fontWeight = FontWeight.Bold)
          }
        }
      } else {
        Button(
          onClick = onNext,
          shape = RoundedCornerShape(12.dp),
          modifier = Modifier.weight(1f).height(48.dp)
        ) {
          Text(text = if (lang == "np") "अर्को" else "Next")
        }
      }
    }
  }
}

@Composable
fun MockResultsScreen(
  state: MockState,
  lang: String,
  onClose: () -> Unit,
  onRetake: () -> Unit
) {
  Column(
    modifier = Modifier
      .fillMaxSize()
      .verticalScroll(rememberScrollState())
      .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp),
    horizontalAlignment = Alignment.CenterHorizontally
  ) {
    Spacer(modifier = Modifier.height(16.dp))

    Icon(
      imageVector = if (state.passed) Icons.Default.CheckCircle else Icons.Default.Cancel,
      contentDescription = "Result Status",
      tint = if (state.passed) Color(0xFF52C41A) else Color(0xFFF5222D),
      modifier = Modifier.size(90.dp)
    )

    Text(
      text = if (state.passed) {
        if (lang == "np") "उत्कृष्ट! तपाईं पास हुनुभयो" else "Congratulations! You Passed"
      } else {
        if (lang == "np") "दुर्भाग्यवश! पुनः प्रयास गर्नुहोस्" else "Unsuccessful Attempt"
      },
      style = MaterialTheme.typography.headlineSmall,
      fontWeight = FontWeight.ExtraBold,
      textAlign = TextAlign.Center
    )

    // Score layout
    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(24.dp),
      colors = CardDefaults.cardColors(containerColor = if (state.passed) Color(0xFFEAF9ED) else Color(0xFFFCEBEB))
    ) {
      Column(
        modifier = Modifier.padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        val count = state.questions.size
        var correct = 0
        state.questions.forEachIndexed { index, question ->
          if (state.answers[index] == question.correctOptionIndex) correct++
        }

        val pct = if (count > 0) ((correct.toDouble() / count) * 100).toInt() else 0

        Text(
          text = "$pct%",
          style = MaterialTheme.typography.headlineLarge.copy(fontSize = 54.sp),
          fontWeight = FontWeight.ExtraBold,
          color = if (state.passed) Color(0xFF1B5E20) else Color(0xFFC62828)
        )

        Text(
          text = if (lang == "np") "अंक: $correct / $count मिलाएको" else "Score: $correct of $count correct",
          style = MaterialTheme.typography.titleMedium,
          fontWeight = FontWeight.Bold,
          color = if (state.passed) Color(0xFF1B5E20) else Color(0xFFC62828)
        )

        Text(
          text = if (state.passed) {
            if (lang == "np") "तपाईं वास्तविक लिखित परीक्षा दिन योग्य हुनुहुन्छ!" else "Your preparation score is ready for the real written test."
          } else {
            if (lang == "np") "पास हुन कम्तीमा ८०% प्राप्त गर्नुपर्छ।" else "The official DoTM passing threshold is 80%."
          },
          style = MaterialTheme.typography.bodySmall,
          textAlign = TextAlign.Center,
          color = if (state.passed) Color(0xFF1B5E20).copy(alpha = 0.8f) else Color(0xFFC62828).copy(alpha = 0.8f)
        )
      }
    }

    // Diagnostics / Weak Area Breakdown
    Card(
      modifier = Modifier.fillMaxWidth(),
      shape = RoundedCornerShape(16.dp),
      colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
      Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        Text(
          text = if (lang == "np") "विषयगत विश्लेषण (Weak Areas)" else "Topic Weaknesses Diagnostic",
          style = MaterialTheme.typography.titleSmall,
          fontWeight = FontWeight.Bold,
          color = MaterialTheme.colorScheme.primary
        )

        // Count mistakes by topic
        val topicsStats = mutableMapOf<String, Int>() // topic -> wrong count
        state.questions.forEachIndexed { index, question ->
          val isCorrect = state.answers[index] == question.correctOptionIndex
          if (!isCorrect) {
            topicsStats[question.topic] = (topicsStats[question.topic] ?: 0) + 1
          }
        }

        if (topicsStats.isEmpty()) {
          Text(
            text = if (lang == "np") "कुनै कमजोरी भेटिएन! उत्कृष्ट प्रदर्शन!" else "No weak areas found! Superb performance!",
            style = MaterialTheme.typography.bodyMedium,
            color = Color(0xFF52C41A),
            fontWeight = FontWeight.Bold
          )
        } else {
          topicsStats.forEach { (topic, wrongCount) ->
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text(text = topic, style = MaterialTheme.typography.bodyMedium)
              Text(
                text = if (lang == "np") "$wrongCount गल्तीहरू" else "$wrongCount mistakes",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.error
              )
            }
          }
        }
      }
    }

    // Question Review scroll list
    Text(
      text = if (lang == "np") "प्रश्न समीक्षा (Review Questions)" else "Full Question Review Breakdown",
      style = MaterialTheme.typography.titleMedium,
      fontWeight = FontWeight.ExtraBold,
      modifier = Modifier.align(Alignment.Start).padding(top = 8.dp)
    )

    Column(
      modifier = Modifier.fillMaxWidth(),
      verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      state.questions.forEachIndexed { index, q ->
        val userAnsIndex = state.answers[index]
        val isCorrect = userAnsIndex == q.correctOptionIndex
        val options = q.getOptions(lang)

        Card(
          modifier = Modifier.fillMaxWidth(),
          shape = RoundedCornerShape(16.dp),
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Text(
              text = "${index + 1}. ${q.getQuestion(lang)}",
              style = MaterialTheme.typography.bodyMedium,
              fontWeight = FontWeight.Bold
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

            Text(
              text = if (lang == "np") {
                "तपाईंको उत्तर: ${userAnsIndex?.let { options.getOrNull(it) } ?: "छोडिएको"}"
              } else {
                "Your Answer: ${userAnsIndex?.let { options.getOrNull(it) } ?: "Skipped"}"
              },
              style = MaterialTheme.typography.bodySmall,
              fontWeight = FontWeight.Bold,
              color = if (isCorrect) Color(0xFF1B5E20) else Color(0xFFC62828)
            )

            if (!isCorrect) {
              Text(
                text = if (lang == "np") {
                  "सही उत्तर: ${options.getOrNull(q.correctOptionIndex)}"
                } else {
                  "Correct Answer: ${options.getOrNull(q.correctOptionIndex)}"
                },
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1B5E20)
              )
            }

            Box(
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.05f))
                .padding(8.dp)
            ) {
              Text(
                text = q.getExplanation(lang),
                style = MaterialTheme.typography.bodySmall,
                lineHeight = 16.sp
              )
            }
          }
        }
      }
    }

    Spacer(modifier = Modifier.height(16.dp))

    // Navigation buttons
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
      OutlinedButton(
        onClick = onRetake,
        modifier = Modifier
          .weight(1f)
          .height(56.dp)
          .testTag("mock_retake_btn"),
        shape = RoundedCornerShape(16.dp)
      ) {
        Text(text = if (lang == "np") "पुनः जाँच दिनुहोस्" else "Retake Exam")
      }

      Button(
        onClick = onClose,
        modifier = Modifier
          .weight(1f)
          .height(56.dp)
          .testTag("mock_home_btn"),
        shape = RoundedCornerShape(16.dp)
      ) {
        Text(text = if (lang == "np") "होम स्क्रिन" else "Go Home")
      }
    }

    Spacer(modifier = Modifier.height(24.dp))
  }
}
