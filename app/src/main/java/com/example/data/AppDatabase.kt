package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
  entities = [
    Category::class,
    Question::class,
    RoadSign::class,
    RuleArticle::class,
    FinePenalty::class,
    UserProgress::class,
    Attempt::class,
    Badge::class
  ],
  version = 5,
  exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
  abstract fun appDao(): AppDao

  companion object {
    @Volatile
    private var INSTANCE: AppDatabase? = null

    fun getDatabase(context: Context, scope: CoroutineScope): AppDatabase {
      return INSTANCE ?: synchronized(this) {
        val callback = AppDatabaseCallback(scope)
        val instance = Room.databaseBuilder(
          context.applicationContext,
          AppDatabase::class.java,
          "license_sathi_database"
        )
        .fallbackToDestructiveMigration()
        .addCallback(callback)
        .build()
        INSTANCE = instance
        callback.database = instance  // Provide the reference BEFORE build triggers onCreate
        instance
      }
    }
  }

  private class AppDatabaseCallback(
    private val scope: CoroutineScope
  ) : RoomDatabase.Callback() {
    // Assigned right after build() so onCreate (which fires async) will see a non-null reference
    var database: AppDatabase? = null

    override fun onCreate(db: SupportSQLiteDatabase) {
      super.onCreate(db)
      val appDb = database ?: INSTANCE  // fallback to INSTANCE in case of async timing
      appDb?.let { safeDb ->
        scope.launch(Dispatchers.IO) {
          val dao = safeDb.appDao()
          populateInitialData(dao)
        }
      }
    }

    private suspend fun populateInitialData(dao: AppDao) {
      // 1. Categories
      val categories = listOf(
        Category(
          id = "A",
          nameNp = "वर्ग क (मोटरसाइकल / स्कुटर)",
          nameEn = "Category A (Motorcycle / Scooter)",
          icon = "motorcycle",
          questionCount = 20,
          timeLimitMinutes = 30,
          passMark = 80 // 16 correct out of 20
        ),
        Category(
          id = "B",
          nameNp = "वर्ग ख (कार / जिप / भ्यान)",
          nameEn = "Category B (Car / Jeep / Van)",
          icon = "directions_car",
          questionCount = 20,
          timeLimitMinutes = 30,
          passMark = 80 // 16 correct out of 20
        )
      )
      dao.insertCategories(categories)

      // 2. Badges
      val badges = listOf(
        Badge("streak_3", "३-दिने सक्रियता", "3-Day Streak", "Keep practicing for 3 consecutive days", "local_fire_department"),
        Badge("streak_7", "७-दिने सक्रियता", "7-Day Streak", "Keep practicing for 7 consecutive days", "local_fire_department"),
        Badge("sign_master", "सडक सङ्केत ज्ञाता", "Road Sign Master", "Score 100% in any Road Signs quiz", "verified"),
        Badge("mock_pass", "पहिलो परीक्षा उत्तीर्ण", "First Mock Pass", "Pass your first full timed mock exam", "emoji_events"),
        Badge("cat_a_ready", "दुई-पाङ्ग्रे तयारी", "Cat A Ready", "Achieve Exam-Ready level in Category A", "motorcycle"),
        Badge("cat_b_ready", "चार-पाङ्ग्रे तयारी", "Cat B Ready", "Achieve Exam-Ready level in Category B", "directions_car")
      )
      dao.insertBadges(badges)

      // 3. User Progress Default
      dao.saveUserProgress(
        UserProgress(
          id = 1,
          name = "Nabin",
          selectedCategory = "A",
          selectedLanguage = "np",
          points = 0,
          streakCount = 1,
          lastActiveDateStr = "",
          hasOnboarded = false,
          phoneNumber = null,
          email = null,
          jwtToken = null,
          isLoggedIn = false,
          categoryPreferences = "A"
        )
      )

      // 4. Rule Articles
      val articles = listOf(
        RuleArticle(
          topic = "general",
          titleNp = "सामान्य ट्राफिक नियमहरू",
          titleEn = "General Traffic Rules",
          contentNp = "१. सधैं बायाँ तर्फबाट सवारी चलाउनुहोस्।\n२. ओभरटेक गर्दा दाहिने तर्फबाट मात्र गर्नुहोस्।\n३. घुम्तीमा गति कम गर्नुहोस् र हर्नको उचित प्रयोग गर्नुहोस्।\n४. जेब्रा क्रसिङमा पैदलयात्रीलाई प्राथमिकता दिनुहोस्।\n५. सवारी चलाउँदा मोबाइल फोन प्रयोग नगर्नुहोस्।",
          contentEn = "1. Always drive on the left side of the road.\n2. Overtake from the right side only.\n3. Reduce speed on curves and use the horn appropriately.\n4. Give priority to pedestrians at zebra crossings.\n5. Do not use mobile phones while driving.",
          categoryId = "ALL"
        ),
        RuleArticle(
          topic = "drink_driving",
          titleNp = "मापसे (मदिरा सेवन) सम्बन्धी कानुन",
          titleEn = "Drink Driving Regulations (DUI)",
          contentNp = "१. नेपालमा मापसे गरेर सवारी चलाउन पूर्ण प्रतिबन्ध छ।\n२. मापसे गरेको पाइएमा रु. १,००० जरिवाना र सवारी अनुमति पत्रमा प्वाल पारिनेछ।\n३. लाइसेन्समा पाँच पटक प्वाल परेमा लाइसेन्स खारेज हुन सक्छ।\n४. मापसे चेकिङमा प्रहरीलाई सहयोग नगर्नु पनि सजाय योग्य हुनेछ।",
          contentEn = "1. Driving under the influence of alcohol is completely banned in Nepal.\n2. Violators face Rs. 1,000 fine and a hole punched in their licence.\n3. Accumulating 5 holes on the licence can lead to licence cancellation.\n4. Refusing to cooperate in alcohol checks is also punishable by law.",
          categoryId = "ALL"
        ),
        RuleArticle(
          topic = "right_of_way",
          titleNp = "बाटोको प्राथमिकता (Right of Way)",
          titleEn = "Right of Way Guidelines",
          contentNp = "१. उकालो आउँदै गरेको सवारी साधनलाई ओरालो गइरहेको सवारी साधनले बाटो छोड्नुपर्छ।\n२. चौबाटोमा दायाँ तर्फबाट आउने सवारी साधनलाई प्राथमिकता दिनुपर्छ।\n३. मुख्य सडकमा प्रवेश गर्दा मुख्य सडकका सवारीलाई प्राथमिकता दिनुहोस्।\n४. आपतकालीन सवारी (एम्बुलेन्स, दमकल) लाई तुरुन्त बाटो दिनुहोस्।",
          contentEn = "1. Vehicles going downhill must yield way to vehicles climbing uphill.\n2. At intersections, priority must be given to vehicles coming from the right.\n3. Vehicles entering a main road must yield to vehicles already on it.\n4. Always yield immediate right of way to emergency vehicles like ambulances and fire engines.",
          categoryId = "ALL"
        ),
        RuleArticle(
          topic = "two_wheeler",
          titleNp = "मोटरसाइकल चालकका लागि विशेष नियम",
          titleEn = "Special Rules for Two-Wheelers",
          contentNp = "१. चालक र पछाडि बस्ने दुवैले हेल्मेट लगाउनु अनिवार्य छ। हेल्मेट क्लिप लगाउनुहोस्।\n२. तीव्र गतिमा कुदाउनु र लापरवाही ओभरटेक गर्नु हुँदैन।\n३. हेल्मेट गुणस्तरीय (ISI/DOT प्रमाणित) हुनुपर्छ।\n४. फुटपाथ वा पैदल मार्गमा बाइक कुदाउनु सख्त मनाही छ।",
          contentEn = "1. Helmets are mandatory for both riders and pillion passengers. Fasten your straps!\n2. High-speed racing and zig-zag overtaking are strictly forbidden.\n3. Ensure your helmet is certified (e.g. ISI/DOT).\n4. Riding two-wheelers on footpaths is strictly prohibited.",
          categoryId = "A"
        )
      )
      dao.insertRuleArticles(articles)

      // 5. Fines & Penalties
      val fines = listOf(
        FinePenalty(offenseNp = "सवारी अनुमति पत्र (लाइसेन्स) नलिई सवारी चलाएको", offenseEn = "Driving without a valid licence", fineAmount = "रु. १,००० - १,५००", category = "Licence violation"),
        FinePenalty(offenseNp = "मादक पदार्थ सेवन गरी सवारी चलाएको (मापसे)", offenseEn = "Driving under the influence of alcohol (DUI)", fineAmount = "रु. १,००० + १ घण्टा सचेतना कक्षा", category = "Alcohol violation"),
        FinePenalty(offenseNp = "हेल्मेट वा सिट बेल्ट नलगाई सवारी चलाएको", offenseEn = "Riding without helmet / Seatbelt", fineAmount = "रु. ५००", category = "Safety violation"),
        FinePenalty(offenseNp = "तीव्र गतिमा सवारी चलाएको (स्पीडिङ)", offenseEn = "Over-speeding violation", fineAmount = "रु. ५०० - १,५००", category = "Speed violation"),
        FinePenalty(offenseNp = "लेन अनुशासन पालना नगरेको", offenseEn = "Lane discipline violation", fineAmount = "रु. ५००", category = "Lane violation"),
        FinePenalty(offenseNp = "अनावस्यक रूपमा हर्न बजाएको", offenseEn = "Unnecessary honking in silent zone", fineAmount = "रु. ५००", category = "Noise violation"),
        FinePenalty(offenseNp = "सवारी साधनको कागजपत्र (ब्लूबुक) साथमा नराखेको", offenseEn = "Not carrying registration papers (Bluebook)", fineAmount = "रु. ५००", category = "Documents missing")
      )
      dao.insertFines(fines)

      // 6. Road Signs
      val signs = listOf(
        RoadSign(
          type = "Mandatory",
          nameNp = "रोक्नुहोस् (STOP)",
          nameEn = "Stop Sign",
          descriptionNp = "यस सङ्केतले सवारी चालकलाई आफ्नो सवारी पूर्ण रूपमा रोक्न र बाटो सुरक्षित भएपछि मात्र अगाडि बढ्न निर्देशन दिन्छ।",
          descriptionEn = "This sign commands the driver to bring their vehicle to a complete stop and proceed only when it is safe to do so.",
          memoryTipNp = "यसको आठ वटा कुना (Octagon) र रातो रङ्ग हुन्छ।",
          memoryTipEn = "It has 8 sides (Octagon) and a bright red color. Mandatory STOP.",
          iconName = "sign_stop"
        ),
        RoadSign(
          type = "Mandatory",
          nameNp = "प्रवेश निषेध",
          nameEn = "No Entry",
          descriptionNp = "यस सडक खण्डमा सवारी साधनहरू प्रवेश गर्न पाउने छैनन्। विपरीत दिशाको एकतर्फी बाटोमा यो राखिन्छ।",
          descriptionEn = "Entering with any vehicle is prohibited. Usually placed on one-way streets.",
          memoryTipNp = "रातो गोलो घेरा भित्र तेर्सो सेतो पट्टी हुन्छ।",
          memoryTipEn = "Red circle with a horizontal white bar inside.",
          iconName = "sign_no_entry"
        ),
        RoadSign(
          type = "Mandatory",
          nameNp = "गति सीमा ४० कि.मी./घण्टा",
          nameEn = "Speed Limit 40 km/h",
          descriptionNp = "यस बाटोमा अधिकतम गति ४० कि.मी. प्रति घण्टा भन्दा बढी हुन पाइने छैन।",
          descriptionEn = "Maximum permitted speed limit is 40 kilometers per hour.",
          memoryTipNp = "रातो घेरा भित्र ४० अङ्क लेखिएको हुन्छ।",
          memoryTipEn = "Red border circle with the number 40 in black.",
          iconName = "sign_speed_limit_40"
        ),
        RoadSign(
          type = "Mandatory",
          nameNp = "ओभरटेक निषेध",
          nameEn = "No Overtaking",
          descriptionNp = "यस सडक खण्डमा अगाडिको सवारी साधनलाई ओभरटेक गर्न सख्त मनाही छ।",
          descriptionEn = "Overtaking any vehicle is strictly prohibited in this zone.",
          memoryTipNp = "रातो घेरा भित्र दुई वटा कार देखाइएको हुन्छ, एउटा रातो।",
          memoryTipEn = "Red circle with two cars, indicating overtaking is restricted.",
          iconName = "sign_no_overtaking"
        ),
        RoadSign(
          type = "Warning",
          nameNp = "विद्यालय क्षेत्र",
          nameEn = "School Ahead",
          descriptionNp = "अगाडि विद्यालय क्षेत्र भएकाले विद्यार्थीहरू सडक पार गर्दै हुन सक्छन्। गति कम गर्नुहोस्।",
          descriptionEn = "Warning that children are nearby. Reduce speed and watch out for students crossing.",
          memoryTipNp = "पहेंलो त्रिकोण भित्र दुई स्कुले विद्यार्थी देखाइएको हुन्छ।",
          memoryTipEn = "Triangle pointing upwards, showing two school children running.",
          iconName = "sign_school"
        ),
        RoadSign(
          type = "Warning",
          nameNp = "अगाडि जेब्रा क्रसिङ",
          nameEn = "Zebra Crossing Ahead",
          descriptionNp = "पैदलयात्रीहरू सडक पार गर्ने ठाउँ नजिकै छ, सावधान रहनुहोस्।",
          descriptionEn = "Zebra crossing is ahead. Prepare to slow down and stop for pedestrians.",
          memoryTipNp = "त्रिकोण भित्र मानिस हिडिरहेको सङ्केत।",
          memoryTipEn = "Upward-pointing triangle showing a pedestrian walking on white stripes.",
          iconName = "sign_zebra"
        ),
        RoadSign(
          type = "Warning",
          nameNp = "चिप्लो बाटो",
          nameEn = "Slippery Road",
          descriptionNp = "पानी वा माटोका कारण बाटो चिप्लो हुन सक्छ। अचानक ब्रेक नलगाउनुहोस्।",
          descriptionEn = "The road surface may be unusually slippery. Avoid hard braking.",
          memoryTipNp = "त्रिकोण भित्र कार घुमिरहेको वा स्किड गरिरहेको चित्र।",
          memoryTipEn = "Triangle showing a car skidding with curved tire marks.",
          iconName = "sign_slippery"
        ),
        RoadSign(
          type = "Informational",
          nameNp = "अस्पताल",
          nameEn = "Hospital Sign",
          descriptionNp = "अगाडि अस्पताल छ। हर्न बजाउन निषेध गरिएको हुन सक्छ।",
          descriptionEn = "Hospital facility nearby. Noise level should be kept at a minimum.",
          memoryTipNp = "नीलो वर्गाकार बोर्ड भित्र सेतो र रातो क्रस वा 'H' लेखिएको हुन्छ।",
          memoryTipEn = "Blue square sign containing a white or red cross, or a big 'H'.",
          iconName = "sign_hospital"
        )
      )
      dao.insertRoadSigns(signs)

      // 7. Questions
      val questions = listOf(
        // Questions Category A
        Question(
          categoryId = "A",
          topic = "Traffic Rules",
          questionNp = "मोटरसाइकल चलाउँदा हेल्मेट लगाउनु किन आवश्यक छ?",
          questionEn = "Why is it necessary to wear a helmet while riding a motorcycle?",
          optionsNp = "प्रहरीको जरिवानाबाट बच्न|टाउकोको चोटपटकबाट बच्न र सुरक्षाका लागि|धुलोबाट बच्न मात्र|माथिका सबै",
          optionsEn = "To avoid police fine|To prevent head injuries and ensure safety|Only to block dust|All of the above",
          correctOptionIndex = 1,
          explanationNp = "हेल्मेटले दुर्घटनाको समयमा टाउकोमा लाग्ने गम्भीर चोटपटकबाट ८५% सम्म बचाउँछ। यो सुरक्षाको लागि सबैभन्दा महत्त्वपूर्ण साधन हो।",
          explanationEn = "Helmets protect the rider's head from severe trauma in collisions, reducing serious head injuries by up to 85%.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "A",
          topic = "Traffic Rules",
          questionNp = "मोटरसाइकलको पछाडि बस्ने यात्रुले हेल्मेट लगाउनु पर्छ कि पर्दैन?",
          questionEn = "Does the pillion (passenger) on a motorcycle need to wear a helmet?",
          optionsNp = "पर्दैन, चालकले लगाए पुग्छ|अनिवार्य रूपमा लगाउनु पर्छ|इच्छा अनुसार लगाए हुन्छ|प्रहरी नभएको ठाउँमा नलाए नि हुन्छ",
          optionsEn = "No, driver is enough|Mandatory for pillion passenger as well|Optional, up to them|Only if police are around",
          correctOptionIndex = 1,
          explanationNp = "नेपालको ट्राफिक कानुन अनुसार मोटरसाइकलको पछाडि बस्ने यात्रुले पनि दुर्घटनाको जोखिम कम गर्न हेल्मेट लगाउनु अनिवार्य छ।",
          explanationEn = "According to road safety regulations, pillion riders face equal danger and must wear certified safety helmets.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "A",
          topic = "Right of Way",
          questionNp = "तीव्र उकालो बाटोमा सवारी चलाउँदा कसलाई पहिलो प्राथमिकता दिनुपर्छ?",
          questionEn = "On a steep uphill road, who should be given priority?",
          optionsNp = "ओरालो गइरहेको सवारीलाई|उकालो आइरहेको सवारीलाई|साइकल यात्रीलाई|ठुलो बस वा ट्रकलाई मात्र",
          optionsEn = "The vehicle going downhill|The vehicle coming uphill|Bicyclists|Only large buses or trucks",
          correctOptionIndex = 1,
          explanationNp = "उकालोमा गुडिरहेको सवारीलाई नियन्त्रण र पुनः सुरु गर्न गाह्रो हुने हुनाले ओरालो जाने सवारीले बाटो छोडिदिनुपर्छ।",
          explanationEn = "Vehicles coming uphill have the right of way as restarting on a steep incline is difficult and hazardous.",
          difficulty = "Medium"
        ),

        // Questions Category B
        Question(
          categoryId = "B",
          topic = "Traffic Rules",
          questionNp = "कार चलाउँदा सिट बेल्ट बाँध्नु किन अनिवार्य छ?",
          questionEn = "Why is it mandatory to wear a seatbelt while driving a car?",
          optionsNp = "सिट बेल्ट नलगाए जरिवाना तिर्नुपर्छ|दुर्घटना हुँदा अगाडिको सिसामा ठोक्किन वा बाहिर फ्याँकिनबाट बच्न|लाइसेन्स परीक्षामा अंक थपिने भएकाले|सिट बेल्ट बाँध्दा आराम मिल्ने हुनाले",
          optionsEn = "To avoid police fines|To prevent crashing into the windshield or being thrown out|To gain extra points in exams|Because it is comfortable",
          correctOptionIndex = 1,
          explanationNp = "सिट बेल्टले दुर्घटनाको समयमा शरीरलाई सिटमै बाँधेर राख्छ र गम्भीर चोटपटकबाट बचाउँछ।",
          explanationEn = "Seatbelts secure passengers in their seats during rapid deceleration, preventing impact with structural elements.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "B",
          topic = "Right of Way",
          questionNp = "गोलाकार चौबाटो (Roundabout) मा कुन सवारी साधनलाई पहिलो प्राथमिकता दिनुपर्छ?",
          questionEn = "At a roundabout, which vehicle has the priority?",
          optionsNp = "दायाँ तर्फबाट आउने सवारीलाई|गोलाकार घुम्ती भित्र गुडिरहेका सवारीहरूलाई|सबैभन्दा ठूलो गाडीलाई|बायाँ तर्फबाट आउने सवारीलाई",
          optionsEn = "Vehicles coming from the right|Vehicles already inside the roundabout|The largest vehicles|Vehicles coming from the left",
          correctOptionIndex = 1,
          explanationNp = "गोलाकार घुम्तीमा पहिले देखि नै गुडिरहेका सवारी साधनलाई पहिलो प्राथमिकता दिनु सडकको नियम हो।",
          explanationEn = "Vehicles already occupying and moving inside the roundabout circle have legal right of way.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "B",
          topic = "Vehicle Knowledge",
          questionNp = "चार पाङ्ग्रे सवारी साधनको ब्रेक आयल कम हुँदा ड्यासबोर्डमा कुन सङ्केत देखाउँछ?",
          questionEn = "Which dashboard light indicates low brake fluid or handbrake applied?",
          optionsNp = "मन्जुरी चिन्ह (!) रातो रङ्गको|इन्जिन बत्ती (Check Engine)|तापक्रम बत्ती|ब्याट्री चार्ज बत्ती",
          optionsEn = "Exclamation mark (!) inside a red circle|Check Engine light|Coolant temperature light|Battery light",
          correctOptionIndex = 0,
          explanationNp = "रातो रङ्गको गोलाकार कोष्ठक भित्र (!) चिन्हले ब्रेक आयल स्तर कम भएको वा ह्यान्डब्रेक लागिरहेको बुझाउँछ।",
          explanationEn = "The red exclamation mark inside a circle symbol (!) warns about low brake fluid level or engaged handbrake.",
          difficulty = "Hard"
        ),

        // Shared Questions
        Question(
          categoryId = "ALL",
          topic = "Road Signs",
          questionNp = "बाटोको कुनामा देखिने 'STOP' चिन्हको आकार कस्तो हुन्छ?",
          questionEn = "What is the shape of a roadside 'STOP' sign?",
          optionsNp = "त्रिभुजाकार (Triangle)|गोलाकार (Circle)|अष्टभुजाकार (Octagon)|चौकोर (Square)",
          optionsEn = "Triangle|Circle|Octagon|Square",
          correctOptionIndex = 2,
          explanationNp = "'STOP' चिन्ह अन्तर्राष्ट्रिय रूपमै अष्टभुजाकार (८ कुना भएको) हुन्छ, ताकि हिउँ वा धुलोले ढाकिए पनि चिन्न सकियोस्।",
          explanationEn = "A stop sign has an octagonal shape worldwide, designed to be recognizable even from the back or when dirty.",
          difficulty = "Easy",
          imageRef = "sign_stop"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "नेपालमा मापसे (मादक पदार्थ सेवन) सम्बन्धी कानुन कस्तो छ?",
          questionEn = "What is Nepal's law regarding driving under the influence (DUI) of alcohol?",
          optionsNp = "एक गिलास बियर सम्म खान पाइन्छ|मापसे गरेर सवारी साधन चलाउन पूर्ण प्रतिबन्ध छ|रातिको समयमा मात्र मापसे गर्न पाइन्छ|कडा लाइसेन्स भएका चालकले खान पाउँछन्",
          optionsEn = "One glass of beer is allowed|Zero-tolerance, complete ban on any blood alcohol concentration|Allowed during night hours only|Experienced drivers are allowed",
          correctOptionIndex = 1,
          explanationNp = "नेपालमा 'शून्य सहनशीलता' (Zero Tolerance) नीति छ। मापसे गरेर सवारी चलाउनु पूर्ण रूपमा अवैध हो।",
          explanationEn = "Nepal implements a strict zero-tolerance policy on drink driving. Any detectable alcohol level is a violation.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "ALL",
          topic = "Road Signs",
          questionNp = "रातो गोलाकार घेरा भित्र तेर्सो सेतो पट्टी भएको सङ्केतले के बुझाउँछ?",
          questionEn = "What does a red circle sign with a horizontal white bar indicate?",
          optionsNp = "गति सीमा अन्त्य|प्रवेश निषेध (No Entry)|अगाडि पुल छ|अगाडि वन-वे छ",
          optionsEn = "End of speed limit|No Entry|Bridge ahead|One-Way ahead",
          correctOptionIndex = 1,
          explanationNp = "यो चिन्हले 'प्रवेश निषेध' जनाउँछ। यस सडकमा सवारी साधन लग्न पाइँदैन।",
          explanationEn = "This is the 'No Entry' sign, prohibiting vehicles from entering that street section.",
          difficulty = "Easy",
          imageRef = "sign_no_entry"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "चौबाटोमा पहेंलो ट्राफिक बत्ती बलिरहेको छ भने चालकले के गर्नुपर्छ?",
          questionEn = "If a traffic light turns yellow at an intersection, what should the driver do?",
          optionsNp = "गति तीव्र पारेर चोक पार गर्ने|रोकिनका लागि गति कम गर्ने र तयारी गर्ने|हर्न बजाउँदै अगाडि बढ्ने|गाडी रोकेर इन्जिन बन्द गर्ने",
          optionsEn = "Speed up to cross quickly|Slow down and prepare to stop safely|Blow horn and proceed|Stop and turn off engine",
          correctOptionIndex = 1,
          explanationNp = "पहेंलो बत्तीले रातो बत्ती बस्न लागेको सङ्केत गर्छ। चोक सुरक्षित रूपमा खाली गर्न वा सुरक्षित स्थानमा रोक्न गति कम गर्नुपर्छ।",
          explanationEn = "A yellow light means prepare to stop. Drivers must slow down unless they are too close to stop safely.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "सडक दुर्घटना भई कोही घाइते भएमा चालकको पहिलो कर्तव्य के हो?",
          questionEn = "What is the primary duty of a driver if there is a road accident causing injury?",
          optionsNp = "घटनास्थलबाट तुरुन्तै भाग्ने|घाइतेको उद्धार गरी नजिकैको अस्पताल लैजाने र प्रहरीलाई खबर गर्ने|आफ्नो गाडीमा क्षति भएको छ कि हेर्ने|अन्य सवारीलाई बोलाएर गाली गर्ने",
          optionsEn = "Flee the scene immediately|Rescue injured passengers/pedestrians, take them to a hospital, and notify police|Check damage to own vehicle|Call and blame other vehicles",
          correctOptionIndex = 1,
          explanationNp = "घाइतेको ज्यान बचाउनु मानवीय र कानुनी हिसाबले चालकको पहिलो कर्तव्य हो। तुरुन्त उद्धार गरी अस्पताल लैजानुपर्छ।",
          explanationEn = "Human safety is the highest priority. Drivers must render first aid, transport the injured to hospital, and contact emergency services.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "सवारी चलाउँदा चालकसँग कुन कागजात अनिवार्य हुनुपर्छ?",
          questionEn = "Which document must a driver always carry while driving?",
          optionsNp = "सवारी दर्ता किताब (ब्लुबुक)|चालक अनुमति पत्र (लाइसेन्स)|सवारी कर तिरेको रसिद र बीमा|माथिका सबै कागजात",
          optionsEn = "Vehicle Registration Book (Bluebook)|Driver's License|Tax Receipt and Insurance|All of the above documents",
          correctOptionIndex = 3,
          explanationNp = "सवारी चलाउँदा चालकसँग सधैं सवारी दर्ता किताब, लाइसेन्स र कर तथा बीमाको प्रमाण पत्र हुनु अनिवार्य छ।",
          explanationEn = "Drivers must always carry their driver's license, vehicle registration certificate, and valid insurance/tax documents.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "A",
          topic = "Traffic Rules",
          questionNp = "मोटरसाइकल चालक अनुमति पत्र (लाइसेन्स) लिन न्यूनतम उमेर कति हुनुपर्छ?",
          questionEn = "What is the minimum age required to get a motorcycle driving license in Nepal?",
          optionsNp = "१४ वर्ष|१६ वर्ष|१८ वर्ष|२० वर्ष",
          optionsEn = "14 years|16 years|18 years|20 years",
          correctOptionIndex = 1,
          explanationNp = "नेपालको कानुन अनुसार वर्ग 'क' (मोटरसाइकल / स्कुटर) को लाइसेन्स लिन न्यूनतम उमेर १६ वर्ष पुरा भएको हुनुपर्छ।",
          explanationEn = "According to Nepalese law, the minimum age required to apply for a Category A (Motorcycle) driving license is 16 years.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "B",
          topic = "Traffic Rules",
          questionNp = "कार/जिप जस्ता साना सवारी चालक अनुमति पत्र लिन न्यूनतम उमेर कति हुनुपर्छ?",
          questionEn = "What is the minimum age required to get a car/jeep driving license in Nepal?",
          optionsNp = "१६ वर्ष|१८ वर्ष|२० वर्ष|२१ वर्ष",
          optionsEn = "16 years|18 years|20 years|21 years",
          correctOptionIndex = 1,
          explanationNp = "नेपालमा चार पाङ्ग्रे साना सवारी (वर्ग 'ख') को लाइसेन्स प्राप्त गर्न न्यूनतम १८ वर्ष उमेर पुरा भएको हुनुपर्छ।",
          explanationEn = "To apply for a Category B (Car/Jeep/Van) driving license in Nepal, a person must be at least 18 years old.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "बायाँ मोड्नका लागि कति दुरी अगाडिदेखि इन्डिकेटर (बत्ती) बाल्नुपर्छ?",
          questionEn = "How far in advance should you turn on your indicator signal before making a turn?",
          optionsNp = "मोड्ने बित्तिकै|कम्तीमा ३० मिटर अगाडि|कम्तीमा ५ मिटर अगाडि|इन्डिकेटर बाल्न आवश्यक छैन",
          optionsEn = "Just as you turn|At least 30 meters in advance|At least 5 meters in advance|Not necessary to use indicators",
          correctOptionIndex = 1,
          explanationNp = "पछाडि आउने सवारी साधनहरूलाई सुरक्षित रूपमा सचेत गराउन मोड्नु भन्दा कम्तीमा ३० मिटर अगाडि संकेत दिनुपर्छ।",
          explanationEn = "Indicators should be turned on at least 30 meters before turning to give ample warning to vehicles behind.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "ALL",
          topic = "Right of Way",
          questionNp = "अगाडिबाट एम्बुलेन्स वा दमकल आइरहेको छ भने चालकले के करनाुपर्छ?",
          questionEn = "What should a driver do when an emergency vehicle (ambulance/fire engine) approaches?",
          optionsNp = "आफ्नो गति बढाउने|सवारी बायाँतर्फ किनारमा रोकी वा साइड दिई बाटो छोडिदिने|हर्न बजाएर रोक्न भन्ने|वास्ता नगरी गुडिरहने",
          optionsEn = "Speed up own vehicle|Pull over to the left and yield the right of way|Blow horn to ask them to stop|Ignore and keep driving",
          correctOptionIndex = 1,
          explanationNp = "आपतकालीन सेवाका सवारी साधनहरू जस्तै एम्बुलेन्स र दमकललाई जतिसक्दो चाँडो बाटो दिनु हरेक चालकको पहिलो कानुनी र नैतिक कर्तव्य हो।",
          explanationEn = "Emergency vehicles with active sirens have complete right of way. Drivers must safely yield and let them pass.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "ALL",
          topic = "Road Signs",
          questionNp = "पहेंलो रङ्गको त्रिकोणात्मक ट्राफिक चिन्हहरूले के बुझाउँछन्?",
          questionEn = "What do upward-pointing triangular road signs with red borders signify?",
          optionsNp = "अनिवार्य निर्देशन (Mandatory)|चेतावनी वा सचेत गराउने (Warning)|जानकारी दिने (Informational)|गति सीमा अन्त्य",
          optionsEn = "Mandatory Signs|Warning/Cautionary Signs|Informational Signs|End of speed restriction",
          correctOptionIndex = 1,
          explanationNp = "त्रिकोणात्मक रातो घेरा भएका चिन्हहरूले चालकलाई अगाडि आउने खतरा वा सडक अवस्थाबारे सचेत गराउँछन्।",
          explanationEn = "Triangular signs are warning signs, warning drivers of upcoming hazards, pedestrian zones, or road conditions.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "ALL",
          topic = "Road Signs",
          questionNp = "निलो रङ्गको वर्गाकार वा आयातकार ट्राफिक चिन्हहरूले के बुझाउँछन्?",
          questionEn = "What do rectangular or square road signs with blue/green backgrounds signify?",
          optionsNp = "सचेत गराउने चिन्ह|अनिवार्य निषेध चिन्ह|सूचनामूलक वा जानकारीमुलक चिन्ह (Informational)|गति सीमा चिन्ह",
          optionsEn = "Warning signs|Mandatory prohibitive signs|Informational signs|Speed limit signs",
          correctOptionIndex = 2,
          explanationNp = "निलो वा हरियो रङ्गका आयातकार बोर्डहरूले अस्पताल, पेट्रोल पम्प, दिशा वा दुरी जस्ता उपयोगी सूचना प्रदान गर्छन्।",
          explanationEn = "Rectangular blue or green signs provide useful directory information like hospital, fuel station, distances, etc.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "सडकको बीचमा कोरिएको दोहोरो पहेँलो वा सेतो अविच्छिन्न (सिधा) रेखाको अर्थ के हो?",
          questionEn = "What does a double solid yellow or white line down the center of a road mean?",
          optionsNp = "ओभरटेक गर्न अनुमति छ|रेखा नाघेर जान वा ओभरटेक गर्न सख्त निषेध छ|पार्किङ गर्न पाइन्छ|गति बढाउन पाइन्छ",
          optionsEn = "Overtaking is allowed|Crossing and overtaking are strictly prohibited|Parking is permitted|Speed increase is allowed",
          correctOptionIndex = 1,
          explanationNp = "अविच्छिन्न (सिधा नजुटिएको) दोहोरो रेखाले ओभरटेक गर्न वा रेखा काट्न सख्त निषेध गरिएको जनाउँछ।",
          explanationEn = "Solid lines down the center of the road act as a physical barrier. Crossing over or overtaking is strictly illegal.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "कुन-कुन क्षेत्रमा हर्न बजाउन पूर्ण रूपमा प्रतिबन्ध गरिएको छ?",
          questionEn = "In which areas is blowing the vehicle's horn strictly prohibited?",
          optionsNp = "विद्यालय र अस्पताल नजिक|लामो पुलहरूमा|भन्सार कार्यालय नजिक|सपिङ मलको अगाडि",
          optionsEn = "Near schools and hospitals (Silent zones)|On long bridges|Near customs office|In front of shopping malls",
          correctOptionIndex = 0,
          explanationNp = "विद्यालय, अस्पताल र निषेधित 'शान्त क्षेत्र' (Silent Zone) मा अनावश्यक हर्न बजाउनु गैरकानुनी र दण्डनीय छ।",
          explanationEn = "Blowing horns near hospitals and school zones is strictly banned to prevent noise pollution and disturbance.",
          difficulty = "Easy",
          imageRef = "sign_no_horn"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "जेब्रा क्रसिङमा पैदलयात्री बाटो काट्दै छन् भने चालकले के गर्नुपर्छ?",
          questionEn = "If pedestrians are crossing the road at a zebra crossing, what must the driver do?",
          optionsNp = "गति बढाएर छिटो निस्कने|हर्न बजाएर बाटो खाली गर्न भन्ने|सवारी साधन रोकेर पैदलयात्रीलाई पहिले बाटो काट्न दिने|साइड लाइट बालेर अगाडि बढ्ने",
          optionsEn = "Speed up to cross before them|Blow horn to clear the way|Stop the vehicle and let the pedestrians cross first|Use hazard lights and keep driving",
          correctOptionIndex = 2,
          explanationNp = "जेब्रा क्रसिङमा पैदलयात्रीको पहिलो प्राथमिकता हुन्छ। चालकले गाडी पूर्ण रूपमा रोकेर उनीहरूलाई बाटो दिनुपर्छ।",
          explanationEn = "Pedestrians have absolute right of way at zebra crossings. Drivers must halt completely and yield.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "नेपालमा सवारी चलाउँदा सधैं कुन साइडबाट चलाउनुपर्छ?",
          questionEn = "On which side of the road should you always drive in Nepal?",
          optionsNp = "दायाँ साइडबाट|बायाँ साइडबाट|सडकको बीच भागबाट|जता खाली छ त्यतैबाट",
          optionsEn = "Right side|Left side|Middle of the road|Whichever side is empty",
          correctOptionIndex = 1,
          explanationNp = "नेपालमा देब्रेतर्फ सवारी चलाउने नियम (Keep Left) छ। त्यसैले सधैं सडकको बायाँ भाग प्रयोग गर्नुपर्छ।",
          explanationEn = "Nepal follows the left-hand traffic system. Vehicles must always be driven on the left side of the road.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "एकतर्फी बाटो (One-way road) मा कुन कुरा निषेध गरिएको हुन्छ?",
          questionEn = "What is prohibited on a designated one-way road?",
          optionsNp = "सवारी पार्क गर्न|विपरीत दिशामा सवारी चलाउन|तीव्र गतिमा कुदाउन|सवारीको लाइट बाल्न",
          optionsEn = "Parking vehicles|Driving in the opposite direction|Driving fast|Turning on headlamps",
          correctOptionIndex = 1,
          explanationNp = "एकतर्फी बाटोमा तोकिएको दिशामा मात्र सवारी चलाउन पाइन्छ। विपरीत दिशाबाट जानु गम्भीर ट्राफिक नियम उल्लंघन हो।",
          explanationEn = "On a one-way street, driving in the opposite direction is strictly forbidden and highly dangerous.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "ALL",
          topic = "Vehicle Knowledge",
          questionNp = "सवारी साधनको चक्का (टायर) को हावाको प्रेसर कहिले चेक गर्नुपर्छ?",
          questionEn = "When should you check the air pressure of your vehicle's tires?",
          optionsNp = "टायर चिसो भएको अवस्थामा (यात्रा अघि)|लामो यात्रा सकेर फर्केपछि|टायर तातो भएको अवस्थामा मात्र|हरेक पटक ब्रेक लगाएपछि",
          optionsEn = "When tires are cold (before driving)|After completing a long trip|Only when tires are hot|Every time you brake",
          correctOptionIndex = 0,
          explanationNp = "टायर तातो हुँदा हावा फैलने हुनाले वास्तविक प्रेसर थाहा हुँदैन। त्यसैले टायर चिसो भएको बेला प्रेसर नाप्नुपर्छ।",
          explanationEn = "Tire pressure should be measured when tires are cold, as heat generated from driving temporarily expands the air and inflates readings.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "A",
          topic = "Vehicle Knowledge",
          questionNp = "मोटरसाइकलको चेन किन धेरै खुकुलो हुनु हुँदैन?",
          questionEn = "Why should a motorcycle's drive chain not be kept too loose?",
          optionsNp = "चेन स्प्रोकेटबाट फुत्किने वा दुर्घटना हुने जोखिम हुन्छ|इन्जिन बन्द हुन्छ|हर्न बज्न छोड्छ|पेट्रोल धेरै खपत हुन्छ",
          optionsEn = "The chain can slip off the sprocket and cause a sudden wheel lockup or crash|Engine will switch off|Horn will stop working|Fuel consumption will double",
          correctOptionIndex = 0,
          explanationNp = "चेन खुकुलो हुँदा स्प्रोकेटबाट फुत्केर चक्का जाम गराउन सक्छ, जसले दुर्घटना निम्त्याउँछ।",
          explanationEn = "A loose drive chain can slide off the sprockets, locking up the rear wheel and causing a dangerous fall.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "B",
          topic = "Vehicle Knowledge",
          questionNp = "सवारी चलाउँदा इन्जिनको तापक्रम सूचक रातो भागमा पुगेमा के गर्नुपर्छ?",
          questionEn = "What should you do if the engine temperature gauge reaches the red zone while driving?",
          optionsNp = "अझै तीव्र गतिमा कुदाउने|सुरक्षित ठाउँमा गाडी रोकी इन्जिन बन्द गर्ने र चिसो हुन दिने|पानी नहाली तुरुन्तै हिँड्ने|हर्न बजाएर सहयोग माग्ने",
          optionsEn = "Speed up to cool it down|Safely pull over, turn off the engine, and allow it to cool down|Ignore and keep driving|Blow horn to ask for help",
          correctOptionIndex = 1,
          explanationNp = "रातो भागमा पुग्नु इन्जिन ओभरहिट भएको संकेत हो। यस्तोमा सुरक्षित रूपमा रोकी कुलेन्ट वा पानी चेक गर्नुपर्छ।",
          explanationEn = "Red zone means the engine is overheating. Continuing to drive will destroy internal engine components. Stop safely.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "नेपालमा मापसे कारबाही अन्तर्गत लाइसेन्समा अधिकतम कति पटक प्वाल पार्ने नियम छ?",
          questionEn = "Under Nepal's traffic system, up to how many holes can be punched in a license for violations before it is suspended?",
          optionsNp = "३ पटक|५ पटक|१० पटक|२ पटक मात्र",
          optionsEn = "3 times|5 times|10 times|Only 2 times",
          correctOptionIndex = 1,
          explanationNp = "गम्भीर ट्राफिक नियम उल्लंघन वा मापसे गर्दा लाइसेन्समा ५ पटक सम्म प्वाल पारिन्छ। ५ पटक नाघेमा लाइसेन्स ६ महिनाका लागि निलम्बन हुन्छ।",
          explanationEn = "Licences are punched for major violations. Upon receiving 5 punches, the driving licence is suspended for 6 months.",
          difficulty = "Hard"
        ),
        Question(
          categoryId = "ALL",
          topic = "Traffic Rules",
          questionNp = "सडकमा संकेत बत्तीको रङ्गहरू कुन क्रममा बलिरहेका हुन्छन्?",
          questionEn = "In which sequence do traffic signal lights change?",
          optionsNp = "रातो, हरियो, पहेंलो|रातो, पहेंलो, हरियो|पहेंलो, रातो, हरियो|हरियो, रातो, पहेंलो",
          optionsEn = "Red, Green, Yellow|Red, Yellow, Green|Yellow, Red, Green|Green, Red, Yellow",
          correctOptionIndex = 1,
          explanationNp = "ट्राफिक बत्तीहरू सामान्यतया रातो (रोक्ने), पहेंलो (तयार हुने/धीमा गर्ने) र हरियो (जाने) को क्रममा चल्छन्।",
          explanationEn = "Standard traffic lights cycle in the sequence of Red (Stop), Yellow (Prepare/Slow down), and Green (Go).",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "ALL",
          topic = "Road Signs",
          questionNp = "सडकको बीचमा कोरिएको टुटेको सेतो रेखा (Broken White Line) ले के बुझाउँछ?",
          questionEn = "What does a broken (dashed) white line in the center of the road mean?",
          optionsNp = "ओभरटेक वा लेन परिवर्तन गर्न पाइन्छ|सवारी पार्क गर्न पाइन्छ|सवारी रोक्न सख्त मनाही छ|गति सीमा समाप्त भएको",
          optionsEn = "Overtaking or lane changing is allowed when safe|Parking is permitted|Stopping is strictly forbidden|Speed limit is over",
          correctOptionIndex = 0,
          explanationNp = "टुटेको सेतो रेखा भएको सडकमा सुरक्षित भएमा ओभरटेक गर्न वा लेन परिवर्तन गर्न पाइन्छ।",
          explanationEn = "A broken white line down the center indicates that overtaking and lane changing are permitted when it is safe to do so.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "ALL",
          topic = "Right of Way",
          questionNp = "विद्यालय क्षेत्र वा अस्पताल अगाडि सवारीको गति कति हुनुपर्छ?",
          questionEn = "What should be the speed of a vehicle in school or hospital zones?",
          optionsNp = "गति तीव्र पार्ने|कम्पनीको सिफारिस अनुसार|गति कम गरी सावधान रहने|६० कि.मी. प्रति घण्टा",
          optionsEn = "Speed up|As recommended by manufacturer|Slow down and drive with extreme caution|60 km/h",
          correctOptionIndex = 2,
          explanationNp = "विद्यालय र अस्पताल संवेदनशील क्षेत्र हुन्, जहाँ आकस्मिक रूपमा मानिसहरू बाटोमा आउन सक्छन्। त्यसैले गति कम गरी सावधानी अपनाउनुपर्छ।",
          explanationEn = "School and hospital zones are highly sensitive areas. Drivers must slow down to ensure pedestrian safety.",
          difficulty = "Easy"
        ),
        Question(
          categoryId = "A",
          topic = "Vehicle Knowledge",
          questionNp = "मोटरसाइकलको गियर परिवर्तन गर्दा कुन अङ्गको प्रयोग गरिन्छ?",
          questionEn = "Which control is used to change gears on a motorcycle?",
          optionsNp = "दायाँ हातको क्लच र बायाँ खुट्टाको गियर लिभर|बायाँ हातको क्लच र बायाँ खुट्टाको गियर लिभर|दायाँ खुट्टाको ब्रेक र दायाँ हातको एक्सिलेटर|बायाँ हातको क्लच र दायाँ खुट्टाको गियर लिभर",
          optionsEn = "Right hand clutch and left foot gear lever|Left hand clutch lever and left foot gear lever|Right foot brake and right hand accelerator|Left hand clutch and right foot gear lever",
          correctOptionIndex = 1,
          explanationNp = "मोटरसाइकलमा गियर परिवर्तन गर्दा देब्रे हातले क्लच थिचेर देब्रे खुट्टाले गियर लिभर दबाउनुपर्छ।",
          explanationEn = "To change gears on a motorcycle, you must engage the clutch lever with your left hand and operate the gear lever with your left foot.",
          difficulty = "Medium"
        ),
        Question(
          categoryId = "B",
          topic = "Vehicle Knowledge",
          questionNp = "मैन्युअल गियर भएको कारमा गियर परिवर्तन गर्नुअघि कुन पेडल अनिवार्य थिच्नुपर्छ?",
          questionEn = "Which pedal must be fully pressed before changing gears in a manual car?",
          optionsNp = "एक्सेलेटर पेडल (Gas)|ब्रेक पेडल (Brake)|क्लच पेडल (Clutch)|ह्यान्डब्रेक लिभर",
          optionsEn = "Accelerator pedal (Gas)|Brake pedal|Clutch pedal|Handbrake lever",
          correctOptionIndex = 2,
          explanationNp = "म्यानुअल गाडीमा इन्जिन र गियरबक्स जडान विच्छेद गर्न गियर परिवर्तन गर्नु अगाडि क्लच पेडल पूरै थिच्नुपर्छ।",
          explanationEn = "In manual vehicles, you must depress the clutch pedal fully to disengage the engine power before changing gears.",
          difficulty = "Easy"
        )
      )
      dao.insertQuestions(questions)

      // Seed Initial Attempts for Progress Dashboard Visualization
      val initialAttempts = listOf(
        Attempt(mode = "Mock", categoryId = "A", score = 60, totalQuestions = 20, passed = false, startedAt = System.currentTimeMillis() - 86400000 * 5, completedAt = System.currentTimeMillis() - 86400000 * 5 + 900000, correctAnswersCount = 12, userEmail = "mock_user"),
        Attempt(mode = "Mock", categoryId = "A", score = 70, totalQuestions = 20, passed = false, startedAt = System.currentTimeMillis() - 86400000 * 4, completedAt = System.currentTimeMillis() - 86400000 * 4 + 950000, correctAnswersCount = 14, userEmail = "mock_user"),
        Attempt(mode = "Mock", categoryId = "A", score = 80, totalQuestions = 20, passed = true, startedAt = System.currentTimeMillis() - 86400000 * 3, completedAt = System.currentTimeMillis() - 86400000 * 3 + 800000, correctAnswersCount = 16, userEmail = "mock_user"),
        Attempt(mode = "Mock", categoryId = "A", score = 85, totalQuestions = 20, passed = true, startedAt = System.currentTimeMillis() - 86400000 * 2, completedAt = System.currentTimeMillis() - 86400000 * 2 + 750000, correctAnswersCount = 17, userEmail = "mock_user"),
        Attempt(mode = "Mock", categoryId = "A", score = 95, totalQuestions = 20, passed = true, startedAt = System.currentTimeMillis() - 86400000 * 1, completedAt = System.currentTimeMillis() - 86400000 * 1 + 700000, correctAnswersCount = 19, userEmail = "mock_user"),
        
        Attempt(mode = "Quiz", categoryId = "A", score = 80, totalQuestions = 10, passed = true, startedAt = System.currentTimeMillis() - 86400000 * 5, completedAt = System.currentTimeMillis() - 86400000 * 5 + 400000, topic = "Traffic Rules", correctAnswersCount = 8, userEmail = "mock_user"),
        Attempt(mode = "Quiz", categoryId = "A", score = 60, totalQuestions = 10, passed = false, startedAt = System.currentTimeMillis() - 86400000 * 4, completedAt = System.currentTimeMillis() - 86400000 * 4 + 450000, topic = "Road Signs", correctAnswersCount = 6, userEmail = "mock_user"),
        Attempt(mode = "Quiz", categoryId = "A", score = 90, totalQuestions = 10, passed = true, startedAt = System.currentTimeMillis() - 86400000 * 3, completedAt = System.currentTimeMillis() - 86400000 * 3 + 350000, topic = "Vehicle Knowledge", correctAnswersCount = 9, userEmail = "mock_user"),
        Attempt(mode = "Quiz", categoryId = "A", score = 70, totalQuestions = 10, passed = false, startedAt = System.currentTimeMillis() - 86400000 * 2, completedAt = System.currentTimeMillis() - 86400000 * 2 + 380000, topic = "Right of Way", correctAnswersCount = 7, userEmail = "mock_user")
      )
      initialAttempts.forEach { dao.insertAttempt(it) }
    }
  }
}
