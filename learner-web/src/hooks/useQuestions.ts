import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Canonical schema written by the admin panel and Android app
export interface Question {
  id: string;
  // Display fields (mapped from Firestore)
  text: string;           // mapped from questionEn
  textNp: string;         // mapped from questionNp
  options: string[];      // mapped from optionsEn (pipe-separated)
  optionsNp: string[];    // mapped from optionsNp (pipe-separated)
  correctAnswerIndex: number; // mapped from correctOptionIndex
  category: string;
  topic: string;
  difficulty: string;
  explanation?: string;   // mapped from explanationEn
  explanationNp?: string;
  imageUrl?: string;      // mapped from imageRef
  setNumber?: number;
  status: string;
}

function mapDoc(id: string, data: Record<string, unknown>): Question {
  const optionsEn = typeof data.optionsEn === 'string'
    ? data.optionsEn.split('|').map((s: string) => s.trim())
    : (Array.isArray(data.options) ? data.options as string[] : []);

  const optionsNp = typeof data.optionsNp === 'string'
    ? data.optionsNp.split('|').map((s: string) => s.trim())
    : [];

  return {
    id,
    text:               (data.questionEn  as string) ?? (data.text as string) ?? '',
    textNp:             (data.questionNp  as string) ?? '',
    options:            optionsEn,
    optionsNp:          optionsNp,
    correctAnswerIndex: typeof data.correctOptionIndex === 'number'
                          ? data.correctOptionIndex
                          : typeof data.correctAnswerIndex === 'number'
                            ? data.correctAnswerIndex
                            : 0,
    category:           (data.category   as string) ?? '',
    topic:              (data.topic      as string) ?? '',
    difficulty:         (data.difficulty as string) ?? 'Medium',
    explanation:        (data.explanationEn as string) ?? (data.explanation as string),
    explanationNp:      (data.explanationNp as string),
    imageUrl:           (data.imageRef   as string) ?? (data.imageUrl as string),
    setNumber:          typeof data.setNumber === 'number' ? data.setNumber : undefined,
    status:             (data.status     as string) ?? 'Active',
  };
}

export function useQuestions(category: string = 'all', setNumber?: number) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use single-field queries only — composite indexes are not guaranteed to exist.
        // All filtering beyond that is done client-side.
        let q;
        if (category !== 'all') {
          // Single where on category — no composite index needed
          q = query(collection(db, 'questions'), where('category', '==', category));
        } else {
          // Fetch everything — filter Active client-side
          q = query(collection(db, 'questions'));
        }

        const snapshot = await getDocs(q);
        let data = snapshot.docs
          .map(doc => mapDoc(doc.id, doc.data() as Record<string, unknown>))
          .filter(q => q.status === 'Active'); // always filter Active client-side

        // For specific category, also include 'ALL' questions
        if (category !== 'all') {
          const allCatSnap = await getDocs(
            query(collection(db, 'questions'), where('category', '==', 'ALL'))
          );
          const allCatData = allCatSnap.docs
            .map(doc => mapDoc(doc.id, doc.data() as Record<string, unknown>))
            .filter(q => q.status === 'Active');
          // Merge, deduplicate by id
          const seen = new Set(data.map(q => q.id));
          data = [...data, ...allCatData.filter(q => !seen.has(q.id))];
        }

        // Filter by set if requested
        if (setNumber !== undefined) {
          data = data.filter(q => q.setNumber === setNumber);
        }

        setQuestions(data);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category, setNumber]);

  return { questions, loading, error };
}

// Fetch all published question sets from Firestore
export interface QuestionSet {
  id: string;
  name: string;
  description?: string;
  setNumber: number;
  questionCount?: number;
}

export function useQuestionSets() {
  const [sets,    setSets]    = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, 'question_sets'), orderBy('setNumber'));
        const snap = await getDocs(q);
        setSets(snap.docs.map(d => ({ id: d.id, ...d.data() } as QuestionSet)));
      } catch (e) {
        console.error('Failed to fetch question sets', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { sets, loading };
}
