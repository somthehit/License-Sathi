export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: July 2026</p>

        <section className="space-y-6 text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">1. Information We Collect</h2>
            <p>License Sathi collects minimal information necessary to provide our driving license exam preparation service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Account information (email address, display name) when you sign in</li>
              <li>Study progress and quiz results to personalize your learning experience</li>
              <li>Device information for analytics and crash reporting</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and improve our exam preparation services</li>
              <li>To track your learning progress and readiness</li>
              <li>To respond to your questions via the Ask Expert feature</li>
              <li>To send important service updates</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">3. Data Storage & Security</h2>
            <p>Your data is stored securely using Firebase (Google Cloud Platform). We implement industry-standard encryption for data in transit and at rest. API keys used for AI services are encrypted using AES-256-GCM.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Firebase</strong> (Google) — Authentication, database, and storage</li>
              <li><strong>Google Gemini API</strong> — AI-powered Ask Expert feature</li>
              <li><strong>OpenRouter</strong> — Alternative AI provider for Ask Expert</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">5. Your Rights</h2>
            <p>You can request access, correction, or deletion of your data at any time by contacting us. You may also sign out and delete your account through the app.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">6. Contact</h2>
            <p>For privacy-related inquiries, contact us at <a href="mailto:support@licensesathi.com.np" className="text-blue-600 underline">support@licensesathi.com.np</a>.</p>
          </div>
        </section>
      </div>
    </div>
  );
}