import { NextResponse } from 'next/server';
import { getKPIDataWithProgress, calculateKhoiProgress, calculateDepartmentProgress, saveKPIProgress } from '@/lib/excel';

export async function GET() {
  try {
    const groups = getKPIDataWithProgress();
    const khoiProgress = calculateKhoiProgress(groups);
    
    const departments = ['P.TĐDN', 'P.TĐBL', 'P.HT&GSPD', 'P.PDTD'];
    const departmentProgress = departments.map(dept => ({
      code: dept,
      name: getDepartmentFullName(dept),
      progress: calculateDepartmentProgress(groups, dept)
    }));
    
    return NextResponse.json({
      groups,
      khoiProgress,
      departmentProgress
    });
  } catch (error) {
    console.error('Error reading KPI data:', error);
    return NextResponse.json(
      { error: 'Không thể đọc dữ liệu KPI' },
      { status: 500 }
    );
  }
}

function getDepartmentFullName(code: string): string {
  const names: Record<string, string> = {
    'P.TĐDN': 'Phòng Thẩm định Doanh nghiệp',
    'P.TĐBL': 'Phòng Thẩm định Bán lẻ',
    'P.HT&GSPD': 'Phòng Hỗ trợ & Giám sát Phê duyệt',
    'P.PDTD': 'Phòng Phê duyệt Tín dụng'
  };
  return names[code] || code;
}

// PUT: Cập nhật progress cho KPI item
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { kpiItemId, department, progress } = body;
    
    if (!kpiItemId || !department || progress === undefined) {
      return NextResponse.json(
        { error: 'Thiếu thông tin: kpiItemId, department, progress' },
        { status: 400 }
      );
    }
    
    const success = saveKPIProgress(kpiItemId, department, progress);
    
    if (success) {
      return NextResponse.json({ success: true, kpiItemId, department, progress });
    } else {
      return NextResponse.json(
        { error: 'Không thể lưu progress' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật progress' },
      { status: 500 }
    );
  }
}
