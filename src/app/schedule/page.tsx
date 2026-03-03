'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Layout from '@/components/Layout';

interface Task {
  id: string;
  kpiItemId: string;
  kpiCode: string;
  kpiLevel: string;
  department: string;
  title: string;
  description: string;
  assignee: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  pending: '#fef3c7',
  in_progress: '#dbeafe',
  completed: '#d1fae5'
};

const statusBorderColors: Record<string, string> = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981'
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành'
};

const departmentColors: Record<string, string> = {
  'P.TĐDN': '#8b5cf6',
  'P.TĐBL': '#ec4899',
  'P.HT&GSPD': '#06b6d4',
  'P.PDTD': '#f97316'
};

export default function SchedulePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterDept, setFilterDept] = useState<string>('');
  const [kpiNameMap, setKpiNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentDate(new Date());
    fetchTasks();
    fetchKpiNames();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTasks(data.tasks || []);
      toast.success('Đã tải lịch công việc');
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchKpiNames = async () => {
    try {
      const res = await fetch('/api/kpi');
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, string> = {};
      for (const group of data.groups || []) {
        for (const sub of group.subGroups || []) {
          for (const item of sub.items || []) {
            map[item.id] = item.name;
            for (const si of item.subItems || []) {
              map[si.id] = si.name;
              for (const d of si.details || []) {
                map[d.id] = d.name;
                for (const sd of d.subDetails || []) {
                  map[sd.id] = sd.name;
                }
              }
            }
          }
        }
      }
      setKpiNameMap(map);
    } catch (err) {
      console.error('Error fetching KPI names:', err);
    }
  };

  // Get unique departments from tasks
  const departments = Array.from(new Set(tasks.map(t => t.department))).sort();

  // Get filtered tasks
  const filteredTasks = filterDept ? tasks.filter(t => t.department === filterDept) : tasks;

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredTasks.filter(t => t.dueDate === dateStr);
  };

  // Get first day of month
  const getFirstDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Get last day of month
  const getLastDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // Get days in month view (including padding days from prev/next month)
  const getMonthDays = (): Date[] => {
    if (!currentDate) return [];
    const firstDay = getFirstDayOfMonth(currentDate);
    const lastDay = getLastDayOfMonth(currentDate);
    const days: Date[] = [];
    
    // Add padding days from previous month
    const startPadding = firstDay.getDay(); // 0 = Sunday
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i - 1);
      days.push(d);
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    
    // Add padding days from next month to complete the grid (6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    
    return days;
  };

  // Get days in week view
  const getWeekDays = (): Date[] => {
    if (!currentDate) return [];
    const days: Date[] = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    
    return days;
  };

  // Navigation
  const goToPrevious = () => {
    if (!currentDate) return;
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    if (!currentDate) return;
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format date
  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = (days: Date[]): string => {
    const start = days[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const end = days[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    if (!currentDate) return false;
    return date.getMonth() === currentDate.getMonth();
  };

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  if (loading || !currentDate) {
    return (
      <Layout>
        <div className="page-header">
          <h1 className="page-header__title">Schedule</h1>
          <p className="page-header__subtitle">Đang tải...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Schedule</h1>
        <p className="page-header__subtitle">
          Lịch deadline các task - Tổng: <strong>{filteredTasks.length}</strong> tasks
        </p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card__body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => setViewMode('month')}
              className={`btn ${viewMode === 'month' ? 'btn--primary' : 'btn--secondary'}`}
            >
              Tháng
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`btn ${viewMode === 'week' ? 'btn--primary' : 'btn--secondary'}`}
            >
              Tuần
            </button>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={goToPrevious} className="btn btn--secondary">◀</button>
            <span style={{ fontWeight: 600, minWidth: '200px', textAlign: 'center' }}>
              {viewMode === 'month' 
                ? formatMonthYear(currentDate)
                : formatWeekRange(getWeekDays())
              }
            </span>
            <button onClick={goToNext} className="btn btn--secondary">▶</button>
          </div>
          
          <button onClick={goToToday} className="btn btn--secondary">
            Hôm nay
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="card__body" style={{ padding: 0 }}>
          {/* Day headers */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-primary)',
            color: 'white'
          }}>
            {dayNames.map(day => (
              <div key={day} style={{ 
                padding: '0.75rem', 
                textAlign: 'center', 
                fontWeight: 600 
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)',
            minHeight: viewMode === 'month' ? '600px' : '400px'
          }}>
            {(viewMode === 'month' ? getMonthDays() : getWeekDays()).map((date, idx) => {
              const dayTasks = getTasksForDate(date);
              const isCurrentMonthDay = isCurrentMonth(date);
              
              return (
                <div 
                  key={idx}
                  style={{
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--color-border)' : 'none',
                    borderBottom: '1px solid var(--color-border)',
                    padding: '0.5rem',
                    minHeight: viewMode === 'month' ? '100px' : '350px',
                    backgroundColor: isToday(date) ? 'rgba(37, 99, 235, 0.1)' : 
                                    !isCurrentMonthDay && viewMode === 'month' ? 'rgba(0,0,0,0.02)' : 'white',
                    opacity: isCurrentMonthDay || viewMode === 'week' ? 1 : 0.5
                  }}
                >
                  {/* Date number */}
                  <div style={{ 
                    fontWeight: isToday(date) ? 700 : 500,
                    color: isToday(date) ? 'var(--color-primary)' : 'var(--color-text)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isToday(date) ? 'var(--color-primary)' : 'transparent',
                      color: isToday(date) ? 'white' : 'inherit'
                    }}>
                      {date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        backgroundColor: 'var(--color-primary)', 
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Tasks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'auto', maxHeight: viewMode === 'month' ? '70px' : '300px' }}>
                    {dayTasks.slice(0, viewMode === 'month' ? 3 : 10).map(task => (
                      <div 
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        style={{
                          fontSize: '0.7rem',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          backgroundColor: statusBorderColors[task.status],
                          color: '#000',
                          cursor: 'pointer',
                          overflow: 'hidden'
                        }}
                        title={`${task.title} - ${task.department}`}
                      >
                        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#000' }}>{task.title}</div>
                        <div style={{ marginTop: '2px', fontSize: '0.65rem', color: '#555' }}>
                          {task.department} • {task.progress}%
                        </div>
                      </div>
                    ))}
                    {viewMode === 'month' && dayTasks.length > 3 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        +{dayTasks.length - 3} khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card__body">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <strong style={{ marginRight: '1rem' }}>Trạng thái:</strong>
              {Object.entries(statusLabels).map(([key, label]) => (
                <span key={key} style={{ 
                  marginRight: '1rem',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: statusBorderColors[key],
                  color: 'white',
                  fontSize: '0.75rem'
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div 
            className="card"
            style={{ 
              width: '90%', 
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Chi tiết Task</h3>
              <button 
                onClick={() => setSelectedTask(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <div className="card__body">
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0', width: '120px' }}>Tiêu đề:</td>
                    <td>{selectedTask.title}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Mô tả:</td>
                    <td>{selectedTask.description || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Phòng ban:</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: departmentColors[selectedTask.department] || '#666',
                        color: 'white'
                      }}>
                        {selectedTask.department}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Mã KPI:</td>
                    <td>{selectedTask.kpiCode}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Tên KPI:</td>
                    <td>{kpiNameMap[selectedTask.kpiItemId] || '-'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Người thực hiện:</td>
                    <td>{selectedTask.assignee || 'Chưa phân công'}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Trạng thái:</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: statusBorderColors[selectedTask.status],
                        color: 'white'
                      }}>
                        {statusLabels[selectedTask.status]}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Tiến độ:</td>
                    <td>{selectedTask.progress}%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Deadline:</td>
                    <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                      {new Date(selectedTask.dueDate).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}
