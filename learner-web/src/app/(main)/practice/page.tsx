'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  collection, getDocs, query, where, orderBy, limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  FaPen, FaClock, FaCheck, FaTimes, FaChevronRight,
  FaLayerGroup, FaFilter, FaRedo, FaTrophy, FaFire,
} from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionSet {
  id: string;
  name: string;
  description?: string;
  setNumber: number;
  questionCount: number;
}

interface Question {
  id: string;
  questionEn: string;
  questionNp?: string;
  optionsEn: string;          // pipe-separated OR array
  correctOptionIndex: number;
  explanationEn?: string;
  difficulty: string;
  setId?: string;
  status: string;
}

type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';
type Screen = 'setup' | 'quiz' | 'result';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split('|').map(s => s.trim()).filter(Boolean);
  return [];
}

const DIFF_STYLES: Record<Difficulty, { pill: string; ring: string }> = {
  All:    { pill: 'bg-slate-100 text-slate-700',   ring: 'ring-slate-400' },
  Easy:   { pill: 'bg-green-100 text-green-700',   ring: 'ring-green-500' },
  Medium: { pill: 'bg-yellow-100 text-yellow-700', ring: 'ring-yellow-500' },
  Hard:   { pill: 'bg-red-100 text-red-700',       ring: 'ring-red-500' },
};

const DIFF_OPTIONS: Difficulty[] = ['All', 'Easy', 'Medium', 'Hard'];

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function PracticePage() {
  const [screen, setScreen]           = useState<Screen>('setup');
  const [sets, setSets]               = useState<QuestionSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(true);

  // Setup selections
  const [selectedSet,  setSelectedSet]  = useState<QuestionSet | null>(null);
  const [difficulty,   setDifficulty]   = useState<Difficulty>('All');

  // Quiz state
  const [questions,    setQuestions]    = useState<Question[]>([]);
  const [quizLoading,  setQuizLoading]  = useState(false);
  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [answers,      setAnswers]      = useState<Record<string, number>>({}); // qId → chosen index
  const [timeLeft,     setTimeLeft]     = useState(0);

  // ── Load question sets ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'question_sets'), orderBy('setNumber', 'asc'))
        );
        setSets(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionSet)));
      } catch (e) {
        console.error('Failed to load sets', e);
      } finally {
        setSetsLoading(false);
      }
    })();
  }, []);

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'quiz' || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { setScreen('result'); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [screen, timeLeft]);

  // ── Start quiz ───────────────────────────────────────────────────────────────
  const startQuiz = useCallback(async () => {
    if (!selectedSet) return;
    setQuizLoading(true);
    try {
      let q = query(
        collection(db, 'questions'),
        where('status', '==', 'Active'),
        where('setId', '==', selectedSet.id),
        limit(50),
      );
      if (difficulty !== 'All') {
        q = query(
          collection(db, 'questions'),
          where('status', '==', 'Active'),
          where('setId', '==', selectedSet.id),
          where('difficulty', '==', difficulty),
          limit(50),
        );
      }
      const snap = await getDocs(q);
      const loaded = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Question))
        .filter(q => parseOptions(q.optionsEn).length > 0)
        .sort(() => Math.random() - 0.5);

      if (loaded.length === 0) {
        alert('No questions found for this selection. Try a different set or difficulty.');
        return;
      }

      setQuestions(loaded);
      setCurrentIdx(0);
      setAnswers({});
      setTimeLeft(loaded.length * 60); // 1 min per question
      setScreen('quiz');
    } catch (e) {
      console.error('Failed to load questions', e);
      alert('Failed to load questions. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  }, [selectedSet, difficulty]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAnswer = (qId: string, idx: number) => {
    if (answers[qId] !== undefined) return;
    setAnswers(p => ({ ...p, [qId]: idx }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(p => p + 1);
    else setScreen('result');
  };

  const handleRetry = () => {
    setScreen('setup');
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
  };

  // ─── Screens ─────────────────────────────────────────────────────────────────

  if (screen === 'setup') {
    return (
      <SetupScreen
        sets={sets}
        setsLoading={setsLoading}
        selectedSet={selectedSet}
        setSelectedSet={setSelectedSet}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onStart={startQuiz}
        loading={quizLoading}
      />
    );
  }

  if (screen === 'quiz') {
    return (
      <QuizScreen
        questions={questions}
        currentIdx={currentIdx}
        answers={answers}
        timeLeft={timeLeft}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onQuit={() => setScreen('result')}
      />
    );
  }

  return (
    <ResultScreen
      questions={questions}
      answers={answers}
      setName={selectedSet?.name ?? ''}
      difficulty={difficulty}
      onRetry={handleRetry}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function SetupScreen({
  sets, setsLoading, selectedSet, setSelectedSet,
  difficulty, setDifficulty, onStart, loading,
}: {
  sets: QuestionSet[];
  setsLoading: boolean;
  selectedSet: QuestionSet | null;
  setSelectedSet: (s: QuestionSet) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  loading: boolean;
}) {
  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
          <FaPen size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Practice Quiz</h1>
          <p className="text-sm text-slate-500">Choose a set and difficulty to begin</p>
        </div>
      </div>

      {/* Step 1 — Select Set */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <FaLayerGroup className="text-orange-500" size={14} />
          <h2 className="font-bold text-slate-800 text-sm">Step 1 — Select Question Set</h2>
        </div>
        <div className="p-4 space-y-2">
          {setsLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))
          ) : sets.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No question sets available yet. Ask your admin to create some.
            </p>
          ) : (
            sets.map(set => {
              const active = selectedSet?.id === set.id;
              return (
                <button
                  key={set.id}
                  onClick={() => setSelectedSet(set)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                    active
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-100 hover:border-orange-200 hover:bg-orange-50/40'
                  }`}
                >
                  <div>
                    <p className={`font-bold text-sm ${active ? 'text-orange-700' : 'text-slate-800'}`}>
                      Set {set.setNumber} — {set.name}
                    </p>
                    {set.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{set.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{set.questionCount} questions</p>
                  </div>
                  {active && <FaCheck className="text-orange-500 flex-shrink-0" size={16} />}
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Step 2 — Select Difficulty */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <FaFilter className="text-orange-500" size={14} />
          <h2 className="font-bold text-slate-800 text-sm">Step 2 — Select Difficulty</h2>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {DIFF_OPTIONS.map(d => {
            const active = difficulty === d;
            const s = DIFF_STYLES[d];
            return (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                  active
                    ? `${s.pill} border-current ring-2 ${s.ring} ring-offset-1`
                    : 'border-slate-100 text-slate-600 hover:border-slate-300'
                }`}
              >
                {d === 'All' ? '🎯 All Levels' : d === 'Easy' ? '🟢 Easy' : d === 'Medium' ? '🟡 Medium' : '🔴 Hard'}
              </button>
            );
          })}
        </div>
      </section>

      {/* Start Button */}
      <button
        onClick={onStart}
        disabled={!selectedSet || loading}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
          selectedSet && !loading
            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>Loading questions…</>
        ) : (
          <>
            <FaFire /> Start Practice
            {selectedSet && <span className="opacity-70 text-sm font-normal">· Set {selectedSet.setNumber}, {difficulty}</span>}
          </>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function QuizScreen({
  questions, currentIdx, answers, timeLeft,
  onAnswer, onNext, onQuit,
}: {
  questions: Question[];
  currentIdx: number;
  answers: Record<string, number>;
  timeLeft: number;
  onAnswer: (qId: string, idx: number) => void;
  onNext: () => void;
  onQuit: () => void;
}) {
  const q = questions[currentIdx];
  const options = parseOptions(q.optionsEn);
  const chosen = answers[q.id];
  const answered = chosen !== undefined;
  const isLast = currentIdx === questions.length - 1;
  const mins = Math.floor(timeLeft / 60);
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const timerColor = timeLeft < 60 ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50';
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4 min-h-screen flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-sm font-semibold text-slate-500">
          {currentIdx + 1} <span className="text-slate-300">/</span> {questions.length}
        </div>
        <div className="flex-1 mx-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className={`flex items-center gap-1.5 font-bold text-sm px-3 py-1 rounded-full ${timerColor}`}>
          <FaClock size={12} /> {mins}:{secs}
        </div>
      </div>

      {/* Difficulty badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DIFF_STYLES[q.difficulty as Difficulty]?.pill ?? 'bg-slate-100 text-slate-600'}`}>
          {q.difficulty}
        </span>
      </div>

      {/* Question card */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <p className="text-lg font-semibold text-slate-800 leading-snug mb-5">{q.questionEn}</p>

        <div className="space-y-3">
          {options.map((opt, idx) => {
            const isChosen  = chosen === idx;
            const isCorrect = idx === q.correctOptionIndex;
            let cls = 'w-full text-left p-4 rounded-xl border-2 transition-all text-sm ';

            if (!answered) {
              cls += 'border-slate-200 hover:border-orange-400 hover:bg-orange-50';
            } else if (isCorrect) {
              cls += 'border-green-500 bg-green-50 text-green-900 font-semibold';
            } else if (isChosen) {
              cls += 'border-red-400 bg-red-50 text-red-800';
            } else {
              cls += 'border-slate-100 text-slate-400';
            }

            return (
              <button key={idx} disabled={answered} onClick={() => onAnswer(q.id, idx)} className={cls}>
                <span className="inline-flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    answered && isCorrect ? 'border-green-500 bg-green-500 text-white' :
                    answered && isChosen  ? 'border-red-400 bg-red-400 text-white' :
                    'border-slate-300 text-slate-400'
                  }`}>
                    {answered && isCorrect ? <FaCheck size={9} /> :
                     answered && isChosen  ? <FaTimes size={9} /> :
                     String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered && q.explanationEn && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-600 mb-1">💡 Explanation</p>
            <p className="text-sm text-blue-800 leading-relaxed">{q.explanationEn}</p>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3">
        <button onClick={onQuit} className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50">
          Quit
        </button>
        <button
          disabled={!answered}
          onClick={onNext}
          className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            answered
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isLast ? <><FaTrophy size={13} /> Finish</> : <>Next <FaChevronRight size={11} /></>}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULT SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function ResultScreen({
  questions, answers, setName, difficulty, onRetry,
}: {
  questions: Question[];
  answers: Record<string, number>;
  setName: string;
  difficulty: Difficulty;
  onRetry: () => void;
}) {
  const correct = questions.filter(q => answers[q.id] === q.correctOptionIndex).length;
  const total   = questions.length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed  = pct >= 60;

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 space-y-5">

      {/* Score card */}
      <div className={`rounded-3xl p-8 text-center text-white ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
          {passed ? <FaTrophy size={36} className="text-yellow-300" /> : <FaTimes size={36} />}
        </div>
        <p className="text-5xl font-bold">{pct}%</p>
        <p className="text-lg font-semibold mt-1 opacity-90">{passed ? 'Passed! 🎉' : 'Not yet — keep practicing!'}</p>
        <p className="text-sm opacity-70 mt-2">{correct} correct out of {total} questions</p>
        <p className="text-xs opacity-60 mt-1">{setName} · {difficulty}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Correct',   value: correct,          color: 'text-green-600 bg-green-50' },
          { label: 'Wrong',     value: total - correct,  color: 'text-red-500 bg-red-50' },
          { label: 'Skipped',   value: total - Object.keys(answers).length, color: 'text-slate-500 bg-slate-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Review — show wrong answers */}
      {questions.some(q => answers[q.id] !== q.correctOptionIndex) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <p className="px-5 py-4 font-bold text-slate-800 text-sm border-b border-slate-100">Review Incorrect Answers</p>
          <div className="divide-y divide-slate-100">
            {questions
              .filter(q => answers[q.id] !== undefined && answers[q.id] !== q.correctOptionIndex)
              .map(q => {
                const opts = parseOptions(q.optionsEn);
                return (
                  <div key={q.id} className="p-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-800">{q.questionEn}</p>
                    <p className="text-xs text-red-600">
                      Your answer: <strong>{opts[answers[q.id]] ?? '—'}</strong>
                    </p>
                    <p className="text-xs text-green-700">
                      Correct: <strong>{opts[q.correctOptionIndex] ?? '—'}</strong>
                    </p>
                    {q.explanationEn && (
                      <p className="text-xs text-slate-500 italic">{q.explanationEn}</p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onRetry} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold bg-orange-600 hover:bg-orange-700 text-white transition-colors">
          <FaRedo size={13} /> Try Again
        </button>
      </div>
    </div>
  );
}
