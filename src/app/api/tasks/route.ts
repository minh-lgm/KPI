import { NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

interface Task {
  id: string;
  kpiItemId: string;
  kpiCode: string;
  kpiLevel: 'item' | 'subItem' | 'detail' | 'subDetail';
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

const STORE_NAME = 'kpi-tasks';
const TASKS_KEY = 'tasks';

// Check if running on Netlify
function isNetlify(): boolean {
  return !!process.env.NETLIFY || !!process.env.NETLIFY_BLOBS_CONTEXT;
}

// Read tasks from Netlify Blobs or local file
async function readTasks(): Promise<Task[]> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const data = await store.get(TASKS_KEY, { type: 'json' });
      return data?.tasks || [];
    } else {
      // Local development - use file system
      const filePath = path.join(process.cwd(), 'data', 'tasks.json');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return data.tasks || [];
      }
    }
  } catch (error) {
    console.error('Error reading tasks:', error);
  }
  return [];
}

// Save tasks to Netlify Blobs or local file
async function saveTasks(tasks: Task[]): Promise<boolean> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.setJSON(TASKS_KEY, { tasks });
      return true;
    } else {
      // Local development - use file system
      const filePath = path.join(process.cwd(), 'data', 'tasks.json');
      fs.writeFileSync(filePath, JSON.stringify({ tasks }, null, 2));
      return true;
    }
  } catch (error) {
    console.error('Error saving tasks:', error);
    return false;
  }
}

// GET: Lấy danh sách tasks
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    
    let tasks = await readTasks();
    
    if (department) {
      tasks = tasks.filter((t: Task) => t.department === department);
    }
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Không thể đọc dữ liệu tasks' },
      { status: 500 }
    );
  }
}

// POST: Tạo task mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, assignee, kpiCode, kpiItemId, kpiLevel, department, dueDate } = body;
    
    if (!title || !kpiItemId || !department) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc: title, kpiItemId, department' },
        { status: 400 }
      );
    }
    
    const tasks = await readTasks();
    const now = new Date().toISOString();
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      description: description || '',
      assignee: assignee || '',
      kpiCode: kpiCode || '',
      kpiItemId,
      kpiLevel: kpiLevel || 'item',
      department,
      status: 'pending',
      progress: 0,
      dueDate: dueDate || '',
      createdAt: now,
      updatedAt: now
    };
    
    tasks.push(newTask);
    
    if (await saveTasks(tasks)) {
      return NextResponse.json(newTask, { status: 201 });
    } else {
      return NextResponse.json(
        { error: 'Không thể lưu task' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Lỗi tạo task' },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật task
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu task ID' },
        { status: 400 }
      );
    }
    
    const tasks = await readTasks();
    const taskIndex = tasks.findIndex((t: Task) => t.id === id);
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Không tìm thấy task' },
        { status: 404 }
      );
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    if (await saveTasks(tasks)) {
      return NextResponse.json(tasks[taskIndex]);
    } else {
      return NextResponse.json(
        { error: 'Không thể cập nhật task' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật task' },
      { status: 500 }
    );
  }
}

// DELETE: Xóa task
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu task ID' },
        { status: 400 }
      );
    }
    
    const tasks = await readTasks();
    const filteredTasks = tasks.filter((t: Task) => t.id !== id);
    
    if (filteredTasks.length === tasks.length) {
      return NextResponse.json(
        { error: 'Không tìm thấy task' },
        { status: 404 }
      );
    }
    
    if (await saveTasks(filteredTasks)) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Không thể xóa task' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa task' },
      { status: 500 }
    );
  }
}
