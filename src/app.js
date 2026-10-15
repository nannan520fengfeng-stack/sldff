import { createId, loadWorkspace, saveWorkspace } from "./data.js";

const pageMeta = {
  overview: { title: "总览", eyebrow: "WELCOME BACK", heading: "把今天过得清楚一点", description: "任务、想法和正在推进的事情，都从这里开始。" },
  tasks: { title: "任务", eyebrow: "YOUR TASKS", heading: "一步一步来", description: "记下下一步，让重要的事情持续向前。" },
  notes: { title: "笔记", eyebrow: "YOUR NOTES", heading: "收好值得留下的想法", description: "随手记录，之后再整理也来得及。" },
  projects: { title: "项目", eyebrow: "YOUR PROJECTS", heading: "把事情放回上下文里", description: "用项目串起相关任务和笔记。" },
};

let workspace = loadWorkspace();
let activePage = getPageFromHash();
let taskFilter = "open";

const pageContent = document.querySelector("#page-content");
const dialog = document.querySelector("#item-dialog");
const itemForm = document.querySelector("#item-form");
const dialogContent = document.querySelector("#dialog-content");

function getPageFromHash() {
  const page = window.location.hash.slice(1);
  return Object.hasOwn(pageMeta, page) ? page : "overview";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function formatDate(value, options = { month: "short", day: "numeric" }) {
  if (!value) return "未设置日期";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", options).format(date);
}

function projectName(projectId) {
  return workspace.projects.find((project) => project.id === projectId)?.name || "未关联项目";
}

function openTasks() {
  return workspace.tasks.filter((task) => task.status !== "done");
}

function taskMarkup(task) {
  const isDone = task.status === "done";
  return `
    <article class="task-row ${isDone ? "is-done" : ""}">
      <label class="task-check" aria-label="${isDone ? "标记为未完成" : "标记为完成"}">
        <input type="checkbox" data-action="toggle-task" data-id="${escapeHtml(task.id)}" ${isDone ? "checked" : ""} />
        <span aria-hidden="true"></span>
      </label>
      <div class="task-copy">
        <p class="task-title">${escapeHtml(task.title)}</p>
        <p class="task-meta">${escapeHtml(projectName(task.projectId))}${task.dueDate ? ` <span>·</span> ${escapeHtml(formatDate(task.dueDate))}` : ""}</p>
      </div>
      <span class="task-status ${isDone ? "status-done" : "status-open"}">${isDone ? "已完成" : "进行中"}</span>
    </article>`;
}

function pageHeading() {
  const meta = pageMeta[activePage];
  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">${meta.eyebrow}</p>
        <h1>${meta.heading}</h1>
        <p class="page-description">${meta.description}</p>
      </div>
      <div class="page-actions">${pageActionButton()}</div>
    </div>`;
}

function pageActionButton() {
  const actions = {
    overview: '<button class="button button-primary" data-action="new-task"><span aria-hidden="true">＋</span> 添加任务</button>',
    tasks: '<button class="button button-primary" data-action="new-task"><span aria-hidden="true">＋</span> 新任务</button>',
    notes: '<button class="button button-primary" data-action="new-note"><span aria-hidden="true">＋</span> 新笔记</button>',
    projects: '<button class="button button-primary" data-action="new-project"><span aria-hidden="true">＋</span> 新项目</button>',
  };
  return actions[activePage];
}

function overviewMarkup() {
  const tasks = openTasks().slice().sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")).slice(0, 3);
  const projects = workspace.projects.slice(0, 3);
  return `
    <section class="stats-grid" aria-label="工作台统计">
      <article class="stat-card stat-accent"><span class="stat-icon">↗</span><p>待办任务</p><strong>${openTasks().length}</strong><span class="stat-foot">一步一步完成</span></article>
      <article class="stat-card"><span class="stat-icon stat-icon-lilac">◫</span><p>进行中的项目</p><strong>${workspace.projects.length}</strong><span class="stat-foot">让工作保持有序</span></article>
      <article class="stat-card"><span class="stat-icon stat-icon-peach">▤</span><p>已收集的笔记</p><strong>${workspace.notes.length}</strong><span class="stat-foot">灵感随时可以回看</span></article>
    </section>
    <div class="content-grid">
      <section class="panel">
        <div class="panel-heading"><div><p class="eyebrow">UP NEXT</p><h2>接下来</h2></div><a class="text-link" href="#tasks">查看全部 <span aria-hidden="true">→</span></a></div>
        <div class="task-list">${tasks.length ? tasks.map(taskMarkup).join("") : emptyState("暂时没有待办", "添加一项任务，开始你的下一步。")}</div>
      </section>
      <section class="panel project-panel">
        <div class="panel-heading"><div><p class="eyebrow">YOUR SPACE</p><h2>项目</h2></div><a class="text-link" href="#projects">查看全部 <span aria-hidden="true">→</span></a></div>
        <div class="mini-project-list">${projects.length ? projects.map((project) => `
          <a class="mini-project" href="#projects"><span class="project-mark" aria-hidden="true">${escapeHtml(project.name.slice(0, 1))}</span><span><strong>${escapeHtml(project.name)}</strong><small>${workspace.tasks.filter((task) => task.projectId === project.id && task.status !== "done").length} 项待办</small></span><span class="mini-arrow" aria-hidden="true">↗</span></a>`).join("") : emptyState("还没有项目", "新建一个项目来整理相关事项。")}</div>
        <button class="create-inline" data-action="new-project"><span aria-hidden="true">＋</span> 创建项目</button>
      </section>
    </div>
    <section class="quote-card"><span class="quote-mark" aria-hidden="true">“</span><p>清晰不是把每件事都做完，而是知道下一步是什么。</p><span class="quote-caption">留一点空间给专注</span></section>`;
}

function tasksMarkup() {
  const tasks = workspace.tasks
    .filter((task) => taskFilter === "all" || (taskFilter === "open" ? task.status !== "done" : task.status === "done"))
    .slice()
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  return `
    <section class="panel full-panel">
      <div class="panel-heading task-panel-heading"><div><p class="eyebrow">TASK LIST</p><h2>所有任务 <span class="count-pill">${workspace.tasks.length}</span></h2></div>
        <label class="filter-control"><span class="visually-hidden">筛选任务</span><select id="task-filter"><option value="open" ${taskFilter === "open" ? "selected" : ""}>未完成</option><option value="all" ${taskFilter === "all" ? "selected" : ""}>全部任务</option><option value="done" ${taskFilter === "done" ? "selected" : ""}>已完成</option></select></label>
      </div>
      <div class="task-list">${tasks.length ? tasks.map(taskMarkup).join("") : emptyState("这里还很安静", "添加一项任务，给接下来留个清晰的方向。")}</div>
    </section>`;
}

function notesMarkup() {
  const notes = workspace.notes.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return `<section class="notes-grid">${notes.length ? notes.map((note) => `
    <article class="note-card"><div class="note-card-top"><span class="note-icon" aria-hidden="true">▤</span><span>${escapeHtml(formatDate(note.updatedAt.slice(0, 10), { month: "long", day: "numeric" }))}</span></div><h2>${escapeHtml(note.title)}</h2><p class="note-body">${escapeHtml(note.content)}</p><div class="note-footer"><span class="project-tag">${escapeHtml(projectName(note.projectId))}</span><button class="icon-button" aria-label="删除笔记" data-action="delete-note" data-id="${escapeHtml(note.id)}">···</button></div></article>`).join("") : `<div class="panel full-panel">${emptyState("还没有笔记", "先记下一条想法，之后再慢慢整理。")}</div>`}</section>`;
}

function projectsMarkup() {
  return `<section class="projects-grid">${workspace.projects.length ? workspace.projects.map((project) => {
    const tasks = workspace.tasks.filter((task) => task.projectId === project.id);
    const notes = workspace.notes.filter((note) => note.projectId === project.id);
    const completeCount = tasks.filter((task) => task.status === "done").length;
    const progress = tasks.length ? Math.round((completeCount / tasks.length) * 100) : 0;
    return `<article class="project-card"><div class="project-card-head"><span class="project-mark large-mark" aria-hidden="true">${escapeHtml(project.name.slice(0, 1))}</span><span class="project-kebab">PERSONAL</span></div><h2>${escapeHtml(project.name)}</h2><p class="project-description">${escapeHtml(project.description || "暂无项目说明。")}</p><div class="progress-label"><span>任务进度</span><span>${progress}%</span></div><div class="progress-track"><span style="width:${progress}%"></span></div><div class="project-card-footer"><span>${tasks.length} 项任务</span><span>${notes.length} 条笔记</span></div></article>`;
  }).join("") : `<div class="panel full-panel">${emptyState("还没有项目", "创建一个项目，开始整理相关的任务和笔记。")}</div>`}</section>`;
}

function emptyState(title, description) {
  return `<div class="empty-state"><span class="empty-icon" aria-hidden="true">✳</span><strong>${title}</strong><p>${description}</p></div>`;
}

function render() {
  activePage = getPageFromHash();
  document.querySelector("#current-section").textContent = pageMeta[activePage].title;
  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
  document.querySelectorAll("[data-page]").forEach((link) => {
    const active = link.dataset.page === activePage;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const body = {
    overview: overviewMarkup,
    tasks: tasksMarkup,
    notes: notesMarkup,
    projects: projectsMarkup,
  }[activePage]();
  pageContent.innerHTML = `${pageHeading()}${body}`;
}

function projectOptions(selectedId = "") {
  return `<option value="">不关联项目</option>${workspace.projects.map((project) => `<option value="${escapeHtml(project.id)}" ${project.id === selectedId ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}`;
}

function openDialog(kind) {
  const dialogs = {
    task: {
      title: "添加一项任务",
      intro: "先写下下一步，其他细节可以之后再补。",
      fields: `<label class="field-label" for="item-title">任务名称</label><input id="item-title" name="title" class="text-input" maxlength="120" placeholder="例如：整理本周计划" required autofocus /><div class="form-row"><div><label class="field-label" for="item-due">截止日期</label><input id="item-due" name="dueDate" class="text-input" type="date" /></div><div><label class="field-label" for="item-project">所属项目</label><select id="item-project" name="projectId" class="text-input">${projectOptions()}</select></div></div>`,
    },
    note: {
      title: "新建一条笔记",
      intro: "把值得留下的内容记下来。",
      fields: `<label class="field-label" for="item-title">标题</label><input id="item-title" name="title" class="text-input" maxlength="120" placeholder="给这条笔记起个名字" required autofocus /><label class="field-label" for="item-content">内容</label><textarea id="item-content" name="content" class="text-input text-area" rows="5" placeholder="写下你的想法……" required></textarea><label class="field-label" for="item-project">关联项目</label><select id="item-project" name="projectId" class="text-input">${projectOptions()}</select>`,
    },
    project: {
      title: "创建一个项目",
      intro: "给一组相关的任务和笔记一个共同的地方。",
      fields: `<label class="field-label" for="item-title">项目名称</label><input id="item-title" name="title" class="text-input" maxlength="80" placeholder="例如：个人网站" required autofocus /><label class="field-label" for="item-description">项目说明</label><textarea id="item-description" name="description" class="text-input text-area" rows="3" maxlength="240" placeholder="这个项目想要完成什么？"></textarea>`,
    },
  };
  const config = dialogs[kind];
  itemForm.dataset.kind = kind;
  dialogContent.innerHTML = `<div class="dialog-heading"><p class="eyebrow">QUICK ADD</p><h2>${config.title}</h2><p>${config.intro}</p></div><div class="form-fields">${config.fields}</div>`;
  dialog.showModal();
  dialog.querySelector("input, textarea")?.focus();
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;

  if (action.dataset.action === "new-task") openDialog("task");
  if (action.dataset.action === "new-note") openDialog("note");
  if (action.dataset.action === "new-project") openDialog("project");
  if (action.dataset.action === "close-dialog") dialog.close();
  if (action.dataset.action === "delete-note") {
    workspace.notes = workspace.notes.filter((note) => note.id !== action.dataset.id);
    saveWorkspace(workspace);
    render();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-action='toggle-task']")) {
    const task = workspace.tasks.find((item) => item.id === event.target.dataset.id);
    if (task) task.status = event.target.checked ? "done" : "todo";
    saveWorkspace(workspace);
    render();
  }

  if (event.target.matches("#task-filter")) {
    taskFilter = event.target.value;
    render();
  }
});

itemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!itemForm.reportValidity()) return;

  const values = new FormData(itemForm);
  const now = new Date().toISOString();
  const kind = itemForm.dataset.kind;
  if (kind === "task") {
    workspace.tasks.unshift({
      id: createId("task"),
      title: values.get("title").trim(),
      status: "todo",
      dueDate: values.get("dueDate") || null,
      projectId: values.get("projectId") || null,
      createdAt: now,
    });
  }
  if (kind === "note") {
    workspace.notes.unshift({
      id: createId("note"),
      title: values.get("title").trim(),
      content: values.get("content").trim(),
      projectId: values.get("projectId") || null,
      createdAt: now,
      updatedAt: now,
    });
  }
  if (kind === "project") {
    workspace.projects.unshift({
      id: createId("project"),
      name: values.get("title").trim(),
      description: values.get("description").trim(),
      createdAt: now,
    });
  }

  saveWorkspace(workspace);
  dialog.close();
  itemForm.reset();
  render();
});

window.addEventListener("hashchange", render);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

render();

