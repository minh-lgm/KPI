'use client';

import { useEffect, useState } from 'react';
import ProgressBar from '@/components/ProgressBar';

interface Task {
  id: string;
  kpiItemId: string;
  kpiCode: string;
  department: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
}

interface DepartmentStats {
  code: string;
  name: string;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  averageProgress: number;
}

const DEPARTMENTS = [
  { code: 'P.TĐDN', name: 'Phòng Thẩm định Doanh nghiệp' },
  { code: 'P.TĐBL', name: 'Phòng Thẩm định Bán lẻ' },
  { code: 'P.HT&GSPD', name: 'Phòng Hỗ trợ & Giám sát Phê duyệt' },
  { code: 'P.PDTD', name: 'Phòng Phê duyệt Tín dụng' },
];

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981'
};

export default function KPIPhongContent() {
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllDepartmentStats();
  }, []);

  const fetchAllDepartmentStats = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        const tasks: Task[] = data.tasks;
        
        const stats: DepartmentStats[] = DEPARTMENTS.map(dept => {
          const deptTasks = tasks.filter(t => t.department === dept.code);
          const totalTasks = deptTasks.length;
          const pendingTasks = deptTasks.filter(t => t.status === 'pending').length;
          const inProgressTasks = deptTasks.filter(t => t.status === 'in_progress').length;
          const completedTasks = deptTasks.filter(t => t.status === 'completed').length;
          const averageProgress = totalTasks > 0 
            ? Math.round(deptTasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
            : 0;
          
          return {
            code: dept.code,
            name: dept.name,
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            averageProgress
          };
        });
        
        setDepartmentStats(stats);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-header__title">KPI Phòng</h1>
        <p className="page-header__subtitle">Chọn phòng ban để xem và cập nhật tiến độ tasks</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {departmentStats.map((dept) => (
          <a 
            key={dept.code} 
            href={`/kpi-phong/${encodeURIComponent(dept.code)}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div className="card__header">
                <h3 className="card__title" style={{ fontSize: '1rem' }}>{dept.code}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {dept.name}
                </p>
              </div>
              <div className="card__body">
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    Tiến độ trung bình
                  </div>
                  <ProgressBar value={dept.averageProgress} showLabel />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{dept.totalTasks}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Tổng tasks</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: statusColors.completed }}>{dept.completedTasks}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Hoàn thành</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: statusColors.in_progress }}>{dept.inProgressTasks}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Đang làm</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: statusColors.pending }}>{dept.pendingTasks}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Chờ xử lý</div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '0.5rem 1rem', 
                    backgroundColor: 'var(--color-primary)', 
                    color: 'white', 
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}>
                    Xem Tasks →
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
