'use client';

import Sidebar from './Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      <div className="layout">
        <Sidebar />
        <main className="layout__main">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
