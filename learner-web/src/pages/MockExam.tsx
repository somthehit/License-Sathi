import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuestions } from '../hooks/useQuestions';
import type { Question } from '../hooks/useQuestions';
import './MockExam.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'All Categories', emoji: '📚', passMark: 70, timeMin: 20, count: 25 },
  { id: 'A',   label: 'Category A — Motorcycle', emoji: '🏍️', passMark: 80, timeMin: 15, count: 20 },
  { id: 'B',   label: 'Category B — Car / Jeep', emoji: '🚗', passMark: 80, timeMin: 20, count: 25 },
  { id: 'K',   label: 'Category K — Scooter',    emoji: '🛵', passMark: 80, timeMin: 15, count: 20 },
  { id: 'G',   label: 'Category G — Tractor',    emoji: '🚜', passMark: 80, timeMin: 15, count: 20 },
];

type Phase = 'setup' | 'running' | 'results';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Setup Screen ──────────────────────────────────────────────────────────────
function SetupScreen({ onStart }: { onStart: (catId: string) => void }) {
  const [selected, setSelected] = useState('A');
  const cat = CATEGORIES.find(c => c.id === selected)!;

  return (
    <div className="mock-setup">
      <div className="mock-setup-hero">
        <div className="mock-setup-icon">⏱️</div>
        <h1>Official Mock Exam</h1>
        <p className="text-muted">Simulates the Nepal DoTM written licence exam. No feedback during the test — results shown at the end.</p>
      </div>

      <div className="mock-category-grid">
        {CATEGORIES.map(c => (
          <button key={c.id}
            className={`mock-cat-card ${selected === c.id ? 'active' : ''}`}
            onClick={() => setSelected(c.id)}>
            <span className="mock-cat-emoji">{c.emoji}</span>
            <span className="mock-cat-label">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="mock-config-card">
        <div className="mock-config-row">
          <span>📋 Questions</span><strong>{cat.count}</strong>
        </div>
        <div className="mock-config-row">
          <span>⏱️ Time Limit</span><strong>{cat.timeMin} min</strong>
        </div>
        <div className="mock-config-row">
          <span>🎯 Pass Mark</span><strong>{cat.passMark}%</strong>
        </div>
        <div className="mock-config-row warning-row">
          <span>⚠️ Note</span><span>No answer feedback during exam</span>
        </div>
      </div>

      <button className="btn btn-primary mock-start-btn" onClick={() => onStart(selected)}>
        Begin Exam →
      </button>
    </div>
  );
}

// ── Running Screen ────────────────────────────────────────────────────────────
function RunningScreen({
  questions, timeLeft, answers, currentIndex,
  onSelect, onJump, onSubmit, onQuit,
}: {
  questions: Question[];
  timeLeft: number;
  answers: Record<number, number>;
  currentIndex: number;
  onSelect: (idx: number) => void;
  onJump: (idx: number) => void;
  onSubmit: () => void;
  onQuit: () => void;
}) {
  const q = questions[currentIndex];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const pct = total > 0 ? (timeLeft / (total * 60)) * 100 : 0;
  const timerDanger = timeLeft <= 60;

  return (
    <div className="mock-running">
      {/* Top bar */}
      <div className="mock-topbar">
        <button className="mock-quit-btn" onClick={onQuit}>✕ Quit</button>
        <div className="mock-progress-info">
          <span>{answered}/{total} answered</span>
          <div className="mock-timer-bar">
            <div className="mock-timer-fill" style={{ width: `${Math.max(0, pct)}%`, background: timerDanger ? '#FF7675' : 'var(--color-primary)' }} />
          </div>
        </div>
        <div className={`mock-timer ${timerDanger ? 'danger' : ''}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question */}
      <div className="mock-body">
        <div className="mock-question-card">
          <div className="question-header">
            <span className="question-counter">Question {currentIndex + 1} of {total}</span>
            <span className={`difficulty-badge diff-${q.difficulty?.toLowerCase()}`}>{q.difficulty || 'Medium'}</span>
          </div>

          {q.imageUrl && <img src={q.imageUrl} alt="Question visual" className="question-image" />}

          <p className="question-text">{q.text}</p>

          <div className="options-grid">
            {q.options.map((opt, i) => {
              const picked = answers[currentIndex] === i;
              return (
                <button key={i}
                  className={`option-btn ${picked ? 'mock-selected' : ''}`}
                  onClick={() => onSelect(i)}>
                  <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="option-text">{opt}</span>
                  {picked && <span className="option-icon">●</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="mock-nav-row">
          <button className="btn btn-secondary" onClick={() => onJump(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
            ← Prev
          </button>
          {currentIndex < total - 1 ? (
            <button className="btn btn-primary" onClick={() => onJump(currentIndex + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn btn-primary mock-submit-final" onClick={onSubmit}>
              Submit Exam ✓
            </button>
          )}
        </div>

        {/* Question grid */}
        <div className="mock-grid-header">
          <span>Question Navigator</span>
          <span className="text-muted">{answered} answered · {total - answered} remaining</span>
        </div>
        <div className="mock-q-grid">
          {questions.map((_, i) => (
            <button key={i}
              className={`mock-q-dot ${i === currentIndex ? 'current' : ''} ${answers[i] !== undefined ? 'done' : ''}`}
              onClick={() => onJump(i)}>
              {i + 1}
            </button>
          ))}
        </div>

        <button className="btn btn-primary mock-submit-btn" onClick={onSubmit}>
          Submit Exam ({answered}/{total} answered)
        </button>
      </div>
    </div>
  );
}

// ── Results Screen ────────────────────────────────────────────────────────────
function ResultsScreen({
  questions, answers, passMark, timeUsed,
  onRetake, onHome,
}: {
  questions: Question[];
  answers: Record<number, number>;
  passMark: number;
  timeUsed: number;
  onRetake: () => void;
  onHome: () => void;
}) {
  const total   = questions.length;
  const correct = questions.filter((q, i) => answers[i] === q.correctAnswerIndex).length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed  = pct >= passMark;
  const [showReview, setShowReview] = useState(false);

  return (
    <div className="mock-results">
      {/* Score ring */}
      <div className={`mock-score-ring ${passed ? 'pass' : 'fail'}`}>
        <span className="mock-score-pct">{pct}%</span>
        <span className="mock-score-label">{passed ? 'PASS ✓' : 'FAIL ✗'}</span>
      </div>

      <h2 className="mock-result-title">{passed ? '🎉 Congratulations!' : '📖 Keep Practicing!'}</h2>
      <p className="text-muted mock-result-sub">
        You answered <strong>{correct}</strong> out of <strong>{total}</strong> correctly in{' '}
        <strong>{formatTime(timeUsed)}</strong>.
      </p>

      {/* Stats row */}
      <div className="mock-stats-row">
        <div className="mock-stat">
          <span className="mock-stat-val" style={{ color: 'var(--color-success)' }}>{correct}</span>
          <span className="mock-stat-label">Correct</span>
        </div>
        <div className="mock-stat">
          <span className="mock-stat-val" style={{ color: 'var(--color-error)' }}>{total - correct}</span>
          <span className="mock-stat-label">Wrong</span>
        </div>
        <div className="mock-stat">
          <span className="mock-stat-val" style={{ color: 'var(--color-warning)' }}>{total - Object.keys(answers).length}</span>
          <span className="mock-stat-label">Skipped</span>
        </div>
        <div className="mock-stat">
          <span className="mock-stat-val">{passMark}%</span>
          <span className="mock-stat-label">Pass Mark</span>
        </div>
      </div>

      <div className="mock-result-actions">
        <button className="btn btn-secondary" onClick={() => setShowReview(r => !r)}>
          {showReview ? 'Hide Review' : '📋 Review Answers'}
        </button>
        <button className="btn btn-secondary" onClick={onRetake}>🔄 Retake</button>
        <button className="btn btn-primary" onClick={onHome}>🏠 Home</button>
      </div>

      {/* Answer review */}
      {showReview && (
        <div className="mock-review">
          {questions.map((q, i) => {
            const userAns   = answers[i];
            const isCorrect = userAns === q.correctAnswerIndex;
            const skipped   = userAns === undefined;
            return (
              <div key={i} className={`mock-review-item ${isCorrect ? 'review-correct' : skipped ? 'review-skipped' : 'review-wrong'}`}>
                <div className="mock-review-header">
                  <span className="mock-review-num">Q{i + 1}</span>
                  <span className="mock-review-status">
                    {skipped ? '— Skipped' : isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </span>
                </div>
                <p className="mock-review-q">{q.text}</p>
                {!skipped && !isCorrect && (
                  <p className="mock-review-your">Your answer: <em>{q.options[userAns]}</em></p>
                )}
                <p className="mock-review-correct">Correct: <strong>{q.options[q.correctAnswerIndex]}</strong></p>
                {q.explanation && (
                  <p className="mock-review-exp">💡 {q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Controller ───────────────────────────────────────────────────────────
export default function MockExam() {
  const [phase,        setPhase]       = useState<Phase>('setup');
  const [catId,        setCatId]       = useState('A');
  const [examQuestions,setExamQs]      = useState<Question[]>([]);
  const [answers,      setAnswers]     = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex]= useState(0);
  const [timeLeft,     setTimeLeft]    = useState(0);
  const [timeUsed,     setTimeUsed]    = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { questions: allQuestions, loading, error } = useQuestions(catId === 'all' ? 'all' : catId);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleStart = useCallback((selectedCat: string) => {
    setCatId(selectedCat);
    const cat = CATEGORIES.find(c => c.id === selectedCat)!;
    const pool = allQuestions.filter(q =>
      selectedCat === 'all' ? true : q.category === selectedCat || q.category === 'ALL'
    );
    const picked = shuffle(pool).slice(0, cat.count);
    if (picked.length === 0) return;

    const limitSec = cat.timeMin * 60;
    setExamQs(picked);
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(limitSec);
    setTimeUsed(0);
    setPhase('running');

    stopTimer();
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = limitSec - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        setTimeUsed(limitSec);
        setPhase('results');
        stopTimer();
      } else {
        setTimeLeft(remaining);
        setTimeUsed(elapsed);
      }
    }, 1000);
  }, [allQuestions, stopTimer]);

  const handleSubmit = useCallback(() => {
    stopTimer();
    setPhase('results');
  }, [stopTimer]);

  const handleRetake = useCallback(() => {
    stopTimer();
    setPhase('setup');
  }, [stopTimer]);

  // Stop timer on unmount
  useEffect(() => () => stopTimer(), [stopTimer]);

  const cat = CATEGORIES.find(c => c.id === catId)!;

  if (loading && phase === 'setup') {
    return (
      <div className="loader-container">
        <div className="loader" />
        <p>Loading question bank…</p>
      </div>
    );
  }

  if (error && phase === 'setup') {
    return (
      <div className="error-box" style={{ padding: '4rem', textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="mock-page">
      {phase === 'setup' && <SetupScreen onStart={handleStart} />}

      {phase === 'running' && (
        <RunningScreen
          questions={examQuestions}
          timeLeft={timeLeft}
          answers={answers}
          currentIndex={currentIndex}
          onSelect={i => setAnswers(a => ({ ...a, [currentIndex]: i }))}
          onJump={setCurrentIndex}
          onSubmit={handleSubmit}
          onQuit={handleRetake}
        />
      )}

      {phase === 'results' && (
        <ResultsScreen
          questions={examQuestions}
          answers={answers}
          passMark={cat.passMark}
          timeUsed={timeUsed}
          onRetake={handleRetake}
          onHome={handleRetake}
        />
      )}
    </div>
  );
}
