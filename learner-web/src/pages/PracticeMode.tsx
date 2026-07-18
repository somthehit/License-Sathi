import { useState, useMemo } from 'react';
import { useQuestions, useQuestionSets } from '../hooks/useQuestions';
import type { Question } from '../hooks/useQuestions';
import './PracticeMode.css';

type Lang   = 'np' | 'en';
type Mode   = 'setup' | 'quiz' | 'done';
type Source = 'category' | 'set';

const CATEGORIES = [
  { id: 'all', labelEn: 'All Categories',       labelNp: 'सबै वर्ग',         emoji: '📚' },
  { id: 'A',   labelEn: 'Category A — Bike',     labelNp: 'वर्ग A — मोटरसाइकल', emoji: '🏍️' },
  { id: 'B',   labelEn: 'Category B — Car',      labelNp: 'वर्ग B — कार',       emoji: '🚗' },
  { id: 'K',   labelEn: 'Category K — Scooter',  labelNp: 'वर्ग K — स्कुटर',    emoji: '🛵' },
  { id: 'G',   labelEn: 'Category G — Tractor',  labelNp: 'वर्ग G — ट्र्याक्टर', emoji: '🚜' },
];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function getQ(q: Question, lang: Lang) {
  return lang === 'np' && q.textNp ? q.textNp : q.text;
}
function getOpts(q: Question, lang: Lang): string[] {
  return lang === 'np' && q.optionsNp?.length ? q.optionsNp : q.options;
}
function getExp(q: Question, lang: Lang) {
  return lang === 'np' && q.explanationNp ? q.explanationNp : (q.explanation ?? '');
}

// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ question, index, total, onAnswer, answered, selectedIndex, lang }: {
  question: Question; index: number; total: number;
  onAnswer: (i: number) => void; answered: boolean;
  selectedIndex: number | null; lang: Lang;
}) {
  const opts = getOpts(question, lang);
  const getClass = (i: number) => {
    if (!answered) return 'option-btn';
    if (i === question.correctAnswerIndex) return 'option-btn correct';
    if (i === selectedIndex && i !== question.correctAnswerIndex) return 'option-btn wrong';
    return 'option-btn dimmed';
  };
  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-counter">{index + 1} / {total}</span>
        <span className={`difficulty-badge diff-${question.difficulty?.toLowerCase()}`}>{question.difficulty || 'Medium'}</span>
      </div>
      {question.imageUrl && <img src={question.imageUrl} alt="Question visual" className="question-image" />}
      <p className="question-text">{getQ(question, lang)}</p>
      <div className="options-grid">
        {opts.map((opt, i) => (
          <button key={i} className={getClass(i)} onClick={() => !answered && onAnswer(i)} disabled={answered}>
            <span className="option-letter">{String.fromCharCode(65 + i)}</span>
            <span className="option-text">{opt}</span>
            {answered && i === question.correctAnswerIndex && <span className="option-icon">✓</span>}
            {answered && i === selectedIndex && i !== question.correctAnswerIndex && <span className="option-icon">✗</span>}
          </button>
        ))}
      </div>
      {answered && getExp(question, lang) && (
        <div className="explanation-box">
          <strong>{lang === 'np' ? '💡 स्पष्टीकरण:' : '💡 Explanation:'}</strong> {getExp(question, lang)}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${total > 0 ? (current / total) * 100 : 0}%` }} />
    </div>
  );
}

function SessionSummary({ score, total, onRestart, lang }: { score: number; total: number; onRestart: () => void; lang: Lang }) {
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 70;
  return (
    <div className="summary-card">
      <div className={`summary-ring ${passed ? 'pass' : 'fail'}`}><span>{pct}%</span></div>
      <h2 className="summary-title">{passed ? (lang === 'np' ? '🎉 शाबास!' : '🎉 Great Job!') : (lang === 'np' ? '📖 फेरि प्रयास गर्नुहोस्!' : '📖 Keep Practicing!')}</h2>
      <p className="text-muted summary-sub">
        {lang === 'np' ? `${total} मध्ये ${score} सही` : `${score} of ${total} correct`}
      </p>
      <div className="summary-bar-wrapper"><ProgressBar current={score} total={total} /></div>
      <button className="btn btn-primary restart-btn" onClick={onRestart}>
        {lang === 'np' ? 'पुनः प्रयास गर्नुहोस्' : 'Try Again'}
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PracticeMode() {
  const [lang, setLang]               = useState<Lang>('np');
  const [source, setSource]           = useState<Source>('category');
  const [selectedCat, setSelectedCat] = useState('all');
  const [mode, setMode]               = useState<Mode>('setup');
  const [quizQs, setQuizQs]           = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered]       = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore]             = useState(0);

  const { questions, loading, error } = useQuestions(selectedCat === 'all' ? 'all' : selectedCat);
  const { sets, loading: setsLoading }= useQuestionSets();

  // Sets grouped with question counts
  const setsWithCount = useMemo(() => sets.map(s => ({
    ...s,
    count: questions.filter(q => q.setNumber === s.setNumber).length,
  })), [sets, questions]);

  function startCategory() {
    const pool = shuffle(questions);
    if (!pool.length) return;
    setQuizQs(pool); reset(); setMode('quiz');
  }

  function startSet(setNum: number) {
    const pool = questions.filter(q => q.setNumber === setNum);
    if (!pool.length) return;
    setQuizQs(pool); reset(); setMode('quiz');
  }

  function reset() {
    setCurrentIndex(0); setAnswered(false); setSelectedOption(null); setScore(0);
  }

  function handleAnswer(i: number) {
    setAnswered(true); setSelectedOption(i);
    if (i === quizQs[currentIndex].correctAnswerIndex) setScore(s => s + 1);
  }

  function handleNext() {
    if (currentIndex + 1 >= quizQs.length) { setMode('done'); return; }
    setCurrentIndex(idx => idx + 1); setAnswered(false); setSelectedOption(null);
  }

  function handleRestart() { reset(); setMode('setup'); }

  const SET_COLORS = ['#6C5CE7','#00B894','#E17055','#FDCB6E','#0984E3','#E84393','#00CEC9','#636E72'];

  return (
    <div className="practice-page">

      {/* Lang toggle — always visible */}
      <div className="practice-lang-bar">
        {(['np','en'] as Lang[]).map(l => (
          <button key={l} className={`lang-btn ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>
            {l === 'np' ? '🇳🇵 नेपाली' : '🇬🇧 English'}
          </button>
        ))}
      </div>

      {/* ── SETUP ───────────────────────────────────────── */}
      {mode === 'setup' && (
        <div className="practice-content">

          {/* Source tabs */}
          <div className="practice-source-tabs">
            <button className={`source-tab ${source === 'category' ? 'active' : ''}`} onClick={() => setSource('category')}>
              {lang === 'np' ? '🎲 वर्ग अनुसार (र्यान्डम)' : '🎲 By Category (Random)'}
            </button>
            <button className={`source-tab ${source === 'set' ? 'active' : ''}`} onClick={() => setSource('set')}>
              {lang === 'np' ? '📋 सेट अनुसार' : '📋 By Set'}
            </button>
          </div>

          {source === 'category' && (
            <>
              <p className="practice-section-label">
                {lang === 'np' ? 'वर्ग छान्नुहोस्' : 'Select Category'}
              </p>
              <div className="category-bar" style={{ padding: '0.5rem 0', background: 'transparent', borderBottom: 'none' }}>
                {CATEGORIES.map(c => (
                  <button key={c.id}
                    className={`cat-tab ${selectedCat === c.id ? 'active' : ''}`}
                    onClick={() => setSelectedCat(c.id)}>
                    <span>{c.emoji}</span>
                    <span>{lang === 'np' ? c.labelNp : c.labelEn}</span>
                  </button>
                ))}
              </div>
              {loading
                ? <div className="loader-container"><div className="loader"/></div>
                : <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.05rem' }} onClick={startCategory}>
                    {lang === 'np' ? 'अभ्यास सुरु गर्नुहोस् →' : 'Start Practice →'}
                  </button>}
            </>
          )}

          {source === 'set' && (
            <>
              <p className="practice-section-label">
                {lang === 'np' ? 'सेट छान्नुहोस्' : 'Select a Set'}
              </p>
              {setsLoading || loading
                ? <div className="loader-container"><div className="loader"/></div>
                : setsWithCount.length === 0
                  ? <div className="empty-state">
                      <p style={{ fontSize: '2rem' }}>📭</p>
                      <p className="text-muted">{lang === 'np' ? 'कुनै सेट फेला परेन।' : 'No sets found.'}</p>
                    </div>
                  : <div className="practice-sets-grid">
                      {setsWithCount.map((s, i) => (
                        <button key={s.id}
                          className="practice-set-card"
                          style={{ '--set-color': SET_COLORS[i % SET_COLORS.length] } as React.CSSProperties}
                          onClick={() => { startSet(s.setNumber); }}>
                          <span className="set-num">Set {s.setNumber}</span>
                          <span className="set-name">{s.name}</span>
                          {s.description && <span className="set-desc">{s.description}</span>}
                          <span className="set-count">{s.count} {lang === 'np' ? 'प्रश्न' : 'questions'}</span>
                        </button>
                      ))}
                    </div>}
            </>
          )}
        </div>
      )}

      {/* ── QUIZ ────────────────────────────────────────── */}
      {mode === 'quiz' && quizQs.length > 0 && (
        <>
          <div className="category-bar" style={{ justifyContent: 'space-between', padding: '0.75rem 1.5rem' }}>
            <div className="session-stats" style={{ margin: 0, flex: 1 }}>
              <span>{lang === 'np' ? `अंक: ${score}` : `Score: ${score}`}</span>
              <ProgressBar current={currentIndex} total={quizQs.length} />
              <span>{quizQs.length} {lang === 'np' ? 'प्रश्न' : 'Qs'}</span>
            </div>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={handleRestart}>
              {lang === 'np' ? 'छोड्नुहोस्' : 'Quit'}
            </button>
          </div>
          <div className="practice-content">
            {error && <div className="error-box"><p>⚠️ {error}</p></div>}
            <QuestionCard
              question={quizQs[currentIndex]} index={currentIndex} total={quizQs.length}
              onAnswer={handleAnswer} answered={answered} selectedIndex={selectedOption} lang={lang}
            />
            {answered && (
              <button className="btn btn-primary next-btn" onClick={handleNext}>
                {currentIndex + 1 >= quizQs.length
                  ? (lang === 'np' ? 'नतिजा हेर्नुहोस् →' : 'See Results →')
                  : (lang === 'np' ? 'अर्को प्रश्न →' : 'Next Question →')}
              </button>
            )}
          </div>
        </>
      )}

      {/* ── DONE ────────────────────────────────────────── */}
      {mode === 'done' && (
        <div className="practice-content">
          <SessionSummary score={score} total={quizQs.length} onRestart={handleRestart} lang={lang} />
        </div>
      )}
    </div>
  );
}
