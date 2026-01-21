'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  user: {
    name: string;
    role: string;
    department?: string;
  } | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/kpi-khoi', label: 'KPI Khối', icon: '🏢' },
    { href: '/kpi-phong', label: 'KPI Phòng', icon: '👥' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
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
          {user ? (
            <div className="sidebar__user">
              <div className="sidebar__user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">{user.name}</div>
                <div className="sidebar__user-role">
                  {user.role === 'admin' ? 'Quản trị viên' : 
                   user.role === 'manager' ? 'Trưởng phòng' : 'Nhân viên'}
                </div>
              </div>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="btn btn--sm btn--secondary">
                  Đăng xuất
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="btn btn--primary" style={{ width: '100%' }}>
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
