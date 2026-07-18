"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseClient';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // If already logged in, skip the login page
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => { if (res.ok) router.replace(searchParams.get('next') ?? '/'); })
      .catch(() => { /* not logged in, stay on login page */ });
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Sign in with Firebase client SDK to get an ID token
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      // 2. Send the ID token to our server — it will check admin role and set a session cookie
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Sign the user back out on the client if the server rejected them
        await auth.signOut();
        setError(data.error ?? 'Login failed. Please try again.');
        return;
      }

      // 3. Redirect to the originally requested page (or dashboard)
      router.replace(searchParams.get('next') ?? '/');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#e5e2e1', minHeight: '100vh' }} className="flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} className="mb-4">
          <span className="material-symbols-outlined text-[#b1002c] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-[#1c1b1b]">License Sathi</h1>
        <p className="text-xs font-bold tracking-widest text-[#5c3f3f] uppercase mt-1">Management Console</p>
      </div>

      {/* Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 440 }} className="p-8">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div style={{ border: '1px solid #e6bdbc', borderRadius: '99px', padding: '4px 16px' }} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#b1002c]" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            <span className="text-xs font-bold text-[#5c3f3f] uppercase tracking-widest">Secure Admin Access</span>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ backgroundColor: '#ffdad9', border: '1px solid #b1002c40', borderRadius: '10px', padding: '10px 14px', marginBottom: 16 }} className="flex items-start gap-2">
            <span className="material-symbols-outlined text-sm text-[#b1002c] mt-0.5">error</span>
            <p className="text-sm text-[#b1002c] font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#1c1b1b] mb-1.5">Email Address</label>
            <div style={{ border: `1px solid ${error ? '#b1002c' : '#e6bdbc'}`, borderRadius: '10px', backgroundColor: '#f6f3f2' }} className="flex items-center gap-3 px-4 py-3">
              <span className="material-symbols-outlined text-[#5c3f3f] text-xl">alternate_email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="admin@licensesathi.com"
                className="flex-1 bg-transparent outline-none text-sm text-[#1c1b1b] placeholder:text-[#5c3f3f]/60"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-[#1c1b1b]">Password</label>
              <button type="button" className="text-sm font-semibold text-[#335ab4] hover:underline">Forgot Password?</button>
            </div>
            <div style={{ border: `1px solid ${error ? '#b1002c' : '#e6bdbc'}`, borderRadius: '10px', backgroundColor: '#f6f3f2' }} className="flex items-center gap-3 px-4 py-3">
              <span className="material-symbols-outlined text-[#5c3f3f] text-xl">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="flex-1 bg-transparent outline-none text-sm text-[#1c1b1b] placeholder:text-[#5c3f3f]"
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                <span className="material-symbols-outlined text-[#5c3f3f] text-xl hover:text-[#1c1b1b] transition-colors">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" style={{ accentColor: '#b1002c' }} className="w-4 h-4 rounded" />
            <label htmlFor="remember" className="text-sm text-[#5c3f3f]">Keep me signed in</label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: '#b1002c', color: '#fff', borderRadius: '10px' }}
            className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Signing in...
              </>
            ) : (
              <>
                Sign In to Console
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #e6bdbc' }} className="mt-6 pt-5 text-center">
          <p className="text-sm text-[#5c3f3f]">
            Need assistance?{' '}
            <a href="#" className="font-bold text-[#335ab4] hover:underline">Contact Support</a>
          </p>
        </div>
      </div>

      <p className="text-xs text-[#5c3f3f] mt-6">© 2024 Nepal Driving License Portal. All rights reserved.</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
