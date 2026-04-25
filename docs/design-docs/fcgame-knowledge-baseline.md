# FCGame 项目全量理解与维护手册

> 更新时间：2026-04-01  
> 仓库路径：`/Users/lucas/github.com/lucaszhongsj/fcgame`  
> 目标：为后续维护、重构、问题排查提供统一事实基线

## 1. 一句话结论

这是一个基于 JSNES 二次开发的纯静态网页 FC/NES 模拟器项目：入口在
`index.html`，仿真内核在 `source/`，第三方依赖在 `lib/`，ROM 目录在
`roms/`（不内置商业 ROM，ROM 列表由 `roms/index.json` 动态驱动），当前无构建
系统、无后端服务代码，包含基于 `node --test` 的最小自动化测试集。

### 1.1 2026-03-31 合规变更（增量）

- 仓库已移除 `roms/` 下全部内置 `.nes` 文件，不再分发商业 ROM。
- 页面新增“本地导入 ROM”能力，用户可选择本地 `.nes` 文件直接加载。
- 新增合规文档：
  - 根目录 `ROM_POLICY.md`
  - `docs/design-docs/rom-copyright-audit-2026-03-31.md`

### 1.2 2026-04-01 ROM 动态清单变更（增量）

- `index.html` 移除硬编码 ROM 列表，改为读取 `roms/index.json`。
- 新增 `source/rom_catalog_loader.js`，负责拉取与组装 ROM 分组数据。
- 新增 `scripts/fetch-roms.sh` 与 `rom-sources.json`，通过配置生成 ROM 清单与下载报告。
- 约定 `runtime-assets` 为运行时资源派生分支，由 GitHub Actions 覆盖同步。

## 2. 项目快照（当前仓库状态）

### 2.1 目录与资源规模

- `css/`：1 个文件，约 8KB
- `lib/`：8 个文件，约 224KB
- `source/`：10 个文件（新增 ROM 清单加载器）
- `roms/`：按来源仓库存放 `.nes` 与 `manifest.json`，并包含 `index.json`
- `static/`：4 个文件，约 324KB
- `.idea/`：IDE 工程配置（不参与运行）

### 2.2 代码体量（按行数）

- `source/cpu.js`：1689 行
- `source/keyboard.js`：85 行
- `source/mappers.js`：1404 行
- `source/nes.js`：237 行
- `source/papu.js`：1469 行
- `source/ppu.js`：1933 行
- `source/rom.js`：219 行
- `source/ui.js`：811 行
- `source/utils.js`：52 行

## 3. 顶层目录分层与职责

### 3.1 根目录

- `index.html`
  - 页面结构、脚本装配顺序、ROM 动态清单加载入口、摇杆实例初始化。
- `README.md`
  - 对外说明、按键说明、开源协议与 ROM 合规使用说明。
- `.gitignore`
  - 通用忽略规则，含前端常见目录。

### 3.2 `source/`（模拟器内核层）

- `nes.js`：系统编排层（CPU/PPU/PAPU/UI/Mapper 组装、主循环、ROM 生命周期）
- `cpu.js`：6502 CPU 指令解释与寄存器/中断/内存读写
- `ppu.js`：图形渲染（扫描线、精灵、调色板、镜像、VBlank/NMI）
- `papu.js`：音频仿真（方波/三角波/噪声/DMC 通道与混音输出）
- `rom.js`：iNES 文件解析与 mapper 选择
- `mappers.js`：地址映射、PRG/CHR bank 切换、手柄寄存器读写
- `ui.js`：jQuery UI 插件（ROM 下拉、画布、键盘/触控、音频输出桥接）
- `rom_catalog_loader.js`：ROM 清单拉取与分组转换（`roms/index.json` -> `JSNESUI` 配置）
- `keyboard.js`：按键状态机（P1/P2）
- `utils.js`：数组复制、JSON 辅助、IE 判断

### 3.3 `lib/`（第三方与兼容层）

- `jquery-1.4.2.min.js`：UI 事件与 DOM 依赖
- `dynamicaudio-min.js` + `dynamicaudio.swf`：旧浏览器音频回退
- `nipplejs.min.js` + `joystick.js`：移动摇杆
- `jweixin-1.6.0.js`：微信分享 SDK（页面中相关代码当前注释）
- `jsnes-ie-hacks.vbscript`：IE 二进制 ROM 读取补丁
- `debug.js`：反调试逻辑（会持续 `debugger`）

### 3.4 `roms/`（ROM 资源目录层）

- ROM 按来源仓库名分目录（如 `roms/<source_repo>/`）。
- 每个来源目录包含 `manifest.json`，顶层由 `roms/index.json` 汇总。
- 用户仍可通过页面“本地导入 ROM”加载其他合法持有的 ROM。

### 3.5 `css/` 与 `static/`

- `css/jsnes.css`：FC 外观皮肤 + 横竖屏适配布局
- `static/*`：图标与 README 展示图片

## 4. 启动链路与运行时序

### 4.1 脚本加载顺序（关键）

`index.html` 的脚本顺序是：

1. `lib/jquery-1.4.2.min.js`
2. `lib/dynamicaudio-min.js`
3. `source/nes.js`
4. `source/utils.js`
5. `source/cpu.js`
6. `source/keyboard.js`
7. `source/mappers.js`
8. `source/papu.js`
9. `source/ppu.js`
10. `source/rom.js`
11. `source/ui.js`
12. `source/rom_catalog_loader.js`
13. 条件加载 `lib/debug.js`（仅 `antiDebug=1`）
14. `lib/nipplejs.min.js`
15. `lib/joystick.js`
16. `lib/jweixin-1.6.0.js`

说明：这是典型“全局变量 + 顺序依赖”结构，随意调整顺序会导致运行失败。

### 4.2 初始化时序

1. `$(function(){ ... })` 创建 `nes = new JSNES({ ui: $('#emulator').JSNESUI({}) })`
2. `JSNES` 构造中依次创建 `CPU`、`PPU`、`PAPU`、`Keyboard`
3. `FCGameRomCatalog.loadCatalog('roms/index.json')` 拉取来源索引与 manifest
4. `JSNESUI` 初始化画布、ROM 下拉、按钮、键盘和触控事件
5. 清单加载完成后调用 `nes.ui.setRoms(...)` 注入分组列表
6. 页面底部初始化 `Joystick`，将摇杆动作转成虚拟按键事件

### 4.3 ROM 加载时序

1. 用户选择远程 ROM（可选）或通过文件框本地导入 `.nes`
2. 远程模式：`ui.js` 的 `loadROM()` 通过 AJAX 拉取 `.nes` 文件
3. 本地模式：`ui.js` 的 `loadLocalROM()` 通过 `FileReader` 读取文件
4. `nes.loadRom(data)` 创建 `JSNES.ROM` 并解析 iNES 头
5. `rom.createMapper()` 创建 mapper 实例
6. `mmap.loadROM()` 装载 PRG/CHR 到 CPU/PPU
7. `ppu.setMirroring()` 设置镜像方式
8. `nes.start()` 启动帧循环

### 4.4 帧循环时序

1. `nes.frame()` 触发 `ppu.startFrame()`
2. CPU 执行指令：`cpu.emulate()`
3. 按周期推进 PPU（每 CPU 周期约 3 个 PPU 周期）
4. 可选推进 PAPU（当 `emulateSound=true`）
5. 进入 VBlank 时触发 NMI，结束当前帧并写入画布

## 5. 关键模块详解（维护视角）

### 5.1 `source/nes.js`（系统编排）

职责：

- 配置与组件装配（UI/CPU/PPU/PAPU/Keyboard）
- 统一生命周期：`reset`、`start`、`stop`、`reloadRom`、`loadRom`
- 主循环驱动：`frame`
- 状态序列化：`toJSON/fromJSON`

维护提示：

- 这是“入口编排层”，不要把具体 mapper 逻辑或 UI 细节继续堆到这里。
- 当前 `JSNES.VERSION = "<%= version %>"` 是模板残留，项目无构建步骤时无实际替换链路。

### 5.2 `source/cpu.js`（CPU）

职责：

- CPU 内存初始化与寄存器维护
- 指令解释执行（含寻址模式、周期、分支）
- IRQ/NMI/RESET 中断处理
- 与 mapper 的内存读写桥接

维护提示：

- 指令表由 `JSNES.CPU.OpData` 生成，新增/修改指令需同步周期与寻址模式。
- `toJSON/fromJSON` 已覆盖核心寄存器状态，适合做状态保存功能扩展。

### 5.3 `source/ppu.js`（图形）

职责：

- VRAM/Sprite RAM 管理
- 镜像规则（Horizontal/Vertical/Single/Four）
- 扫描线推进与背景/精灵渲染
- 状态寄存器读写与 VBlank/NMI 协作

维护提示：

- `setMirroring()` 是 mapper 影响画面的关键入口。
- `endScanline()` 逻辑复杂，做任何性能重构都要保持扫描线行为一致。

### 5.4 `source/papu.js`（音频）

职责：

- 各音频通道时钟推进
- 帧计数器与采样混音
- 双声道输出缓冲区写入 UI

维护提示：

- 当前仍有旧浏览器兼容分支；`AudioContext` 与 `DynamicAudio` 双路径并存。
- 音频默认关闭（`emulateSound:false`），由 UI 按钮动态打开。

### 5.5 `source/rom.js`（ROM 解析）

职责：

- 校验 NES 文件头 `"NES\x1a"`
- 解析 PRG/CHR 数量与 mapper 编号
- 构建 `vromTile`
- 创建 mapper 实例并上抛不支持情况

维护提示：

- mapper 支持能力最终由 `JSNES.Mappers[mapperType]` 是否存在决定。

### 5.6 `source/mappers.js`（映射层）

职责：

- Mapper0 基础能力：CPU/PPU 寄存器映射、手柄读写、PRG/CHR 装载
- mapper 扩展：1/2/3/4/5/7/11/34/66

维护提示：

- 这里是“硬件地址语义”核心层，任何改动都需以 ROM 兼容为第一约束。
- Mapper5 当前实现不完整（详见第 7 节问题清单）。

### 5.7 `source/ui.js`（浏览器桥接）

职责：

- 初始化 DOM、canvas、ROM 下拉
- 加载 ROM 并启动模拟器
- 处理键盘、触摸、按钮状态
- 音频输出和帧绘制

维护提示：

- 文件内含大量历史分支与未使用选择器，重构优先从“删除无效路径”入手。

### 5.8 `source/keyboard.js`（输入状态机）

职责：

- 维护手柄 `state1/state2`
- 键码 -> 手柄按键位映射
- `keyDown/keyUp/keyPress` 事件入口

维护提示：

- 此文件是输入真值来源，UI 触控/摇杆都应该严格对齐这里的键码定义。

## 6. 支持范围（基于当前代码事实）

### 6.1 明确存在的 mapper

当前代码中定义了以下 mapper：`0, 1, 2, 3, 4, 5, 7, 11, 34, 66`。

### 6.2 ROM 可用性判断链路

- 第一层：`rom.js` 是否能识别并解析 iNES 头
- 第二层：`mappers.js` 是否存在对应 `JSNES.Mappers[mapperType]`
- 第三层：对应 mapper 逻辑是否完整（例如 Mapper5 当前不完整）

## 7. 已确认问题与技术债（维护重点）

### 7.1 输入映射不一致（高优先级）

1. 移动端 `Select` 键发出 `keyCode:17`，但键盘映射只识别 `32`（Space）。
2. README 写的是 `B=J, A=K`，而 `keyboard.js` 实际是 `A=J, B=K`。

影响：用户文档与真实行为不一致，移动端可能出现 `Select` 无效。

### 7.2 UI 历史残留分支多（高优先级）

`ui.js` 中存在多个当前页面未提供的 DOM 选择器逻辑：

- `#controls-turbofire`
- `#pc-controlls`
- `#mobile-controlls`
- `.shang`
- `leftup/rightup/leftdown/rightdown/center` 方向分支

影响：维护噪音高，排查输入问题时很难快速定位真实生效路径。

### 7.3 Mapper5 不完整（高优先级）

Mapper5 分支引用了若干当前仓库中未定义成员/方法，例如：

- `this.SetBank_SRAM`
- `this.SetBank_CPU`
- `this.SetBank_PPU`
- `this.nes.cpu.ClearIRQ`
- `this.nes.papu.exWrite`

影响：涉及 Mapper5 ROM 时兼容性不可保证，且容易在运行期抛错。

### 7.4 反调试脚本默认启用（中优先级）

`lib/debug.js` 在页面加载后持续触发 `debugger`，并有跳转逻辑。

影响：本地开发调试体验差，问题排查效率显著下降。

### 7.5 代码组织问题（中优先级）

1. `ui.js` 中 `self.status.appendTo(self.root)` 发生在 `self.root` 赋值之前。
2. 缩放按钮 `zoomed` 状态切换逻辑存在明显反转风险。
3. `mappers.js` 中 Mapper5 的 `write` 被重复定义，前一个会被后一个覆盖。

## 8. 维护操作手册（按任务类型）

### 8.1 新增 ROM

1. 在 `rom-sources.json` 增加来源与条目配置（`name`、`rom_url` 必填）
2. 执行 `bash scripts/fetch-roms.sh rom-sources.json`
3. 检查生成的 `roms/index.json` 与 `roms/<source_repo>/manifest.json`
4. 在手机和桌面各验证一次启动、输入、画面、声音

### 8.2 修改按键映射

1. 先改 `source/keyboard.js`（真值层）
2. 再统一 `source/ui.js` 触控与摇杆发出的 `keyCode`
3. 最后同步 README 按键说明

### 8.3 扩展 mapper 支持

1. 在 `source/mappers.js` 新增 `JSNES.Mappers[x]`
2. 保证 `loadROM()`、bank 切换、IRQ/镜像行为完整
3. 用至少 1~2 个真实 ROM 做回归
4. 更新本文件“支持范围”和“问题清单”

### 8.4 本地调试建议

1. 用静态文件服务运行，不建议直接双击 `index.html`
2. 调试期间建议临时禁用 `lib/debug.js` 引用
3. 排查 ROM 列表问题时优先检查 `roms/index.json` 与对应 `manifest.json`
4. 排查输入问题时优先看 `keyboard.js` 的 `setKey` 是否命中

## 9. 推荐改造路线（分阶段）

### P0（先做，降低维护风险）

1. 修复输入映射一致性（Select、A/B 文档与代码统一）
2. 清理 `ui.js` 当前页面未使用的输入分支
3. 将 `lib/debug.js` 从默认生产加载链路移除或按环境开关

### P1（结构性降复杂度）

1. 为 `rom_catalog_loader.js` 增加缓存与超时重试策略
2. 梳理 UI 事件路径，拆分为“桌面键盘/移动按钮/摇杆”三个清晰模块
3. 对 mapper 支持做明确分级（稳定/实验/未完成）

### P2（长期演进）

1. 逐步替换老旧依赖（例如 jQuery 1.4.2）
2. 建立最小自动化回归（ROM 加载、输入、画面刷新、音频输出）
3. 形成 changelog 与维护文档联动机制

## 10. 修改前后检查清单

### 10.1 修改前

1. 明确改动归属层（UI / 输入 / mapper / CPU / PPU / PAPU / 资源）
2. 确认是否会跨层影响（尤其输入与 mapper）
3. 识别是否涉及 README 和本手册同步更新

### 10.2 修改后

1. 选择至少 2 个 ROM 回归（含一个常用、一个边缘）
2. 验证桌面键盘与移动触控
3. 验证暂停、重启、切 ROM、声音开关
4. 回写本手册中“支持范围/问题清单/改造路线”

## 11. 文档维护规则

本文件是“事实文档”，要求和代码保持同一提交更新。出现以下变化时必须同步更新：

1. 目录结构变化
2. 关键链路变化（启动、ROM、渲染、输入、音频）
3. mapper 支持范围变化
4. 风险状态变化（新增问题、问题修复、优先级调整）

---

本手册用于减少后续维护中的“口口相传成本”和“重复踩坑成本”。  
如未来引入构建系统、测试体系或后端能力，请新增“架构演进记录”章节并标注生效日期。
