/**
 * Firestore Collections Seeder — License Sathi
 *
 * Seeds all application collections with sample documents.
 * Safe to run multiple times — uses { merge: true } on all writes.
 *
 * Usage:
 *   npm run seed:collections
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
  console.log('✔ Loaded .env.local');
} catch {
  console.warn('⚠  Could not load .env.local');
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) { console.error('❌  NEXT_PUBLIC_FIREBASE_PROJECT_ID not set'); process.exit(1); }

// ── Load service account ──────────────────────────────────────────────────────
const saPath = resolve(__dirname, 'license-sathi-firebase-adminsdk-fbsvc-ff25be4e81.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'));
  console.log('✔ Service account loaded');
} catch {
  console.error(`❌  Could not read: ${saPath}`);
  process.exit(1);
}

// ── Init Firebase Admin ───────────────────────────────────────────────────────
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');

const app = initializeApp({ credential: cert(serviceAccount), projectId });
const db = getFirestore(app);
const ts = () => FieldValue.serverTimestamp();

// Track writes per collection
const summary = {};
const track = (col) => { summary[col] = (summary[col] ?? 0) + 1; };

// Get existing admin UID for createdBy fields
let adminUid = 'system';
try {
  const snap = await db.collection('admins').limit(1).get();
  if (!snap.empty) adminUid = snap.docs[0].id;
} catch { /* use fallback */ }
console.log(`ℹ  createdBy: ${adminUid}\n`);

// ── 1. admins — skip if exists ────────────────────────────────────────────────
console.log('── admins ──────────────────────────────────────');
const adminsSnap = await db.collection('admins').limit(1).get();
if (!adminsSnap.empty) {
  console.log('  ⤸ Already has documents — skipping.');
  summary['admins'] = 0;
} else {
  await db.collection('admins').doc('_schema').set({
    name: 'Schema Doc', email: 'admin@example.com',
    role: 'admin', status: 'active', createdAt: ts(),
  }, { merge: true });
  console.log('  ✔ _schema doc written');
  track('admins');
}

// ── 2. questions ──────────────────────────────────────────────────────────────
console.log('── questions ───────────────────────────────────');
const questions = [
  {
    "id": "q-001",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "लामो दूरीमा चल्ने यात्रुवाहक सार्वजनिक सवारी साधनले कति घण्टा पछि विश्राम गर्नुपर्दछ ?",
    "questionEn": "After how many hours must a long-distance public passenger vehicle take a rest?",
    "optionsNp": "प्रत्येक ३ घण्टामा|प्रत्येक ५ घण्टामा|प्रत्येक २ घण्टामा|कुनैपनि होईन",
    "optionsEn": "Every 3 hours|Every 5 hours|Every 2 hours|None of the above",
    "correctOptionIndex": 3,
    "explanationNp": "यातायात व्यवस्था ऐन अनुसार सामान्यतया हरेक ४ घण्टामा विश्राम गर्नुपर्ने प्रावधान छ।",
    "explanationEn": "According to the Transport Management Act, rests are generally required every 4 hours.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-002",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "सवारी चालक अनुमति पत्रको बहाल अवधि कति वर्षको हुने व्यवस्था रहेको छ ?",
    "questionEn": "What is the validity period of a driving license?",
    "optionsNp": "१ वर्ष|३ वर्ष|५ वर्ष|१० वर्ष",
    "optionsEn": "1 year|3 years|5 years|10 years",
    "correctOptionIndex": 2,
    "explanationNp": "सवारी चालक अनुमति पत्रको अवधि ५ वर्षको हुन्छ र त्यसपछि नवीकरण गर्नुपर्छ।",
    "explanationEn": "A driving license is valid for 5 years, after which it must be renewed.",
    "difficulty": "Easy",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-003",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "स्थानीय बाटोमा चल्ने यात्रुवाहक ठूलो सार्वजनिक सवारीमा अशक्त व्यक्तिका लागि कति सिट आरक्षित गरिएको छ ?",
    "questionEn": "How many seats are reserved for disabled persons in large public passenger vehicles operating on local routes?",
    "optionsNp": "२ सिट|३ सिट|४ सिट|५ सिट",
    "optionsEn": "2 seats|3 seats|4 seats|5 seats",
    "correctOptionIndex": 0,
    "explanationNp": "अशक्त व्यक्तिहरूको सहजताका लागि २ सिट आरक्षित गर्नुपर्ने नियम छ।",
    "explanationEn": "The rules mandate reserving 2 seats for the convenience of disabled passengers.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-004",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "चालक अनुमति पत्र कति अवधिसम्म निलम्बन गर्न सकिने प्रावधान छ ?",
    "questionEn": "For how long can a driving license be suspended?",
    "optionsNp": "३ महिना|५ महिना|६ महिना|८ महिना",
    "optionsEn": "3 months|5 months|6 months|8 months",
    "correctOptionIndex": 2,
    "explanationNp": "नियम उल्लंघनको गम्भीरता हेरी चालक अनुमति पत्र ६ महिनासम्म निलम्बन गर्न सकिन्छ।",
    "explanationEn": "Depending on the severity of the violation, a driving license can be suspended for up to 6 months.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-005",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "ठूला सवारीको सवारी चालक अनुमति पत्र नवीकरण गर्दा कति दस्तुर लाग्दछ ?",
    "questionEn": "What is the renewal fee for a heavy vehicle driving license?",
    "optionsNp": "एक हजार पाँच सय|दुई हजार|दुई हजार पाँच सय|कुनैपनि होइन",
    "optionsEn": "Rs. 1500|Rs. 2000|Rs. 2500|None of the above",
    "correctOptionIndex": 2,
    "explanationNp": "हालको नियम अनुसार ठूला सवारी चालक अनुमति पत्र नवीकरण शुल्क रु. २५०० लाग्छ।",
    "explanationEn": "As per current regulations, the renewal fee for a heavy vehicle license is Rs. 2500.",
    "difficulty": "Hard",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-006",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "म्याद सकिएको कति समयपछि सवारी चालक अनुमति पत्र नवीकरण गर्दा जरिवाना लाग्दछ?",
    "questionEn": "After how much time does a fine apply for renewing an expired driving license?",
    "optionsNp": "एक महिना|तीन महिना|पाँच महिना|सात महिना",
    "optionsEn": "1 month|3 months|5 months|7 months",
    "correctOptionIndex": 1,
    "explanationNp": "म्याद सकिएको ३ महिना भित्र नवीकरण गराउँदा जरिवाना लाग्दैन, त्यसपछि लाग्छ।",
    "explanationEn": "No fine applies if renewed within 3 months of expiry; fines apply afterward.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-007",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "बाटोइजाजत र नामसारी गर्नको लागि निवेदन फारममा कतिको टिकट टाँस गर्नुपर्ने व्यवस्था छ ?",
    "questionEn": "What value of postage stamp must be affixed to the application form for route permit and transfer of ownership?",
    "optionsNp": "पाँच रुपैयाँ|दश रुपैयाँ|दुई रुपैयाँको|एक रुपैयाँको",
    "optionsEn": "5 Rupees|10 Rupees|2 Rupees|1 Rupee",
    "correctOptionIndex": 1,
    "explanationNp": "सरकारी दस्तुर अनुसार फारममा दश रुपैयाँको हुलाक टिकट टाँस्नुपर्छ।",
    "explanationEn": "According to government fee structures, a 10 Rupee postage stamp must be affixed.",
    "difficulty": "Hard",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-008",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "सवारी दर्ता प्रमाण पत्र हराएमा वा अन्य कुनै कारणबाट नासिएमा सो भएको कति दिन भित्र प्रतिलिपिका लागि निवेदन दिनुपर्छ?",
    "questionEn": "Within how many days must an application for a copy be filed if the vehicle registration certificate is lost or destroyed?",
    "optionsNp": "३ दिन भित्र|७ दिन भित्र|१५ दिन भित्र|३० दिन भित्र",
    "optionsEn": "Within 3 days|Within 7 days|Within 15 days|Within 30 days",
    "correctOptionIndex": 2,
    "explanationNp": "प्रमाण पत्र हराएमा वा नासिएमा १५ दिन भित्र यातायात कार्यालयमा निवेदन दिनुपर्दछ।",
    "explanationEn": "If the certificate is lost or destroyed, an application must be submitted to the transport office within 15 days.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-009",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Vehicle Knowledge",
    "questionNp": "प्रदूषण पास स्टीकर नभएको सवारी साधन निषेधित सडकमा लगेमा के सजाय हुन्छ?",
    "questionEn": "What is the penalty for driving a vehicle without an emissions pass sticker on restricted roads?",
    "optionsNp": "कैद सजाय|सवारी जफत|भविष्यमा सवारी चलाउन प्रतिबन्ध|चालकलाई जरिवाना",
    "optionsEn": "Imprisonment|Vehicle confiscation|Future driving ban|Fine to the driver",
    "correctOptionIndex": 3,
    "explanationNp": "प्रदूषण मापदण्ड पूरा नगरेको सवारी चलाएमा चालकलाई आर्थिक जरिवाना गरिन्छ।",
    "explanationEn": "Driving a vehicle that fails emission standards results in a financial fine for the driver.",
    "difficulty": "Easy",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-010",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "सवारी चालक अनुमति पत्र नवीकरण गर्ने समय एक वर्ष पार भएको अवस्थामा नियमानुसार कति जरिवाना थप हुन्छ ?",
    "questionEn": "If a driving license renewal is delayed by more than a year, what is the additional penalty as per the rules?",
    "optionsNp": "एक सय पचास प्रतिशत|पचास प्रतिशत|बीस प्रतिशत|एक सय प्रतिशत",
    "optionsEn": "150%|50%|20%|100%",
    "correctOptionIndex": 3,
    "explanationNp": "एक वर्ष पार भएपछि नियमानुसार दस्तुरको १००% (दोब्बर) जरिवाना लाग्ने व्यवस्था छ।",
    "explanationEn": "If delayed for over a year, a penalty of 100% (double the fee) is added.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-011",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "सवारी तथा यातायात व्यवस्था ऐन अनुसार ठूलो सवारीको चालक अनुमति पत्र प्राप्त गर्न कति उमेर पुगेको हुनुपर्दछ ?",
    "questionEn": "According to the Transport Management Act, what is the minimum age required to obtain a heavy vehicle driving license?",
    "optionsNp": "१६ वर्ष|१८ वर्ष|२१ वर्ष|२५ वर्ष",
    "optionsEn": "16 years|18 years|21 years|25 years",
    "correctOptionIndex": 2,
    "explanationNp": "ठूलो सवारी साधन चलाउनको लागि कानुन अनुसार न्यूनतम २१ वर्ष उमेर पुगेको हुनुपर्छ।",
    "explanationEn": "According to the law, one must be at least 21 years old to drive heavy vehicles.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-012",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Vehicle Knowledge",
    "questionNp": "निजी सवारी साधनको प्रदूषण जाँच कति कति अवधिमा गरिन्छ ?",
    "questionEn": "How often is the emission test conducted for private vehicles?",
    "optionsNp": "३/३ महिनामा|६/६ महिनामा|१/१ वर्षमा|२/२ वर्षमा",
    "optionsEn": "Every 3 months|Every 6 months|Every 1 year|Every 2 years",
    "correctOptionIndex": 2,
    "explanationNp": "निजी सवारी साधनको हकमा सामान्यतया प्रत्येक १ वर्षमा प्रदूषण जाँच गराउनुपर्ने नियम छ।",
    "explanationEn": "For private vehicles, the emission test is generally required every 1 year.",
    "difficulty": "Easy",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-013",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "भन्सार तिरी ल्याएको मितिले कति दिन भित्र सवारी साधन दर्ता गराईसक्नुपर्दछ?",
    "questionEn": "Within how many days from the date of paying customs duty must a vehicle be registered?",
    "optionsNp": "१० दिनभित्र|१५ दिनभित्र|२० दिनभित्र|२५ दिनभित्र",
    "optionsEn": "Within 10 days|Within 15 days|Within 20 days|Within 25 days",
    "correctOptionIndex": 1,
    "explanationNp": "भन्सार पास भएको १५ दिनभित्र यातायात व्यवस्था कार्यालयमा सवारी दर्ता गरिसक्नुपर्छ।",
    "explanationEn": "The vehicle must be registered at the transport management office within 15 days of customs clearance.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-014",
    "subject": "Vehicle Knowledge",
    "category": "ALL",
    "topic": "Vehicle Knowledge",
    "questionNp": "तौलको आधारमा ठूलो सवारी भन्नाले कति वजन भएको सवारीलाई बुझिन्छ?",
    "questionEn": "Based on weight, what is considered a heavy vehicle?",
    "optionsNp": "१० टनभन्दा बढी|४ टनदेखि १० टनसम्म|४ टन भन्दा कम|१ टन",
    "optionsEn": "More than 10 tons|4 to 10 tons|Less than 4 tons|1 ton",
    "correctOptionIndex": 0,
    "explanationNp": "१० टन (१०००० किलो) भन्दा बढी तौल भएको सवारीलाई ठूलो सवारी (Heavy Vehicle) मानिन्छ।",
    "explanationEn": "A vehicle weighing more than 10 tons (10,000 kg) is classified as a heavy vehicle.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-015",
    "subject": "Vehicle Knowledge",
    "category": "ALL",
    "topic": "Vehicle Knowledge",
    "questionNp": "तौलको आधारमा मझौला सवारी भन्नाले कति वजन भएको सवारीलाई बुझिन्छ?",
    "questionEn": "Based on weight, what is considered a medium vehicle?",
    "optionsNp": "१० टन|१ टनदेखि ४ टनसम्म|४ टनदेखि १० टनसम्म|१ टन",
    "optionsEn": "10 tons|1 to 4 tons|4 to 10 tons|1 ton",
    "correctOptionIndex": 2,
    "explanationNp": "४ टनदेखि १० टनसम्म तौल भएको सवारी साधन मझौला सवारी अन्तर्गत पर्दछन्।",
    "explanationEn": "Vehicles weighing between 4 and 10 tons fall under the medium vehicle category.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-016",
    "subject": "Vehicle Knowledge",
    "category": "ALL",
    "topic": "Vehicle Knowledge",
    "questionNp": "तौलको आधारमा साना सवारी भन्नाले कति वजन भएको सवारीलाई बुझिन्छ?",
    "questionEn": "Based on weight, what is considered a light vehicle?",
    "optionsNp": "१० टन|४ टनभन्दा कम|१ टन भन्दा कम|१ टन",
    "optionsEn": "10 tons|Less than 4 tons|Less than 1 ton|1 ton",
    "correctOptionIndex": 1,
    "explanationNp": "४ टन (४००० किलो) भन्दा कम तौल भएका सवारी साधनलाई साना सवारी भनिन्छ।",
    "explanationEn": "Vehicles weighing less than 4 tons (4000 kg) are classified as light vehicles.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-017",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "सवारी तथा यातायात व्यवस्था ऐन कुन सालमा जारी भएको हो?",
    "questionEn": "In which year was the Vehicle and Transport Management Act issued in Nepal?",
    "optionsNp": "वि.सं. २०४८|वि.सं. २०४९|वि.सं. २०५४|वि.सं. २०५०",
    "optionsEn": "2048 BS|2049 BS|2054 BS|2050 BS",
    "correctOptionIndex": 1,
    "explanationNp": "सवारी तथा यातायात व्यवस्था ऐन, २०४९ सालमा जारी भई लागु भएको हो।",
    "explanationEn": "The Vehicle and Transport Management Act was issued and implemented in the year 2049 BS.",
    "difficulty": "Hard",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-018",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "नेपालमा हाल सवारी प्रदूषण मापदण्ड कुन लागु भएको छ ?",
    "questionEn": "Which vehicle emission standard act is currently applied in Nepal?",
    "optionsNp": "नेपाल सवारी प्रदूषण मापदण्ड, २०५६|नेपाल सवारी प्रदूषण मापदण्ड, २०६०|नेपाल सवारी प्रदूषण मापदण्ड, २०६५|नेपाल सवारी प्रदूषण मापदण्ड, २०६९",
    "optionsEn": "Nepal Vehicle Emission Standard, 2056|Nepal Vehicle Emission Standard, 2060|Nepal Vehicle Emission Standard, 2065|Nepal Vehicle Emission Standard, 2069",
    "correctOptionIndex": 3,
    "explanationNp": "पछिल्लो समय नेपाल सवारी प्रदूषण मापदण्ड, २०६९ लागु गरिएको छ।",
    "explanationEn": "The Nepal Vehicle Emission Standard, 2069 is the currently applied standard.",
    "difficulty": "Hard",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-019",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "सवारी दर्ता प्रमाणपत्र कति अवधिमा नवीकरण गराउनुपर्दछ ?",
    "questionEn": "How often must a vehicle registration certificate (Bluebook) be renewed?",
    "optionsNp": "६ महिनामा|१ वर्षमा|२ वर्षमा|४ वर्षमा",
    "optionsEn": "In 6 months|In 1 year|In 2 years|In 4 years",
    "correctOptionIndex": 1,
    "explanationNp": "सवारी दर्ता प्रमाणपत्र (ब्लुबुक) प्रत्येक १ वर्षमा कर तिरेर नवीकरण गराउनुपर्छ।",
    "explanationEn": "The vehicle registration certificate (Bluebook) must be renewed annually by paying the required tax.",
    "difficulty": "Easy",
    "imageRef": null,
    "status": "Active"
  },
  {
    "id": "q-020",
    "subject": "Traffic Rules",
    "category": "ALL",
    "topic": "Traffic Rules",
    "questionNp": "सवारी चालक अनुमति पत्रको म्याद सकिए पछि जरिवाना तिरेर कति वर्षसम्म नवीकरण गर्न पाइन्छ ?",
    "questionEn": "Up to how many years can a driving license be renewed by paying a fine after its expiry?",
    "optionsNp": "५ वर्ष|३ वर्ष|२ वर्ष|७ वर्ष",
    "optionsEn": "5 years|3 years|2 years|7 years",
    "correctOptionIndex": 0,
    "explanationNp": "म्याद सकिएको ५ वर्षभित्र जरिवाना तिरेर नवीकरण गर्न सकिन्छ, त्यसपछि स्वतः खारेज हुन्छ।",
    "explanationEn": "It can be renewed within 5 years of expiry by paying a fine, after which it gets automatically cancelled.",
    "difficulty": "Medium",
    "imageRef": null,
    "status": "Active"
  }
];
for (const { id, ...data } of questions) {
  const ref = id ? db.collection('questions').doc(id) : db.collection('questions').doc();
  await ref.set({ ...data, setId: "", createdAt: ts(), updatedAt: ts() }, { merge: true });
  console.log(`  ✔ ${ref.id}`);
  track('questions');
}

// ── 3. study_materials ────────────────────────────────────────────────────────
console.log('── study_materials ─────────────────────────────');
const materials = [
  // ==========================================
  // TRAFFIC SIGNS (TS)
  // ==========================================
  {
    id: 'sm-ts-004', code: 'TS-004', contentType: 'Traffic Sign',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Give Way', titleNp: 'बाटो दिनुहोस्',
    descEn: 'An inverted triangle sign instructing drivers to yield the right of way to other vehicles.',
    descNp: 'अन्य सवारी साधनलाई अघि बढ्न प्राथमिकता दिन निर्देशन दिने उल्टो त्रिकोण आकारको चिन्ह।',
    imageUrl: null, sectionId: 'SEC-MS-02', dotmRef: 'DOTM-TS-S02',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-ts-005', code: 'TS-005', contentType: 'Traffic Sign',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'No Parking', titleNp: 'पार्किङ निषेध',
    descEn: 'A circular sign with a blue background and a red diagonal line indicating parking is not allowed.',
    descNp: 'निलो पृष्ठभूमि र रातो छड्के रेखा भएको गोलाकार चिन्ह जसले पार्किङ गर्न मनाही गर्दछ।',
    imageUrl: null, sectionId: 'SEC-PS-02', dotmRef: 'DOTM-TS-P02',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-ts-006', code: 'TS-006', contentType: 'Traffic Sign',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'No U-Turn', titleNp: 'यु-टर्न निषेध',
    descEn: 'Indicates that making a U-turn is strictly prohibited on this section of the road.',
    descNp: 'यस सडक खण्डमा यु-टर्न गर्न पूर्ण रूपमा निषेध गरिएको जनाउँछ।',
    imageUrl: null, sectionId: 'SEC-PS-03', dotmRef: 'DOTM-TS-P03',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-ts-007', code: 'TS-007', contentType: 'Traffic Sign',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Horn Prohibited', titleNp: 'हर्न बजाउन निषेध',
    descEn: 'Prohibits the use of vehicle horns. Usually placed near hospitals, schools, and residential zones.',
    descNp: 'हर्न बजाउन निषेध गरिएको क्षेत्र। प्रायजसो अस्पताल, विद्यालय र शान्त क्षेत्रमा राखिन्छ।',
    imageUrl: null, sectionId: 'SEC-PS-04', dotmRef: 'DOTM-TS-P04',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-ts-008', code: 'TS-008', contentType: 'Traffic Sign',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Pedestrian Crossing', titleNp: 'जेब्रा क्रसिङ (पैदल यात्री क्रसिङ)',
    descEn: 'Warns drivers of a pedestrian crossing ahead. Drivers must slow down and prepare to stop.',
    descNp: 'अगाडि पैदल यात्री क्रसिङ रहेको जानकारी दिन्छ। चालकले गति कम गरी रोक्न तयार हुनुपर्छ।',
    imageUrl: null, sectionId: 'SEC-WS-01', dotmRef: 'DOTM-TS-W01',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },

  // ==========================================
  // ROAD RULES (RR)
  // ==========================================
  {
    id: 'sm-rr-001', code: 'RR-001', contentType: 'Road Rule',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Keep Left Rule', titleNp: 'बायाँ तर्फबाट चलाउने नियम',
    descEn: 'In Nepal, all vehicles must be driven on the left side of the road.',
    descNp: 'नेपालमा सबै सवारी साधन सडकको बायाँ तर्फबाट चलाउनुपर्दछ।',
    imageUrl: null, sectionId: 'SEC-RR-01', dotmRef: 'DOTM-RR-01',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-rr-002', code: 'RR-002', contentType: 'Road Rule',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Overtaking Rule', titleNp: 'ओभरटेक सम्बन्धी नियम',
    descEn: 'Overtaking must always be done from the right side of the vehicle ahead. Never overtake on turns or bridges.',
    descNp: 'ओभरटेक सधैं अगाडिको सवारीको दाहिने तर्फबाट मात्र गर्नुपर्छ। घुम्ती र पुलमा ओभरटेक गर्नु हुँदैन।',
    imageUrl: null, sectionId: 'SEC-RR-02', dotmRef: 'DOTM-RR-02',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-rr-003', code: 'RR-003', contentType: 'Road Rule',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Yield to Emergency Vehicles', titleNp: 'आपत्कालीन सवारीलाई बाटो दिने',
    descEn: 'Drivers must immediately yield the right of way to ambulances, fire engines, and police vehicles with active sirens.',
    descNp: 'साइरन बजाइरहेका एम्बुलेन्स, दमकल र प्रहरीको सवारी साधनलाई तत्काल बाटो छोडिदिनुपर्छ।',
    imageUrl: null, sectionId: 'SEC-RR-03', dotmRef: 'DOTM-RR-03',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-rr-004', code: 'RR-004', contentType: 'Road Rule',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Roundabout Priority', titleNp: 'गोलचक्कर (राउन्डअबाउट) को नियम',
    descEn: 'Vehicles already circulating within the roundabout have priority over vehicles entering it.',
    descNp: 'गोलचक्करमा प्रवेश गर्न लागेका सवारी भन्दा भित्र घुमिरहेका सवारी साधनको प्राथमिकता पहिले हुन्छ।',
    imageUrl: null, sectionId: 'SEC-RR-04', dotmRef: 'DOTM-RR-04',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },

  // ==========================================
  // LAWS (LW) - Includes specific 'topic' fields
  // ==========================================
  {
    id: 'sm-lw-001', code: 'LW-001', contentType: 'Law',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Drink Driving Penalty', titleNp: 'मापसे सम्बन्धी सजाय',
    descEn: 'Nepal has a zero-tolerance policy for drink driving (MAPASE). It results in a Rs. 1000 fine, license punching, and mandatory traffic class.',
    descNp: 'मादक पदार्थ सेवन गरी सवारी चलाएमा रु. १००० जरिवाना, लाइसेन्समा प्वाल पार्ने र ट्राफिक कक्षा लिनुपर्ने कानुनी व्यवस्था छ।',
    topicEn: 'drink_driving', topicNp: 'मापसे सम्बन्धी',
    imageUrl: null, sectionId: 'SEC-LW-01', dotmRef: 'DOTM-LAW-01',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-lw-002', code: 'LW-002', contentType: 'Law',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Driving License Validity', titleNp: 'सवारी चालक अनुमति पत्रको अवधि',
    descEn: 'A standard driving license in Nepal is valid for 5 years and must be renewed to avoid penalties.',
    descNp: 'नेपालमा सवारी चालक अनुमति पत्रको अवधि ५ वर्षको हुन्छ। म्याद सकिएपछि जरिवानाबाट बच्न नवीकरण गर्नुपर्छ।',
    topicEn: 'general', topicNp: 'सामान्य नियम',
    imageUrl: null, sectionId: 'SEC-LW-02', dotmRef: 'DOTM-LAW-02',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-lw-003', code: 'LW-003', contentType: 'Law',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Probation Period', titleNp: 'परीक्षण काल',
    descEn: 'Newly issued driving licenses are subject to a 1-year probation period as per the Transport Management Act.',
    descNp: 'यातायात व्यवस्था ऐन अनुसार नयाँ जारी गरिएको सवारी चालक अनुमति पत्र पहिलो १ वर्षको लागि परीक्षण कालमा रहन्छ।',
    topicEn: 'licensing', topicNp: 'लाइसेन्स सम्बन्धी',
    imageUrl: null, sectionId: 'SEC-LW-03', dotmRef: 'DOTM-LAW-03',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-lw-004', code: 'LW-004', contentType: 'Law',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Heavy Vehicle Minimum Age', titleNp: 'ठूला सवारीको उमेर हद',
    descEn: 'An individual must be at least 21 years old to legally obtain a heavy vehicle driving license.',
    descNp: 'ठूलो सवारीको चालक अनुमति पत्र प्राप्त गर्न कानुन अनुसार कम्तीमा २१ वर्ष उमेर पुगेको हुनुपर्छ।',
    topicEn: 'licensing', topicNp: 'लाइसेन्स सम्बन्धी',
    imageUrl: null, sectionId: 'SEC-LW-04', dotmRef: 'DOTM-LAW-04',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },

  // ==========================================
  // VEHICLE KNOWLEDGE (VK)
  // ==========================================
  {
    id: 'sm-vk-001', code: 'VK-001', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Engine Temperature Light', titleNp: 'इन्जिन तापक्रम बत्ती',
    descEn: 'A thermometer symbol that illuminates in red if the engine is overheating. Pull over immediately.',
    descNp: 'थर्मोमिटर आकारको रातो बत्ती बलेमा इन्जिन अत्यधिक तातेको बुझिन्छ। तुरुन्तै सवारी रोक्नुपर्छ।',
    imageUrl: null, sectionId: 'SEC-VK-01', dotmRef: 'DOTM-VK-01',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-vk-002', code: 'VK-002', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Battery Warning Light', titleNp: 'ब्याट्री चेतावनी बत्ती',
    descEn: 'If this light stays on while driving, it means the battery is not charging properly (usually an alternator issue).',
    descNp: 'सवारी चलाउँदा यो बत्ती बलिरहेमा ब्याट्री चार्ज नभएको वा अल्टरनेटरमा समस्या भएको बुझिन्छ।',
    imageUrl: null, sectionId: 'SEC-VK-02', dotmRef: 'DOTM-VK-02',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-vk-003', code: 'VK-003', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'A', difficulty: 'Easy',
    titleEn: 'Motorcycle Chain Maintenance', titleNp: 'मोटरसाइकलको चेन मर्मत',
    descEn: 'The drive chain should be lubricated and its tension checked regularly (every 500-1000 km) for safe riding.',
    descNp: 'सुरक्षित यात्राको लागि मोटरसाइकलको चेनमा नियमित लुब्रिकेन्ट हाल्ने र टाइट गर्ने काम (हरेक ५००-१००० किमीमा) गर्नुपर्छ।',
    imageUrl: null, sectionId: 'SEC-VK-03', dotmRef: 'DOTM-VK-03',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-vk-004', code: 'VK-004', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'B', difficulty: 'Hard',
    titleEn: 'Function of the Clutch', titleNp: 'क्लचको कार्य',
    descEn: 'The clutch separates the engine from the wheels, allowing the driver to change gears smoothly without grinding.',
    descNp: 'क्लचले इन्जिन र पाङ्ग्राको सम्पर्क छुटाउँछ, जसले गर्दा गियर परिवर्तन गर्न सजिलो हुन्छ।',
    imageUrl: null, sectionId: 'SEC-VK-04', dotmRef: 'DOTM-VK-04',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-vk-005', code: 'VK-005', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Tire Tread Depth', titleNp: 'टायरको गोलाइ र ग्रिप',
    descEn: 'Tires with worn-out treads take a longer distance to stop and are highly dangerous on wet and slippery roads.',
    descNp: 'ग्रिप (Tread) खिइएको टायरले ब्रेक लगाउँदा रोकिन धेरै समय लिन्छ र चिप्लो बाटोमा अत्यन्त खतरनाक हुन्छ।',
    imageUrl: null, sectionId: 'SEC-VK-05', dotmRef: 'DOTM-VK-05',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  // ==========================================
  // TRAFFIC SIGNS (TS)
  // ==========================================
  {
    id: 'sm-ts-009', code: 'TS-009', contentType: 'Traffic Sign',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Slippery Road Ahead', titleNp: 'अगाडि चिप्लो सडक छ',
    descEn: 'A triangular warning sign showing a car with squiggly lines, indicating the road ahead may be slippery, especially when wet.',
    descNp: 'त्रिभुजाकार चेतावनी चिन्ह जसले अगाडिको बाटो चिप्लो हुन सक्ने जनाउँछ, विशेषगरी पानी परेको बेला।',
    imageUrl: null, sectionId: 'SEC-WS-02', dotmRef: 'DOTM-TS-W02',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-ts-010', code: 'TS-010', contentType: 'Traffic Sign',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Narrow Bridge Ahead', titleNp: 'अगाडि साँघुरो पुल छ',
    descEn: 'Warns drivers that the upcoming bridge is narrower than the road. Drivers should slow down and be cautious of oncoming traffic.',
    descNp: 'अगाडिको पुल सडकभन्दा साँघुरो छ भन्ने चेतावनी दिन्छ। चालकले गति कम गरी अगाडिबाट आउने सवारीको ध्यान दिनुपर्छ।',
    imageUrl: null, sectionId: 'SEC-WS-03', dotmRef: 'DOTM-TS-W03',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-ts-011', code: 'TS-011', contentType: 'Traffic Sign',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Hospital Zone', titleNp: 'अस्पताल क्षेत्र',
    descEn: 'A blue rectangular sign with a white bed and red cross indicating a hospital is nearby. Honking is usually prohibited here.',
    descNp: 'अस्पताल नजिकै छ भन्ने जनाउने चिन्ह। यस्तो क्षेत्रमा सामान्यतया हर्न बजाउन पूर्ण रूपमा निषेध गरिन्छ।',
    imageUrl: null, sectionId: 'SEC-IS-01', dotmRef: 'DOTM-TS-I01',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },

  // ==========================================
  // ROAD RULES (RR)
  // ==========================================
  {
    id: 'sm-rr-005', code: 'RR-005', contentType: 'Road Rule',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Using Turn Signals', titleNp: 'साइड लाइट (इन्डिकेटर) को प्रयोग',
    descEn: 'Always use your turn signals well in advance before turning, changing lanes, or overtaking to inform other drivers of your intention.',
    descNp: 'मोड्नु, लेन परिवर्तन गर्नु वा ओभरटेक गर्नु अघि अन्य चालकलाई जानकारी दिन सधैं समयमै साइड लाइट बाल्नुपर्छ।',
    imageUrl: null, sectionId: 'SEC-RR-05', dotmRef: 'DOTM-RR-05',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-rr-006', code: 'RR-006', contentType: 'Road Rule',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Safe Following Distance', titleNp: 'सुरक्षित दूरी कायम गर्ने',
    descEn: 'Maintain a safe distance from the vehicle ahead. Use the "two-second rule" to ensure you have enough time to stop in an emergency.',
    descNp: 'अगाडिको सवारी साधनसँग सुरक्षित दूरी कायम राख्नुहोस्। आपतकालीन अवस्थामा रोक्नको लागि प्रशस्त समय मिलोस् भनी दूरी राख्नुपर्छ।',
    imageUrl: null, sectionId: 'SEC-RR-06', dotmRef: 'DOTM-RR-06',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-rr-007', code: 'RR-007', contentType: 'Road Rule',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Night Driving & Headlights', titleNp: 'रातिको समय र हेडलाइटको प्रयोग',
    descEn: 'Always use low-beam headlights when another vehicle is approaching from the opposite direction at night to avoid blinding the other driver.',
    descNp: 'राति विपरीत दिशाबाट अर्को सवारी आइरहेको बेला अर्को चालकको आँखा नतिर्मिराओस् भन्नका लागि सधैं लो-बिम (Low Beam) लाइट प्रयोग गर्नुपर्छ।',
    imageUrl: null, sectionId: 'SEC-RR-07', dotmRef: 'DOTM-RR-07',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },

  // ==========================================
  // LAWS (LW) 
  // ==========================================
  {
    id: 'sm-lw-005', code: 'LW-005', contentType: 'Law',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'License Renewal Validity (10 Years)', titleNp: 'लाइसेन्स नवीकरण अवधि (१० वर्ष)',
    descEn: 'Under current regulations in Nepal, once a driving license is renewed, the new validity period provided is 10 years.',
    descNp: 'हालको नयाँ कानुनी व्यवस्था अनुसार, नवीकरण गरिएको सवारी चालक अनुमति पत्रको म्याद १० वर्षको हुने प्रावधान छ।',
    topicEn: 'licensing', topicNp: 'लाइसेन्स सम्बन्धी',
    imageUrl: null, sectionId: 'SEC-LW-05', dotmRef: 'DOTM-LAW-05',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-lw-006', code: 'LW-006', contentType: 'Law',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Third-Party Insurance Mandatory', titleNp: 'तेस्रो पक्ष बिमा अनिवार्य',
    descEn: 'All vehicles must have valid third-party insurance. It covers injury, death, or property damage to others caused by your vehicle.',
    descNp: 'सबै सवारी साधनको तेस्रो पक्ष बिमा हुनु अनिवार्य छ। यसले दुर्घटना हुँदा अरूलाई पर्ने शारीरिक वा भौतिक क्षतिको क्षतिपूर्ति दिन्छ।',
    topicEn: 'insurance', topicNp: 'बिमा सम्बन्धी',
    imageUrl: null, sectionId: 'SEC-LW-06', dotmRef: 'DOTM-LAW-06',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-lw-007', code: 'LW-007', contentType: 'Law',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Green Sticker (Emissions)', titleNp: 'हरियो स्टिकर (प्रदूषण जाँच)',
    descEn: 'Vehicles passing the emission test receive a green sticker. It is mandatory for driving in restricted areas like the Kathmandu Valley.',
    descNp: 'प्रदूषण जाँच पास गरेका सवारीलाई हरियो स्टिकर दिइन्छ। काठमाडौं उपत्यका जस्ता क्षेत्रमा सवारी चलाउन यो अनिवार्य छ।',
    topicEn: 'general', topicNp: 'सामान्य नियम',
    imageUrl: null, sectionId: 'SEC-LW-07', dotmRef: 'DOTM-LAW-07',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },

  // ==========================================
  // VEHICLE KNOWLEDGE (VK)
  // ==========================================
  {
    id: 'sm-vk-006', code: 'VK-006', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'All', difficulty: 'Medium',
    titleEn: 'Radiator and Coolant Safety', titleNp: 'रेडियटर र कुलेन्टको सुरक्षा',
    descEn: 'The radiator keeps the engine cool. Never attempt to open the radiator cap while the engine is hot, as boiling coolant can cause severe burns.',
    descNp: 'रेडियटरले इन्जिनलाई अत्यधिक तात्ने समस्याबाट बचाउँछ। इन्जिन तातो भएको बेला रेडियटरको बिर्को खोल्नु हुँदैन, उम्लेको पानीले पोल्न सक्छ।',
    imageUrl: null, sectionId: 'SEC-VK-06', dotmRef: 'DOTM-VK-06',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-vk-007', code: 'VK-007', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'All', difficulty: 'Easy',
    titleEn: 'Adjusting Rear-View Mirrors', titleNp: 'लुकिङ ग्लास (ऐना) को मिलावट',
    descEn: 'Before driving, adjust your side and interior rear-view mirrors so you can clearly see the traffic behind you without moving your head.',
    descNp: 'सवारी चलाउनु अघि पछाडिको सवारी साधन स्पष्ट देखिने गरी आफ्नो साइड र भित्री ऐना (Looking Glass) मिलाउनुपर्छ।',
    imageUrl: null, sectionId: 'SEC-VK-07', dotmRef: 'DOTM-VK-07',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-vk-008', code: 'VK-008', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'All', difficulty: 'Hard',
    titleEn: 'Oil Pressure Warning Light', titleNp: 'इन्जिन आयल प्रेसर बत्ती',
    descEn: 'A red oil can symbol indicates low engine oil pressure. Continuing to drive can cause catastrophic engine failure. Stop immediately.',
    descNp: 'रातो रङको तेलको भाँडो जस्तो बत्ती बलेमा इन्जिन आयलको प्रेसर कम भएको बुझिन्छ। यस्तो अवस्थामा सवारी चलाइराखे इन्जिन सीज हुन सक्छ।',
    imageUrl: null, sectionId: 'SEC-VK-08', dotmRef: 'DOTM-VK-08',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-vk-009', code: 'VK-009', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'A', difficulty: 'Easy',
    titleEn: 'Motorcycle Brake Usage', titleNp: 'मोटरसाइकलमा ब्रेकको प्रयोग',
    descEn: 'For safe and balanced stopping, always apply both the front and rear brakes simultaneously on a motorcycle.',
    descNp: 'सुरक्षित र सन्तुलित रूपमा मोटरसाइकल रोक्नको लागि सधैं अगाडि र पछाडिको ब्रेक एकैसाथ प्रयोग गर्नुपर्दछ।',
    imageUrl: null, sectionId: 'SEC-VK-09', dotmRef: 'DOTM-VK-09',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  },
  {
    id: 'sm-vk-010', code: 'VK-010', contentType: 'Vehicle Knowledge',
    vehicleCategory: 'A', difficulty: 'Easy',
    titleEn: 'Motorcycle Brake Usage', titleNp: 'मोटरसाइकलमा ब्रेकको प्रयोग',
    descEn: 'For safe and balanced stopping, always apply both the front and rear brakes simultaneously on a motorcycle.',
    descNp: 'सुरक्षित र सन्तुलित रूपमा मोटरसाइकल रोक्नको लागि सधैं अगाडि र पछाडिको ब्रेक एकैसाथ प्रयोग गर्नुपर्दछ।',
    imageUrl: null, sectionId: 'SEC-VK-09', dotmRef: 'DOTM-VK-09',
    status: 'Published', createdBy: adminUid, createdAt: ts(), updatedAt: ts(),
  }

];
for (const { id, ...data } of materials) {
  await db.collection('study_materials').doc(id).set(data, { merge: true });
  console.log(`  ✔ ${id}`);
  track('study_materials');
}


// ── 6. notices ────────────────────────────────────────────────────────────────
console.log('── notices ─────────────────────────────────────');
const notices = [
  {
    id: 'notice-sample-001',
    titleEn: 'New Traffic Rules Effective from Shrawan 2082',
    titleNp: 'श्रावण २०८२ देखि लागू हुने नया ट्राफिक नियम',
    contentEn: 'Updated traffic regulations from the Department of Transport Management effective Shrawan 1, 2082. Key changes include revised speed limits and stricter phone-use penalties.',
    contentNp: 'यातायात व्यवस्था विभागले श्रावण १, २०८२ देखि लागू हुने नया नियमहरू घोषणा गरेको छ।',
    type: 'info', targetCategory: ['all'], status: 'Published',
    publishedAt: ts(), expiresAt: null,
    createdBy: adminUid, createdAt: ts(),
  },
  {
    id: 'notice-sample-002',
    titleEn: 'Scheduled Maintenance — App Downtime on Sunday',
    titleNp: 'आइतबार अनुसूचित मर्मत — एप डाउनटाइम',
    contentEn: 'License Sathi will be unavailable Sunday 2:00–5:00 AM for scheduled maintenance.',
    contentNp: 'अनुसूचित मर्मतका लागि आइतबार बिहान २:०० देखि ५:०० बजेसम्म एप उपलब्ध हुनेछैन।',
    type: 'warning', targetCategory: ['A', 'B', 'K', 'G'], status: 'Published',
    publishedAt: ts(), expiresAt: null,
    createdBy: adminUid, createdAt: ts(),
  },
];
for (const { id, ...data } of notices) {
  await db.collection('notices').doc(id).set(data, { merge: true });
  console.log(`  ✔ ${id}`);
  track('notices');
}
// ── 7. question_sets ──────────────────────────────────────────────────────────
console.log('── question_sets ───────────────────────────────');
const questionSets = [
  {
    id: 'set-001',
    name: 'General Traffic Rules',
    nameNp: 'सामान्य ट्राफिक नियमहरू',
    description: 'A basic set containing general traffic rules for all categories.',
    createdBy: adminUid,
    createdAt: ts(),
    updatedAt: ts(),
  },
  {
    id: 'set-002',
    name: 'Advanced Driving',
    nameNp: 'उन्नत ड्राइभिङ',
    description: 'Advanced driving scenarios and situational questions.',
    createdBy: adminUid,
    createdAt: ts(),
    updatedAt: ts(),
  },
];
for (const { id, ...data } of questionSets) {
  await db.collection('question_sets').doc(id).set(data, { merge: true });
  console.log(`  ✔ ${id}`);
  track('question_sets');
}

// ── 8. app_settings ───────────────────────────────────────────────────────────
console.log('── app_settings ────────────────────────────────');
await db.collection('app_settings').doc('config').set({
  appName: 'License Sathi',
  supportEmail: 'support@licensesathi.com.np',
  maintenanceMode: false,
  version: '2.4.1',
  passingScore: 60,
  examDuration: 1800,
  questionsPerExam: 50,
  categories: ['A', 'B', 'K', 'G'],
  updatedAt: ts(),
  updatedBy: adminUid,
}, { merge: true });
console.log('  ✔ app_settings/config');
track('app_settings');

// ── 9. admin_api_keys ─────────────────────────────────────────────────────────
console.log('── admin_api_keys ──────────────────────────────');
const apiKeyServices = ['openai', 'gemini', 'anthropic', 'admob'];
for (const service of apiKeyServices) {
  await db.collection('admin_api_keys').doc(service).set({
    service,
    is_configured: false,
    encrypted_key: null,
    updated_at: null,
    updated_by: null,
    note: `Set your ${service.toUpperCase()} API key from the Admin Panel → Settings → API Keys`,
  }, { merge: true });
  console.log(`  ✔ admin_api_keys/${service}`);
  track('admin_api_keys');
}

// ── 10. system_prompts ────────────────────────────────────────────────────────
console.log('── system_prompts ──────────────────────────────');
const systemPrompts = [
  {
    id: 'ask-expert-v1',
    name: 'ask_expert_system_prompt',
    version: 'v1',
    is_active: true,
    created_at: new Date().toISOString(),
    prompt_text: `You are License Sathi's AI driving expert assistant, specializing in Nepal's traffic laws, road signs, and vehicle regulations as defined by the Department of Transport Management (DoTM).

Your role:
- Answer questions clearly and accurately in the same language the user asks (Nepali or English).
- Base your answers ONLY on the provided context from the knowledge base.
- If the context does not contain enough information, say "I don't have specific information on that, please consult the DoTM website or a licensed driving instructor."
- Keep answers concise and practical — users are preparing for their driving license exam.
- Format answers with bullet points when listing rules or steps.
- Always be polite and encouraging.

Context from knowledge base:
{context}

User's question:
{question}`,
  },
];
for (const { id, ...data } of systemPrompts) {
  await db.collection('system_prompts').doc(id).set(data, { merge: true });
  console.log(`  ✔ system_prompts/${id}`);
  track('system_prompts');
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Collection           Docs Written');
console.log('  ─────────────────── ────────────');
for (const [col, count] of Object.entries(summary)) {
  const pad = ' '.repeat(Math.max(1, 20 - col.length));
  console.log(`  ${col}${pad}${count === 0 ? 'skipped' : count}`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

process.exit(0);
