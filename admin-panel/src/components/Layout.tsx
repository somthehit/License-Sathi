import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  topbarRight?: React.ReactNode;
}

export default function Layout({ children, title = 'Admin Panel', topbarRight }: LayoutProps) {
  return (
    <div style={{ backgroundColor: '#fcf9f8', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 220 }}>
        <Topbar title={title} right={topbarRight} />
        <main style={{ paddingTop: 56 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
