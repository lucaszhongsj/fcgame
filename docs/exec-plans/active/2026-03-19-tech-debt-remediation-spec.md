# 技术债务修复规格（TD-001 ~ TD-004）

## 1. 背景与目标

当前 `docs/exec-plans/tech-debt-tracker.md` 中存在 4 项 `open` 技术债，均位于核心运行链路（输入、UI 交互、Mapper 支持声明、调试体验）。目标是在不引入新构建系统的前提下，完成最小可验证修复，并补充回归测试与文档状态更新。

## 2. 范围

### 2.1 In Scope

- TD-001：统一输入映射真值来源，修复移动端 `Select` 键码不一致，并同步 README 按键说明。
- TD-002：清理 `source/ui.js` 中与当前 DOM 结构不匹配的历史分支（无效选择器、无效方向分支、废弃连发分支）。
- TD-003：对 Mapper5 明确标记为“当前版本不支持”，避免误判为可用导致不稳定行为。
- TD-004：反调试脚本改为显式开关加载，默认不启用。
- 增加 Node 侧回归测试，覆盖上述行为约束。

### 2.2 Out of Scope

- 完整实现 MMC5（Mapper5）全部寄存器与中断行为。
- 引入打包器、测试框架迁移或 TypeScript 改造。
- 大规模重写 `source/ui.js` 架构。

## 3. 方案候选

### 方案 A：最小修补（推荐）

- 只修改受影响分支：键码、条件加载、Mapper 显式不支持、UI 无效分支清理。
- 优点：变更面可控，回归风险低，能快速关闭高优先级技术债。
- 缺点：`ui.js` 仍偏大，后续仍需结构化拆分。

### 方案 B：中等重构

- 在方案 A 基础上，进一步拆分 `ui.js` 为输入模块、ROM 加载模块、状态模块。
- 优点：长期维护性更好。
- 缺点：本轮改动面显著扩大，验证成本高。

### 方案 C：激进清理

- 移除大量历史逻辑并同步改造 CSS/HTML 结构。
- 优点：代码最干净。
- 缺点：回归风险高，不符合本轮“快速修债”目标。

结论：采用方案 A。

## 4. 详细设计

### 4.1 TD-001 输入映射一致性

- `source/ui.js`：移动端 `Select` 触摸事件从 `keyCode: 17` 改为 `keyCode: 32`，与 `source/keyboard.js` 保持一致。
- `README.md`：按 `keyboard.js` 修正 P1/P2 的 A/B 键位描述（A=J, B=K；P2 A=Num1, B=Num2）。
- 回归测试：
  - 校验 `ui.js` 的 `Select` 触发键码为 32。
  - 校验 README 按键表与代码映射一致。

### 4.2 TD-002 UI 历史残留逻辑清理

- 清理 `source/ui.js` 中无效选择器路径：
  - `#pc-controlls`、`#mobile-controlls`、`.shang`
  - `#controls-turbofire`
- 清理无效方向类分支：
  - `leftup`、`rightup`、`leftdown`、`rightdown`
- 保留并简化当前有效路径：
  - 方向键仅保留 `up/down/left/right`
  - `controls-fire` 仅保留当前 `a/b/c` 触发逻辑（并与真实键码对齐）
- 回归测试：
  - 断言上述无效选择器/分支字符串不再出现。

### 4.3 TD-003 Mapper5 支持级别声明

- `source/rom.js`：
  - 增加“显式不支持 mapper 列表”，包含 `5`。
  - `mapperSupported()` 需同时满足“实现存在”且“不在显式不支持列表”。
  - `createMapper()` 对显式不支持 mapper 给出明确状态提示（包含 Mapper 名称和编号）。
- 目的：避免当前不完整 Mapper5 被误识别为“支持”。
- 回归测试：
  - mapper=5 时 `mapperSupported()` 返回 `false` 且 `createMapper()` 返回 `null`。
  - mapper=0 等正常 mapper 不受影响。

### 4.4 TD-004 反调试脚本默认禁用

- `index.html`：
  - 移除默认 `<script src="lib/debug.js">`。
  - 增加显式开关：仅在 URL 包含 `antiDebug=1` 时动态加载该脚本。
- 回归测试：
  - 断言默认脚本标签已移除。
  - 断言存在 `antiDebug=1` 条件加载逻辑。

## 5. 验收标准

- `node --test tests/*.test.js` 全通过。
- `tech-debt-tracker.md` 中 TD-001~TD-004 状态更新为 `done`，并附修复说明。
- 本地手测：
  - 触摸 `Select` 可触发暂停菜单相关行为（键码链路一致）。
  - 默认打开页面不再触发反调试逻辑。
- Mapper5 ROM 尝试加载时给出明确“不支持”提示，且不进入不稳定分支。

## 6. 风险与回滚

- 风险：清理 UI 残留逻辑可能影响历史未公开 DOM 结构。
- 缓解：仅移除已确认在 `index.html` 不存在的路径，并使用静态回归测试锁定。
- 回滚：按 TD 维度回滚相关文件改动，避免整包回退。
