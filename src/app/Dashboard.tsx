'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import { DepartmentBarChart, KPIGroupPieChart, ProgressOverviewChart } from '@/components/KPIChart';

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

interface DepartmentProgress {
  code: string;
  name: string;
  progress: number;
}

interface KPIData {
  groups: KPIGroup[];
  khoiProgress: number;
  departmentProgress: DepartmentProgress[];
}

export default function Dashboard() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/kpi');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Không thể tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>
        <p>{error || 'Đã xảy ra lỗi'}</p>
      </div>
    );
  }

  const getProgressVariant = (value: number) => {
    if (value >= 80) return 'success';
    if (value >= 50) return 'warning';
    return 'danger';
  };

  const groupChartData = data.groups.map(g => ({
    name: g.code,
    weight: g.weight,
    progress: calculateGroupProgress(g),
  }));

  const deptChartData = data.departmentProgress.map(d => ({
    name: d.code,
    progress: d.progress,
  }));

  return (
    <>
      <div className="page-header">
        <h1 className="page-header__title">Dashboard</h1>
        <p className="page-header__subtitle">Tổng quan tiến độ KPI Khối Thẩm định & Phê duyệt</p>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Tiến độ KPI Khối"
          value={data.khoiProgress.toFixed(1)}
          suffix="%"
          variant={getProgressVariant(data.khoiProgress)}
        />
        <StatCard
          label="Số nhóm KPI"
          value={data.groups.length}
        />
        <StatCard
          label="Số phòng ban"
          value={data.departmentProgress.length}
        />
        <StatCard
          label="Tổng số đầu việc"
          value={data.groups.reduce((sum, g) => sum + g.subGroups.reduce((s, sg) => s + sg.items.length, 0), 0)}
        />
      </div>

      <div className="charts-grid">
        <DepartmentBarChart data={deptChartData} />
        <KPIGroupPieChart data={groupChartData} />
      </div>

      <div className="charts-grid">
        <ProgressOverviewChart data={groupChartData} />
      </div>

      <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
        <div className="card__header">
          <h3 className="card__title">Tiến độ theo Phòng</h3>
        </div>
        <div className="card__body">
          <div className="dept-grid">
            {data.departmentProgress.map((dept) => (
              <div key={dept.code} className="dept-card">
                <div className="dept-card__header">
                  <div>
                    <div className="dept-card__name">{dept.code}</div>
                    <div className="dept-card__code">{dept.name}</div>
                  </div>
                  <div className={`dept-card__progress`} style={{ color: `var(--color-${getProgressVariant(dept.progress)})` }}>
                    {dept.progress.toFixed(1)}%
                  </div>
                </div>
                <ProgressBar value={dept.progress} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function calculateGroupProgress(group: KPIGroup): number {
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
}
