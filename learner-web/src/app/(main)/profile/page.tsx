'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaUser, FaEnvelope, FaGoogle, FaSignOutAlt, FaLock, FaUserPlus, FaSignInAlt, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

export default function ProfilePage() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, error, clearError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Logged out: Auth form ──────────────────────────────────
  if (!user) {
    return (
      <div className="p-4 md:p-8 max-w-md mx-auto space-y-6">
        <header className="text-center">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser size={36} />
          </div>
          <h1 className="text-2xl font-bold font-poppins">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p className="text-slate-500 mt-1">{isSignUp ? 'Sign up to track your progress' : 'Sign in to your account'}</p>
        </header>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm">
            <FaExclamationCircle className="text-rose-500 flex-shrink-0" />
            <p className="text-rose-700">{error}</p>
            <button onClick={clearError} className="ml-auto text-rose-400 hover:text-rose-600">&times;</button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
            <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
            <p className="text-emerald-700">{success}</p>
          </div>
        )}

        {/* Google Sign-In */}
        <button
          onClick={async () => {
            try { await signInWithGoogle(); } catch {}
          }}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
        >
          <FaGoogle className="text-[#4285F4]" size={20} />
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-slate-50 px-3 text-slate-400">or</span></div>
        </div>

        {/* Email Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setSuccess('');
            try {
              if (isSignUp) {
                await signUpWithEmail(email, password, name);
                setSuccess('Account created successfully!');
              } else {
                await signInWithEmail(email, password);
              }
            } catch {}
            setSubmitting(false);
          }}
          className="space-y-4"
        >
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? <FaUserPlus size={16} /> : <FaSignInAlt size={16} />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); clearError(); setSuccess(''); }}
            className="text-indigo-600 font-semibold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    );
  }

  // ── Logged in: Profile ──────────────────────────────────────
  const initials = (user.displayName || user.email || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
          <FaUser className="text-indigo-600" /> My Profile
        </h1>
        <p className="text-slate-500">Manage your account and settings.</p>
      </header>

      {/* Avatar Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
        <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <h2 className="text-xl font-bold">{user.displayName || 'User'}</h2>
        <p className="text-slate-500">Learner</p>
        {user.emailVerified && (
          <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
            <FaCheckCircle size={12} /> Verified
          </span>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          <div className="p-4 flex items-center gap-4">
            <FaEnvelope className="text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          {user.displayName && (
            <div className="p-4 flex items-center gap-4">
              <FaUser className="text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Display Name</p>
                <p className="font-medium">{user.displayName}</p>
              </div>
            </div>
          )}
          <div className="p-4 flex items-center gap-4">
            <FaUser className="text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">User ID</p>
              <p className="font-medium text-xs text-slate-400 font-mono">{user.uid}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button
          onClick={async () => {
            await signOut();
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors"
        >
          <div className="flex items-center gap-3 font-medium text-red-600">
            <FaSignOutAlt /> Sign Out
          </div>
        </button>
      </div>
    </div>
  );
}
