# Personal Workspace

一个轻量的个人工作台起步项目，用来集中整理任务、笔记和项目。首阶段优先保持容易运行、容易阅读、容易继续交给 Codex 开发。

## 技术选择

- 浏览器端：原生 JavaScript ES modules、HTML、CSS，无构建工具和第三方运行依赖。
- 本地服务：Node.js 内置 HTTP 模块，只负责提供静态文件。
- 数据：浏览器 `localStorage`，当前不需要账号、数据库或网络服务。

这套选择让空仓库可以马上运行，也让后续功能先围绕真实使用需求逐步成形。若之后需要跨设备同步，再单独评估后端和账号方案。

## 启动

需要 Node.js 18 或更高版本。在项目根目录运行：

```bash
npm start
```

浏览器打开 <http://127.0.0.1:4173>。如端口已被占用，可在启动前设置 `PORT` 环境变量。

## 首批页面

- **总览**：查看未完成任务、项目和笔记数量，以及近期任务。
- **任务**：新增任务、设置日期和所属项目、标记完成并筛选。
- **笔记**：新增、浏览和删除笔记，可关联项目。
- **项目**：创建项目，查看任务数量、笔记数量和完成进度。

首次打开会载入少量示例数据。所有新增和状态变化保存在当前浏览器的 `localStorage`；清除浏览器站点数据会清除这些内容。

## 数据结构

根对象带有 `schemaVersion`，为后续调整本地数据格式保留迁移入口。

```js
{
  schemaVersion: 1,
  projects: [{ id, name, description, createdAt }],
  tasks: [{ id, title, status, dueDate, projectId, createdAt }],
  notes: [{ id, title, content, projectId, createdAt, updatedAt }]
}
```

`projectId` 可以为空；关联存在时，任务和笔记都引用项目的 `id`。当前任务状态为 `todo` 或 `done`。

## 项目结构

```text
index.html          页面入口和共享对话框
server.mjs          Node 内置静态文件服务
src/app.js          页面导航、渲染和交互
src/data.js         初始数据、本地读写和 ID 生成
src/styles.css      布局与响应式样式
docs/DEVELOPMENT.md 开发顺序与断点续开发说明
```

## 继续开发

从 [开发顺序与断点续开发说明](docs/DEVELOPMENT.md) 开始。当前检查点是：四个页面可以运行，首批新增和完成操作会保存到浏览器本地。开发新功能时，先查看对应页面和 `src/data.js`，再围绕现有数据结构做小步修改。

