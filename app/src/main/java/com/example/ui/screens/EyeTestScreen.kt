package com.example.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import coil.compose.rememberAsyncImagePainter
import com.example.ui.viewmodel.LicenseSathiViewModel

data class IshiharaPlate(val id: Int, val url: String, val answer: String)

val plates = listOf(
    IshiharaPlate(1, "https://upload.wikimedia.org/wikipedia/commons/e/e0/Ishihara_9.png", "74"),
    IshiharaPlate(2, "https://upload.wikimedia.org/wikipedia/commons/1/1a/Ishihara_11.PNG", "6"),
    IshiharaPlate(3, "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Ishihara_23.PNG/300px-Ishihara_23.PNG", "42")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EyeTestScreen(
    viewModel: LicenseSathiViewModel,
    onNavigateBack: () -> Unit
) {
    val lang by viewModel.activeLanguage.collectAsState()
    var currentPlateIndex by remember { mutableStateOf(0) }
    var input by remember { mutableStateOf("") }
    var score by remember { mutableStateOf(0) }
    var testFinished by remember { mutableStateOf(false) }
    var testStarted by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (lang == "np") "आँखा परीक्षण" else "Eye Test") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (!testStarted) {
                Spacer(modifier = Modifier.height(32.dp))
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    modifier = Modifier.size(80.dp),
                    tint = Color(0xFF10B981) // Emerald
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = if (lang == "np") "कलर ब्लाइन्डनेस परीक्षण" else "Color Blindness Test",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = if (lang == "np") "यस परीक्षणमा तपाईंलाई केही रङ्गिन चित्रहरू देखाइनेछन् जसमा अङ्कहरू लुकेका छन्। कृपया आफूले देखेको अङ्क प्रविष्ट गर्नुहोस्।" else "In this test, you will be shown colored plates with hidden numbers. Enter the number you see to verify your color vision.",
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(32.dp))
                Button(
                    onClick = { testStarted = true },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text(if (lang == "np") "परीक्षण सुरु गर्नुहोस्" else "Begin Test", fontSize = MaterialTheme.typography.titleMedium.fontSize)
                }
            } else if (testFinished) {
                val passed = score == plates.size
                Spacer(modifier = Modifier.height(32.dp))
                Icon(
                    imageVector = if (passed) Icons.Default.CheckCircle else Icons.Default.Error,
                    contentDescription = null,
                    modifier = Modifier.size(100.dp),
                    tint = if (passed) Color(0xFF10B981) else Color(0xFFEF4444)
                )
                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    text = if (passed) (if (lang == "np") "तपाईं उत्तीर्ण हुनुभयो!" else "Vision Test Passed!") 
                           else (if (lang == "np") "परीक्षण असफल भयो" else "Vision Test Failed"),
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = if (lang == "np") "तपाईंले $score/${plates.size} अङ्क प्राप्त गर्नुभयो।" else "You scored $score out of ${plates.size}.",
                    style = MaterialTheme.typography.titleLarge
                )
                if (!passed) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = if (lang == "np") "तपाईंलाई कलर भिजनको समस्या हुन सक्छ। कृपया आँखा विशेषज्ञलाई भेट्नुहोस्।" else "You might have color vision deficiency. Please consult an eye specialist.",
                        color = Color(0xFFEF4444),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(horizontal = 16.dp)
                    )
                }
                Spacer(modifier = Modifier.height(32.dp))
                OutlinedButton(
                    onClick = {
                        currentPlateIndex = 0
                        input = ""
                        score = 0
                        testFinished = false
                        testStarted = false
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp)
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.padding(end = 8.dp))
                    Text(if (lang == "np") "पुनः प्रयास गर्नुहोस्" else "Retake Test")
                }
            } else {
                Text(
                    text = if (lang == "np") "चित्र ${currentPlateIndex + 1} / ${plates.size}" else "Plate ${currentPlateIndex + 1} of ${plates.size}",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(24.dp))
                
                Box(
                    modifier = Modifier
                        .size(250.dp)
                        .clip(CircleShape)
                        .background(Color.LightGray)
                ) {
                    Image(
                        painter = rememberAsyncImagePainter(plates[currentPlateIndex].url),
                        contentDescription = "Ishihara Plate",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                
                Spacer(modifier = Modifier.height(32.dp))
                Text(
                    text = if (lang == "np") "तपाईं कुन अङ्क देख्दै हुनुहुन्छ?" else "What number do you see?",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = input,
                    onValueChange = { if (it.length <= 3) input = it },
                    singleLine = true,
                    textStyle = LocalTextStyle.current.copy(
                        textAlign = TextAlign.Center, 
                        fontSize = MaterialTheme.typography.headlineMedium.fontSize
                    ),
                    modifier = Modifier.width(150.dp),
                    shape = RoundedCornerShape(16.dp)
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Button(
                    onClick = {
                        if (input.trim() == plates[currentPlateIndex].answer) {
                            score++
                        }
                        if (currentPlateIndex < plates.size - 1) {
                            currentPlateIndex++
                            input = ""
                        } else {
                            testFinished = true
                        }
                    },
                    enabled = input.isNotBlank(),
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text(if (lang == "np") "बुझाउनुहोस्" else "Submit", fontSize = MaterialTheme.typography.titleMedium.fontSize)
                }
            }
        }
    }
}
