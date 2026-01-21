import { NextRequest, NextResponse } from 'next/server';
import { saveKPIProgress } from '@/lib/excel';
import { getSession, canEditKPI } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }
    
    const { itemId, progress, department } = await request.json();
    
    if (!canEditKPI(user, department)) {
      return NextResponse.json(
        { error: 'Không có quyền chỉnh sửa' },
        { status: 403 }
      );
    }
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Tiến độ phải từ 0 đến 100' },
        { status: 400 }
      );
    }
    
    const success = saveKPIProgress(itemId, department, progress);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Không thể lưu tiến độ' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    );
  }
}
