import { FaEnvelope, FaUser, FaExternalLinkAlt, FaMapMarkerAlt, FaGlobe, FaPhone } from 'react-icons/fa';

export default function ContactPage() {
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
            Have questions, feedback, or need assistance? Reach out to us using any of the methods below and we&apos;ll get back to you as soon as possible.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email Support */}
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

          {/* Developer */}
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

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <FaEnvelope size={36} className="mx-auto mb-4 text-violet-200" />
          <h2 className="text-2xl font-bold font-poppins mb-2">Have a question?</h2>
          <p className="text-violet-100 mb-6">We typically respond within 24 hours on business days.</p>
          <a
            href="mailto:support@licensesathi.com.np"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-violet-600 rounded-xl font-semibold hover:bg-violet-50 transition-colors shadow-lg"
          >
            Send us an email
          </a>
        </div>
      </div>
    </div>
  );
}
