# runtime-assets 分支同步与 ROM 动态加载设计（2026-04-01）

## 1. 背景与目标

当前 `index.html` 中 ROM 列表为硬编码，新增 ROM 需要改代码并提 PR，维护成本高。  
目标是在不污染 `main` 分支的前提下，实现：

1. ROM 由脚本按来源仓库自动下载和分类。
2. 前端通过清单文件动态加载 ROM，不再硬编码列表。
3. 使用 GitHub Actions 将 `main` 的代码与运行时资源同步到专用分支 `runtime-assets`。
4. `runtime-assets` 冲突时直接覆盖，保持“以最新 `main`+脚本产物为准”。
5. `runtime-assets` 仅允许 GitHub Actions 写入。

## 2. 非目标

1. 不在本阶段引入后端服务。
2. 不在本阶段引入对象存储/CDN 专有能力。
3. 不在本阶段实现复杂授权审计引擎（保留最小可选字段与报告机制）。

## 3. 约束与前提

1. 项目是静态前端，浏览器端不能可靠遍历目录，因此必须依赖“目录索引清单”。
2. 用户希望脚本可在本地使用，同时 CI 也可执行。
3. `main` 保持干净，不提交 ROM 运行时下载产物。
4. `runtime-assets` 允许被工作流强制覆盖（force push）。

## 4. 方案对比

### 方案 A：硬编码列表（现状）

- 优点：实现简单。
- 缺点：每次新增 ROM 都要改前端代码；无法扩展多来源仓库。

### 方案 B：前端直接遍历 `roms/` 目录

- 优点：理论上零配置。
- 缺点：静态站点环境通常不支持目录遍历，部署环境不可移植。

### 方案 C：清单驱动（选用）

- 优点：兼容静态站点；新增 ROM 不改前端代码；本地与 CI 可共用。
- 缺点：需要维护脚本与 manifest 结构。

结论：采用方案 C。

## 5. 总体设计

### 5.1 目录与文件结构

`main` 分支（代码源）新增：

1. `scripts/fetch-roms.sh`：下载与清单生成脚本。
2. `rom-sources.json`：ROM 源配置。

`runtime-assets` 分支（运行时产物）最终包含：

1. `roms/<source_repo>/*.nes`
2. `roms/<source_repo>/manifest.json`
3. `roms/index.json`
4. `download-report.json`
5. `main` 全量代码镜像（由工作流同步覆盖）

### 5.2 配置模型（`rom-sources.json`）

每个来源仓库定义一个 `source_repo` 与 `items` 列表。  
宽松模式必填字段：

1. `source_repo`
2. `name`
3. `rom_url`

可选字段：

1. `license`
2. `license_url`
3. `homepage`

### 5.3 下载脚本行为（本地/CI 共用）

脚本核心流程：

1. 读取 `rom-sources.json`。
2. 逐条下载 ROM 到 `roms/<source_repo>/`。
3. 为每个来源生成 `roms/<source_repo>/manifest.json`。
4. 汇总生成 `roms/index.json`（记录所有来源及 manifest 路径）。
5. 输出 `download-report.json`（成功/失败/原因）。
6. 失败项不阻断整体流程，最终以非零退出码或报告字段体现异常数量（由参数控制）。

### 5.4 前端加载模型

`index.html` 不再写死 ROM 列表，改为：

1. 拉取 `roms/index.json`。
2. 遍历每个来源的 manifest。
3. 组装 `JSNESUI` 需要的结构：`{ 分组名: [[显示名, 路径], ...] }`。
4. 请求失败时显示清晰错误状态，并保留“本地导入 ROM”可用。

### 5.5 GitHub Actions 同步模型

触发条件：

1. `push` 到 `main`
2. `workflow_dispatch`

执行流程：

1. 检出 `main`。
2. 运行 `scripts/fetch-roms.sh` 生成运行时资源与清单。
3. 将当前工作树强制推送到 `runtime-assets`（覆盖冲突）。

分支写权限策略：

1. `runtime-assets` 启用 branch protection/ruleset。
2. 仅允许 bot 身份写入（通过 `RUNTIME_ASSETS_PUSH_TOKEN`）。
3. 人工账号不直接向 `runtime-assets` 提交。

## 6. 冲突覆盖与一致性语义

`runtime-assets` 被定义为“派生分支”，非人工协作分支。  
其状态由“最新 `main` + 最新脚本运行结果”决定，若发生冲突或分叉，一律覆盖。  
因此 `runtime-assets` 不承诺保留人工历史，主审计与评审仍以 `main` 为准。

## 7. 失败处理与回滚

1. 下载失败：记录在 `download-report.json`，不中断其他条目。
2. 清单生成失败：workflow 失败，不推送分支。
3. 发布回滚：重新运行最近一次稳定 `main` 提交的 workflow，即可覆盖 `runtime-assets`。

## 8. 验证策略

### 8.1 自动化验证

1. 保留现有 Node 测试。
2. 新增脚本级校验（配置合法性、manifest 结构完整性）。
3. 新增前端加载回归测试（当 `roms/index.json` 存在时能正确渲染列表）。

### 8.2 人工验收

1. 本地执行脚本后可看到分来源分组。
2. Actions 完成后，`runtime-assets` 分支存在最新 ROM 与清单。
3. 线上页面无需改代码即可显示新增 ROM。

## 9. 风险与控制

1. 仓库体积增长：长期评估 Git LFS 或外部对象存储。
2. 来源质量波动：通过 `download-report.json` 暴露异常并在 CI 里告警。
3. 链接失效：支持重试、超时与失败统计，不因为单点失败拖垮全量。

## 10. 实施边界

本设计仅定义目标架构与实施策略，不包含具体代码实现。  
待评审通过后进入执行计划阶段。
