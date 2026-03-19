# 技术债追踪（Tech Debt Tracker）

> 更新时间：2026-03-19

## 状态定义

- `open`：未处理
- `in-progress`：处理中
- `done`：已处理

## 债务清单

### TD-001 输入映射不一致

- 状态：`done`
- 严重性：高
- 描述：
  - 移动端 `Select` 发送 `keyCode:17`
  - `keyboard.js` 仅识别 `Select=32(Space)`
  - README 的 A/B 描述与代码映射存在不一致
- 影响：移动端/文档行为不一致，用户困惑
- 建议：
  1. 统一输入真值来源（以 `keyboard.js` 为准）
  2. UI 与 README 同步修正
- 修复说明：
  - `source/ui.js` 中 `Select` 触摸事件统一为 `keyCode:32`
  - `README.md` 按键表已与 `keyboard.js` 对齐（A=J, B=K；P2 A=Num1, B=Num2）
  - 回归测试：`tests/tech-debt-001-input-consistency.test.js`

### TD-002 UI 历史残留逻辑

- 状态：`done`
- 严重性：高
- 描述：`ui.js` 中存在未在 `index.html` 提供的 DOM 选择器路径
- 影响：代码噪音高，排查成本高
- 建议：清理无效分支并拆分输入路径
- 修复说明：
  - 清理无效选择器路径：`#pc-controlls`、`#mobile-controlls`、`.shang`、`#controls-turbofire`
  - 清理无效方向分支：`leftup/rightup/leftdown/rightdown`
  - 方向与 A/B 触摸逻辑改为仅使用当前 DOM 的有效分支与真实键码
  - 回归测试：`tests/tech-debt-002-ui-dead-code.test.js`

### TD-003 Mapper5 实现不完整

- 状态：`done`
- 严重性：高
- 描述：Mapper5 引用了多处当前仓库未定义方法/成员
- 影响：涉及 Mapper5 ROM 时稳定性不可保证
- 建议：明确标记支持级别，逐项补齐或禁用该分支
- 修复说明：
  - `source/rom.js` 增加显式不支持 mapper 列表，当前将 `Mapper5` 标记为不支持
  - `mapperSupported()` 与 `createMapper()` 已接入该策略，避免误进入不完整实现
  - 回归测试：`tests/tech-debt-003-mapper5-support.test.js`

### TD-004 反调试脚本默认启用

- 状态：`done`
- 严重性：中
- 描述：`lib/debug.js` 持续触发 `debugger` 并清空控制台
- 影响：本地开发与调试效率低
- 建议：按环境开关加载，默认开发环境禁用
- 修复说明：
  - `index.html` 默认不再直接加载 `lib/debug.js`
  - 新增 URL 开关：仅当 `antiDebug=1` 时动态加载
  - 回归测试：`tests/tech-debt-004-debug-script-gate.test.js`

## 更新规则

1. 新发现问题必须新增条目
2. 修复后更新状态并附修复说明
3. 每次版本迭代至少复核一次本文件
