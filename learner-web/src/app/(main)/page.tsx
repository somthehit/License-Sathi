'use client';

import React from 'react';
import Link from 'next/link';
import { FaBookOpen, FaPen, FaEye, FaRobot } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-poppins text-slate-900">Welcome to License Sathi</h1>
        <p className="text-slate-600 mt-2 text-lg">Prepare for your driving license exam efficiently.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/study" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FaBookOpen size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Study Library</h2>
          <p className="text-slate-500">Read traffic rules, signs, and driving laws.</p>
        </Link>
        
        <Link href="/practice" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FaPen size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Mock Exam</h2>
          <p className="text-slate-500">Test your knowledge with timed practice exams.</p>
        </Link>
        
        <Link href="/ask-expert" className="bg-indigo-600 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow text-white group">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FaRobot size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Ask the Expert</h2>
          <p className="text-indigo-100">Get instant AI-powered answers to your driving queries.</p>
        </Link>

        <Link href="/eye-test" className="bg-emerald-600 p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow text-white group">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FaEye size={24} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Eye Test</h2>
          <p className="text-emerald-100">Check your color vision with the Ishihara test.</p>
        </Link>
      </section>
    </div>
  );
}
