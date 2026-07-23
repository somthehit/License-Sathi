'use client';

import React from 'react';
import { FaChartLine, FaTrophy, FaCalendarCheck } from 'react-icons/fa';

export default function ProgressPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
          <FaChartLine className="text-indigo-600" /> My Progress
        </h1>
        <p className="text-slate-500">Track your mock exam scores and study streaks.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <FaTrophy size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Average Score</p>
            <p className="text-2xl font-bold">82%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <FaCalendarCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Study Streak</p>
            <p className="text-2xl font-bold">5 Days</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold mb-4">Recent Exams</h2>
        <div className="space-y-4">
          {[
            { id: 1, date: 'Today, 10:30 AM', score: 45, total: 50, pass: true },
            { id: 2, date: 'Yesterday, 2:15 PM', score: 40, total: 50, pass: true },
            { id: 3, date: '3 days ago', score: 22, total: 50, pass: false },
          ].map((exam) => (
            <div key={exam.id} className="flex justify-between items-center p-4 border rounded-xl border-slate-50">
              <div>
                <p className="font-semibold">{exam.date}</p>
                <p className={`text-sm ${exam.pass ? 'text-green-600' : 'text-red-600'}`}>
                  {exam.pass ? 'Passed' : 'Failed'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{exam.score} / {exam.total}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
