'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  FaBookOpen, FaTrafficLight, FaExclamationTriangle,
  FaCar, FaVideo, FaHeart, FaEye, FaSearch, FaTimes,
  FaStar, FaRegStar, FaChevronRight, FaCloudUploadAlt,
  FaArrowRight, FaCheck, FaQuestionCircle, FaSpinner,
  FaRobot, FaExclamationCircle, FaRedo, FaBookmark, FaRegBookmark,
  FaPlay,
} from 'react-icons/fa';
import { MdGavel } from 'react-icons/md';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RuleArticle {
  id: string;
  titleEn: string;
  titleNp: string;
  contentEn: string;
  contentNp: string;
  topic: string;
}

interface RoadSign {
  id: string;
  nameEn: string;
  nameNp: string;
  descriptionEn: string;
  descriptionNp: string;
  memoryTipEn: string;
  memoryTipNp: string;
  type: string;
  iconName: string;
}

interface FinePenalty {
  id: string;
  offenseEn: string;
  offenseNp: string;
  fineAmount: string;
  category: string;
}

interface Question {
  id: string;
  questionEn: string;
  questionNp: string;
  options: string[];   // parsed from optionsEn pipe-separated or array
  correctOptionIndex: number;
  explanationEn: string;
  explanationNp: string;
  topic: string;
  difficulty: string;
}

interface VideoGuide {
  id: string;
  titleEn: string;
  titleNp: string;
  descriptionEn: string;
  videoUrl: string;
  durationSeconds: number;
  category: string;
}

interface ExpertModal {
  title: string;
  content: string;
  type: string;
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

/** Parse pipe-separated string or array into string[] */
function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split('|').map(s => s.trim()).filter(Boolean);
  return [];
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseInt(v, 10) || 0;
  return 0;
}

// ─── Ask Expert hook ──────────────────────────────────────────────────────────

function useAskExpert() {
  const [modal, setModal] = useState<ExpertModal | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (title: string, content: string, type: string) => {
    setModal({ title, content, type });
    setAnswer(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/ask-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'learner-web-user',
          question: `Explain this ${type}: "${title}"\n\nContext: ${content}`,
          category: type,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setAnswer(data.answer ?? data.explanation ?? 'No response received.');
    } catch {
      setError('Could not reach the expert. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (modal) ask(modal.title, modal.content, modal.type);
  }, [modal, ask]);

  const close = useCallback(() => {
    setModal(null); setAnswer(null); setError(null); setLoading(false);
  }, []);

  return { modal, loading, answer, error, ask, retry, close };
}

// ─── Ask Expert Button ────────────────────────────────────────────────────────

function AskExpertBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
    >
      <FaRobot size={11} /> Ask Expert
    </button>
  );
}

// ─── Ask Expert Modal ─────────────────────────────────────────────────────────

function AskExpertModal({ modal, loading, answer, error, onRetry, onClose }: {
  modal: ExpertModal;
  loading: boolean;
  answer: string | null;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100 flex-shrink-0">
          <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <FaRobot size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">{modal.type}</p>
            <p className="font-bold text-slate-800 text-sm truncate">{modal.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
            <FaTimes size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="flex flex-col items-center py-10 gap-3 text-slate-500">
              <FaSpinner className="animate-spin text-indigo-500" size={28} />
              <p className="text-sm font-medium">Consulting Nepal Traffic Expert…</p>
            </div>
          )}
          {error && !loading && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center space-y-3">
              <FaExclamationCircle className="text-red-400 mx-auto" size={28} />
              <p className="text-sm text-red-700">{error}</p>
              <button onClick={onRetry} className="flex items-center gap-2 mx-auto text-sm font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">
                <FaRedo size={12} /> Retry
              </button>
            </div>
          )}
          {answer && !loading && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Expert Explanation</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{answer}</div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'rules',     label: 'Rules',     icon: FaBookOpen },
  { id: 'signs',     label: 'Signs',     icon: FaTrafficLight },
  { id: 'fines',     label: 'Fines',     icon: FaExclamationTriangle },
  { id: 'law',       label: 'Law',       icon: MdGavel },
  { id: 'vehicle',   label: 'Vehicle',   icon: FaCar },
  { id: 'videos',    label: 'Videos',    icon: FaVideo },
  { id: 'favorites', label: 'Favorites', icon: FaHeart },
];

const SIGN_COLORS: Record<string, { bg: string; text: string }> = {
  Mandatory:     { bg: 'bg-blue-50',   text: 'text-blue-700' },
  Warning:       { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  Informational: { bg: 'bg-green-50',  text: 'text-green-700' },
};

const DIFF_COLORS: Record<string, string> = {
  Easy:   'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard:   'bg-red-100 text-red-700',
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState('rules');
  const [search, setSearch] = useState('');

  // ── Data ────────────────────────────────────────────────────────────────────
  const [rules, setRules] = useState<RuleArticle[]>([]);
  const [signs, setSigns] = useState<RoadSign[]>([]);
  const [fines, setFines] = useState<FinePenalty[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [videos, setVideos] = useState<VideoGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── UI State ─────────────────────────────────────────────────────────────────
  const [starredRules, setStarredRules] = useState<Set<string>>(new Set());
  const [starredSigns, setStarredSigns] = useState<Set<string>>(new Set());
  const [bookmarkedQs, setBookmarkedQs] = useState<Set<string>>(new Set());
  const [signTypeFilter, setSignTypeFilter] = useState('All');
  const expert = useAskExpert();

  // ── Fetch all data from Firestore ────────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setFetchError(null);
      try {
        // 1. study_materials — split by contentType
        const materialsSnap = await getDocs(
          query(collection(db, 'study_materials'), where('status', '==', 'Published'))
        );

        const rulesArr: RuleArticle[] = [];
        const signsArr: RoadSign[] = [];
        const finesArr: FinePenalty[] = [];

        for (const doc of materialsSnap.docs) {
          const d = doc.data();
          const ct = str(d.contentType).toLowerCase();

          // Match admin panel content types (title case) as well as legacy lowercase variants
          const isSign    = ['traffic sign', 'road sign', 'roadsign', 'road_sign', 'sign'].includes(ct);
          const isRule    = ['road rule', 'rule', 'rule article', 'rule_article', 'article', 'traffic rule', 'road_rules'].includes(ct);
          const isLaw     = ct === 'law';
          const isFine    = ['fine', 'fine/penalty', 'penalty', 'fines'].includes(ct);

          if (isSign) {
            signsArr.push({
              id:            doc.id,
              nameEn:        str(d.nameEn ?? d.titleEn ?? d.title),
              nameNp:        str(d.nameNp ?? d.titleNp),
              descriptionEn: str(d.descriptionEn ?? d.descEn ?? d.description),
              descriptionNp: str(d.descriptionNp ?? d.descNp),
              memoryTipEn:   str(d.memoryTipEn),
              memoryTipNp:   str(d.memoryTipNp),
              type:          str(d.type, 'Informational'),
              iconName:      str(d.iconName ?? d.imageUrl, 'sign_info'),
            });
          } else if (isRule || isLaw) {
            rulesArr.push({
              id:        doc.id,
              titleEn:   str(d.titleEn ?? d.title),
              titleNp:   str(d.titleNp),
              contentEn: str(d.contentEn ?? d.descEn ?? d.description ?? d.content),
              contentNp: str(d.contentNp ?? d.descNp),
              topic:     str(d.topic ?? d.topicEn, isLaw ? 'law' : 'general'),
            });
          } else if (isFine) {
            finesArr.push({
              id:         doc.id,
              offenseEn:  str(d.offenseEn ?? d.titleEn ?? d.offense),
              offenseNp:  str(d.offenseNp ?? d.titleNp),
              fineAmount: str(d.fineAmount),
              category:   str(d.category, 'General'),
            });
          }
        }

        setRules(rulesArr);
        setSigns(signsArr);
        setFines(finesArr);

        // 2. questions — active, all topics including Vehicle Knowledge
        const questionsSnap = await getDocs(
          query(collection(db, 'questions'), where('status', '==', 'Active'))
        );
        setQuestions(questionsSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id:                 doc.id,
            questionEn:         str(d.questionEn),
            questionNp:         str(d.questionNp),
            options:            parseOptions(d.optionsEn),
            correctOptionIndex: num(d.correctOptionIndex),
            explanationEn:      str(d.explanationEn),
            explanationNp:      str(d.explanationNp),
            topic:              str(d.topic, 'General'),
            difficulty:         str(d.difficulty, 'Medium'),
          };
        }));

        // 3. video_guides — published
        const videosSnap = await getDocs(
          query(collection(db, 'video_guides'), where('isPublished', '==', true))
        );
        setVideos(videosSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id:              doc.id,
            titleEn:         str(d.titleEn),
            titleNp:         str(d.titleNp),
            descriptionEn:   str(d.descriptionEn),
            videoUrl:        str(d.videoUrl),
            durationSeconds: num(d.durationSeconds),
            category:        str(d.category, 'ALL'),
          };
        }));

      } catch (e) {
        console.error('Study fetch error:', e);
        setFetchError('Failed to load study materials. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Filtered lists ───────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredRules  = useMemo(() => rules.filter(r => !q || r.titleEn.toLowerCase().includes(q) || r.contentEn.toLowerCase().includes(q) || r.topic.toLowerCase().includes(q)), [rules, q]);
  const filteredFines  = useMemo(() => fines.filter(f => !q || f.offenseEn.toLowerCase().includes(q) || f.category.toLowerCase().includes(q) || f.fineAmount.toLowerCase().includes(q)), [fines, q]);
  const filteredSigns  = useMemo(() => {
    const byType = signTypeFilter === 'All' ? signs : signs.filter(s => s.type === signTypeFilter);
    return byType.filter(s => !q || s.nameEn.toLowerCase().includes(q) || s.descriptionEn.toLowerCase().includes(q));
  }, [signs, signTypeFilter, q]);
  const vehicleQs = useMemo(() =>
    questions.filter(q2 => q2.topic.toLowerCase().includes('vehicle')).filter(q2 => !q || q2.questionEn.toLowerCase().includes(q)),
    [questions, q]);
  const favoriteRules = rules.filter(r => starredRules.has(r.id));
  const favoriteSigns = signs.filter(s => starredSigns.has(s.id));
  const favoriteQs    = questions.filter(q2 => bookmarkedQs.has(q2.id));

  // ─── Loading / Error ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-4 max-w-5xl mx-auto">
        <div className="h-8 bg-slate-200 rounded-xl w-48 animate-pulse" />
        <div className="flex gap-2">{TABS.map(t => <div key={t.id} className="h-9 bg-slate-200 rounded-full w-20 animate-pulse" />)}</div>
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-8">
        <FaExclamationCircle className="text-red-400" size={40} />
        <p className="font-semibold text-slate-700">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-indigo-600 border border-indigo-200 px-4 py-2 rounded-full hover:bg-indigo-50">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaBookOpen className="text-indigo-600" /> Study Library
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {rules.length} rules · {signs.length} signs · {fines.length} fines · {questions.length} questions
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold">
          <FaCloudUploadAlt /> Live Data
        </div>
      </header>

      {/* ── Eye Test Banner ─────────────────────────────────────────────────── */}
      <Link href="/eye-test">
        <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <FaEye size={22} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base">Color Blindness Eye Test</p>
            <p className="text-emerald-100 text-sm">Required for driving license — Ishihara plates</p>
          </div>
          <FaArrowRight className="opacity-80 flex-shrink-0" />
        </div>
      </Link>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search rules, signs, fines, questions…"
          className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <FaTimes size={14} />
          </button>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
            >
              <tab.icon size={13} className={active ? 'text-white' : 'text-slate-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      {activeTab === 'rules'     && <RulesTab    rules={filteredRules}  starredRules={starredRules}  setStarredRules={setStarredRules}  onAskExpert={expert.ask} />}
      {activeTab === 'signs'     && <SignsTab    signs={filteredSigns}  starredSigns={starredSigns}  setStarredSigns={setStarredSigns}  signTypeFilter={signTypeFilter} setSignTypeFilter={setSignTypeFilter} onAskExpert={expert.ask} />}
      {activeTab === 'fines'     && <FinesTab    fines={filteredFines}  onAskExpert={expert.ask} />}
      {activeTab === 'law'       && <LawTab      rules={filteredRules}  starredRules={starredRules}  setStarredRules={setStarredRules}  onAskExpert={expert.ask} />}
      {activeTab === 'vehicle'   && <VehicleTab  questions={vehicleQs} bookmarkedQs={bookmarkedQs} setBookmarkedQs={setBookmarkedQs} onAskExpert={expert.ask} />}
      {activeTab === 'videos'    && <VideosTab   videos={videos} />}
      {activeTab === 'favorites' && <FavoritesTab favoriteRules={favoriteRules} favoriteSigns={favoriteSigns} favoriteQs={favoriteQs} onAskExpert={expert.ask} />}

      {/* ── Ask Expert Modal ────────────────────────────────────────────────── */}
      {expert.modal && (
        <AskExpertModal
          modal={expert.modal}
          loading={expert.loading}
          answer={expert.answer}
          error={expert.error}
          onRetry={expert.retry}
          onClose={expert.close}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RULES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function RulesTab({ rules, starredRules, setStarredRules, onAskExpert }: {
  rules: RuleArticle[];
  starredRules: Set<string>;
  setStarredRules: React.Dispatch<React.SetStateAction<Set<string>>>;
  onAskExpert: (t: string, c: string, type: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setStarredRules(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (rules.length === 0) return <Empty icon={<FaBookOpen />} text="No traffic rules found in database." />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 font-medium">{rules.length} rules</p>
      {rules.map(rule => (
        <div key={rule.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="w-full flex items-start justify-between p-4 text-left cursor-pointer" onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}>
            <div className="flex-1 pr-3">
              {rule.topic && <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">{rule.topic.replace(/_/g, ' ')}</span>}
              <p className="font-semibold text-slate-800 mt-0.5 text-sm">{rule.titleEn}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div role="button" tabIndex={0} onClick={e => { e.stopPropagation(); toggle(rule.id); }} onKeyDown={e => e.key === 'Enter' && toggle(rule.id)} className="text-slate-300 hover:text-yellow-400 transition-colors cursor-pointer">
                {starredRules.has(rule.id) ? <FaStar className="text-yellow-400" size={14} /> : <FaRegStar size={14} />}
              </div>
              <FaChevronRight className={`text-slate-300 text-xs transition-transform ${expanded === rule.id ? 'rotate-90' : ''}`} />
            </div>
          </div>
          {expanded === rule.id && (
            <div className="px-4 pb-4 border-t border-slate-100 space-y-3">
              <p className="text-slate-600 text-sm leading-relaxed mt-3">{rule.contentEn}</p>
              <div className="flex justify-end">
                <AskExpertBtn onClick={() => onAskExpert(rule.titleEn, rule.contentEn, 'Traffic Rule')} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function SignsTab({ signs, starredSigns, setStarredSigns, signTypeFilter, setSignTypeFilter, onAskExpert }: {
  signs: RoadSign[];
  starredSigns: Set<string>;
  setStarredSigns: React.Dispatch<React.SetStateAction<Set<string>>>;
  signTypeFilter: string;
  setSignTypeFilter: (v: string) => void;
  onAskExpert: (t: string, c: string, type: string) => void;
}) {
  const [flipped, setFlipped] = useState<string | null>(null);
  const toggle = (id: string) => setStarredSigns(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (signs.length === 0) return <Empty icon={<FaTrafficLight />} text="No road signs found in database." />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {['All', 'Mandatory', 'Warning', 'Informational'].map(t => (
          <button key={t} onClick={() => setSignTypeFilter(t)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${signTypeFilter === t ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {t}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400 font-medium">{signs.length} signs</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {signs.map(sign => {
          const col = SIGN_COLORS[sign.type] ?? { bg: 'bg-slate-50', text: 'text-slate-700' };
          const isFlipped = flipped === sign.id;
          return (
            <div key={sign.id} onClick={() => setFlipped(isFlipped ? null : sign.id)}
              className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>{sign.type}</span>
                <button onClick={e => { e.stopPropagation(); toggle(sign.id); }} className="text-slate-300 hover:text-yellow-400">
                  {starredSigns.has(sign.id) ? <FaStar className="text-yellow-400" size={14} /> : <FaRegStar size={14} />}
                </button>
              </div>
              {!isFlipped ? (
                <div className="flex flex-col items-center py-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-3xl">🚦</div>
                  <p className="font-bold text-slate-800 text-center text-sm">{sign.nameEn}</p>
                  <p className="text-xs text-indigo-400 mt-1">Tap to see details</p>
                </div>
              ) : (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <p className="font-bold text-indigo-600 text-sm">{sign.nameEn}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{sign.descriptionEn}</p>
                  {sign.memoryTipEn && (
                    <div className="bg-indigo-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-indigo-600 mb-1">💡 Memory Tip</p>
                      <p className="text-xs text-indigo-700 italic">{sign.memoryTipEn}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-slate-400">Tap card to flip back</p>
                    <AskExpertBtn onClick={() => onAskExpert(sign.nameEn, sign.descriptionEn + (sign.memoryTipEn ? ' Tip: ' + sign.memoryTipEn : ''), 'Road Sign')} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function FinesTab({ fines, onAskExpert }: {
  fines: FinePenalty[];
  onAskExpert: (t: string, c: string, type: string) => void;
}) {
  if (fines.length === 0) return <Empty icon={<FaExclamationTriangle />} text="No traffic fines found in database." />;
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 font-medium">{fines.length} fines</p>
      {fines.map(fine => (
        <div key={fine.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">{fine.offenseEn}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fine.category}</p>
            </div>
            <div className="bg-red-50 text-red-600 font-bold text-sm px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0">
              {fine.fineAmount}
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <AskExpertBtn onClick={() => onAskExpert(fine.offenseEn, `Fine: ${fine.fineAmount} | Category: ${fine.category}`, 'Traffic Fine')} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAW TAB (same data as rules — rules with legal topics)
// ═══════════════════════════════════════════════════════════════════════════════

function LawTab({ rules, starredRules, setStarredRules, onAskExpert }: {
  rules: RuleArticle[];
  starredRules: Set<string>;
  setStarredRules: React.Dispatch<React.SetStateAction<Set<string>>>;
  onAskExpert: (t: string, c: string, type: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (id: string) => setStarredRules(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (rules.length === 0) return <Empty icon={<MdGavel />} text="No law content found in database." />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 font-medium">{rules.length} articles</p>
      {rules.map(rule => (
        <div key={rule.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="w-full flex items-start gap-3 p-4 text-left cursor-pointer" onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}>
            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <MdGavel size={16} />
            </div>
            <div className="flex-1 pr-2">
              <p className="font-semibold text-slate-800 text-sm">{rule.titleEn}</p>
              <p className="text-xs text-purple-400 mt-0.5 capitalize">{rule.topic?.replace(/_/g, ' ')}</p>
            </div>
            <div role="button" tabIndex={0} onClick={e => { e.stopPropagation(); toggle(rule.id); }} onKeyDown={e => e.key === 'Enter' && toggle(rule.id)} className="text-slate-300 hover:text-yellow-400 cursor-pointer">
              {starredRules.has(rule.id) ? <FaStar className="text-yellow-400" size={14} /> : <FaRegStar size={14} />}
            </div>
          </div>
          {expanded === rule.id && (
            <div className="px-4 pb-4 border-t border-slate-100 space-y-3">
              <p className="text-slate-600 text-sm leading-relaxed mt-3">{rule.contentEn}</p>
              <div className="flex justify-end">
                <AskExpertBtn onClick={() => onAskExpert(rule.titleEn, rule.contentEn, 'Law / Legal Rule')} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VEHICLE KNOWLEDGE TAB
// ═══════════════════════════════════════════════════════════════════════════════

function VehicleTab({ questions, bookmarkedQs, setBookmarkedQs, onAskExpert }: {
  questions: Question[];
  bookmarkedQs: Set<string>;
  setBookmarkedQs: React.Dispatch<React.SetStateAction<Set<string>>>;
  onAskExpert: (t: string, c: string, type: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggleBm = (id: string) => setBookmarkedQs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (questions.length === 0) return <Empty icon={<FaCar />} text="No vehicle knowledge questions found in database." />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 font-medium">{questions.length} questions</p>
      {questions.map(q => {
        const diffCls = DIFF_COLORS[q.difficulty] ?? 'bg-slate-100 text-slate-600';
        const isOpen = expanded === q.id;
        return (
          <div key={q.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="w-full flex items-start gap-3 p-4 text-left cursor-pointer" onClick={() => setExpanded(isOpen ? null : q.id)}>
              <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaQuestionCircle size={15} />
              </div>
              <div className="flex-1 pr-2">
                <p className="font-medium text-slate-800 text-sm">{q.questionEn}</p>
                <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${diffCls}`}>{q.difficulty}</span>
              </div>
              <div role="button" tabIndex={0} onClick={e => { e.stopPropagation(); toggleBm(q.id); }} onKeyDown={e => e.key === 'Enter' && toggleBm(q.id)} className="text-slate-300 hover:text-indigo-500 cursor-pointer">
                {bookmarkedQs.has(q.id) ? <FaBookmark className="text-indigo-500" size={14} /> : <FaRegBookmark size={14} />}
              </div>
            </div>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-slate-100 space-y-2">
                <div className="mt-3 space-y-1.5">
                  {q.options.map((opt, idx) => (
                    <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl text-sm ${
                      idx === q.correctOptionIndex ? 'bg-green-50 border border-green-200 text-green-800 font-semibold' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {idx === q.correctOptionIndex
                        ? <FaCheck className="text-green-500 flex-shrink-0" size={11} />
                        : <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      }
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanationEn && (
                  <div className="bg-teal-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-teal-700 mb-1">💡 Explanation</p>
                    <p className="text-xs text-teal-800 leading-relaxed">{q.explanationEn}</p>
                  </div>
                )}
                <div className="flex justify-end pt-1">
                  <AskExpertBtn onClick={() => onAskExpert(q.questionEn, q.explanationEn, 'Vehicle Knowledge')} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEOS TAB — real data from video_guides collection
// ═══════════════════════════════════════════════════════════════════════════════

function VideosTab({ videos }: { videos: VideoGuide[] }) {
  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  if (videos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 text-sm text-pink-700">
          🎬 No video guides published yet — add them from the admin panel.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 font-medium">{videos.length} videos</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {videos.map(v => (
          <a key={v.id} href={v.videoUrl || '#'} target="_blank" rel="noopener noreferrer"
            className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
            <div className="w-full h-36 bg-slate-100 flex items-center justify-center relative">
              <div className="w-14 h-14 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaPlay size={20} />
              </div>
              {v.durationSeconds > 0 && (
                <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {formatDuration(v.durationSeconds)}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold text-slate-800 text-sm line-clamp-2">{v.titleEn}</p>
              {v.descriptionEn && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{v.descriptionEn}</p>}
              {v.category && v.category !== 'ALL' && (
                <span className="inline-block mt-2 text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-medium">{v.category}</span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAVORITES TAB
// ═══════════════════════════════════════════════════════════════════════════════

function FavoritesTab({ favoriteRules, favoriteSigns, favoriteQs, onAskExpert }: {
  favoriteRules: RuleArticle[];
  favoriteSigns: RoadSign[];
  favoriteQs: Question[];
  onAskExpert: (t: string, c: string, type: string) => void;
}) {
  const total = favoriteRules.length + favoriteSigns.length + favoriteQs.length;
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center"><FaHeart size={28} /></div>
        <p className="font-semibold text-slate-700">No Favorites Yet</p>
        <p className="text-sm text-slate-400 max-w-xs">Star rules/signs or bookmark questions to see them here.</p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {favoriteRules.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Traffic Rules ({favoriteRules.length})</h3>
          <div className="space-y-2">
            {favoriteRules.map(r => (
              <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2">
                <p className="font-semibold text-indigo-600 text-sm">{r.titleEn}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{r.contentEn}</p>
                <div className="flex justify-end">
                  <AskExpertBtn onClick={() => onAskExpert(r.titleEn, r.contentEn, 'Traffic Rule')} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {favoriteSigns.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Road Signs ({favoriteSigns.length})</h3>
          <div className="space-y-2">
            {favoriteSigns.map(s => (
              <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">🚦</div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{s.nameEn}</p>
                  <p className="text-xs text-slate-400">{s.type}</p>
                </div>
                <AskExpertBtn onClick={() => onAskExpert(s.nameEn, s.descriptionEn, 'Road Sign')} />
              </div>
            ))}
          </div>
        </section>
      )}
      {favoriteQs.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bookmarked Questions ({favoriteQs.length})</h3>
          <div className="space-y-2">
            {favoriteQs.map(q => (
              <div key={q.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2">
                <p className="font-medium text-slate-800 text-sm">{q.questionEn}</p>
                <div className="flex justify-end">
                  <AskExpertBtn onClick={() => onAskExpert(q.questionEn, q.explanationEn, 'Vehicle Knowledge')} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-2xl">{icon}</div>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
