import { FaShieldAlt, FaLock, FaDatabase, FaPlug, FaUserShield, FaEnvelope } from 'react-icons/fa';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <FaShieldAlt size={28} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold font-poppins">Privacy Policy</h1>
              <p className="text-slate-400 mt-1">How we protect your data</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-slate-300">Last updated: July 2026</span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium">GDPR Compliant</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        {/* Intro */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <p className="text-lg text-slate-700 leading-relaxed">
            At License Sathi, your privacy is fundamental to us. This policy explains what data we collect, how we use it, and the measures we take to keep it secure. We believe in transparency and minimal data collection.
          </p>
        </div>

        {/* Section 1 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <FaDatabase size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">1. Information We Collect</h2>
          </div>
          <p className="text-slate-600 mb-4">License Sathi collects minimal information necessary to provide our driving license exam preparation service:</p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900">Account Information</h3>
                <p className="text-slate-600 text-sm mt-0.5">Email address and display name when you sign in via Google or email/password.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900">Learning Progress</h3>
                <p className="text-slate-600 text-sm mt-0.5">Quiz results, study progress, and mock exam scores to personalize your experience.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900">Device Information</h3>
                <p className="text-slate-600 text-sm mt-0.5">Basic device details for analytics, crash reporting, and improving app performance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
              <FaPlug size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">2. How We Use Your Information</h2>
          </div>
          <div className="grid gap-3">
            {[
              { title: 'Service Delivery', desc: 'To provide and improve our exam preparation services.' },
              { title: 'Progress Tracking', desc: 'To track your learning progress and readiness for the actual exam.' },
              { title: 'Ask Expert', desc: 'To process and respond to your questions via the AI-powered Ask Expert feature.' },
              { title: 'Service Updates', desc: 'To notify you of important service changes and new features.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="w-6 h-6 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <FaLock size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">3. Data Storage & Security</h2>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
            <p className="text-slate-700 leading-relaxed">
              Your data is stored securely using <strong>Firebase (Google Cloud Platform)</strong>. We implement industry-standard encryption for data in transit and at rest. API keys used for AI services are encrypted using <strong>AES-256-GCM</strong> encryption.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">AES-256-GCM</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Firebase Auth</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">SSL/TLS</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Google Cloud</span>
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <FaPlug size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">4. Third-Party Services</h2>
          </div>
          <p className="text-slate-600 mb-4">We integrate with the following trusted third-party services:</p>
          <div className="grid gap-3">
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🔗</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Firebase (Google)</h3>
                <p className="text-slate-600 text-sm">Authentication, database, and cloud storage infrastructure.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🔗</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Google Gemini API</h3>
                <p className="text-slate-600 text-sm">Powers the AI-driven Ask Expert feature for instant answers.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
              <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🔗</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">OpenRouter</h3>
                <p className="text-slate-600 text-sm">Alternative AI provider for the Ask Expert feature.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <FaUserShield size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">5. Your Rights</h2>
          </div>
          <p className="text-slate-600 mb-4">You have full control over your personal data:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900">Access</h3>
                <p className="text-slate-600 text-sm">Request a copy of your stored data.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900">Correction</h3>
                <p className="text-slate-600 text-sm">Request correction of inaccurate data.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900">Deletion</h3>
                <p className="text-slate-600 text-sm">Request permanent deletion of your data.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
              <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-slate-900">Sign Out</h3>
                <p className="text-slate-600 text-sm">Sign out and clear local data anytime.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
              <FaEnvelope size={18} />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-slate-900">6. Contact Us</h2>
          </div>
          <p className="text-slate-600 mb-4">For privacy-related inquiries, reach out to us:</p>
          <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <FaEnvelope size={18} className="text-cyan-600" />
              <a href="mailto:support@licensesathi.com.np" className="text-cyan-700 font-semibold hover:underline">
                support@licensesathi.com.np
              </a>
            </div>
            <p className="text-sm text-slate-500 mt-2">We respond to all privacy inquiries within 48 hours.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
