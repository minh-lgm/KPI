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
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-header__title">KPI Phòng</h1>
        <p className="page-header__subtitle">Chọn phòng ban để xem và cập nhật tiến độ tasks</p>
      </div>

      <div className="dept-grid">
        {departmentStats.map((dept) => (
          <a 
            key={dept.code} 
            href={`/kpi-phong/${encodeURIComponent(dept.code)}`}
            className="dept-card"
          >
            <div className="card">
              <div className="card__header">
                <h3 className="card__title dept-card__title">{dept.code}</h3>
                <p className="dept-card__subtitle">{dept.name}</p>
              </div>
              <div className="card__body">
                <div className="dept-card__progress">
                  <div className="dept-card__progress-label">Tiến độ trung bình</div>
                  <ProgressBar value={dept.averageProgress} showLabel />
                </div>
                
                <div className="dept-card__stats">
                  <div className="dept-card__stat">
                    <div className="dept-card__stat-value">{dept.totalTasks}</div>
                    <div className="dept-card__stat-label">Tổng tasks</div>
                  </div>
                  <div className="dept-card__stat">
                    <div className="dept-card__stat-value dept-card__stat-value--completed">{dept.completedTasks}</div>
                    <div className="dept-card__stat-label">Hoàn thành</div>
                  </div>
                  <div className="dept-card__stat">
                    <div className="dept-card__stat-value dept-card__stat-value--in-progress">{dept.inProgressTasks}</div>
                    <div className="dept-card__stat-label">Đang làm</div>
                  </div>
                  <div className="dept-card__stat">
                    <div className="dept-card__stat-value dept-card__stat-value--pending">{dept.pendingTasks}</div>
                    <div className="dept-card__stat-label">Chờ xử lý</div>
                  </div>
                </div>

                <div className="dept-card__action">
                  <span className="dept-card__action-btn">Xem Tasks →</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
