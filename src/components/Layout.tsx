import Sidebar from './Sidebar';
import { getSession } from '@/lib/auth';

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  const user = await getSession();

  return (
    <div className="layout">
      <Sidebar user={user} />
      <main className="layout__main">
        {children}
      </main>
    </div>
  );
}
