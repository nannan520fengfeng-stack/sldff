export const STORAGE_KEY = "personal-workspace:v1";

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export const initialWorkspace = {
  schemaVersion: 1,
  projects: [
    {
      id: "project-workspace",
      name: "个人工作台",
      description: "把重要的事情放在一个清晰的地方。",
      createdAt: new Date().toISOString(),
    },
    {
      id: "project-weekly",
      name: "本周计划",
      description: "为这一周留出专注和整理的时间。",
      createdAt: new Date().toISOString(),
    },
  ],
  tasks: [
    {
      id: "task-outline",
      title: "梳理工作台的第一阶段范围",
      status: "todo",
      dueDate: dateOffset(0),
      projectId: "project-workspace",
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-review",
      title: "回顾本周的优先事项",
      status: "todo",
      dueDate: dateOffset(1),
      projectId: "project-weekly",
      createdAt: new Date().toISOString(),
    },
    {
      id: "task-capture",
      title: "记录一个新的想法",
      status: "done",
      dueDate: null,
      projectId: null,
      createdAt: new Date().toISOString(),
    },
  ],
  notes: [
    {
      id: "note-start-here",
      title: "从这里开始",
      content: "先把想法和待办收进来，再决定下一步。这个工作台目前只保存在当前浏览器。",
      projectId: "project-workspace",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

function isWorkspace(value) {
  return value?.schemaVersion === 1
    && Array.isArray(value.projects)
    && Array.isArray(value.tasks)
    && Array.isArray(value.notes);
}

export function loadWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isWorkspace(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not read saved workspace data:", error);
  }

  const freshWorkspace = JSON.parse(JSON.stringify(initialWorkspace));
  saveWorkspace(freshWorkspace);
  return freshWorkspace;
}

export function saveWorkspace(workspace) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch (error) {
    console.warn("Could not save workspace data:", error);
  }
}

export function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

