# 技术债务修复执行计划（TD-001 ~ TD-004）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans。步骤使用 `- [ ]` 追踪。

**Goal:** 以最小风险修复 4 项 open 技术债，并建立回归测试防止问题复发。  
**Architecture:** 采用“债务条目切片 + TDD”方式，先补失败测试，再做最小实现改动，最后统一回写技术债状态。  
**Tech Stack:** 原生 HTML/CSS/JavaScript（jQuery + JSNES），Node.js 内置 `node:test`。

---

## Task 1: TD-001 输入映射一致性

**Files:**
- Modify: `source/ui.js`
- Modify: `README.md`
- Test: `tests/tech-debt-001-input-consistency.test.js`

- [ ] **Step 1: 写失败测试**
  - 断言 `joystick_btn_select` 使用 `keyCode: 32`。
  - 断言 README 的 A/B 映射与 `keyboard.js` 一致。
- [ ] **Step 2: 运行测试确认失败**
  - Run: `node --test tests/tech-debt-001-input-consistency.test.js`
- [ ] **Step 3: 实现最小修复**
  - 修改 `Select` 触摸键码为 32。
  - 修正 README A/B 表格映射。
- [ ] **Step 4: 运行测试确认通过**
  - Run: `node --test tests/tech-debt-001-input-consistency.test.js`

## Task 2: TD-002 UI 历史残留逻辑清理

**Files:**
- Modify: `source/ui.js`
- Test: `tests/tech-debt-002-ui-dead-code.test.js`

- [ ] **Step 1: 写失败测试**
  - 断言 `ui.js` 不再包含 `controls-turbofire`、`pc-controlls`、`mobile-controlls`、`.shang`、`leftup/rightup/leftdown/rightdown`。
- [ ] **Step 2: 运行测试确认失败**
  - Run: `node --test tests/tech-debt-002-ui-dead-code.test.js`
- [ ] **Step 3: 实现最小修复**
  - 删除无效 DOM 选择器路径。
  - 简化方向和 fire 事件处理逻辑，仅保留当前 DOM 需要的分支。
- [ ] **Step 4: 运行测试确认通过**
  - Run: `node --test tests/tech-debt-002-ui-dead-code.test.js`

## Task 3: TD-003 Mapper5 支持级别声明

**Files:**
- Modify: `source/rom.js`
- Test: `tests/tech-debt-003-mapper5-support.test.js`

- [ ] **Step 1: 写失败测试**
  - mapper=5 时 `mapperSupported()` 应返回 `false`。
  - mapper=5 时 `createMapper()` 应返回 `null` 且提示“不支持”。
- [ ] **Step 2: 运行测试确认失败**
  - Run: `node --test tests/tech-debt-003-mapper5-support.test.js`
- [ ] **Step 3: 实现最小修复**
  - 增加显式不支持 mapper 列表并接入支持判断。
- [ ] **Step 4: 运行测试确认通过**
  - Run: `node --test tests/tech-debt-003-mapper5-support.test.js`

## Task 4: TD-004 反调试脚本默认禁用

**Files:**
- Modify: `index.html`
- Test: `tests/tech-debt-004-debug-script-gate.test.js`

- [ ] **Step 1: 写失败测试**
  - 断言默认不直接加载 `lib/debug.js`。
  - 断言存在 `antiDebug=1` 条件加载逻辑。
- [ ] **Step 2: 运行测试确认失败**
  - Run: `node --test tests/tech-debt-004-debug-script-gate.test.js`
- [ ] **Step 3: 实现最小修复**
  - 移除默认脚本标签，新增条件动态加载。
- [ ] **Step 4: 运行测试确认通过**
  - Run: `node --test tests/tech-debt-004-debug-script-gate.test.js`

## Task 5: 集成验证与文档回写

**Files:**
- Modify: `docs/exec-plans/tech-debt-tracker.md`
- Modify: `docs/exec-plans/active/index.md`

- [ ] **Step 1: 运行全量测试**
  - Run: `node --test tests/*.test.js`
- [ ] **Step 2: 更新技术债状态**
  - 将 TD-001~TD-004 改为 `done`，补充修复说明与影响文件。
- [ ] **Step 3: 更新 active 索引**
  - 加入本次 spec/plan 链接。
- [ ] **Step 4: 差异自检**
  - Run: `git diff -- README.md index.html source/ui.js source/rom.js docs/exec-plans tests`
