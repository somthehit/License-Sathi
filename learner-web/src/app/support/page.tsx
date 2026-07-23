'use client';

import { useState } from 'react';
import { FaHeadset, FaChevronDown, FaChevronUp, FaExclamationTriangle, FaBookOpen, FaEye, FaRobot, FaLock, FaWifi, FaSync, FaEnvelope, FaUser, FaExternalLinkAlt } from 'react-icons/fa';

const faqs = [
  {
    q: 'How do I use the app?',
    a: 'Browse the study library to learn traffic rules and road signs, take practice tests, and use the mock exam to assess your readiness. You can also use the Ask Expert feature for instant AI-powered answers.',
  },
  {
    q: 'How does the Eye Test work?',
    a: 'The eye test displays Ishihara color plates used for color vision testing. Enter the number you see on each plate to check your color vision — the same test used in real driving license exams.',
  },
  {
    q: 'What is Ask Expert?',
    a: 'Ask Expert uses AI (Google Gemini or OpenRouter) to answer your questions about Nepal\'s driving rules, traffic laws, and licensing process in real-time.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is encrypted in transit and at rest using industry-standard AES-256-GCM encryption. Your progress and personal information are stored securely on Firebase (Google Cloud).',
  },
];

const troubleshooting = [
  {
    problem: 'App not loading?',
    solution: 'Check your internet connection and try restarting the app. If the issue persists, clear your browser cache.',
  },
  {
    problem: 'Ask Expert not responding?',
    solution: 'The AI service may be temporarily unavailable due to quota limits. Try again in a few minutes.',
  },
  {
    problem: 'Quiz not saving progress?',
    solution: 'Ensure you are signed in to your account. Guest mode progress is stored locally and may be lost if you clear app data.',
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FaHeadset size={28} className="text-blue-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold font-poppins">Support Center</h1>
              <p className="text-blue-200 mt-1">Get help with License Sathi</p>
            </div>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Find answers to common questions or reach out to our support team. We&apos;re here to help you prepare for your driving license exam.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        {/* FAQ Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <FaBookOpen size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">{i + 1}</span>
                    </div>
                    <span className="flex-1 font-semibold text-slate-900">{faq.q}</span>
                    <div className="text-slate-400">
                      {isOpen ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pl-17">
                      <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Troubleshooting */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <FaExclamationTriangle size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">Troubleshooting</h2>
          </div>

          <div className="grid gap-4">
            {troubleshooting.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaExclamationTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{item.problem}</h3>
                    <p className="text-slate-600 mt-1">{item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <FaHeadset size={36} className="mx-auto mb-4 text-blue-200" />
          <h2 className="text-2xl font-bold font-poppins mb-2">Still need help?</h2>
          <p className="text-blue-100 mb-6">Our support team is ready to assist you with any issues.</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
