'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DepartmentData {
  name: string;
  progress: number;
  [key: string]: string | number;
}

interface GroupData {
  name: string;
  weight: number;
  progress: number;
  [key: string]: string | number;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function DepartmentBarChart({ data }: { data: DepartmentData[] }) {
  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Tiến độ KPI theo Phòng</h3>
      </div>
      <div className="card__body" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
            <Bar dataKey="progress" fill="#2563eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function KPIGroupPieChart({ data }: { data: GroupData[] }) {
  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Phân bổ trọng số KPI Khối</h3>
      </div>
      <div className="card__body" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="weight"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ProgressOverviewChart({ data }: { data: GroupData[] }) {
  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Tiến độ theo nhóm KPI</h3>
      </div>
      <div className="card__body" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
            <Legend />
            <Bar dataKey="progress" name="Tiến độ" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="weight" name="Trọng số" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
