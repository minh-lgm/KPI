'use client';

import React, { useEffect, useState, useRef } from 'react';
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

export default function GanttChartPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [kpiNameMap, setKpiNameMap] = useState<Record<string, string>>({});
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
    fetchKpiNames();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTasks(data.tasks || []);
      toast.success('Đã tải dữ liệu Gantt Chart');
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

  // Filter tasks
  const departments = Array.from(new Set(tasks.map(t => t.department))).sort();
  const filteredTasks = tasks.filter(t => {
    if (filterDept && t.department !== filterDept) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  // Sort tasks by startDate then dueDate
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aStart = a.startDate || a.dueDate || a.createdAt;
    const bStart = b.startDate || b.dueDate || b.createdAt;
    return aStart.localeCompare(bStart);
  });

  // Calculate date range for chart
  const getDateRange = () => {
    if (sortedTasks.length === 0) return { start: new Date(), end: new Date(), days: 30 };
    
    let minDate = new Date();
    let maxDate = new Date();
    let first = true;

    for (const task of sortedTasks) {
      const start = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
      const end = task.dueDate ? new Date(task.dueDate) : start;
      if (!start || !end) continue;

      if (first) {
        minDate = new Date(start);
        maxDate = new Date(end);
        first = false;
      } else {
        if (start < minDate) minDate = new Date(start);
        if (end > maxDate) maxDate = new Date(end);
      }
    }

    // Add some padding
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    const days = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return { start: minDate, end: maxDate, days: Math.max(days, 14) };
  };

  const { start: rangeStart, days: totalDays } = getDateRange();

  // Get day offset from rangeStart
  const getDayOffset = (dateStr: string): number => {
    const d = new Date(dateStr);
    return Math.ceil((d.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Generate date headers
  const getDateHeaders = () => {
    const headers: { date: Date; label: string; isToday: boolean; isMonthStart: boolean; monthLabel: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      headers.push({
        date: d,
        label: d.getDate().toString(),
        isToday: d.toDateString() === today.toDateString(),
        isMonthStart: d.getDate() === 1,
        monthLabel: d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
      });
    }
    return headers;
  };

  const dateHeaders = getDateHeaders();
  const DAY_WIDTH = 36;
  const ROW_HEIGHT = 40;
  const LABEL_WIDTH = 320;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <Layout>
        <div className="page-header">
          <h1 className="page-header__title">Gantt Chart</h1>
          <p className="page-header__subtitle">Đang tải...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Gantt Chart</h1>
        <p className="page-header__subtitle">
          Biểu đồ tiến độ công việc - Tổng: <strong>{sortedTasks.length}</strong> tasks
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card__body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {Object.entries(statusLabels).map(([key, label]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: statusColors[key], display: 'inline-block' }}></span>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      {sortedTasks.length === 0 ? (
        <div className="card">
          <div className="card__body" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
            Không có task nào để hiển thị
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', overflow: 'auto' }} ref={chartRef}>
            {/* Left side: Task labels */}
            <div style={{ 
              minWidth: `${LABEL_WIDTH}px`, 
              maxWidth: `${LABEL_WIDTH}px`, 
              borderRight: '2px solid var(--color-border)',
              position: 'sticky',
              left: 0,
              zIndex: 10,
              backgroundColor: 'white'
            }}>
              {/* Header */}
              <div style={{ 
                height: '52px', 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0 0.75rem', 
                borderBottom: '1px solid var(--color-border)', 
                fontWeight: 600,
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}>
                Task
              </div>
              {/* Task rows */}
              {sortedTasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  style={{ 
                    height: `${ROW_HEIGHT}px`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0 0.75rem', 
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    gap: '0.5rem'
                  }}
                  title={`${task.title} - ${task.department}`}
                >
                  <span style={{
                    width: '4px',
                    height: '24px',
                    borderRadius: '2px',
                    backgroundColor: departmentColors[task.department] || '#666',
                    flexShrink: 0
                  }}></span>
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                      {task.department} • {task.assignee || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side: Chart area */}
            <div style={{ flex: 1, minWidth: `${totalDays * DAY_WIDTH}px` }}>
              {/* Date headers */}
              <div style={{ 
                display: 'flex', 
                height: '52px', 
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}>
                {dateHeaders.map((h, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      width: `${DAY_WIDTH}px`, 
                      minWidth: `${DAY_WIDTH}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid rgba(255,255,255,0.15)',
                      fontSize: '0.7rem',
                      backgroundColor: h.isToday ? 'rgba(255,255,255,0.2)' : 'transparent',
                      position: 'relative'
                    }}
                  >
                    {(h.isMonthStart || i === 0) && (
                      <div style={{ fontSize: '0.6rem', opacity: 0.8, position: 'absolute', top: '2px' }}>
                        {h.monthLabel}
                      </div>
                    )}
                    <div style={{ marginTop: h.isMonthStart || i === 0 ? '10px' : '0', fontWeight: h.isToday ? 700 : 400 }}>
                      {h.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Task bars */}
              {sortedTasks.map((task) => {
                const taskStart = task.startDate || task.dueDate || task.createdAt?.split('T')[0];
                const taskEnd = task.dueDate || taskStart;
                if (!taskStart) return <div key={task.id} style={{ height: `${ROW_HEIGHT}px`, borderBottom: '1px solid var(--color-border)' }}></div>;

                const startOffset = getDayOffset(taskStart);
                const endOffset = getDayOffset(taskEnd);
                const barLength = Math.max(endOffset - startOffset + 1, 1);
                const progressWidth = (task.progress / 100) * barLength * DAY_WIDTH;

                return (
                  <div 
                    key={task.id} 
                    style={{ 
                      height: `${ROW_HEIGHT}px`, 
                      position: 'relative', 
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  >
                    {/* Today line */}
                    {dateHeaders.map((h, i) => h.isToday ? (
                      <div key={`today-${i}`} style={{
                        position: 'absolute',
                        left: `${i * DAY_WIDTH + DAY_WIDTH / 2}px`,
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        backgroundColor: '#ef4444',
                        zIndex: 1,
                        opacity: 0.5
                      }}></div>
                    ) : null)}

                    {/* Task bar */}
                    <div
                      onClick={() => setSelectedTask(task)}
                      style={{
                        position: 'absolute',
                        left: `${startOffset * DAY_WIDTH + 2}px`,
                        top: '8px',
                        width: `${barLength * DAY_WIDTH - 4}px`,
                        height: `${ROW_HEIGHT - 16}px`,
                        backgroundColor: statusColors[task.status],
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        opacity: 0.9,
                        zIndex: 2
                      }}
                      title={`${task.title}: ${formatDate(taskStart)} → ${formatDate(taskEnd)} (${task.progress}%)`}
                    >
                      {/* Progress fill */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${progressWidth}px`,
                        backgroundColor: 'rgba(0,0,0,0.15)',
                        borderRadius: '4px 0 0 4px'
                      }}></div>
                      {barLength * DAY_WIDTH > 50 && (
                        <span style={{ 
                          position: 'relative', 
                          zIndex: 1, 
                          fontSize: '0.65rem', 
                          color: 'white', 
                          fontWeight: 600, 
                          padding: '0 6px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {task.progress}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                    <td style={{ fontWeight: 600, padding: '8px 0', width: '130px' }}>Tiêu đề:</td>
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
                        backgroundColor: statusColors[selectedTask.status],
                        color: 'white'
                      }}>
                        {statusLabels[selectedTask.status]}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Tiến độ:</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${selectedTask.progress}%`, height: '100%', backgroundColor: statusColors[selectedTask.status], borderRadius: '4px' }}></div>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedTask.progress}%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Ngày bắt đầu:</td>
                    <td>{formatDate(selectedTask.startDate)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Deadline:</td>
                    <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                      {formatDate(selectedTask.dueDate)}
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
