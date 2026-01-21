'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProgressBar from '@/components/ProgressBar';

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
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

interface KPIOption {
  id: string;
  code: string;
  name: string;
  level: string;
  parentCode?: string;
  indent: number;
}

interface KPISubGroupOption {
  code: string;
  name: string;
  fullCode: string;
}

interface KPIItemOption {
  id: string;
  code: string;
  name: string;
  level: string;
  subGroupCode: string;
}

interface KPISubItemOption {
  id: string;
  code: string;
  name: string;
  level: string;
  itemCode: string;
}

interface KPIDetailOption {
  id: string;
  code: string;
  name: string;
  level: string;
  subItemCode: string;
}

interface KPISubDetailOption {
  id: string;
  code: string;
  name: string;
  level: string;
  detailCode: string;
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

export default function KPIPhongPage() {
  const params = useParams();
  const dept = decodeURIComponent(params.dept as string);
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'kpi'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpiOptions, setKpiOptions] = useState<KPIOption[]>([]);
  const [kpiSubGroups, setKpiSubGroups] = useState<KPISubGroupOption[]>([]);
  const [kpiItems, setKpiItems] = useState<KPIItemOption[]>([]);
  const [kpiSubItems, setKpiSubItems] = useState<KPISubItemOption[]>([]);
  const [kpiDetails, setKpiDetails] = useState<KPIDetailOption[]>([]);
  const [kpiSubDetails, setKpiSubDetails] = useState<KPISubDetailOption[]>([]);
  const [selectedSubGroup, setSelectedSubGroup] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSubItem, setSelectedSubItem] = useState('');
  const [selectedDetail, setSelectedDetail] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [kpiData, setKpiData] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    kpiCode: '',
    kpiItemId: '',
    dueDate: ''
  });

  const departmentNames: Record<string, string> = {
    'P.TĐDN': 'Phòng Thẩm định Doanh nghiệp',
    'P.TĐBL': 'Phòng Thẩm định Bán lẻ',
    'P.HT&GSPD': 'Phòng Hỗ trợ & Giám sát Phê duyệt',
    'P.PDTD': 'Phòng Phê duyệt Tín dụng'
  };

  useEffect(() => {
    fetchTasks();
    fetchKPIOptions();
    fetchKPIData();
  }, [dept]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?department=${encodeURIComponent(dept)}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIData = async () => {
    try {
      const res = await fetch('/api/kpi');
      const data = await res.json();
      
      // Filter KPI data for this department
      const filteredGroups = data.groups.map((group: any) => ({
        ...group,
        subGroups: group.subGroups.map((subGroup: any) => ({
          ...subGroup,
          items: subGroup.items.map((item: any) => ({
            ...item,
            departments: item.departments.filter((d: any) => d.department === dept),
            subItems: item.subItems?.map((subItem: any) => ({
              ...subItem,
              departments: subItem.departments.filter((d: any) => d.department === dept),
              details: subItem.details?.map((detail: any) => ({
                ...detail,
                departments: detail.departments.filter((d: any) => d.department === dept),
                subDetails: detail.subDetails?.map((subDetail: any) => ({
                  ...subDetail,
                  departments: subDetail.departments.filter((d: any) => d.department === dept)
                })).filter((sd: any) => sd.departments.length > 0) || []
              })).filter((d: any) => d.departments.length > 0 || d.subDetails?.length > 0) || []
            })).filter((si: any) => si.departments.length > 0 || si.details?.length > 0) || []
          })).filter((i: any) => i.departments.length > 0 || i.subItems?.length > 0)
        })).filter((sg: any) => sg.items.length > 0)
      })).filter((g: any) => g.subGroups.length > 0);

      setKpiData({ groups: filteredGroups });
    } catch (err) {
      console.error('Error fetching KPI data:', err);
    }
  };

  const fetchKPIOptions = async () => {
    try {
      const res = await fetch('/api/kpi');
      const data = await res.json();
      const options: KPIOption[] = [];
      const subGroupsList: KPISubGroupOption[] = [];
      const itemsList: KPIItemOption[] = [];
      const subItemsList: KPISubItemOption[] = [];
      const detailsList: KPIDetailOption[] = [];
      const subDetailsList: KPISubDetailOption[] = [];
      
      // Helper function to normalize strings for comparison
      const normalizeString = (str: string) => str.normalize('NFC').trim();
      const matchDept = (deptStr: string, targetDept: string) => {
        return normalizeString(deptStr) === normalizeString(targetDept);
      };
      
      for (const group of data.groups) {
        for (const subGroup of group.subGroups) {
          let subGroupHasItems = false;
          const fullSubGroupCode = `${group.code}.${subGroup.code}`;
          
          for (const item of subGroup.items) {
            const fullItemCode = `${fullSubGroupCode}.${item.code}`;
            
            // Check if item has this department
            if (Array.isArray(item.departments)) {
              const hasItemDept = item.departments.some((d: { department: string }) => matchDept(d.department, dept));
              
              if (hasItemDept) {
                subGroupHasItems = true;
                // Add subGroup if not already added
                if (!subGroupsList.find(sg => sg.code === subGroup.code)) {
                  subGroupsList.push({ code: subGroup.code, name: subGroup.name, fullCode: fullSubGroupCode });
                }
                itemsList.push({ id: item.id, code: fullItemCode, name: item.name, level: 'item', subGroupCode: subGroup.code });
                options.push({ id: item.id, code: fullItemCode, name: item.name, level: 'item', parentCode: subGroup.code, indent: 1 });
              }
            }
            
            // Check subItems
            if (Array.isArray(item.subItems)) {
              for (const subItem of item.subItems) {
                if (!Array.isArray(subItem.departments)) continue;
                const hasSubItemDept = subItem.departments.some((d: { department: string }) => matchDept(d.department, dept));
                
                if (hasSubItemDept) {
                  subGroupHasItems = true;
                  // Ensure parent item is added
                  if (!itemsList.find(i => i.id === item.id)) {
                    if (!subGroupsList.find(sg => sg.code === subGroup.code)) {
                      subGroupsList.push({ code: subGroup.code, name: subGroup.name, fullCode: fullSubGroupCode });
                    }
                    itemsList.push({ id: item.id, code: fullItemCode, name: item.name, level: 'item', subGroupCode: subGroup.code });
                  }
                  subItemsList.push({ id: subItem.id, code: subItem.code, name: subItem.name, level: 'subItem', itemCode: item.id });
                  options.push({ id: subItem.id, code: `${fullItemCode}.${subItem.code}`, name: subItem.name, level: 'subItem', parentCode: item.code, indent: 2 });
                }
                
                // Check details
                if (Array.isArray(subItem.details)) {
                  for (const detail of subItem.details) {
                    if (!Array.isArray(detail.departments)) continue;
                    const hasDetailDept = detail.departments.some((d: { department: string }) => matchDept(d.department, dept));
                    
                    if (hasDetailDept) {
                      subGroupHasItems = true;
                      // Ensure parent subItem is added
                      if (!subItemsList.find(si => si.id === subItem.id)) {
                        if (!itemsList.find(i => i.id === item.id)) {
                          if (!subGroupsList.find(sg => sg.code === subGroup.code)) {
                            subGroupsList.push({ code: subGroup.code, name: subGroup.name, fullCode: fullSubGroupCode });
                          }
                          itemsList.push({ id: item.id, code: fullItemCode, name: item.name, level: 'item', subGroupCode: subGroup.code });
                        }
                        subItemsList.push({ id: subItem.id, code: subItem.code, name: subItem.name, level: 'subItem', itemCode: item.id });
                      }
                      detailsList.push({ id: detail.id, code: detail.code, name: detail.name, level: 'detail', subItemCode: subItem.id });
                      options.push({ id: detail.id, code: `${fullItemCode}.${subItem.code}.${detail.code}`, name: detail.name, level: 'detail', parentCode: subItem.code, indent: 3 });
                    }
                    
                    // Check subDetails
                    if (Array.isArray(detail.subDetails)) {
                      for (const subDetail of detail.subDetails) {
                        if (!Array.isArray(subDetail.departments)) continue;
                        const hasSubDetailDept = subDetail.departments.some((d: { department: string }) => matchDept(d.department, dept));
                        
                        if (hasSubDetailDept) {
                          // Ensure parent detail is added
                          if (!detailsList.find(d => d.id === detail.id)) {
                            detailsList.push({
                              id: detail.id,
                              code: detail.code,
                              name: detail.name,
                              level: 'detail',
                              subItemCode: subItem.id
                            });
                          }
                          subDetailsList.push({
                            id: subDetail.id,
                            code: subDetail.code,
                            name: subDetail.name,
                            level: 'subDetail',
                            detailCode: detail.id
                          });
                          options.push({ id: subDetail.id, code: `${fullItemCode}.${subItem.code}.${detail.code}.${subDetail.code}`, name: subDetail.name, level: 'subDetail', parentCode: detail.code, indent: 3 });
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      setKpiSubGroups(subGroupsList);
      setKpiItems(itemsList);
      setKpiSubItems(subItemsList);
      setKpiDetails(detailsList);
      setKpiSubDetails(subDetailsList);
      setKpiOptions(options);
    } catch (err) {
      console.error('Error fetching KPI options:', err);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.kpiItemId) return;
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          department: dept,
          kpiLevel: kpiOptions.find(k => k.id === newTask.kpiItemId)?.level || 'item'
        })
      });
      
      if (res.ok) {
        setNewTask({ title: '', description: '', assignee: '', kpiCode: '', kpiItemId: '', dueDate: '' });
        setSelectedSubGroup('');
        setSelectedItem('');
        setSelectedSubItem('');
        setSelectedDetail('');
        setShowAddForm(false);
        fetchTasks();
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, ...updates })
      });
      
      if (res.ok) {
        setEditingTask(null);
        fetchTasks();
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc muốn xóa task này?')) return;
    
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const calculateDepartmentProgress = () => {
    if (tasks.length === 0) return 0;
    const total = tasks.reduce((sum, t) => sum + t.progress, 0);
    return Math.round(total / tasks.length);
  };

  // Calculate KPI progress based on linked tasks
  const getKpiProgress = (kpiId: string, originalProgress: number) => {
    const linkedTasks = tasks.filter(t => t.kpiItemId === kpiId);
    if (linkedTasks.length === 0) return originalProgress;
    const total = linkedTasks.reduce((sum, t) => sum + t.progress, 0);
    return Math.round(total / linkedTasks.length);
  };

  const toggleGroup = (code: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedGroups(newExpanded);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>;
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <a href="/kpi-phong" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            ← Quay lại danh sách phòng
          </a>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {departmentNames[dept] || dept}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Tiến độ phòng:</span>
          <div style={{ width: '200px' }}>
            <ProgressBar value={calculateDepartmentProgress()} showLabel />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'tasks' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
            color: activeTab === 'tasks' ? 'white' : 'var(--color-text)'
          }}
        >
          📋 Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('kpi')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'kpi' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
            color: activeTab === 'kpi' ? 'white' : 'var(--color-text)'
          }}
        >
          📊 Bộ chỉ tiêu KPI
        </button>
      </div>

      {/* Tab Content: Tasks */}
      {activeTab === 'tasks' && (
        <>
          {/* Add Task Button */}
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showAddForm ? 'Hủy' : '+ Thêm Task mới'}
            </button>
          </div>

          {/* Add Task Form */}
          {showAddForm && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Tạo Task mới</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tiêu đề *</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    placeholder="Nhập tiêu đề task"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Người thực hiện</label>
                  <input
                    type="text"
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    placeholder="Tên người thực hiện"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mô tả</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '80px' }}
                    placeholder="Mô tả chi tiết task"
                  />
                </div>
                
                {/* 5 Cascading KPI Dropdowns */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Liên kết KPI *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                    {/* Level 1: SubGroup (I, II, III) */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Nhóm KPI</label>
                      <select
                        value={selectedSubGroup}
                        onChange={(e) => {
                          setSelectedSubGroup(e.target.value);
                          setSelectedItem('');
                          setSelectedSubItem('');
                          setSelectedDetail('');
                          setNewTask({ ...newTask, kpiItemId: '', kpiCode: '' });
                        }}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                      >
                        <option value="">-- Chọn nhóm --</option>
                        {kpiSubGroups.map((sg) => (
                          <option key={sg.code} value={sg.code}>{sg.code} - {sg.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Level 2: Item */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Chỉ tiêu</label>
                      <select
                        value={selectedItem}
                        onChange={(e) => {
                          setSelectedItem(e.target.value);
                          setSelectedSubItem('');
                          setSelectedDetail('');
                          // Check if this item has subItems
                          const hasSubItems = kpiSubItems.some(si => si.itemCode === e.target.value);
                          if (!hasSubItems) {
                            // No subItems, select this item directly
                            const selected = kpiItems.find(k => k.id === e.target.value);
                            setNewTask({ 
                              ...newTask, 
                              kpiItemId: e.target.value,
                              kpiCode: selected?.code || ''
                            });
                          } else {
                            setNewTask({ ...newTask, kpiItemId: '', kpiCode: '' });
                          }
                        }}
                        disabled={!selectedSubGroup}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', opacity: selectedSubGroup ? 1 : 0.5 }}
                      >
                        <option value="">-- Chọn chỉ tiêu --</option>
                        {kpiItems
                          .filter(i => i.subGroupCode === selectedSubGroup)
                          .map((item) => (
                            <option key={item.id} value={item.id}>{item.code} - {item.name}</option>
                          ))}
                      </select>
                    </div>
                    
                    {/* Level 3: SubItem */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Chi tiết</label>
                      <select
                        value={selectedSubItem}
                        onChange={(e) => {
                          setSelectedSubItem(e.target.value);
                          setSelectedDetail('');
                          // Check if this subItem has details
                          const hasDetails = kpiDetails.some(d => d.subItemCode === e.target.value);
                          if (!hasDetails) {
                            // No details, select this subItem directly
                            const selected = kpiSubItems.find(k => k.id === e.target.value);
                            setNewTask({ 
                              ...newTask, 
                              kpiItemId: e.target.value,
                              kpiCode: selected?.code || ''
                            });
                          } else {
                            setNewTask({ ...newTask, kpiItemId: '', kpiCode: '' });
                          }
                        }}
                        disabled={!selectedItem || kpiSubItems.filter(si => si.itemCode === selectedItem).length === 0}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', opacity: (selectedItem && kpiSubItems.filter(si => si.itemCode === selectedItem).length > 0) ? 1 : 0.5 }}
                      >
                        <option value="">-- Chọn chi tiết --</option>
                        {kpiSubItems
                          .filter(si => si.itemCode === selectedItem)
                          .map((subItem) => (
                            <option key={subItem.id} value={subItem.id}>{subItem.code} - {subItem.name}</option>
                          ))}
                      </select>
                    </div>
                    
                    {/* Level 4: Detail */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Chi tiết con</label>
                      <select
                        value={selectedDetail}
                        onChange={(e) => {
                          setSelectedDetail(e.target.value);
                          // Check if this detail has subDetails
                          const hasSubDetails = kpiSubDetails.some(sd => sd.detailCode === e.target.value);
                          if (!hasSubDetails) {
                            // No subDetails, select this detail directly
                            const selected = kpiDetails.find(k => k.id === e.target.value);
                            setNewTask({ 
                              ...newTask, 
                              kpiItemId: e.target.value,
                              kpiCode: selected?.code || ''
                            });
                          } else {
                            setNewTask({ ...newTask, kpiItemId: '', kpiCode: '' });
                          }
                        }}
                        disabled={!selectedSubItem || kpiDetails.filter(d => d.subItemCode === selectedSubItem).length === 0}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', opacity: (selectedSubItem && kpiDetails.filter(d => d.subItemCode === selectedSubItem).length > 0) ? 1 : 0.5 }}
                      >
                        <option value="">-- Chọn chi tiết con --</option>
                        {kpiDetails
                          .filter(d => d.subItemCode === selectedSubItem)
                          .map((d) => (
                            <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                          ))}
                      </select>
                    </div>
                    
                    {/* Level 5: SubDetail (optional) */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Chi tiết nhỏ (nếu có)</label>
                      <select
                        value={newTask.kpiItemId}
                        onChange={(e) => {
                          const selected = kpiSubDetails.find(k => k.id === e.target.value);
                          setNewTask({ 
                            ...newTask, 
                            kpiItemId: e.target.value,
                            kpiCode: selected?.code || ''
                          });
                        }}
                        disabled={!selectedDetail || kpiSubDetails.filter(sd => sd.detailCode === selectedDetail).length === 0}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', opacity: (selectedDetail && kpiSubDetails.filter(sd => sd.detailCode === selectedDetail).length > 0) ? 1 : 0.5 }}
                      >
                        <option value="">-- Chọn chi tiết nhỏ --</option>
                        {kpiSubDetails
                          .filter(sd => sd.detailCode === selectedDetail)
                          .map((sd) => (
                            <option key={sd.id} value={sd.id}>{sd.code} - {sd.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Hạn hoàn thành</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={handleAddTask}
                    disabled={!newTask.title || !newTask.kpiItemId}
                    style={{
                      padding: '0.5rem 1.5rem',
                      backgroundColor: (!newTask.title || !newTask.kpiItemId) ? '#ccc' : 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: (!newTask.title || !newTask.kpiItemId) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Tạo Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="card">
            <table className="table">
              <thead>
                <tr className="table__header">
                  <th className="table__cell">Tiêu đề</th>
                  <th className="table__cell">KPI</th>
                  <th className="table__cell">Người thực hiện</th>
                  <th className="table__cell">Trạng thái</th>
                  <th className="table__cell">Tiến độ</th>
                  <th className="table__cell">Hạn</th>
                  <th className="table__cell">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                      Chưa có task nào. Hãy tạo task mới!
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="table__row">
                      <td className="table__cell">
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            {task.description.substring(0, 50)}{task.description.length > 50 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td className="table__cell">
                        <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                          {task.kpiCode}
                        </span>
                      </td>
                      <td className="table__cell">{task.assignee || '-'}</td>
                      <td className="table__cell">
                        {editingTask === task.id ? (
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTask(task.id, { status: e.target.value as Task['status'] })}
                            style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                          >
                            <option value="pending">Chờ xử lý</option>
                            <option value="in_progress">Đang thực hiện</option>
                            <option value="completed">Hoàn thành</option>
                          </select>
                        ) : (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            backgroundColor: statusColors[task.status],
                            color: 'white'
                          }}>
                            {statusLabels[task.status]}
                          </span>
                        )}
                      </td>
                      <td className="table__cell">
                        {editingTask === task.id ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={task.progress}
                            onChange={(e) => handleUpdateTask(task.id, { progress: parseInt(e.target.value) || 0 })}
                            style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                          />
                        ) : (
                          <ProgressBar value={task.progress} showLabel />
                        )}
                      </td>
                      <td className="table__cell">{task.dueDate || '-'}</td>
                      <td className="table__cell">
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setEditingTask(editingTask === task.id ? null : task.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: editingTask === task.id ? 'var(--color-success)' : 'var(--color-primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            {editingTask === task.id ? '✓' : '✏️'}
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'var(--color-danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab Content: KPI */}
      {activeTab === 'kpi' && kpiData && (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '40px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '400px' }} />
              </colgroup>
              <thead>
                <tr className="table__header">
                  <th className="table__cell"></th>
                  <th className="table__cell">Mã</th>
                  <th className="table__cell">Tên chỉ tiêu</th>
                  <th className="table__cell">Bắt đầu</th>
                  <th className="table__cell">Kết thúc</th>
                  <th className="table__cell">Tiến độ</th>
                  <th className="table__cell">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {kpiData.groups.map((group: any) => (
                  <React.Fragment key={group.code}>
                    {/* Level 1: Group */}
                    <tr 
                      className="table__row"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}
                      onClick={() => toggleGroup(group.code)}
                    >
                      <td className="table__cell">{expandedGroups.has(group.code) ? '▼' : '▶'}</td>
                      <td className="table__cell" style={{ fontWeight: 700 }}>{group.code}</td>
                      <td className="table__cell" colSpan={5} style={{ fontWeight: 700 }}>{group.name}</td>
                    </tr>
                    
                    {/* Level 2: SubGroups */}
                    {expandedGroups.has(group.code) && group.subGroups.map((subGroup: any) => (
                      <React.Fragment key={subGroup.code}>
                        <tr 
                          className="table__row"
                          style={{ backgroundColor: 'var(--color-bg-secondary)', cursor: 'pointer' }}
                          onClick={() => toggleGroup(subGroup.code)}
                        >
                          <td className="table__cell" style={{ paddingLeft: '1rem' }}>
                            {expandedGroups.has(subGroup.code) ? '▼' : '▶'}
                          </td>
                          <td className="table__cell" style={{ fontWeight: 600 }}>{subGroup.code}</td>
                          <td className="table__cell" colSpan={5} style={{ fontWeight: 600 }}>{subGroup.name}</td>
                        </tr>
                        
                        {/* Level 3: Items */}
                        {expandedGroups.has(subGroup.code) && subGroup.items.map((item: any) => (
                          <React.Fragment key={item.id}>
                            <tr 
                              className="table__row"
                              style={{ cursor: item.subItems?.length > 0 ? 'pointer' : 'default' }}
                              onClick={() => item.subItems?.length > 0 && toggleGroup(item.id)}
                            >
                              <td className="table__cell" style={{ paddingLeft: '1.5rem' }}>
                                {item.subItems?.length > 0 ? (expandedGroups.has(item.id) ? '▼' : '▶') : ''}
                              </td>
                              <td className="table__cell">{item.code}</td>
                              <td className="table__cell">{item.name}</td>
                              <td className="table__cell">{item.departments[0]?.startDate || '-'}</td>
                              <td className="table__cell">{item.departments[0]?.endDate || '-'}</td>
                              <td className="table__cell">
                                <ProgressBar value={getKpiProgress(item.id, item.departments[0]?.progress || 0)} showLabel />
                              </td>
                              <td className="table__cell">
                                {tasks.filter(t => t.kpiItemId === item.id).length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {tasks.filter(t => t.kpiItemId === item.id).map(t => (
                                      <div key={t.id} style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: statusColors[t.status], color: 'white', borderRadius: '4px' }}>
                                        {t.title} ({t.progress}%)
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                            
                            {/* Level 4: SubItems */}
                            {expandedGroups.has(item.id) && item.subItems?.map((subItem: any) => (
                              <React.Fragment key={subItem.id}>
                                <tr 
                                  className="table__row"
                                  style={{ backgroundColor: 'rgba(37, 99, 235, 0.03)', cursor: subItem.details?.length > 0 ? 'pointer' : 'default' }}
                                  onClick={() => subItem.details?.length > 0 && toggleGroup(subItem.id)}
                                >
                                  <td className="table__cell" style={{ paddingLeft: '2rem' }}>
                                    {subItem.details?.length > 0 ? (expandedGroups.has(subItem.id) ? '▼' : '▶') : ''}
                                  </td>
                                  <td className="table__cell">{subItem.code}</td>
                                  <td className="table__cell">{subItem.name}</td>
                                  <td className="table__cell">{subItem.departments[0]?.startDate || '-'}</td>
                                  <td className="table__cell">{subItem.departments[0]?.endDate || '-'}</td>
                                  <td className="table__cell">
                                    <ProgressBar value={getKpiProgress(subItem.id, subItem.departments[0]?.progress || 0)} showLabel />
                                  </td>
                                  <td className="table__cell">
                                    {tasks.filter(t => t.kpiItemId === subItem.id).length > 0 && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {tasks.filter(t => t.kpiItemId === subItem.id).map(t => (
                                          <div key={t.id} style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: statusColors[t.status], color: 'white', borderRadius: '4px' }}>
                                            {t.title} ({t.progress}%)
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                                
                                {/* Level 5: Details */}
                                {expandedGroups.has(subItem.id) && subItem.details?.map((detail: any) => (
                                  <tr key={detail.id} className="table__row" style={{ backgroundColor: 'rgba(37, 99, 235, 0.02)' }}>
                                    <td className="table__cell"></td>
                                    <td className="table__cell" style={{ paddingLeft: '1rem' }}>{detail.code}</td>
                                    <td className="table__cell">{detail.name}</td>
                                    <td className="table__cell">{detail.departments[0]?.startDate || '-'}</td>
                                    <td className="table__cell">{detail.departments[0]?.endDate || '-'}</td>
                                    <td className="table__cell">
                                      <ProgressBar value={getKpiProgress(detail.id, detail.departments[0]?.progress || 0)} showLabel />
                                    </td>
                                    <td className="table__cell">
                                      {tasks.filter(t => t.kpiItemId === detail.id).length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          {tasks.filter(t => t.kpiItemId === detail.id).map(t => (
                                            <div key={t.id} style={{ fontSize: '0.75rem', padding: '2px 6px', backgroundColor: statusColors[t.status], color: 'white', borderRadius: '4px' }}>
                                              {t.title} ({t.progress}%)
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
