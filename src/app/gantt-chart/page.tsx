'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
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

interface PathSegment {
  code: string;
  name: string;
  level: string; // group, subGroup, item, subItem, detail, subDetail
}

type GanttRow =
  | { type: 'header'; key: string; code: string; name: string; level: string; depth: number; taskCount: number; avgProgress: number; minStart: string; maxEnd: string }
  | { type: 'task'; key: string; task: Task; depth: number };

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

const levelColors: Record<string, string> = {
  group: 'var(--color-primary)',
  subGroup: '#6366f1',
  item: '#0891b2',
  subItem: '#0d9488',
  detail: '#7c3aed',
  subDetail: '#be185d'
};

const levelBgColors: Record<string, string> = {
  group: '#eef2ff',
  subGroup: '#f0f9ff',
  item: '#ecfdf5',
  subItem: '#f0fdfa',
  detail: '#faf5ff',
  subDetail: '#fff1f2'
};

export default function GanttChartPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [kpiPaths, setKpiPaths] = useState<Record<string, PathSegment[]>>({});
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
    fetchKpiHierarchy();
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

  const fetchKpiHierarchy = async () => {
    try {
      const res = await fetch('/api/kpi');
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, PathSegment[]> = {};

      for (const group of data.groups || []) {
        const gSeg: PathSegment = { code: group.code, name: group.name, level: 'group' };
        for (const sub of group.subGroups || []) {
          const sgSeg: PathSegment = { code: sub.fullCode || sub.code, name: sub.name, level: 'subGroup' };
          for (const item of sub.items || []) {
            const iSeg: PathSegment = { code: item.code, name: item.name, level: 'item' };
            map[item.id] = [gSeg, sgSeg, iSeg];
            for (const si of item.subItems || []) {
              const siSeg: PathSegment = { code: si.code, name: si.name, level: 'subItem' };
              map[si.id] = [gSeg, sgSeg, iSeg, siSeg];
              for (const d of si.details || []) {
                const dSeg: PathSegment = { code: d.code, name: d.name, level: 'detail' };
                map[d.id] = [gSeg, sgSeg, iSeg, siSeg, dSeg];
                for (const sd of d.subDetails || []) {
                  const sdSeg: PathSegment = { code: sd.code, name: sd.name, level: 'subDetail' };
                  map[sd.id] = [gSeg, sgSeg, iSeg, siSeg, dSeg, sdSeg];
                }
              }
            }
          }
        }
      }
      setKpiPaths(map);
    } catch (err) {
      console.error('Error fetching KPI hierarchy:', err);
    }
  };

  const toggle = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const departments = Array.from(new Set(tasks.map(t => t.department))).sort();
  const filteredTasks = tasks.filter(t => {
    if (filterDept && t.department !== filterDept) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const getAgg = (list: Task[]) => {
    const avg = list.length > 0 ? Math.round(list.reduce((s, t) => s + t.progress, 0) / list.length) : 0;
    let minS = '', maxE = '';
    for (const t of list) {
      const s = t.startDate || t.dueDate;
      const e = t.dueDate || t.startDate;
      if (s && (!minS || s < minS)) minS = s;
      if (e && (!maxE || e > maxE)) maxE = e;
    }
    return { avg, minS, maxE };
  };

  // Build tree from tasks using their full paths, then flatten to rows
  const ganttRows = useMemo(() => {
    interface TreeNode {
      code: string;
      name: string;
      level: string;
      children: Map<string, TreeNode>;
      tasks: Task[];
    }

    const root: Map<string, TreeNode> = new Map();

    const getOrCreate = (parent: Map<string, TreeNode>, seg: PathSegment): TreeNode => {
      const key = `${seg.level}-${seg.code}`;
      if (!parent.has(key)) {
        parent.set(key, { code: seg.code, name: seg.name, level: seg.level, children: new Map(), tasks: [] });
      }
      return parent.get(key)!;
    };

    for (const task of filteredTasks) {
      const path = kpiPaths[task.kpiItemId];
      if (!path || path.length === 0) {
        const node = getOrCreate(root, { code: '_other', name: 'Chưa phân loại', level: 'group' });
        node.tasks.push(task);
        continue;
      }
      let currentChildren = root;
      let lastNode: TreeNode | null = null;
      for (const seg of path) {
        lastNode = getOrCreate(currentChildren, seg);
        currentChildren = lastNode.children;
      }
      if (lastNode) lastNode.tasks.push(task);
    }

    const getAllTasks = (node: TreeNode): Task[] => {
      let all = [...node.tasks];
      for (const child of node.children.values()) {
        all = all.concat(getAllTasks(child));
      }
      return all;
    };

    const rows: GanttRow[] = [];

    const flatten = (nodes: Map<string, TreeNode>, depth: number) => {
      const sorted = Array.from(nodes.values()).sort((a, b) => a.code.localeCompare(b.code));
      for (const node of sorted) {
        const allTasks = getAllTasks(node);
        if (allTasks.length === 0) continue;
        const agg = getAgg(allTasks);
        const headerKey = `${node.level}-${node.code}`;

        rows.push({
          type: 'header',
          key: headerKey,
          code: node.code,
          name: node.name,
          level: node.level,
          depth,
          taskCount: allTasks.length,
          avgProgress: agg.avg,
          minStart: agg.minS,
          maxEnd: agg.maxE
        });

        if (collapsed.has(headerKey)) continue;

        // Recurse children first
        if (node.children.size > 0) {
          flatten(node.children, depth + 1);
        }

        // Then direct tasks of this node
        const sortedTasks = [...node.tasks].sort((a, b) => (a.startDate || a.dueDate || '').localeCompare(b.startDate || b.dueDate || ''));
        for (const task of sortedTasks) {
          rows.push({ type: 'task', key: `t-${task.id}`, task, depth: depth + 1 });
        }
      }
    };

    flatten(root, 0);
    return rows;
  }, [filteredTasks, kpiPaths, collapsed]);

  // Date range
  const getDateRange = () => {
    if (filteredTasks.length === 0) return { start: new Date(), days: 30 };
    let minD = new Date(), maxD = new Date(), first = true;
    for (const t of filteredTasks) {
      const s = t.startDate ? new Date(t.startDate) : (t.dueDate ? new Date(t.dueDate) : null);
      const e = t.dueDate ? new Date(t.dueDate) : s;
      if (!s || !e) continue;
      if (first) { minD = new Date(s); maxD = new Date(e); first = false; }
      else { if (s < minD) minD = new Date(s); if (e > maxD) maxD = new Date(e); }
    }
    minD.setDate(minD.getDate() - 3);
    maxD.setDate(maxD.getDate() + 3);
    const days = Math.ceil((maxD.getTime() - minD.getTime()) / 86400000) + 1;
    return { start: minD, days: Math.max(days, 14) };
  };

  const { start: rangeStart, days: totalDays } = getDateRange();
  const getDayOffset = (ds: string) => Math.ceil((new Date(ds).getTime() - rangeStart.getTime()) / 86400000);

  const dateHeaders = useMemo(() => {
    const h: { label: string; isToday: boolean; isMonthStart: boolean; monthLabel: string }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(rangeStart); d.setDate(d.getDate() + i);
      h.push({ label: d.getDate().toString(), isToday: d.toDateString() === today.toDateString(), isMonthStart: d.getDate() === 1, monthLabel: d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }) });
    }
    return h;
  }, [rangeStart, totalDays]);

  const DAY_W = 36;
  const ROW_H = 36;
  const HDR_H = 30;
  const LABEL_W = 420;
  const todayIdx = dateHeaders.findIndex(h => h.isToday);
  const fmt = (ds: string) => ds ? new Date(ds).toLocaleDateString('vi-VN') : '-';
  const rh = (row: GanttRow) => row.type === 'task' ? ROW_H : HDR_H;

  if (loading) {
    return (<Layout><div className="page-header"><h1 className="page-header__title">Gantt Chart</h1><p className="page-header__subtitle">Đang tải...</p></div></Layout>);
  }

  return (
    <Layout>
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Gantt Chart</h1>
        <p className="page-header__subtitle">Biểu đồ tiến độ theo KPI - Tổng: <strong>{filteredTasks.length}</strong> tasks</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card__body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}>
            <option value="">Tất cả phòng ban</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.85rem' }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {Object.entries(statusLabels).map(([k, l]) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: statusColors[k], display: 'inline-block' }}></span>{l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt */}
      {ganttRows.length === 0 ? (
        <div className="card"><div className="card__body" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>Không có task nào</div></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', overflow: 'auto' }} ref={chartRef}>
            {/* Left labels */}
            <div style={{ minWidth: `${LABEL_W}px`, maxWidth: `${LABEL_W}px`, borderRight: '2px solid var(--color-border)', position: 'sticky', left: 0, zIndex: 10, backgroundColor: 'var(--color-bg)' }}>
              <div style={{ height: '52px', display: 'flex', alignItems: 'center', padding: '0 0.75rem', borderBottom: '1px solid var(--color-border)', fontWeight: 600, backgroundColor: 'var(--color-primary)', color: 'white' }}>
                KPI / Task
              </div>
              {ganttRows.map((row) => {
                if (row.type === 'header') {
                  const isOpen = !collapsed.has(row.key);
                  const indent = row.depth * 20 + 8;
                  const color = levelColors[row.level] || '#333';
                  const bg = levelBgColors[row.level] || 'transparent';
                  const isGroup = row.level === 'group';
                  return (
                    <div key={row.key} onClick={() => toggle(row.key)} style={{ height: `${HDR_H}px`, display: 'flex', alignItems: 'center', paddingLeft: `${indent}px`, paddingRight: '0.5rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: bg, fontSize: isGroup ? '0.8rem' : '0.72rem', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.6rem', width: '14px', flexShrink: 0 }}>{isOpen ? '▼' : '▶'}</span>
                      <span style={{ fontWeight: isGroup ? 700 : 600, color, flexShrink: 0 }}>{row.code}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isGroup ? 600 : 400 }}>{row.name}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>{row.taskCount} tasks • {row.avgProgress}%</span>
                    </div>
                  );
                }
                const t = row.task;
                const indent = row.depth * 20 + 8;
                return (
                  <div key={row.key} onClick={() => setSelectedTask(t)} style={{ height: `${ROW_H}px`, display: 'flex', alignItems: 'center', paddingLeft: `${indent}px`, paddingRight: '0.5rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', gap: '0.35rem' }} title={`${t.title} - ${t.department}`}>
                    <span style={{ width: '4px', height: '20px', borderRadius: '2px', backgroundColor: departmentColors[t.department] || '#666', flexShrink: 0 }}></span>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)' }}>{t.department} • {t.assignee || 'N/A'}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right chart */}
            <div style={{ flex: 1, minWidth: `${totalDays * DAY_W}px` }}>
              <div style={{ display: 'flex', height: '52px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-primary)', color: 'white' }}>
                {dateHeaders.map((h, i) => (
                  <div key={i} style={{ width: `${DAY_W}px`, minWidth: `${DAY_W}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', fontSize: '0.7rem', backgroundColor: h.isToday ? 'rgba(255,255,255,0.2)' : 'transparent', position: 'relative' }}>
                    {(h.isMonthStart || i === 0) && <div style={{ fontSize: '0.6rem', opacity: 0.8, position: 'absolute', top: '2px' }}>{h.monthLabel}</div>}
                    <div style={{ marginTop: (h.isMonthStart || i === 0) ? '10px' : '0', fontWeight: h.isToday ? 700 : 400 }}>{h.label}</div>
                  </div>
                ))}
              </div>

              {ganttRows.map((row) => {
                const h = rh(row);
                const todayLine = todayIdx >= 0 ? <div style={{ position: 'absolute', left: `${todayIdx * DAY_W + DAY_W / 2}px`, top: 0, bottom: 0, width: '2px', backgroundColor: '#ef4444', zIndex: 1, opacity: 0.4 }}></div> : null;

                if (row.type === 'header') {
                  const so = row.minStart ? getDayOffset(row.minStart) : 0;
                  const eo = row.maxEnd ? getDayOffset(row.maxEnd) : so;
                  const len = Math.max(eo - so + 1, 1);
                  const barColor = levelColors[row.level] || '#888';
                  const bg = levelBgColors[row.level] || 'transparent';
                  return (
                    <div key={row.key} style={{ height: `${h}px`, position: 'relative', borderBottom: '1px solid var(--color-border)', backgroundColor: bg }}>
                      {todayLine}
                      {row.minStart && <div style={{ position: 'absolute', left: `${so * DAY_W}px`, top: `${h / 2 - 4}px`, width: `${len * DAY_W}px`, height: '8px', backgroundColor: barColor, borderRadius: '4px', opacity: 0.25 }}></div>}
                    </div>
                  );
                }

                const t = row.task;
                const tS = t.startDate || t.dueDate || t.createdAt?.split('T')[0];
                const tE = t.dueDate || tS;
                if (!tS) return <div key={row.key} style={{ height: `${h}px`, borderBottom: '1px solid var(--color-border)' }}></div>;
                const so = getDayOffset(tS);
                const eo = getDayOffset(tE);
                const len = Math.max(eo - so + 1, 1);
                const pw = (t.progress / 100) * len * DAY_W;

                return (
                  <div key={row.key} style={{ height: `${h}px`, position: 'relative', borderBottom: '1px solid var(--color-border)' }}>
                    {todayLine}
                    <div onClick={() => setSelectedTask(t)} style={{ position: 'absolute', left: `${so * DAY_W + 2}px`, top: '6px', width: `${len * DAY_W - 4}px`, height: `${h - 12}px`, backgroundColor: statusColors[t.status], borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', overflow: 'hidden', opacity: 0.9, zIndex: 2 }} title={`${t.title}: ${fmt(tS)} → ${fmt(tE)} (${t.progress}%)`}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pw}px`, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '4px 0 0 4px' }}></div>
                      {len * DAY_W > 50 && <span style={{ position: 'relative', zIndex: 1, fontSize: '0.6rem', color: 'white', fontWeight: 600, padding: '0 6px', whiteSpace: 'nowrap' }}>{t.progress}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedTask(null)}>
          <div className="card" style={{ width: '90%', maxWidth: '520px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Chi tiết Task</h3>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
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
                    <td>{kpiPaths[selectedTask.kpiItemId]?.slice(-1)[0]?.name || '-'}</td>
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
                    <td>{selectedTask.progress}%</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: '8px 0' }}>Deadline:</td>
                    <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                      {fmt(selectedTask.dueDate)}
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
