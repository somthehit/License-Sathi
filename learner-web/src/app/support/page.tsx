export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Support</h1>

        <section className="space-y-8 text-slate-700 leading-relaxed">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Frequently Asked Questions</h2>

            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-semibold text-slate-900">How do I use the app?</h3>
                <p className="mt-1">Browse the study library to learn traffic rules and road signs, take practice tests, and use the mock exam to assess your readiness.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">How does the Eye Test work?</h3>
                <p className="mt-1">The eye test displays Ishihara color plates. Enter the number you see on each plate to check your color vision.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">What is Ask Expert?</h3>
                <p className="mt-1">Ask Expert uses AI to answer your questions about Nepal's driving rules, traffic laws, and licensing process.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Is my data secure?</h3>
                <p className="mt-1">Yes. All data is encrypted in transit and at rest. Your progress and personal information are stored securely.</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Troubleshooting</h2>
            <ul className="space-y-3 mt-3">
              <li><strong>App not loading?</strong> Check your internet connection and try restarting the app.</li>
              <li><strong>Ask Expert not responding?</strong> The AI service may be temporarily unavailable due to quota limits. Try again later.</li>
              <li><strong>Quiz not saving progress?</strong> Ensure you are signed in to your account.</li>
            </ul>
          </div>

          <div className="text-center pt-4">
            <p className="text-slate-600">Still need help? Contact us below.</p>
            <a href="/contact" className="inline-block mt-3 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              Contact Support
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}