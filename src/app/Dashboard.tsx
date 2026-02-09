'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { DepartmentBarChart, KPIGroupPieChart, ProgressOverviewChart } from '@/components/KPIChart';
import { 
  pageTransitionVariants, 
  staggerContainerVariants, 
  staggerItemVariants,
  chartAnimationVariants 
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
      toast.success('Đã tải dữ liệu KPI thành công');
    } catch (err) {
      const errorMessage = 'Không thể tải dữ liệu KPI';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="page-header">
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">Tổng quan tiến độ KPI Khối Thẩm định & Phê duyệt</p>
        </div>
        
        <motion.div 
          className="stats-grid"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          {[1, 2, 3, 4].map(i => (
            <motion.div key={i} variants={staggerItemVariants}>
              <SkeletonCard variant="stats" />
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="charts-grid"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
          style={{ marginTop: '2rem' }}
        >
          {[1, 2].map(i => (
            <motion.div key={i} variants={staggerItemVariants}>
              <SkeletonCard variant="chart" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  if (error || !data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}
      >
        <p>{error || 'Đã xảy ra lỗi'}</p>
      </motion.div>
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
    <AnimatePresence mode="wait">
      <motion.div
        key="dashboard"
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">Tổng quan tiến độ KPI Khối Thẩm định & Phê duyệt</p>
        </motion.div>

        <motion.div 
          className="stats-grid"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItemVariants}>
            <StatCard
              label="Tiến độ KPI Khối"
              value={data.khoiProgress.toFixed(1)}
              suffix="%"
              variant={getProgressVariant(data.khoiProgress)}
              animated={true}
            />
          </motion.div>
          <motion.div variants={staggerItemVariants}>
            <StatCard
              label="Số nhóm KPI"
              value={data.groups.length}
              animated={true}
            />
          </motion.div>
          <motion.div variants={staggerItemVariants}>
            <StatCard
              label="Số phòng ban"
              value={data.departmentProgress.length}
              animated={true}
            />
          </motion.div>
          <motion.div variants={staggerItemVariants}>
            <StatCard
              label="Tổng số đầu việc"
              value={data.groups.reduce((sum, g) => sum + g.subGroups.reduce((s, sg) => s + sg.items.length, 0), 0)}
              animated={true}
            />
          </motion.div>
        </motion.div>

        <motion.div 
          className="charts-grid"
          variants={chartAnimationVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <DepartmentBarChart data={deptChartData} />
          <KPIGroupPieChart data={groupChartData} />
        </motion.div>

        <motion.div 
          className="charts-grid"
          variants={chartAnimationVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <ProgressOverviewChart data={groupChartData} />
        </motion.div>

        <motion.div 
          className="card" 
          style={{ marginTop: 'var(--spacing-xl)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <div className="card__header">
            <h3 className="card__title">Tiến độ theo Phòng</h3>
          </div>
          <div className="card__body">
            <motion.div 
              className="dept-grid"
              variants={staggerContainerVariants}
              initial="initial"
              animate="animate"
            >
              {data.departmentProgress.map((dept, index) => (
                <motion.div 
                  key={dept.code} 
                  className="dept-card"
                  variants={staggerItemVariants}
                  whileHover={{ scale: 1.02 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="dept-card__header">
                    <div>
                      <div className="dept-card__name">{dept.code}</div>
                      <div className="dept-card__code">{dept.name}</div>
                    </div>
                    <motion.div 
                      className={`dept-card__progress`} 
                      style={{ color: `var(--color-${getProgressVariant(dept.progress)})` }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 + index * 0.1, type: "spring", stiffness: 300 }}
                    >
                      {dept.progress.toFixed(1)}%
                    </motion.div>
                  </div>
                  <ProgressBar value={dept.progress} animated={true} delay={1.2 + index * 0.1} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
