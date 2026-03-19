# ARCHITECTURE

## 1. 系统定位

FCGame 是一个基于 JSNES 二次开发的前端静态模拟器项目：

- 页面入口：`index.html`
- 仿真内核：`source/`
- 第三方依赖：`lib/`
- ROM 资源：`roms/`

## 2. 架构分层

1. 表现层：`index.html` + `css/jsnes.css`
2. 交互与桥接层：`source/ui.js` + `source/keyboard.js` + `lib/joystick.js`
3. 仿真核心层：`source/nes.js` + `cpu.js` + `ppu.js` + `papu.js` + `rom.js` + `mappers.js`
4. 资源层：`roms/`、`static/`

## 3. 运行主链路

1. 页面加载脚本并初始化 `JSNES`
2. 通过 UI 选择 ROM 并下载 `.nes`
3. `rom.js` 解析 iNES 头并创建 mapper
4. `nes.frame()` 驱动 CPU/PPU/APU 帧循环
5. 画面写入 canvas，声音写入 WebAudio/回退通道

## 4. 详细文档入口

- 深度技术基线：`docs/design-docs/fcgame-knowledge-baseline.md`
- 设计目录索引：`docs/design-docs/index.md`
- 技术债追踪：`docs/exec-plans/tech-debt-tracker.md`
- 计划入口：`docs/PLANS.md`
