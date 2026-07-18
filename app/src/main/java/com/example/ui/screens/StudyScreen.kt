package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.FinePenalty
import com.example.data.RoadSign
import com.example.data.RuleArticle
import com.example.data.Question
import com.example.ui.viewmodel.LicenseSathiViewModel
import kotlin.math.cos
import kotlin.math.sin

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudyScreen(
  viewModel: LicenseSathiViewModel,
  modifier: Modifier = Modifier
) {
  val lang by viewModel.activeLanguage.collectAsState()
  val rulesList by viewModel.ruleArticles.collectAsState()
  val signsList by viewModel.roadSigns.collectAsState()
  val finesList by viewModel.fines.collectAsState()
  val questionsList by viewModel.questions.collectAsState()
  val isSyncing by viewModel.isSyncing.collectAsState()

  val expertLoading by viewModel.expertLoading.collectAsState()
  val expertExplanation by viewModel.expertExplanation.collectAsState()
  val expertError by viewModel.expertError.collectAsState()
  var explainingItem by remember { mutableStateOf<Triple<String, String, String>?>(null) } // Triple of (title, content, type)

  var selectedTab by remember { mutableStateOf(0) }
  val tabTitles = if (lang == "np") {
    listOf("सडक नियम", "सङ्केतहरू", "जरिवाना", "कानून", "सवारी ज्ञान", "मनपर्ने")
  } else {
    listOf("Rules", "Signs", "Fines", "Law", "Vehicle", "Favorites")
  }

  var searchQuery by remember { mutableStateOf("") }

  val filteredRules = remember(rulesList, searchQuery) {
    if (searchQuery.isBlank()) rulesList else {
      rulesList.filter {
        it.titleNp.contains(searchQuery, ignoreCase = true) ||
          it.titleEn.contains(searchQuery, ignoreCase = true) ||
          it.contentNp.contains(searchQuery, ignoreCase = true) ||
          it.contentEn.contains(searchQuery, ignoreCase = true) ||
          it.topic.contains(searchQuery, ignoreCase = true)
      }
    }
  }

  val filteredSigns = remember(signsList, searchQuery) {
    if (searchQuery.isBlank()) signsList else {
      signsList.filter {
        it.nameNp.contains(searchQuery, ignoreCase = true) ||
          it.nameEn.contains(searchQuery, ignoreCase = true) ||
          it.descriptionNp.contains(searchQuery, ignoreCase = true) ||
          it.descriptionEn.contains(searchQuery, ignoreCase = true) ||
          it.memoryTipNp.contains(searchQuery, ignoreCase = true) ||
          it.memoryTipEn.contains(searchQuery, ignoreCase = true) ||
          it.type.contains(searchQuery, ignoreCase = true)
      }
    }
  }

  val filteredFines = remember(finesList, searchQuery) {
    if (searchQuery.isBlank()) finesList else {
      finesList.filter {
        it.offenseNp.contains(searchQuery, ignoreCase = true) ||
          it.offenseEn.contains(searchQuery, ignoreCase = true) ||
          it.category.contains(searchQuery, ignoreCase = true) ||
          it.fineAmount.contains(searchQuery, ignoreCase = true)
      }
    }
  }

  val filteredQuestions = remember(questionsList, searchQuery) {
    val bookmarked = questionsList.filter { it.isBookmarked }
    if (searchQuery.isBlank()) bookmarked else {
      bookmarked.filter {
        it.questionNp.contains(searchQuery, ignoreCase = true) ||
          it.questionEn.contains(searchQuery, ignoreCase = true) ||
          it.explanationNp.contains(searchQuery, ignoreCase = true) ||
          it.explanationEn.contains(searchQuery, ignoreCase = true) ||
          it.topic.contains(searchQuery, ignoreCase = true)
      }
    }
  }

  // Law tab: rule articles that cover legal/law topics
  val lawTopics = setOf("law", "drink_driving", "right_of_way", "general", "two_wheeler",
    "documents", "speed", "overtaking", "signal", "penalty", "fine")
  val filteredLaw = remember(rulesList, searchQuery) {
    if (searchQuery.isBlank()) rulesList else {
      rulesList.filter {
        it.titleNp.contains(searchQuery, ignoreCase = true) ||
          it.titleEn.contains(searchQuery, ignoreCase = true) ||
          it.contentNp.contains(searchQuery, ignoreCase = true) ||
          it.contentEn.contains(searchQuery, ignoreCase = true)
      }
    }
  }

  // Vehicle Knowledge tab: questions with topic "Vehicle Knowledge"
  val filteredVehicleKnowledge = remember(questionsList, searchQuery) {
    val vk = questionsList.filter { it.topic.equals("Vehicle Knowledge", ignoreCase = true) }
    if (searchQuery.isBlank()) vk else {
      vk.filter {
        it.questionNp.contains(searchQuery, ignoreCase = true) ||
          it.questionEn.contains(searchQuery, ignoreCase = true) ||
          it.explanationNp.contains(searchQuery, ignoreCase = true) ||
          it.explanationEn.contains(searchQuery, ignoreCase = true)
      }
    }
  }

  val starredSigns = remember(signsList, searchQuery) {
    val starred = signsList.filter { it.isStarred }
    if (searchQuery.isBlank()) starred else {
      starred.filter {
        it.nameNp.contains(searchQuery, ignoreCase = true) ||
          it.nameEn.contains(searchQuery, ignoreCase = true) ||
          it.descriptionNp.contains(searchQuery, ignoreCase = true) ||
          it.descriptionEn.contains(searchQuery, ignoreCase = true)
      }
    }
  }

  val starredRules = remember(rulesList, searchQuery) {
    val starred = rulesList.filter { it.isStarred }
    if (searchQuery.isBlank()) starred else {
      starred.filter {
        it.titleNp.contains(searchQuery, ignoreCase = true) ||
          it.titleEn.contains(searchQuery, ignoreCase = true) ||
          it.contentNp.contains(searchQuery, ignoreCase = true) ||
          it.contentEn.contains(searchQuery, ignoreCase = true)
      }
    }
  }

  PullToRefreshBox(
    isRefreshing = isSyncing,
    onRefresh = { viewModel.syncContent(force = true) },
    modifier = modifier.fillMaxSize()
  ) {
  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
  ) {
    // 1. Tab Bar Row — compact chips, scrollable only when needed
    androidx.compose.foundation.lazy.LazyRow(
      modifier = Modifier
        .fillMaxWidth()
        .background(MaterialTheme.colorScheme.surfaceVariant)
        .testTag("study_tab_row"),
      contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp),
      horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
      tabTitles.forEachIndexed { index, title ->
        item {
          val selected = selectedTab == index
          Box(
            modifier = Modifier
              .clip(RoundedCornerShape(20.dp))
              .background(
                if (selected) MaterialTheme.colorScheme.primary
                else MaterialTheme.colorScheme.surface
              )
              .clickable { selectedTab = index }
              .padding(horizontal = 14.dp, vertical = 7.dp)
              .testTag("study_tab_$index"),
            contentAlignment = Alignment.Center
          ) {
            Text(
              text = title,
              fontWeight = if (selected) FontWeight.ExtraBold else FontWeight.Medium,
              fontSize = 11.sp,
              maxLines = 1,
              softWrap = false,
              color = if (selected)
                MaterialTheme.colorScheme.onPrimary
              else
                MaterialTheme.colorScheme.onSurfaceVariant
            )
          }
        }
      }
    }

    // 1.5 Offline / Caching Status Banner
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f))
        .padding(horizontal = 16.dp, vertical = 8.dp),
      horizontalArrangement = Arrangement.Center,
      verticalAlignment = Alignment.CenterVertically
    ) {
      Icon(
        imageVector = Icons.Default.CloudDone,
        contentDescription = "Offline Study Active",
        tint = MaterialTheme.colorScheme.primary,
        modifier = Modifier.size(16.dp)
      )
      Spacer(modifier = Modifier.width(8.dp))
      Text(
        text = if (lang == "np") {
          "सक्रिय: अफलाइन अध्ययन र स्थानीय क्यासिङ उपलब्ध छ (Room DB)"
        } else {
          "Offline Access Enabled: Materials cached in Room DB"
        },
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onPrimaryContainer,
        fontWeight = FontWeight.Bold
      )
    }

    // 1.6 Global Search Bar
    OutlinedTextField(
      value = searchQuery,
      onValueChange = { searchQuery = it },
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 16.dp, vertical = 12.dp)
        .testTag("global_study_search_bar"),
      placeholder = {
        Text(
          text = if (lang == "np") {
            "नियम, सङ्केत, जरिवाना वा प्रश्न खोज्नुहोस्..."
          } else {
            "Search rules, signs, fines, or bookmarks..."
          },
          style = MaterialTheme.typography.bodyMedium,
          color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
        )
      },
      leadingIcon = {
        Icon(
          imageVector = Icons.Default.Search,
          contentDescription = "Search Icon",
          tint = MaterialTheme.colorScheme.primary
        )
      },
      trailingIcon = {
        if (searchQuery.isNotEmpty()) {
          IconButton(
            onClick = { searchQuery = "" },
            modifier = Modifier.testTag("clear_search_btn")
          ) {
            Icon(
              imageVector = Icons.Default.Clear,
              contentDescription = "Clear Search",
              tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
          }
        }
      },
      shape = RoundedCornerShape(28.dp),
      colors = OutlinedTextFieldDefaults.colors(
        focusedContainerColor = MaterialTheme.colorScheme.surface,
        unfocusedContainerColor = MaterialTheme.colorScheme.surface,
        focusedBorderColor = MaterialTheme.colorScheme.primary,
        unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
      ),
      singleLine = true
    )

    if (searchQuery.isNotEmpty()) {
      val count = when (selectedTab) {
        0 -> filteredRules.size
        1 -> filteredSigns.size
        2 -> filteredFines.size
        3 -> filteredLaw.size
        4 -> filteredVehicleKnowledge.size
        5 -> filteredQuestions.size + starredSigns.size + starredRules.size
        else -> 0
      }
      Text(
        text = if (lang == "np") {
          "खोज परिणाम: ${viewModel.getNepaliDigits(count)} वटा फेला परे"
        } else {
          "Found $count results in this tab"
        },
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.primary,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
          .padding(horizontal = 24.dp)
          .padding(bottom = 4.dp)
          .testTag("search_results_count")
      )
    }

    // 2. Tab Content
    Box(
      modifier = Modifier
        .fillMaxSize()
        .weight(1f)
    ) {
      when (selectedTab) {
        0 -> RulesTab(
          rules = filteredRules,
          lang = lang,
          onStarToggle = { viewModel.toggleStarRuleArticle(it) },
          onAskExpert = { title, content, type ->
            explainingItem = Triple(title, content, type)
            viewModel.askExpert(type, title, content, lang)
          }
        )
        1 -> SignsTab(
          signs = filteredSigns,
          lang = lang,
          onStarToggle = { viewModel.toggleStarRoadSign(it) },
          onAskExpert = { title, content, type ->
            explainingItem = Triple(title, content, type)
            viewModel.askExpert(type, title, content, lang)
          }
        )
        2 -> FinesTab(
          fines = filteredFines,
          lang = lang,
          onAskExpert = { title, content, type ->
            explainingItem = Triple(title, content, type)
            viewModel.askExpert(type, title, content, lang)
          }
        )
        3 -> LawTab(
          rules = filteredLaw,
          lang = lang,
          onStarToggle = { viewModel.toggleStarRuleArticle(it) },
          onAskExpert = { title, content, type ->
            explainingItem = Triple(title, content, type)
            viewModel.askExpert(type, title, content, lang)
          }
        )
        4 -> VehicleKnowledgeTab(
          questions = filteredVehicleKnowledge,
          lang = lang,
          onToggleBookmark = { viewModel.toggleQuestionBookmark(it) },
          onAskExpert = { title, content, type ->
            explainingItem = Triple(title, content, type)
            viewModel.askExpert(type, title, content, lang)
          }
        )
        5 -> FavoritesTab(
          questions = filteredQuestions,
          signs = starredSigns,
          rules = starredRules,
          lang = lang,
          onToggleBookmark = { viewModel.toggleQuestionBookmark(it) },
          onToggleSignStar = { viewModel.toggleStarRoadSign(it) },
          onToggleRuleStar = { viewModel.toggleStarRuleArticle(it) }
        )
      }
    }

    if (explainingItem != null) {
      val (title, content, type) = explainingItem!!
      
      AlertDialog(
        onDismissRequest = { 
          explainingItem = null 
          viewModel.clearExpertState()
        },
        title = {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Icon(
              imageVector = Icons.Default.AutoAwesome,
              contentDescription = "Ask the Expert Icon",
              tint = MaterialTheme.colorScheme.primary,
              modifier = Modifier.size(24.dp)
            )
            Text(
              text = if (lang == "np") "विज्ञको सल्लाह (Ask Expert)" else "Ask the Expert",
              style = MaterialTheme.typography.titleLarge,
              fontWeight = FontWeight.ExtraBold
            )
          }
        },
        text = {
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .heightIn(max = 450.dp)
              .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            // Source Item Reference
            Card(
              shape = RoundedCornerShape(12.dp),
              colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
              modifier = Modifier.fillMaxWidth()
            ) {
              Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
              ) {
                Text(
                  text = type.uppercase(),
                  style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.sp),
                  color = MaterialTheme.colorScheme.primary,
                  fontWeight = FontWeight.Bold
                )
                Text(
                  text = title,
                  style = MaterialTheme.typography.titleSmall,
                  fontWeight = FontWeight.Bold,
                  color = MaterialTheme.colorScheme.onSurface
                )
              }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))

            if (expertLoading) {
              Column(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
              ) {
                CircularProgressIndicator(
                  color = MaterialTheme.colorScheme.primary,
                  strokeWidth = 3.dp
                )
                Text(
                  text = if (lang == "np") {
                    "नेपाल ट्राफिक नियम विज्ञसँग परामर्श गर्दै..."
                  } else {
                    "Consulting Nepalese Traffic Expert..."
                  },
                  style = MaterialTheme.typography.bodyMedium,
                  color = MaterialTheme.colorScheme.onSurfaceVariant,
                  fontWeight = FontWeight.SemiBold,
                  textAlign = TextAlign.Center
                )
              }
            } else if (expertError != null) {
              Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
              ) {
                Column(
                  modifier = Modifier.padding(16.dp),
                  verticalArrangement = Arrangement.spacedBy(10.dp),
                  horizontalAlignment = Alignment.CenterHorizontally
                ) {
                  Icon(
                    imageVector = Icons.Default.ErrorOutline,
                    contentDescription = "Error Icon",
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(32.dp)
                  )
                  Text(
                    text = expertError!!,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    textAlign = TextAlign.Center
                  )
                  Spacer(modifier = Modifier.height(4.dp))
                  Button(
                    onClick = { viewModel.askExpert(type, title, content, lang) },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                  ) {
                    Text(text = if (lang == "np") "पुनः प्रयास गर्नुहोस्" else "Retry")
                  }
                }
              }
            } else if (expertExplanation != null) {
              RenderMarkdownText(text = expertExplanation!!)
            }
          }
        },
        confirmButton = {
          Button(
            onClick = { 
              explainingItem = null 
              viewModel.clearExpertState()
            },
            shape = RoundedCornerShape(12.dp)
          ) {
            Text(text = if (lang == "np") "बन्द गर्नुहोस्" else "Close")
          }
        }
      )
    }
  }
  } // end PullToRefreshBox
}

@Composable
fun RenderMarkdownText(text: String, modifier: Modifier = Modifier) {
  val lines = text.split("\n")
  Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
    lines.forEach { line ->
      val trimmedLine = line.trim()
      if (trimmedLine.startsWith("-") || trimmedLine.startsWith("•") || trimmedLine.startsWith("*")) {
        // Bullet line
        val bulletContent = trimmedLine.substring(1).trim()
        Row(
          modifier = Modifier.fillMaxWidth().padding(start = 8.dp),
          verticalAlignment = Alignment.Top,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Text(text = "•", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
          Text(
            text = formatBoldText(bulletContent),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            lineHeight = 20.sp
          )
        }
      } else if (trimmedLine.startsWith("###")) {
        Text(
          text = formatBoldText(trimmedLine.removePrefix("###").trim()),
          style = MaterialTheme.typography.titleMedium,
          fontWeight = FontWeight.Bold,
          color = MaterialTheme.colorScheme.primary,
          modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
        )
      } else if (trimmedLine.startsWith("##")) {
        Text(
          text = formatBoldText(trimmedLine.removePrefix("##").trim()),
          style = MaterialTheme.typography.titleLarge,
          fontWeight = FontWeight.ExtraBold,
          color = MaterialTheme.colorScheme.primary,
          modifier = Modifier.padding(top = 10.dp, bottom = 6.dp)
        )
      } else {
        if (line.isNotBlank()) {
          Text(
            text = formatBoldText(line),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            lineHeight = 20.sp
          )
        }
      }
    }
  }
}

@Composable
fun formatBoldText(text: String): androidx.compose.ui.text.AnnotatedString {
  val parts = text.split("**")
  return androidx.compose.ui.text.buildAnnotatedString {
    parts.forEachIndexed { index, part ->
      if (index % 2 == 1) {
        withStyle(style = androidx.compose.ui.text.SpanStyle(fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)) {
          append(part)
        }
      } else {
        append(part)
      }
    }
  }
}

// RULES TAB
@Composable
fun RulesTab(
  rules: List<RuleArticle>,
  lang: String,
  onStarToggle: (RuleArticle) -> Unit,
  onAskExpert: (title: String, content: String, type: String) -> Unit
) {
  LazyColumn(
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
    modifier = Modifier.fillMaxSize()
  ) {
    items(rules) { article ->
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
            Text(
              text = article.getTitle(lang),
              style = MaterialTheme.typography.titleMedium,
              fontWeight = FontWeight.Bold,
              color = MaterialTheme.colorScheme.primary,
              modifier = Modifier.weight(1f)
            )

            IconButton(onClick = { onStarToggle(article) }) {
              Icon(
                imageVector = if (article.isStarred) Icons.Default.Star else Icons.Default.StarBorder,
                contentDescription = "Star Guide",
                tint = if (article.isStarred) Color(0xFFFFB74D) else MaterialTheme.colorScheme.onSurfaceVariant
              )
            }
          }

          HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))

          Text(
            text = article.getContent(lang),
            style = MaterialTheme.typography.bodyMedium,
            lineHeight = 22.sp,
            color = MaterialTheme.colorScheme.onSurface
          )

          Spacer(modifier = Modifier.height(4.dp))
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
          ) {
            OutlinedButton(
              onClick = { onAskExpert(article.getTitle(lang), article.getContent(lang), "Traffic Rule / कानून") },
              shape = RoundedCornerShape(12.dp),
              colors = ButtonDefaults.outlinedButtonColors(
                contentColor = MaterialTheme.colorScheme.primary
              ),
              modifier = Modifier.testTag("ask_expert_rule_${article.id}")
            ) {
              Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = "Ask the Expert",
                modifier = Modifier.size(16.dp)
              )
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = if (lang == "np") "विज्ञसँग सोध्नुहोस्" else "Ask the Expert",
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
              )
            }
          }
        }
      }
    }
  }
}

// SIGNS TAB (Beautiful flashcards!)
@Composable
fun SignsTab(
  signs: List<RoadSign>,
  lang: String,
  onStarToggle: (RoadSign) -> Unit,
  onAskExpert: (title: String, content: String, type: String) -> Unit
) {
  var selectedType by remember { mutableStateOf("All") }
  val types = listOf("All", "Mandatory", "Warning", "Informational")

  Column(
    modifier = Modifier.fillMaxSize()
  ) {
    // Type Filter Row
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 16.dp, vertical = 12.dp),
      horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      types.forEach { type ->
        val isSelected = selectedType == type
        val label = if (lang == "np") {
          when (type) {
            "All" -> "सबै"
            "Mandatory" -> "अनिवार्य"
            "Warning" -> "चेतावनी"
            "Informational" -> "सूचनात्मक"
            else -> type
          }
        } else type

        Box(
          modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(
              if (isSelected) MaterialTheme.colorScheme.primary
              else MaterialTheme.colorScheme.surfaceVariant
            )
            .clickable { selectedType = type }
            .padding(horizontal = 12.dp, vertical = 6.dp),
          contentAlignment = Alignment.Center
        ) {
          Text(
            text = label,
            style = MaterialTheme.typography.labelMedium.copy(
              fontWeight = FontWeight.Bold,
              color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
            )
          )
        }
      }
    }

    val filteredSigns = if (selectedType == "All") signs else signs.filter { it.type == selectedType }

    LazyVerticalGrid(
      columns = GridCells.Fixed(1),
      contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp),
      modifier = Modifier.fillMaxSize()
    ) {
      items(filteredSigns) { sign ->
        var isFlipped by remember { mutableStateOf(false) }

        Card(
          modifier = Modifier
            .fillMaxWidth()
            .clickable { isFlipped = !isFlipped },
          shape = RoundedCornerShape(20.dp),
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
          elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
          ) {
            // Always-visible star row at the top
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Badge(
                containerColor = when (sign.type) {
                  "Mandatory" -> Color(0xFFF1F3FE)
                  "Warning"   -> Color(0xFFFFF9E6)
                  else        -> Color(0xFFEAF9ED)
                }
              ) {
                Text(
                  text = if (lang == "np") {
                    when (sign.type) {
                      "Mandatory"     -> "अनिवार्य"
                      "Warning"       -> "चेतावनी"
                      else            -> "सूचना"
                    }
                  } else sign.type,
                  style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = when (sign.type) {
                      "Mandatory" -> Color(0xFF2F54EB)
                      "Warning"   -> Color(0xFFFAAD14)
                      else        -> Color(0xFF52C41A)
                    }
                  ),
                  modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
              }

              IconButton(
                onClick = { onStarToggle(sign) },
                modifier = Modifier.size(36.dp)
              ) {
                Icon(
                  imageVector = if (sign.isStarred) Icons.Default.Star else Icons.Default.StarBorder,
                  contentDescription = if (sign.isStarred) "Remove from favorites" else "Add to favorites",
                  tint = if (sign.isStarred) Color(0xFFFFB74D) else MaterialTheme.colorScheme.onSurfaceVariant
                )
              }
            }

            // Front / Back flip container
            Box(
              modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
              contentAlignment = Alignment.Center
            ) {
              if (!isFlipped) {
                // Front Side: Graphic and Name
                Column(
                  horizontalAlignment = Alignment.CenterHorizontally,
                  verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                  Box(
                    modifier = Modifier
                      .size(100.dp)
                      .background(Color.White, CircleShape)
                      .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f), CircleShape)
                      .padding(12.dp),
                    contentAlignment = Alignment.Center
                  ) {
                    RoadSignGraphic(iconName = sign.iconName, modifier = Modifier.fillMaxSize())
                  }

                  Text(
                    text = sign.getName(lang),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center
                  )

                  Text(
                    text = if (lang == "np") "विवरण हेर्न ट्याप गर्नुहोस्" else "Tap to view explanation",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.7f),
                    fontWeight = FontWeight.Bold
                  )
                }
              } else {
                // Back Side: Explanation & Memory Tip
                Column(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalAlignment = Alignment.Start,
                  verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                  ) {
                    Badge(
                      containerColor = when (sign.type) {
                        "Mandatory" -> Color(0xFFF1F3FE)
                        "Warning" -> Color(0xFFFFF9E6)
                        else -> Color(0xFFEAF9ED)
                      }
                    ) {
                      Text(
                        text = if (lang == "np") {
                          when (sign.type) {
                            "Mandatory" -> "अनिवार्य सङ्केत"
                            "Warning" -> "सचेतनामूलक सङ्केत"
                            else -> "सूचनात्मक सङ्केत"
                          }
                        } else sign.type,
                        style = MaterialTheme.typography.labelSmall.copy(
                          fontWeight = FontWeight.Bold,
                          color = when (sign.type) {
                            "Mandatory" -> Color(0xFF2F54EB)
                            "Warning" -> Color(0xFFFAAD14)
                            else -> Color(0xFF52C41A)
                          }
                        ),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                      )
                    }

                    IconButton(onClick = { onStarToggle(sign) }) {
                      Icon(
                        imageVector = if (sign.isStarred) Icons.Default.Star else Icons.Default.StarBorder,
                        contentDescription = "Star Sign",
                        tint = if (sign.isStarred) Color(0xFFFFB74D) else MaterialTheme.colorScheme.onSurfaceVariant
                      )
                    }
                  }

                  Text(
                    text = sign.getName(lang),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                  )

                  Text(
                    text = sign.getDescription(lang),
                    style = MaterialTheme.typography.bodyMedium,
                    lineHeight = 20.sp
                  )

                  Box(
                    modifier = Modifier
                      .fillMaxWidth()
                      .clip(RoundedCornerShape(12.dp))
                      .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
                      .padding(12.dp)
                  ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                      Text(
                        text = if (lang == "np") "सम्झने तरिका (Tip):" else "Memory Tip:",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.primary
                      )
                      Text(
                        text = sign.getMemoryTip(lang),
                        style = MaterialTheme.typography.bodySmall,
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                      )
                    }
                  }

                  Spacer(modifier = Modifier.height(4.dp))
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                  ) {
                    OutlinedButton(
                      onClick = { onAskExpert(sign.getName(lang), sign.getDescription(lang) + "\nMemory Tip: " + sign.getMemoryTip(lang), "Road Sign / सडक सङ्केत") },
                      shape = RoundedCornerShape(12.dp),
                      colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.primary
                      ),
                      modifier = Modifier.testTag("ask_expert_sign_${sign.id}")
                    ) {
                      Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = "Ask the Expert",
                        modifier = Modifier.size(16.dp)
                      )
                      Spacer(modifier = Modifier.width(6.dp))
                      Text(
                        text = if (lang == "np") "विज्ञसँग सोध्नुहोस्" else "Ask the Expert",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                      )
                    }
                  }

                  Text(
                    text = if (lang == "np") "सङ्केत हेर्न ट्याप गर्नुहोस्" else "Tap to view sign icon",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
                  )
                }
              }
            }
          }
        }
      }
    }
  }
}

// FINES TAB
@Composable
fun FinesTab(
  fines: List<FinePenalty>,
  lang: String,
  onAskExpert: (title: String, content: String, type: String) -> Unit
) {
  LazyColumn(
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
    modifier = Modifier.fillMaxSize()
  ) {
    items(fines) { fine ->
      Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
      ) {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            Column(modifier = Modifier.weight(1f)) {
              Text(
                text = fine.getOffense(lang),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
              )
              Text(
                text = fine.category,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 4.dp)
              )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Box(
              modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.errorContainer)
                .padding(horizontal = 10.dp, vertical = 6.dp),
              contentAlignment = Alignment.Center
            ) {
              Text(
                text = fine.fineAmount,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.ExtraBold,
                color = MaterialTheme.colorScheme.onErrorContainer,
                textAlign = TextAlign.Center
              )
            }
          }

          HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
          ) {
            OutlinedButton(
              onClick = { onAskExpert(fine.getOffense(lang), "Fine: " + fine.fineAmount + " | Category: " + fine.category, "Traffic Fine / जरिवाना") },
              shape = RoundedCornerShape(12.dp),
              colors = ButtonDefaults.outlinedButtonColors(
                contentColor = MaterialTheme.colorScheme.primary
              ),
              modifier = Modifier.testTag("ask_expert_fine_${fine.id}")
            ) {
              Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = "Ask the Expert",
                modifier = Modifier.size(16.dp)
              )
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = if (lang == "np") "विज्ञसँग सोध्नुहोस्" else "Ask the Expert",
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
              )
            }
          }
        }
      }
    }
  }
}

// LAW TAB
@Composable
fun LawTab(
  rules: List<RuleArticle>,
  lang: String,
  onStarToggle: (RuleArticle) -> Unit,
  onAskExpert: (title: String, content: String, type: String) -> Unit
) {
  if (rules.isEmpty()) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
      Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Icon(imageVector = Icons.Default.Gavel, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f), modifier = Modifier.size(48.dp))
        Text(text = if (lang == "np") "कुनै कानून सामग्री फेला परेन" else "No law content found.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
      }
    }
    return
  }
  LazyColumn(
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
    modifier = Modifier.fillMaxSize()
  ) {
    items(rules) { article ->
      Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
      ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(8.dp),
              modifier = Modifier.weight(1f)
            ) {
              Icon(imageVector = Icons.Default.Gavel, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
              Text(text = article.getTitle(lang), style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            }
            IconButton(onClick = { onStarToggle(article) }, modifier = Modifier.size(36.dp)) {
              Icon(
                imageVector = if (article.isStarred) Icons.Default.Star else Icons.Default.StarBorder,
                contentDescription = "Star",
                tint = if (article.isStarred) Color(0xFFFFB74D) else MaterialTheme.colorScheme.onSurfaceVariant
              )
            }
          }
          // Topic badge
          Box(
            modifier = Modifier
              .clip(RoundedCornerShape(6.dp))
              .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f))
              .padding(horizontal = 8.dp, vertical = 3.dp)
          ) {
            Text(text = article.topic.replace("_", " ").replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
          }
          HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
          Text(text = article.getContent(lang), style = MaterialTheme.typography.bodySmall, lineHeight = 20.sp, color = MaterialTheme.colorScheme.onSurface)
          Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            OutlinedButton(
              onClick = { onAskExpert(article.getTitle(lang), article.getContent(lang), "Law / कानून") },
              shape = RoundedCornerShape(12.dp),
              colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary)
            ) {
              Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp))
              Spacer(modifier = Modifier.width(6.dp))
              Text(text = if (lang == "np") "विज्ञसँग सोध्नुहोस्" else "Ask the Expert", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
            }
          }
        }
      }
    }
  }
}

// VEHICLE KNOWLEDGE TAB
@Composable
fun VehicleKnowledgeTab(
  questions: List<Question>,
  lang: String,
  onToggleBookmark: (Int) -> Unit,
  onAskExpert: (title: String, content: String, type: String) -> Unit
) {
  if (questions.isEmpty()) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
      Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Icon(imageVector = Icons.Default.DirectionsCar, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f), modifier = Modifier.size(48.dp))
        Text(text = if (lang == "np") "सवारी ज्ञान प्रश्नहरू फेला परेनन्" else "No Vehicle Knowledge questions found.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
      }
    }
    return
  }
  LazyColumn(
    contentPadding = PaddingValues(16.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp),
    modifier = Modifier.fillMaxSize()
  ) {
    items(questions, key = { it.id }) { question ->
      var isExpanded by remember { mutableStateOf(false) }
      val options = question.getOptions(lang)
      Card(
        modifier = Modifier
          .fillMaxWidth()
          .clickable { isExpanded = !isExpanded },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
      ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
          ) {
            Row(
              horizontalArrangement = Arrangement.spacedBy(6.dp),
              verticalAlignment = Alignment.CenterVertically,
              modifier = Modifier.weight(1f)
            ) {
              Icon(imageVector = Icons.Default.Build, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(16.dp))
              val diffColor = when (question.difficulty) { "Easy" -> Color(0xFF52C41A); "Medium" -> Color(0xFFFAAD14); else -> Color(0xFFF5222D) }
              Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(diffColor.copy(alpha = 0.1f)).padding(horizontal = 6.dp, vertical = 3.dp)) {
                Text(text = if (lang == "np") when (question.difficulty) { "Easy" -> "सजिलो"; "Medium" -> "मध्यम"; else -> "कठिन" } else question.difficulty, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, color = diffColor))
              }
            }
            IconButton(onClick = { onToggleBookmark(question.id) }, modifier = Modifier.size(36.dp)) {
              Icon(
                imageVector = if (question.isBookmarked) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                contentDescription = "Bookmark",
                tint = if (question.isBookmarked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
              )
            }
          }
          Text(text = question.getQuestion(lang), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
          if (!isExpanded) {
            Text(text = if (lang == "np") "उत्तर हेर्न ट्याप गर्नुहोस्" else "Tap to see answer", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.primary)
          }
          AnimatedVisibility(visible = isExpanded, enter = expandVertically() + fadeIn(), exit = shrinkVertically() + fadeOut()) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
              HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))
              options.forEachIndexed { idx, option ->
                val isCorrect = idx == question.correctOptionIndex
                Row(
                  modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp))
                    .background(if (isCorrect) Color(0xFFEAF9ED) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f))
                    .border(1.dp, if (isCorrect) Color(0xFF52C41A) else Color.Transparent, RoundedCornerShape(8.dp))
                    .padding(10.dp),
                  horizontalArrangement = Arrangement.spacedBy(8.dp),
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Box(modifier = Modifier.size(22.dp).background(if (isCorrect) Color(0xFF52C41A) else MaterialTheme.colorScheme.surfaceVariant, CircleShape), contentAlignment = Alignment.Center) {
                    if (isCorrect) Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                    else Text(text = (idx + 1).toString(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                  }
                  Text(text = option, style = MaterialTheme.typography.bodySmall.copy(fontWeight = if (isCorrect) FontWeight.Bold else FontWeight.Normal), color = if (isCorrect) Color(0xFF1B5E20) else MaterialTheme.colorScheme.onSurface)
                }
              }
              Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(MaterialTheme.colorScheme.primary.copy(alpha = 0.05f)).padding(12.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                  Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(imageVector = Icons.Default.Build, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(14.dp))
                    Text(text = if (lang == "np") "सवारी ज्ञान:" else "Vehicle Knowledge:", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.secondary)
                  }
                  Text(text = question.getExplanation(lang), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, lineHeight = 18.sp)
                }
              }
              Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                OutlinedButton(
                  onClick = { onAskExpert(question.getQuestion(lang), question.getExplanation(lang), "Vehicle Knowledge / सवारी ज्ञान") },
                  shape = RoundedCornerShape(10.dp),
                  colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.secondary)
                ) {
                  Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(14.dp))
                  Spacer(modifier = Modifier.width(4.dp))
                  Text(text = if (lang == "np") "विज्ञसँग सोध्नुहोस्" else "Ask the Expert", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold))
                }
              }
            }
          }
        }
      }
    }
  }
}

// Custom Road Sign Canvas Vector Graphics!
@Composable
fun RoadSignGraphic(
  iconName: String,
  modifier: Modifier = Modifier
) {
  val defaultCircleColor = MaterialTheme.colorScheme.primary
  Canvas(modifier = modifier) {
    val center = Offset(size.width / 2, size.height / 2)
    val radius = size.minDimension / 2

    when (iconName) {
      "sign_stop" -> {
        // Red Octagon for STOP
        val path = Path()
        val sides = 8
        val r = radius - 2
        for (i in 0 until sides) {
          val angle = Math.toRadians((i * 360.0 / sides) + 22.5)
          val x = center.x + r * cos(angle).toFloat()
          val y = center.y + r * sin(angle).toFloat()
          if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        path.close()
        drawPath(path, Color(0xFFD32F2F))

        // White octagon border inner
        val innerPath = Path()
        val ir = r - 4
        for (i in 0 until sides) {
          val angle = Math.toRadians((i * 360.0 / sides) + 22.5)
          val x = center.x + ir * cos(angle).toFloat()
          val y = center.y + ir * sin(angle).toFloat()
          if (i == 0) innerPath.moveTo(x, y) else innerPath.lineTo(x, y)
        }
        innerPath.close()
        drawPath(innerPath, Color.White, style = Stroke(width = 3.dp.toPx()))
      }

      "sign_no_entry" -> {
        // Red circle with white horizontal bar
        drawCircle(color = Color(0xFFD32F2F), radius = radius - 2)
        val barHeight = radius * 0.3f
        val barWidth = radius * 1.5f
        drawRect(
          color = Color.White,
          topLeft = Offset(center.x - barWidth / 2, center.y - barHeight / 2),
          size = androidx.compose.ui.geometry.Size(barWidth, barHeight)
        )
      }

      "sign_speed_limit_40" -> {
        // White circle, red border, black text "40"
        drawCircle(color = Color.White, radius = radius - 2)
        drawCircle(color = Color(0xFFD32F2F), radius = radius - 4, style = Stroke(width = 8.dp.toPx()))

        // Drawing a black inner cross or circle to mimic numbers simplified
        drawCircle(color = Color.Black, radius = radius * 0.4f, style = Stroke(width = 4.dp.toPx()))
      }

      "sign_no_overtaking" -> {
        // Red circle, slash inside with indicators
        drawCircle(color = Color.White, radius = radius - 2)
        drawCircle(color = Color(0xFFD32F2F), radius = radius - 4, style = Stroke(width = 8.dp.toPx()))

        // Draw a diagonal red slash
        drawLine(
          color = Color(0xFFD32F2F),
          start = Offset(center.x - radius * 0.7f, center.y + radius * 0.7f),
          end = Offset(center.x + radius * 0.7f, center.y - radius * 0.7f),
          strokeWidth = 6.dp.toPx()
        )
      }

      "sign_school" -> {
        // Warning: Yellow triangle, black icons
        val path = Path().apply {
          moveTo(center.x, center.y - radius)
          lineTo(center.x - radius, center.y + radius)
          lineTo(center.x + radius, center.y + radius)
          close()
        }
        drawPath(path, Color(0xFFFFD54F))
        drawPath(path, Color(0xFFD32F2F), style = Stroke(width = 6.dp.toPx()))

        // Simplified child icon drawing
        drawCircle(color = Color.Black, radius = radius * 0.15f, center = Offset(center.x, center.y - radius * 0.1f))
        drawRect(color = Color.Black, topLeft = Offset(center.x - radius * 0.1f, center.y), size = androidx.compose.ui.geometry.Size(radius * 0.2f, radius * 0.4f))
      }

      "sign_zebra" -> {
        // Yellow triangle, white/black zebra horizontal bars
        val path = Path().apply {
          moveTo(center.x, center.y - radius)
          lineTo(center.x - radius, center.y + radius)
          lineTo(center.x + radius, center.y + radius)
          close()
        }
        drawPath(path, Color(0xFFFFD54F))
        drawPath(path, Color(0xFFD32F2F), style = Stroke(width = 6.dp.toPx()))

        // Zebra lines inside
        val lineY = center.y + radius * 0.4f
        for (i in 0..3) {
          drawRect(
            color = Color.Black,
            topLeft = Offset(center.x - radius * 0.4f + (i * radius * 0.25f), lineY - 4.dp.toPx()),
            size = androidx.compose.ui.geometry.Size(radius * 0.15f, 8.dp.toPx())
          )
        }
      }

      "sign_slippery" -> {
        // Yellow triangle, skidding tire prints
        val path = Path().apply {
          moveTo(center.x, center.y - radius)
          lineTo(center.x - radius, center.y + radius)
          lineTo(center.x + radius, center.y + radius)
          close()
        }
        drawPath(path, Color(0xFFFFD54F))
        drawPath(path, Color(0xFFD32F2F), style = Stroke(width = 6.dp.toPx()))

        // Skidding wave path
        drawLine(color = Color.Black, start = Offset(center.x - radius * 0.3f, center.y + radius * 0.5f), end = Offset(center.x, center.y + radius * 0.3f), strokeWidth = 3.dp.toPx())
        drawLine(color = Color.Black, start = Offset(center.x, center.y + radius * 0.3f), end = Offset(center.x + radius * 0.3f, center.y + radius * 0.5f), strokeWidth = 3.dp.toPx())
      }

      "sign_hospital" -> {
        // Blue square, white cross
        drawRect(color = Color(0xFF1976D2), topLeft = Offset(center.x - radius, center.y - radius), size = androidx.compose.ui.geometry.Size(radius * 2, radius * 2))

        val crossWidth = radius * 0.25f
        val crossLength = radius * 1.1f
        // Vertical bar
        drawRect(
          color = Color.White,
          topLeft = Offset(center.x - crossWidth / 2, center.y - crossLength / 2),
          size = androidx.compose.ui.geometry.Size(crossWidth, crossLength)
        )
        // Horizontal bar
        drawRect(
          color = Color.White,
          topLeft = Offset(center.x - crossLength / 2, center.y - crossWidth / 2),
          size = androidx.compose.ui.geometry.Size(crossLength, crossWidth)
        )
      }

      else -> {
        // Default circle
        drawCircle(color = defaultCircleColor, radius = radius - 4, style = Stroke(width = 4.dp.toPx()))
      }
    }
  }
}

@Composable
fun FavoritesTab(
  questions: List<Question>,
  signs: List<RoadSign>,
  rules: List<RuleArticle>,
  lang: String,
  onToggleBookmark: (Int) -> Unit,
  onToggleSignStar: (RoadSign) -> Unit,
  onToggleRuleStar: (RuleArticle) -> Unit
) {
  val totalFavorites = questions.size + signs.size + rules.size

  if (totalFavorites == 0) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(32.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center
    ) {
      Box(
        modifier = Modifier
          .size(72.dp)
          .clip(CircleShape)
          .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)),
        contentAlignment = Alignment.Center
      ) {
        Icon(
          imageVector = Icons.Default.BookmarkBorder,
          contentDescription = null,
          tint = MaterialTheme.colorScheme.primary,
          modifier = Modifier.size(36.dp)
        )
      }
      
      Spacer(modifier = Modifier.height(16.dp))
      
      Text(
        text = if (lang == "np") "कुनै पनि मनपर्ने प्रश्नहरू छैनन्" else "No Bookmarks Yet",
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.onBackground
      )
      
      Spacer(modifier = Modifier.height(8.dp))
      
      Text(
        text = if (lang == "np") {
          "अभ्यास वा नमुना परीक्षा गर्दा कठिन प्रश्नहरूलाई यहाँ पुनरावलोकनका लागि सुरक्षित गर्नुहोस्।"
        } else {
          "Bookmark difficult questions during practice sessions or mock exams to review them here later."
        },
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center
      )
    }
  } else {
    LazyColumn(
      contentPadding = PaddingValues(16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
      modifier = Modifier.fillMaxSize()
    ) {
      // ── Section: Starred Rule Articles ───────────────────────────────
      if (rules.isNotEmpty()) {
        item {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(bottom = 4.dp)
          ) {
            Icon(
              imageVector = Icons.Default.MenuBook,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.primary,
              modifier = Modifier.size(18.dp)
            )
            Text(
              text = if (lang == "np") "ट्राफिक नियमहरू" else "Traffic Rules",
              style = MaterialTheme.typography.titleSmall,
              fontWeight = FontWeight.ExtraBold,
              color = MaterialTheme.colorScheme.onBackground
            )
          }
        }
        items(rules, key = { "rule_${it.id}" }) { article ->
          Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
          ) {
            Column(
              modifier = Modifier.padding(16.dp),
              verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
              ) {
                Text(
                  text = article.getTitle(lang),
                  style = MaterialTheme.typography.titleSmall,
                  fontWeight = FontWeight.Bold,
                  color = MaterialTheme.colorScheme.primary,
                  modifier = Modifier.weight(1f)
                )
                IconButton(
                  onClick = { onToggleRuleStar(article) },
                  modifier = Modifier.size(36.dp)
                ) {
                  Icon(
                    imageVector = Icons.Default.Star,
                    contentDescription = "Remove from favorites",
                    tint = Color(0xFFFFB74D),
                    modifier = Modifier.size(20.dp)
                  )
                }
              }
              HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
              Text(
                text = article.getContent(lang),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface,
                lineHeight = 20.sp
              )
            }
          }
        }
        item { Spacer(modifier = Modifier.height(4.dp)) }
      }

      // ── Section: Starred Road Signs ───────────────────────────────────
      if (signs.isNotEmpty()) {
        item {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(bottom = 4.dp)
          ) {
            Icon(
              imageVector = Icons.Default.AltRoute,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.primary,
              modifier = Modifier.size(18.dp)
            )
            Text(
              text = if (lang == "np") "सडक सङ्केतहरू" else "Road Signs",
              style = MaterialTheme.typography.titleSmall,
              fontWeight = FontWeight.ExtraBold,
              color = MaterialTheme.colorScheme.onBackground
            )
          }
        }
        items(signs, key = { "sign_${it.id}" }) { sign ->
          Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
          ) {
            Row(
              modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
              horizontalArrangement = Arrangement.spacedBy(12.dp),
              verticalAlignment = Alignment.CenterVertically
            ) {
              // Sign graphic
              Box(
                modifier = Modifier
                  .size(56.dp)
                  .background(Color.White, CircleShape)
                  .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f), CircleShape)
                  .padding(8.dp),
                contentAlignment = Alignment.Center
              ) {
                RoadSignGraphic(iconName = sign.iconName, modifier = Modifier.fillMaxSize())
              }
              Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                  text = sign.getName(lang),
                  style = MaterialTheme.typography.bodyMedium,
                  fontWeight = FontWeight.Bold,
                  color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                  text = sign.getDescription(lang),
                  style = MaterialTheme.typography.bodySmall,
                  color = MaterialTheme.colorScheme.onSurfaceVariant,
                  maxLines = 2
                )
              }
              IconButton(
                onClick = { onToggleSignStar(sign) },
                modifier = Modifier.size(36.dp)
              ) {
                Icon(
                  imageVector = Icons.Default.Star,
                  contentDescription = "Remove from favorites",
                  tint = Color(0xFFFFB74D),
                  modifier = Modifier.size(20.dp)
                )
              }
            }
          }
        }
        item { Spacer(modifier = Modifier.height(4.dp)) }
      }

      // ── Section: Bookmarked Questions ─────────────────────────────────
      if (questions.isNotEmpty()) {
        item {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(bottom = 4.dp)
          ) {
            Icon(
              imageVector = Icons.Default.Bookmark,
              contentDescription = null,
              tint = MaterialTheme.colorScheme.primary,
              modifier = Modifier.size(18.dp)
            )
            Text(
              text = if (lang == "np") "सुरक्षित प्रश्नहरू" else "Bookmarked Questions",
              style = MaterialTheme.typography.titleSmall,
              fontWeight = FontWeight.ExtraBold,
              color = MaterialTheme.colorScheme.onBackground
            )
          }
        }
      }
      items(questions, key = { it.id }) { question ->
        var isExpanded by remember { mutableStateOf(false) }
        val options = question.getOptions(lang)

        Card(
          modifier = Modifier
            .fillMaxWidth()
            .clickable { isExpanded = !isExpanded }
            .testTag("favorite_question_card_${question.id}"),
          shape = RoundedCornerShape(16.dp),
          colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
        ) {
          Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
          ) {
            // Header Row: Topic & Category with Bookmarks Star/Icon
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
              ) {
                // Category Chip
                SuggestionChip(
                  onClick = { },
                  label = {
                    Text(
                      text = if (question.categoryId == "ALL") {
                        if (lang == "np") "सबै वर्ग" else "All Cats"
                      } else {
                        "${if (lang == "np") "वर्ग" else "Cat"} ${question.categoryId}"
                      },
                      style = MaterialTheme.typography.labelSmall
                    )
                  }
                )

                // Difficulty Chip
                val diffColor = when (question.difficulty) {
                  "Easy" -> Color(0xFF52C41A)
                  "Medium" -> Color(0xFFFAAD14)
                  else -> Color(0xFFF5222D)
                }
                
                Box(
                  modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(diffColor.copy(alpha = 0.1f))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                  Text(
                    text = if (lang == "np") {
                      when (question.difficulty) {
                        "Easy" -> "सजिलो"
                        "Medium" -> "मध्यम"
                        else -> "कठिन"
                      }
                    } else question.difficulty,
                    style = MaterialTheme.typography.labelSmall.copy(
                      fontWeight = FontWeight.Bold,
                      color = diffColor
                    )
                  )
                }
              }

              IconButton(
                onClick = { onToggleBookmark(question.id) },
                modifier = Modifier.size(36.dp).testTag("fav_unbookmark_btn_${question.id}")
              ) {
                Icon(
                  imageVector = Icons.Default.Bookmark,
                  contentDescription = "Remove Bookmark",
                  tint = MaterialTheme.colorScheme.primary,
                  modifier = Modifier.size(22.dp)
                )
              }
            }

            // Question text
            Text(
              text = question.getQuestion(lang),
              style = MaterialTheme.typography.bodyLarge,
              fontWeight = FontWeight.Bold,
              color = MaterialTheme.colorScheme.onSurface
            )

            // Reveal prompt
            if (!isExpanded) {
              Text(
                text = if (lang == "np") "उत्तर र व्याख्या हेर्न ट्याप गर्नुहोस्" else "Tap to reveal answer & explanation",
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(top = 4.dp)
              )
            }

            // Expanded content (Options, explanation, sign icon if exists)
            AnimatedVisibility(
              visible = isExpanded,
              enter = expandVertically() + fadeIn(),
              exit = shrinkVertically() + fadeOut()
            ) {
              Column(
                modifier = Modifier.padding(top = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
              ) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))

                if (question.imageRef != null) {
                  Box(
                    modifier = Modifier
                      .align(Alignment.CenterHorizontally)
                      .size(80.dp)
                      .background(Color.White, CircleShape)
                      .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f), CircleShape)
                      .padding(8.dp),
                    contentAlignment = Alignment.Center
                  ) {
                    RoadSignGraphic(iconName = question.imageRef, modifier = Modifier.fillMaxSize())
                  }
                }

                // Options List
                Column(
                  verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                  options.forEachIndexed { idx, option ->
                    val isCorrect = idx == question.correctOptionIndex
                    val optionBg = if (isCorrect) Color(0xFFEAF9ED) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)
                    val optionBorderColor = if (isCorrect) Color(0xFF52C41A) else Color.Transparent
                    val optionTextColor = if (isCorrect) Color(0xFF1B5E20) else MaterialTheme.colorScheme.onSurface

                    Row(
                      modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(optionBg)
                        .border(1.dp, optionBorderColor, RoundedCornerShape(10.dp))
                        .padding(10.dp),
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                      Box(
                        modifier = Modifier
                          .size(24.dp)
                          .background(if (isCorrect) Color(0xFF52C41A) else MaterialTheme.colorScheme.surfaceVariant, CircleShape),
                        contentAlignment = Alignment.Center
                      ) {
                        if (isCorrect) {
                          Icon(imageVector = Icons.Default.Check, contentDescription = "Correct", tint = Color.White, modifier = Modifier.size(14.dp))
                        } else {
                          Text(text = (idx + 1).toString(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                      }

                      Text(
                        text = option,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = if (isCorrect) FontWeight.Bold else FontWeight.Normal),
                        color = optionTextColor
                      )
                    }
                  }
                }

                // Explanation Block
                Box(
                  modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.05f))
                    .padding(12.dp)
                ) {
                  Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                      Icon(imageVector = Icons.Default.Info, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                      Text(
                        text = if (lang == "np") "उत्तर स्पष्टीकरण:" else "Explanation Guide:",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.primary
                      )
                    }
                    Text(
                      text = question.getExplanation(lang),
                      style = MaterialTheme.typography.bodySmall,
                      color = MaterialTheme.colorScheme.onSurfaceVariant,
                      lineHeight = 18.sp
                    )
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
