"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/',              label: 'Dashboard',     icon: 'dashboard'  },
  { href: '/questions',     label: 'Question Bank', icon: 'dataset'    },
  { href: '/questions/sets',label: 'Question Sets', icon: 'folder_copy', indent: true },
  { href: '/study-library', label: 'Study Library', icon: 'menu_book'  },
  { href: '/video-guides',  label: 'Video Guides',  icon: 'play_circle' },
  { href: '/users',         label: 'Users',         icon: 'group'      },
  { href: '/analytics',     label: 'Analytics',     icon: 'bar_chart'  },
  { href: '/notices',       label: 'Notices',       icon: 'campaign'   },
  { href: '/settings',      label: 'Settings',      icon: 'settings'   },
  { href: '/admin/ask-expert/analytics', label: 'Ask Expert Analytics', icon: 'smart_toy', indent: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = (user?.name ?? user?.email ?? 'A')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  return (
    <aside
      style={{ backgroundColor: '#f6f3f2', borderRight: '1px solid #e6bdbc' }}
      className="h-screen w-[220px] fixed left-0 top-0 flex flex-col z-50"
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div
            style={{ backgroundColor: '#ffdad9', borderRadius: '10px' }}
            className="w-9 h-9 flex items-center justify-center"
          >
            <span
              className="material-symbols-outlined text-[#b1002c] text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_car
            </span>
          </div>
          <div>
            <p className="font-display font-bold text-[#b1002c] text-sm leading-tight">License Sathi</p>
            <p className="text-[10px] text-[#5c3f3f] uppercase tracking-wider font-semibold">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
      {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && item.href !== '/questions' && pathname.startsWith(item.href)) || (item.href === '/questions' && (pathname === '/questions' || (pathname.startsWith('/questions') && !pathname.startsWith('/questions/sets'))));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              style={
                isActive
                  ? { backgroundColor: '#335ab4', color: '#ffffff', borderRadius: '10px' }
                  : { color: '#5c3f3f', borderRadius: '10px' }
              }
              className={`flex items-center gap-3 py-2.5 text-sm font-medium transition-colors hover:bg-[#e6bdbc]/30 ${'indent' in item && item.indent ? 'pl-10 pr-4' : 'px-4'}`}
            >
              <span className="material-symbols-outlined text-[20px]" style={'indent' in item && item.indent ? { fontSize: 16 } : {}}>{item.icon}</span>
              <span>{'indent' in item && item.indent ? <span className="opacity-80">{item.label}</span> : item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid #e6bdbc' }} className="px-3 py-4 space-y-0.5">

        {/* Profile link */}
        <Link
          href="/profile"
          style={
            pathname === '/profile'
              ? { backgroundColor: '#335ab4', color: '#ffffff', borderRadius: '10px' }
              : { color: '#5c3f3f', borderRadius: '10px' }
          }
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[#e6bdbc]/30"
        >
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span>My Profile</span>
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#5c3f3f] rounded-[10px] transition-colors hover:bg-[#e6bdbc]/30 w-full text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Sign Out</span>
        </button>

        {/* Admin identity card */}
        <Link
          href="/profile"
          className="flex items-center gap-3 px-4 py-3 mt-1 rounded-[10px] hover:bg-[#e6bdbc]/30 transition-colors"
        >
          <div
            style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#ffdad9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #e6bdbc' }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: '#b1002c' }}>{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#1c1b1b] truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-[10px] text-[#5c3f3f] truncate">{roleLabel}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
