'use client';

import { useState, FormEvent } from 'react';
import { FaEnvelope, FaUser, FaExternalLinkAlt, FaMapMarkerAlt, FaGlobe, FaPaperPlane, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }

      setStatus('success');
      resetForm();
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FaEnvelope size={28} className="text-violet-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold font-poppins">Contact Us</h1>
              <p className="text-violet-200 mt-1">We&apos;d love to hear from you</p>
            </div>
          </div>
          <p className="text-violet-100 text-lg max-w-2xl">
            Have questions, feedback, or need assistance? Fill out the form below or reach out directly.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5">
              <FaEnvelope size={24} />
            </div>
            <h2 className="text-xl font-bold font-poppins text-slate-900 mb-2">Email Support</h2>
            <p className="text-slate-500 mb-4">Our support team responds within 24 hours.</p>
            <a
              href="mailto:support@licensesathi.com.np"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              support@licensesathi.com.np
              <FaExternalLinkAlt size={12} />
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5">
              <FaUser size={24} />
            </div>
            <h2 className="text-xl font-bold font-poppins text-slate-900 mb-2">Developer</h2>
            <p className="text-slate-500 mb-4">Direct contact with the developer.</p>
            <a
              href="mailto:somthehit@gmail.com"
              className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
            >
              somthehit@gmail.com
              <FaExternalLinkAlt size={12} />
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
              <FaPaperPlane size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">Send us a Message</h2>
          </div>

          {/* Success State */}
          {status === 'success' && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
              <FaCheckCircle size={20} className="text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-800">Message sent successfully!</p>
                <p className="text-emerald-600 text-sm">We&apos;ll get back to you within 24 hours.</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl mb-6">
              <FaExclamationCircle size={20} className="text-rose-600" />
              <div>
                <p className="font-semibold text-rose-800">Failed to send message</p>
                <p className="text-rose-600 text-sm">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  minLength={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="How can we help?"
                required
                minLength={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us more about your question or feedback..."
                required
                minLength={10}
                rows={5}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {status === 'submitting' ? (
                <>
                  <FaSpinner size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane size={16} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <FaMapMarkerAlt size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">Our Location</h2>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <FaMapMarkerAlt size={20} className="text-amber-600 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Nepal</h3>
                <p className="text-slate-600 mt-1">Serving all 77 districts of Nepal</p>
                <div className="flex items-center gap-2 mt-3">
                  <FaGlobe size={14} className="text-amber-600" />
                  <span className="text-slate-600 text-sm">Available nationwide</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Official Resources */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <FaExternalLinkAlt size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">Official Resources</h2>
          </div>
          <p className="text-slate-600 mb-5">Official Nepali government resources for driving license information:</p>
          <div className="grid gap-3">
            <a
              href="https://www.dotm.gov.np"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FaExternalLinkAlt size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Department of Transport Management (DOTM)</h3>
                <p className="text-slate-600 text-sm">Official government transport authority</p>
              </div>
              <FaExternalLinkAlt size={14} className="text-indigo-400" />
            </a>
            <a
              href="https://www.nrsc.gov.np"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FaExternalLinkAlt size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Nepal Road Safety Council</h3>
                <p className="text-slate-600 text-sm">Road safety information and resources</p>
              </div>
              <FaExternalLinkAlt size={14} className="text-indigo-400" />
            </a>
            <a
              href="https://www.nepalpolice.gov.np/traffic-police"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors group"
            >
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <FaExternalLinkAlt size={16} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Nepal Traffic Police</h3>
                <p className="text-slate-600 text-sm">Traffic rules and regulations</p>
              </div>
              <FaExternalLinkAlt size={14} className="text-indigo-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
