'use client';

import React, { useState } from 'react';
import { FaRobot, FaPaperPlane, FaSpinner } from 'react-icons/fa';

export default function AskExpertPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{role: 'user'|'expert', text: string}[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQuestion = question.trim();
    setConversation(prev => [...prev, { role: 'user', text: userQuestion }]);
    setQuestion('');
    setLoading(true);

    try {
      // Call our own API route — no cross-origin issues
      const response = await fetch('/api/ask-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'learner-web-user',
          question: userQuestion,
          category: 'General',
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch answer');

      const data = await response.json();
      setConversation(prev => [...prev, { role: 'expert', text: data.answer }]);
    } catch (error) {
      console.error(error);
      setConversation(prev => [...prev, { role: 'expert', text: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto md:py-6">
      <header className="p-4 md:p-6 bg-white border-b border-slate-100 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
          <FaRobot size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold font-poppins">Ask the Expert</h1>
          <p className="text-sm text-slate-500">AI-powered driving assistant</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {conversation.length === 0 && (
          <div className="text-center text-slate-500 mt-10">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaRobot size={32} className="text-slate-400" />
            </div>
            <p>Ask me anything about Nepal driving rules, traffic signs, or the licensing process!</p>
          </div>
        )}

        {conversation.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm p-4 flex items-center gap-2">
              <FaSpinner className="animate-spin text-indigo-600" /> Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            placeholder="Type your question..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 pl-6 pr-12 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 disabled:opacity-50 transition-all"
          />
          <button 
            type="submit"
            disabled={!question.trim() || loading}
            className="absolute right-2 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <FaPaperPlane className="relative -left-[1px] top-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
