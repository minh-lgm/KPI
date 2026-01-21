import { NextRequest, NextResponse } from 'next/server';
import { createToken, hashPassword } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
}

function getUsers(): User[] {
  const usersFile = path.join(process.cwd(), 'data', 'users.xlsx');
  
  if (!fs.existsSync(usersFile)) {
    return [
      {
        id: '1',
        email: 'admin@company.com',
        password: '123456',
        name: 'Admin',
        role: 'admin',
        department: ''
      },
      {
        id: '2',
        email: 'manager.tddn@company.com',
        password: '123456',
        name: 'Trưởng phòng TĐDN',
        role: 'manager',
        department: 'P.TĐDN'
      },
      {
        id: '3',
        email: 'manager.tdbl@company.com',
        password: '123456',
        name: 'Trưởng phòng TĐBL',
        role: 'manager',
        department: 'P.TĐBL'
      },
      {
        id: '4',
        email: 'manager.htgspd@company.com',
        password: '123456',
        name: 'Trưởng phòng HT&GSPD',
        role: 'manager',
        department: 'P.HT&GSPD'
      },
      {
        id: '5',
        email: 'manager.pdtd@company.com',
        password: '123456',
        name: 'Trưởng phòng PDTD',
        role: 'manager',
        department: 'P.PDTD'
      }
    ];
  }
  
  const workbook = XLSX.readFile(usersFile);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet) as User[];
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }
    
    const users = getUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Email không tồn tại' },
        { status: 401 }
      );
    }
    
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Mật khẩu không đúng' },
        { status: 401 }
      );
    }
    
    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
    });
    
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi' },
      { status: 500 }
    );
  }
}
