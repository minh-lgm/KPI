'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import ProgressBar from '@/components/ProgressBar';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { 
  pageTransitionVariants,
  staggerContainerVariants,
  staggerItemVariants,
  fadeInVariants 
} from '@/lib/animations';

interface DepartmentAssignment {
  department: string;
  weight: number;
  startDate: string;
  endDate: string;
  calculatedWeight: number;
  progress: number;
}

interface KPISubItem {
  id: string;
  code: string;
  name: string;
  weight: number;
  description: string;
  departments: DepartmentAssignment[];
}

interface KPIItem {
  id: string;
  code: string;
  name: string;
  weight: number;
  description: string;
  departments: DepartmentAssignment[];
  subItems: KPISubItem[];
  parentCode: string;
}

interface KPISubGroup {
  code: string;
  name: string;
  weight: number;
  items: KPIItem[];
}

interface KPIGroup {
  code: string;
  name: string;
  weight: number;
  subGroups: KPISubGroup[];
}

interface KPIData {
  groups: KPIGroup[];
  khoiProgress: number;
}

export default function KPIKhoiContent() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/kpi');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setExpandedGroups(new Set(json.groups.map((g: KPIGroup) => g.code)));
      toast.success('Đã tải dữ liệu KPI Khối thành công');
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu KPI Khối');
    } finally {
      setLoading(false);
    }
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

  const calculateGroupProgress = (group: KPIGroup): number => {
    let totalWeight = 0;
    let weightedProgress = 0;
    for (const subGroup of group.subGroups) {
      for (const item of subGroup.items) {
        for (const dept of item.departments) {
          totalWeight += dept.calculatedWeight;
          weightedProgress += dept.calculatedWeight * dept.progress / 100;
        }
        for (const subItem of item.subItems) {
          for (const dept of subItem.departments) {
            totalWeight += dept.calculatedWeight;
            weightedProgress += dept.calculatedWeight * dept.progress / 100;
          }
        }
      }
    }
    return totalWeight > 0 ? (weightedProgress / totalWeight) * 100 : 0;
  };

  const calculateSubGroupProgress = (subGroup: KPISubGroup): number => {
    let totalWeight = 0;
    let weightedProgress = 0;
    for (const item of subGroup.items) {
      for (const dept of item.departments) {
        totalWeight += dept.calculatedWeight;
        weightedProgress += dept.calculatedWeight * dept.progress / 100;
      }
      for (const subItem of item.subItems) {
        for (const dept of subItem.departments) {
          totalWeight += dept.calculatedWeight;
          weightedProgress += dept.calculatedWeight * dept.progress / 100;
        }
      }
    }
    return totalWeight > 0 ? (weightedProgress / totalWeight) * 100 : 0;
  };

  const calculateItemProgress = (item: KPIItem): number => {
    let totalWeight = 0;
    let weightedProgress = 0;
    for (const dept of item.departments) {
      totalWeight += dept.weight;
      weightedProgress += dept.weight * dept.progress / 100;
    }
    for (const subItem of item.subItems) {
      for (const dept of subItem.departments) {
        totalWeight += dept.weight;
        weightedProgress += dept.weight * dept.progress / 100;
      }
    }
    return totalWeight > 0 ? (weightedProgress / totalWeight) * 100 : 0;
  };

  const getDeptBadgeClass = (dept: string): string => {
    const map: Record<string, string> = {
      'P.TĐDN': 'badge--dept-tddn',
      'P.TĐBL': 'badge--dept-tdbl',
      'P.HT&GSPD': 'badge--dept-htgspd',
      'P.PDTD': 'badge--dept-pdtd',
    };
    return map[dept] || 'badge--info';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="page-header">
          <h1 className="page-header__title">KPI Khối Thẩm định & Phê duyệt</h1>
          <p className="page-header__subtitle">Theo dõi chi tiết các KPI của khối</p>
        </div>
        
        <motion.div 
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          {[1, 2, 3].map(i => (
            <motion.div key={i} variants={staggerItemVariants} style={{ marginBottom: '1rem' }}>
              <SkeletonCard variant="table" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  if (!data) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>Không thể tải dữ liệu</div>;
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-header__title">KPI Khối</h1>
        <p className="page-header__subtitle">
          Tiến độ tổng: <strong>{data.khoiProgress.toFixed(1)}%</strong>
        </p>
      </div>

      <div className="card">
        <div className="card__body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '50px' }} />
                <col style={{ width: '60px' }} />
                <col style={{ width: 'auto' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '100px' }} />
                <col style={{ width: '120px' }} />
              </colgroup>
              <thead className="table__header">
                <tr>
                  <th className="table__header-cell"></th>
                  <th className="table__header-cell">STT</th>
                  <th className="table__header-cell">Bộ chỉ tiêu KPIs</th>
                  <th className="table__header-cell">Trọng số (%)</th>
                  <th className="table__header-cell">Phòng thực hiện</th>
                  <th className="table__header-cell">Bắt đầu</th>
                  <th className="table__header-cell">Hoàn thành</th>
                  <th className="table__header-cell">% KPI Khối</th>
                </tr>
              </thead>
              <tbody>
                {data.groups.map((group) => (
                  <React.Fragment key={group.code}>
                    {/* Level 1: Main Group (A, B, C, D) */}
                    <tr
                      className="table__row table__row--level1"
                      style={{ cursor: 'pointer', backgroundColor: 'var(--color-primary)', color: 'white' }}
                      onClick={() => toggleGroup(group.code)}
                    >
                      <td className="table__cell" style={{ textAlign: 'center', width: '50px' }}>
                        {expandedGroups.has(group.code) ? '▼' : '▶'}
                      </td>
                      <td className="table__cell">{group.code}</td>
                      <td className="table__cell"><strong>{group.name}</strong></td>
                      <td className="table__cell">{group.weight}%</td>
                      <td className="table__cell">-</td>
                      <td className="table__cell">-</td>
                      <td className="table__cell">-</td>
                      <td className="table__cell">
                        <ProgressBar value={calculateGroupProgress(group)} showLabel />
                      </td>
                    </tr>
                    
                    {/* Level 2: Sub Groups (I, II, III) */}
                    {expandedGroups.has(group.code) && group.subGroups.map((subGroup) => {
                      const isDirectKPI = subGroup.items.length === 1 && subGroup.items[0].code === subGroup.code;
                      const hasChildren = subGroup.items.length > 0 && !isDirectKPI;
                      
                      return (
                      <React.Fragment key={subGroup.code}>
                        {isDirectKPI ? (
                          <tr className="table__row table__row--level2" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
                            <td className="table__cell" style={{ textAlign: 'center', width: '50px' }}></td>
                            <td className="table__cell">{subGroup.code.split('.').pop()}</td>
                            <td className="table__cell"><strong>{subGroup.name}</strong></td>
                            <td className="table__cell">{subGroup.weight}%</td>
                            <td className="table__cell">
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {subGroup.items[0].departments.map((dept, idx) => (
                                  <span key={idx} className={`badge ${getDeptBadgeClass(dept.department)}`}>
                                    {dept.department}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="table__cell">-</td>
                            <td className="table__cell">-</td>
                            <td className="table__cell">
                              <ProgressBar value={calculateSubGroupProgress(subGroup)} showLabel />
                            </td>
                          </tr>
                        ) : (
                          <>
                            <tr
                              className="table__row table__row--level2"
                              style={{ cursor: hasChildren ? 'pointer' : 'default', backgroundColor: 'rgba(37, 99, 235, 0.1)' }}
                              onClick={() => hasChildren && toggleGroup(subGroup.code)}
                            >
                              <td className="table__cell" style={{ textAlign: 'center', width: '50px' }}>
                                {hasChildren ? (expandedGroups.has(subGroup.code) ? '▼' : '▶') : ''}
                              </td>
                              <td className="table__cell">{subGroup.code.split('.').pop()}</td>
                              <td className="table__cell"><strong>{subGroup.name}</strong></td>
                              <td className="table__cell">{subGroup.weight}%</td>
                              <td className="table__cell">-</td>
                              <td className="table__cell">-</td>
                              <td className="table__cell">-</td>
                              <td className="table__cell">
                                <ProgressBar value={calculateSubGroupProgress(subGroup)} showLabel />
                              </td>
                            </tr>
                            
                            {/* Level 3 & 4: KPI Items */}
                            {hasChildren && expandedGroups.has(subGroup.code) && subGroup.items.map((item) => (
                              <React.Fragment key={item.id}>
                                {/* Level 3: Item row */}
                                <tr 
                                  className="table__row"
                                  style={{ 
                                    cursor: item.subItems.length > 0 ? 'pointer' : 'default',
                                    backgroundColor: item.subItems.length > 0 ? 'rgba(37, 99, 235, 0.05)' : undefined
                                  }}
                                  onClick={() => item.subItems.length > 0 && toggleGroup(item.id)}
                                >
                                  <td className="table__cell" style={{ textAlign: 'center', width: '50px' }}>
                                    {item.subItems.length > 0 ? (expandedGroups.has(item.id) ? '▼' : '▶') : ''}
                                  </td>
                                  <td className="table__cell">{item.code}</td>
                                  <td className="table__cell">
                                    <div>{item.name}</div>
                                    {item.description && (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                        {item.description.substring(0, 100)}
                                        {item.description.length > 100 ? '...' : ''}
                                      </div>
                                    )}
                                  </td>
                                  <td className="table__cell">{item.weight}%</td>
                                  <td className="table__cell">
                                    {item.departments.length > 0 ? (
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {item.departments.map((dept, idx) => (
                                          <span key={idx} className={`badge ${getDeptBadgeClass(dept.department)}`}>
                                            {dept.department}
                                          </span>
                                        ))}
                                      </div>
                                    ) : '-'}
                                  </td>
                                  <td className="table__cell">
                                    {item.departments.length === 1 ? item.departments[0].startDate : '-'}
                                  </td>
                                  <td className="table__cell">
                                    {item.departments.length === 1 ? item.departments[0].endDate : '-'}
                                  </td>
                                  <td className="table__cell">
                                    <ProgressBar value={calculateItemProgress(item)} showLabel />
                                  </td>
                                </tr>
                                
                                {/* Level 4: SubItems */}
                                {item.subItems.length > 0 && expandedGroups.has(item.id) && item.subItems.map((subItem) => (
                                  <tr key={subItem.id} className="table__row">
                                    <td className="table__cell" style={{ textAlign: 'center', width: '50px' }}></td>
                                    <td className="table__cell">{subItem.code}</td>
                                    <td className="table__cell">
                                      <div>{subItem.name}</div>
                                      {subItem.description && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                          {subItem.description.substring(0, 100)}
                                          {subItem.description.length > 100 ? '...' : ''}
                                        </div>
                                      )}
                                    </td>
                                    <td className="table__cell">{subItem.weight}%</td>
                                    <td className="table__cell">
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {subItem.departments.map((dept, idx) => (
                                          <span key={idx} className={`badge ${getDeptBadgeClass(dept.department)}`}>
                                            {dept.department}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="table__cell">
                                      {subItem.departments.length === 1 ? subItem.departments[0].startDate : '-'}
                                    </td>
                                    <td className="table__cell">
                                      {subItem.departments.length === 1 ? subItem.departments[0].endDate : '-'}
                                    </td>
                                    <td className="table__cell">
                                      <ProgressBar 
                                        value={subItem.departments.reduce((sum, d) => sum + d.progress * d.weight, 0) / 
                                               Math.max(subItem.departments.reduce((sum, d) => sum + d.weight, 0), 1)} 
                                        showLabel 
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}
                          </>
                        )}
                      </React.Fragment>
                    );})}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
