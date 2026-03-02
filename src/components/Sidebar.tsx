'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';

export default function Sidebar() {
  const pathname = usePathname();
  const { isAuthenticated, username, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/kpi-khoi', label: 'KPI Khối', icon: '🏢' },
    { href: '/kpi-phong', label: 'KPI Phòng', icon: '👥' },
    { href: '/schedule', label: 'Schedule', icon: '📅' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside className="layout__sidebar">
        <div className="sidebar">
          <div className="sidebar__header">
            <div className="sidebar__logo">KPI Tracker</div>
          </div>

          <nav className="sidebar__nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar__nav-item ${isActive(item.href) ? 'sidebar__nav-item--active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar__footer">
            {isAuthenticated ? (
              <div className="sidebar__user">
                <div className="sidebar__user-avatar">
                  {username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="sidebar__user-info">
                  <div className="sidebar__user-name">{username}</div>
                  <div className="sidebar__user-role">Quản trị viên</div>
                </div>
                <button 
                  onClick={logout}
                  className="btn btn--sm btn--secondary"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="btn btn--primary" 
                style={{ width: '100%' }}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </aside>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
}
