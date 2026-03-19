# bug 标签问题并行修复执行计划（#3 / #4 / #7）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development（本计划按 issue 拆分为可并行任务，步骤使用 `- [ ]` 追踪）。

**Goal:** 并行修复 3 个 `bug` issue，并为每个问题提供可重复的回归验证。  
**Architecture:** 以“按 issue 切片”方式分治：输入映射、ROM 加载、横屏样式三条链路互相解耦，分别改动各自文件并独立测试。  
**Tech Stack:** 原生 HTML/CSS/JavaScript（jQuery + JSNES），Node.js 内置 `node:test`。

---

## 任务切分与文件归属

### Task 1：Issue #7（P2 方向键修复）

**Owner 文件范围（独占写入）**
- 修改：`source/keyboard.js`
- 新增：`tests/issue-7-keyboard-player2.test.js`

- [ ] 写失败测试：P2 方向键 `↑↓←→` 应驱动 `state2`
- [ ] 运行测试，确认在修复前失败
- [ ] 实现最小修复（更正 keyCode 与目标状态数组）
- [ ] 运行 `node --test tests/issue-7-keyboard-player2.test.js`
- [ ] 自检：确认未改动 P1 映射行为

### Task 2：Issue #4（ROM 加载失败链路修复）

**Owner 文件范围（独占写入）**
- 修改：`source/ui.js`
- 新增：`source/rom_load_helpers.js`
- 新增：`tests/issue-4-rom-load.test.js`

- [ ] 写失败测试：失败请求不应进入成功启动路径，需返回明确错误文案
- [ ] 写失败测试：`file://` 协议应给出 HTTP 启动提示
- [ ] 运行测试，确认修复前失败
- [ ] 实现最小修复（success/error 分支、去掉 `escape`、错误提示）
- [ ] 运行 `node --test tests/issue-4-rom-load.test.js`
- [ ] 自检：成功加载路径保持可启动

### Task 3：Issue #3（横屏小高度可见性修复）

**Owner 文件范围（独占写入）**
- 修改：`css/jsnes.css`
- 新增：`tests/issue-3-landscape-layout.test.js`

- [ ] 写失败测试：校验横屏低高度规则存在（防回归）
- [ ] 运行测试，确认修复前失败
- [ ] 实现最小样式修复（确保 `nes-roms` 与 `nes-controls` 可见）
- [ ] 运行 `node --test tests/issue-3-landscape-layout.test.js`
- [ ] 自检：不破坏竖屏布局规则

## 集成与总体验证

- [ ] 运行全部测试：`node --test tests/*.test.js`
- [ ] 代码格式与变更审查：`git diff -- source css tests docs`
- [ ] 更新计划索引（`docs/PLANS.md`、`docs/exec-plans/active/index.md`）

