export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Contact Us</h1>

        <section className="space-y-6 text-slate-700 leading-relaxed">
          <p className="text-lg">We'd love to hear from you. Reach out using any of the methods below.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Email</h2>
              <p className="text-slate-500">Our support team responds within 24 hours.</p>
              <a href="mailto:support@licensesathi.com.np" className="inline-block mt-3 text-blue-600 font-semibold hover:underline">
                support@licensesathi.com.np
              </a>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Developer</h2>
              <p className="text-slate-500">Direct contact with the developer.</p>
              <a href="mailto:somthehit@gmail.com" className="inline-block mt-3 text-blue-600 font-semibold hover:underline">
                somthehit@gmail.com
              </a>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Official Resources</h2>
            <ul className="space-y-2">
              <li><a href="https://www.dotm.gov.np" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Department of Transport Management (DOTM)</a></li>
              <li><a href="https://www.nrsc.gov.np" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Nepal Road Safety Council</a></li>
              <li><a href="https://www.nepalpolice.gov.np/traffic-police" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Nepal Traffic Police</a></li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}