import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

function getKPIDataFilePath(): string {
  return path.resolve(process.cwd(), 'data', 'data.json');
}

function getUsersFilePath(): string {
  return path.resolve(process.cwd(), 'data', 'users.xlsx');
}

export interface DepartmentAssignment {
  department: string;
  weight: number;
  startDate: string;
  endDate: string;
  calculatedWeight: number;
  progress: number;
}

export interface KPISubDetail {
  id: string;
  code: string;
  name: string;
  weight: number;
  description: string;
  departments: DepartmentAssignment[];
}

export interface KPIDetail {
  id: string;
  code: string;
  name: string;
  weight: number;
  description: string;
  departments: DepartmentAssignment[];
  subDetails: KPISubDetail[];
}

export interface KPISubItem {
  id: string;
  code: string;
  name: string;
  weight: number;
  description: string;
  departments: DepartmentAssignment[];
  details: KPIDetail[];
}

export interface KPIItem {
  id: string;
  code: string;
  name: string;
  weight: number;
  description: string;
  departments: DepartmentAssignment[];
  subItems: KPISubItem[];
  parentCode: string;
}

export interface KPISubGroup {
  code: string;
  name: string;
  weight: number;
  items: KPIItem[];
}

export interface KPIGroup {
  code: string;
  name: string;
  weight: number;
  subGroups: KPISubGroup[];
}

interface JSONSubDetail {
  code: string;
  name: string | string[];
  weight?: number;
  description?: string;
  division?: string | string[];
  startdate?: string | null;
  enddate?: string | null;
}

interface JSONDetail {
  code: string;
  name: string | string[];
  weight?: number;
  description?: string;
  division?: string | string[];
  startdate?: string | null;
  enddate?: string | null;
  subDetails?: JSONSubDetail[];
}

interface JSONSubItem {
  code: string;
  name: string | string[];
  weight?: number;
  description?: string;
  division?: string | string[];
  startdate?: string | null;
  enddate?: string | null;
  details?: JSONDetail[];
}

interface JSONItem {
  code: string;
  name: string | string[];
  weight?: number;
  description?: string;
  division?: string | string[];
  startdate?: string | null;
  enddate?: string | null;
  subItems?: JSONSubItem[];
}

interface JSONSubGroup {
  code: string;
  name: string;
  weight: number;
  items?: JSONItem[];
}

interface JSONGroup {
  code: string;
  name: string;
  weight: number;
  subGroups?: JSONSubGroup[];
}

interface JSONKPIData {
  year: number;
  department: string;
  groups: JSONGroup[];
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department: string;
}

export interface Department {
  code: string;
  name: string;
  kpiProgress: number;
}

export interface Task {
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

let _departmentNames: Record<string, string> = {
  'P.TĐDN': 'Phòng Thẩm định Doanh nghiệp',
  'P.TĐBL': 'Phòng Thẩm định Bán lẻ',
  'P.HT&GSPD': 'Phòng Hỗ trợ & Giám sát Phê duyệt',
  'P.PDTD': 'Phòng Phê duyệt Tín dụng'
};

// Helper function to normalize name (array to string)
function normalizeName(name: string | string[]): string {
  return Array.isArray(name) ? name.join('\n') : name;
}

// Helper function to get divisions array
function getDivisions(division?: string | string[]): string[] {
  if (!division) return [];
  if (Array.isArray(division)) {
    return division.map(d => d.trim()).filter(d => d);
  }
  const trimmed = division.trim();
  return trimmed ? [trimmed] : [];
}

// Helper function to create department assignments
function createDepartments(
  divisions: string[],
  weight: number,
  startDate: string,
  endDate: string,
  calculatedWeight: number
): DepartmentAssignment[] {
  if (divisions.length === 0) return [];
  return divisions.map(div => ({
    department: div,
    weight: weight / divisions.length,
    startDate,
    endDate,
    calculatedWeight: calculatedWeight / divisions.length,
    progress: 0
  }));
}

export function readKPIData(): KPIGroup[] {
  const dataFile = getKPIDataFilePath();
  const fileContent = fs.readFileSync(dataFile, 'utf-8');
  // Remove comments from JSON (// comments)
  const cleanedContent = fileContent.replace(/\/\/.*$/gm, '');
  const jsonData: JSONKPIData = JSON.parse(cleanedContent);

  const groups: KPIGroup[] = [];
  let itemIndex = 0;

  for (const jsonGroup of jsonData.groups) {
    const group: KPIGroup = {
      code: jsonGroup.code,
      name: jsonGroup.name,
      weight: jsonGroup.weight,
      subGroups: []
    };

    for (const jsonSubGroup of jsonGroup.subGroups || []) {
      const subGroup: KPISubGroup = {
        code: jsonSubGroup.code,
        name: jsonSubGroup.name,
        weight: jsonSubGroup.weight,
        items: []
      };

      for (const jsonItem of jsonSubGroup.items || []) {
        const itemWeight = jsonItem.weight || 0;
        const itemDivisions = getDivisions(jsonItem.division);
        const itemCalcWeight = (jsonSubGroup.weight * itemWeight) / 100;
        
        const item: KPIItem = {
          id: `kpi-${itemIndex++}`,
          code: jsonItem.code,
          name: normalizeName(jsonItem.name),
          weight: itemWeight,
          description: jsonItem.description || '',
          departments: createDepartments(
            itemDivisions,
            itemWeight,
            jsonItem.startdate || '',
            jsonItem.enddate || '',
            itemCalcWeight
          ),
          subItems: [],
          parentCode: jsonGroup.code
        };

        // Process subItems (Level 4) if exists
        if (jsonItem.subItems && jsonItem.subItems.length > 0) {
          for (const jsonSubItem of jsonItem.subItems) {
            const subItemWeight = jsonSubItem.weight || 0;
            const subItemDivisions = getDivisions(jsonSubItem.division);
            const subItemCalcWeight = (jsonSubGroup.weight * itemWeight * subItemWeight) / 10000;
            
            const subItem: KPISubItem = {
              id: `kpi-${itemIndex++}`,
              code: jsonSubItem.code,
              name: normalizeName(jsonSubItem.name),
              weight: subItemWeight,
              description: jsonSubItem.description || '',
              departments: createDepartments(
                subItemDivisions,
                subItemWeight,
                jsonSubItem.startdate || '',
                jsonSubItem.enddate || '',
                subItemCalcWeight
              ),
              details: []
            };

            // Process details (Level 5) if exists
            if (jsonSubItem.details && jsonSubItem.details.length > 0) {
              for (const jsonDetail of jsonSubItem.details) {
                const detailWeight = jsonDetail.weight || 0;
                const detailDivisions = getDivisions(jsonDetail.division);
                const detailCalcWeight = (jsonSubGroup.weight * itemWeight * subItemWeight * detailWeight) / 1000000;
                
                const detail: KPIDetail = {
                  id: `kpi-${itemIndex++}`,
                  code: jsonDetail.code,
                  name: normalizeName(jsonDetail.name),
                  weight: detailWeight,
                  description: jsonDetail.description || '',
                  departments: createDepartments(
                    detailDivisions,
                    detailWeight,
                    jsonDetail.startdate || '',
                    jsonDetail.enddate || '',
                    detailCalcWeight
                  ),
                  subDetails: []
                };

                // Process subDetails (Level 6) if exists
                if (jsonDetail.subDetails && jsonDetail.subDetails.length > 0) {
                  for (const jsonSubDetail of jsonDetail.subDetails) {
                    const subDetailWeight = jsonSubDetail.weight || 0;
                    const subDetailDivisions = getDivisions(jsonSubDetail.division);
                    const subDetailCalcWeight = (jsonSubGroup.weight * itemWeight * subItemWeight * detailWeight * subDetailWeight) / 100000000;
                    
                    const subDetail: KPISubDetail = {
                      id: `kpi-${itemIndex++}`,
                      code: jsonSubDetail.code,
                      name: normalizeName(jsonSubDetail.name),
                      weight: subDetailWeight,
                      description: jsonSubDetail.description || '',
                      departments: createDepartments(
                        subDetailDivisions,
                        subDetailWeight,
                        jsonSubDetail.startdate || '',
                        jsonSubDetail.enddate || '',
                        subDetailCalcWeight
                      )
                    };
                    detail.subDetails.push(subDetail);
                  }
                }

                subItem.details.push(detail);
              }
            }

            item.subItems.push(subItem);
          }
        }

        subGroup.items.push(item);
      }

      group.subGroups.push(subGroup);
    }

    groups.push(group);
  }

  return groups;
}

export function getDepartments(): Department[] {
  const kpiData = readKPIData();
  const deptMap = new Map<string, { totalWeight: number; weightedProgress: number }>();

  const addDept = (dept: DepartmentAssignment) => {
    if (!deptMap.has(dept.department)) {
      deptMap.set(dept.department, { totalWeight: 0, weightedProgress: 0 });
    }
    const deptData = deptMap.get(dept.department)!;
    deptData.totalWeight += dept.calculatedWeight;
    deptData.weightedProgress += dept.calculatedWeight * dept.progress;
  };

  for (const group of kpiData) {
    for (const subGroup of group.subGroups) {
      for (const item of subGroup.items) {
        for (const dept of item.departments) {
          addDept(dept);
        }
        for (const subItem of item.subItems) {
          for (const dept of subItem.departments) {
            addDept(dept);
          }
          for (const detail of subItem.details) {
            for (const dept of detail.departments) {
              addDept(dept);
            }
            for (const subDetail of detail.subDetails) {
              for (const dept of subDetail.departments) {
                addDept(dept);
              }
            }
          }
        }
      }
    }
  }

  const departments: Department[] = [];
  deptMap.forEach((value, key) => {
    departments.push({
      code: key,
      name: getDepartmentFullName(key),
      kpiProgress: value.totalWeight > 0 ? value.weightedProgress / value.totalWeight : 0
    });
  });

  return departments;
}

function getDepartmentFullName(code: string): string {
  return _departmentNames[code] || code;
}

export function readUsers(): User[] {
  const usersFile = getUsersFilePath();
  if (!fs.existsSync(usersFile)) {
    return getDefaultUsers();
  }
  
  const fileBuffer = fs.readFileSync(usersFile);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet) as User[];
  return data;
}

function getDefaultUsers(): User[] {
  return [
    {
      id: '1',
      email: 'admin@company.com',
      password: '$2a$10$rQnM1.V5QJ5Z5Z5Z5Z5Z5uKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJK',
      name: 'Admin',
      role: 'admin',
      department: ''
    },
    {
      id: '2',
      email: 'manager.tddn@company.com',
      password: '$2a$10$rQnM1.V5QJ5Z5Z5Z5Z5Z5uKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJK',
      name: 'Trưởng phòng TĐDN',
      role: 'manager',
      department: 'P.TĐDN'
    },
    {
      id: '3',
      email: 'manager.tdbl@company.com',
      password: '$2a$10$rQnM1.V5QJ5Z5Z5Z5Z5Z5uKJKJKJKJKJKJKJKJKJKJKJKJKJKJKJK',
      name: 'Trưởng phòng TĐBL',
      role: 'manager',
      department: 'P.TĐBL'
    }
  ];
}

export function saveKPIProgress(kpiItemId: string, department: string, progress: number): boolean {
  try {
    const progressFile = path.join(process.cwd(), 'data', 'progress.json');
    let progressData: Record<string, number> = {};
    
    if (fs.existsSync(progressFile)) {
      progressData = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    }
    
    const key = `${kpiItemId}-${department}`;
    progressData[key] = progress;
    fs.writeFileSync(progressFile, JSON.stringify(progressData, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving progress:', error);
    return false;
  }
}

export function loadKPIProgress(): Record<string, number> {
  try {
    const progressFile = path.join(process.cwd(), 'data', 'progress.json');
    if (fs.existsSync(progressFile)) {
      return JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading progress:', error);
  }
  return {};
}

export function readTasks(): Task[] {
  try {
    const tasksFile = path.join(process.cwd(), 'data', 'tasks.json');
    if (fs.existsSync(tasksFile)) {
      const data = JSON.parse(fs.readFileSync(tasksFile, 'utf-8'));
      return data.tasks || [];
    }
  } catch (error) {
    console.error('Error reading tasks:', error);
  }
  return [];
}

export function getTasksByDepartment(department: string): Task[] {
  const tasks = readTasks();
  return tasks.filter(t => t.department === department);
}

export function getTasksByKPIItem(kpiItemId: string): Task[] {
  const tasks = readTasks();
  return tasks.filter(t => t.kpiItemId === kpiItemId);
}

export function calculateProgressFromTasks(kpiItemId: string, department: string): number {
  const tasks = readTasks();
  const relevantTasks = tasks.filter(t => t.kpiItemId === kpiItemId && t.department === department);
  
  if (relevantTasks.length === 0) return 0;
  
  const totalProgress = relevantTasks.reduce((sum, t) => sum + t.progress, 0);
  return Math.round(totalProgress / relevantTasks.length);
}

export function getKPIDataWithProgress(): KPIGroup[] {
  const groups = readKPIData();
  const tasks = readTasks();
  
  // Helper function to calculate progress from tasks for a specific KPI item and department
  const getProgressFromTasks = (kpiItemId: string, department: string): number => {
    const relevantTasks = tasks.filter(t => t.kpiItemId === kpiItemId && t.department === department);
    if (relevantTasks.length === 0) return 0;
    const totalProgress = relevantTasks.reduce((sum, t) => sum + t.progress, 0);
    return Math.round(totalProgress / relevantTasks.length);
  };
  
  for (const group of groups) {
    for (const subGroup of group.subGroups) {
      for (const item of subGroup.items) {
        for (const dept of item.departments) {
          dept.progress = getProgressFromTasks(item.id, dept.department);
        }
        for (const subItem of item.subItems) {
          for (const dept of subItem.departments) {
            dept.progress = getProgressFromTasks(subItem.id, dept.department);
          }
          for (const detail of subItem.details) {
            for (const dept of detail.departments) {
              dept.progress = getProgressFromTasks(detail.id, dept.department);
            }
            for (const subDetail of detail.subDetails) {
              for (const dept of subDetail.departments) {
                dept.progress = getProgressFromTasks(subDetail.id, dept.department);
              }
            }
          }
        }
      }
    }
  }
  
  return groups;
}

export function calculateKhoiProgress(groups: KPIGroup[]): number {
  let totalWeight = 0;
  let weightedProgress = 0;
  
  for (const group of groups) {
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
          for (const detail of subItem.details) {
            for (const dept of detail.departments) {
              totalWeight += dept.calculatedWeight;
              weightedProgress += dept.calculatedWeight * dept.progress / 100;
            }
            for (const subDetail of detail.subDetails) {
              for (const dept of subDetail.departments) {
                totalWeight += dept.calculatedWeight;
                weightedProgress += dept.calculatedWeight * dept.progress / 100;
              }
            }
          }
        }
      }
    }
  }
  
  return totalWeight > 0 ? (weightedProgress / totalWeight) * 100 : 0;
}

export function calculateDepartmentProgress(groups: KPIGroup[], department: string): number {
  let totalWeight = 0;
  let weightedProgress = 0;
  
  for (const group of groups) {
    for (const subGroup of group.subGroups) {
      for (const item of subGroup.items) {
        for (const dept of item.departments) {
          if (dept.department === department) {
            totalWeight += dept.calculatedWeight;
            weightedProgress += dept.calculatedWeight * dept.progress / 100;
          }
        }
        for (const subItem of item.subItems) {
          for (const dept of subItem.departments) {
            if (dept.department === department) {
              totalWeight += dept.calculatedWeight;
              weightedProgress += dept.calculatedWeight * dept.progress / 100;
            }
          }
          for (const detail of subItem.details) {
            for (const dept of detail.departments) {
              if (dept.department === department) {
                totalWeight += dept.calculatedWeight;
                weightedProgress += dept.calculatedWeight * dept.progress / 100;
              }
            }
            for (const subDetail of detail.subDetails) {
              for (const dept of subDetail.departments) {
                if (dept.department === department) {
                  totalWeight += dept.calculatedWeight;
                  weightedProgress += dept.calculatedWeight * dept.progress / 100;
                }
              }
            }
          }
        }
      }
    }
  }
  
  return totalWeight > 0 ? (weightedProgress / totalWeight) * 100 : 0;
}
