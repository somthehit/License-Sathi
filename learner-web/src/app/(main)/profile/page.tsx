'use client';

import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCog, FaSignOutAlt } from 'react-icons/fa';

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
          <FaUser className="text-blue-600" /> My Profile
        </h1>
        <p className="text-slate-500">Manage your account and settings.</p>
      </header>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          J
        </div>
        <h2 className="text-xl font-bold">John Doe</h2>
        <p className="text-slate-500">Learner</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          <div className="p-4 flex items-center gap-4">
            <FaEnvelope className="text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium">john.doe@example.com</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-4">
            <FaPhone className="text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="font-medium">+977 9800000000</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3 font-medium text-slate-700">
            <FaCog className="text-slate-400" /> Settings
          </div>
        </button>
        <button className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors border-t border-slate-100">
          <div className="flex items-center gap-3 font-medium text-red-600">
            <FaSignOutAlt /> Log Out
          </div>
        </button>
      </div>
    </div>
  );
}
