# AGENTS 协作地图（Map, Not Source of Truth）

> 目的：给人和智能体一个最短导航路径。  
> 定位：仅做“地图”和“入口”，不承载深度事实。  
> 原则：真实细节一律沉淀在 `docs/` 子目录。

---

## 1) 先读什么

当你第一次进入仓库，按以下顺序阅读：

1. `AGENTS.md`（本文件，获取地图）
2. `ARCHITECTURE.md`（系统分层与主链路）
3. `docs/design-docs/index.md`（设计域索引）
4. 对应任务域文档（见下方目录导航）

---

## 2) 知识库总览（结构化 docs）

```text
docs/
├── design-docs/
│   ├── index.md
│   ├── core-beliefs.md
│   └── ...
├── exec-plans/
│   ├── active/
│   ├── completed/
│   └── tech-debt-tracker.md
├── generated/
│   └── db-schema.md
├── product-specs/
│   ├── index.md
│   ├── new-user-onboarding.md
│   └── ...
├── references/
│   ├── design-system-reference-llms.txt
│   ├── nixpacks-llms.txt
│   ├── uv-llms.txt
│   └── ...
├── DESIGN.md
├── FRONTEND.md
├── PLANS.md
├── PRODUCT_SENSE.md
├── QUALITY_SCORE.md
├── RELIABILITY.md
└── SECURITY.md
```

---

## 3) 顶层入口职责（简版）

- `ARCHITECTURE.md`：系统结构与主链路  
- `README.md`：对外说明与快速上手  
- `AGENTS.md`：导航地图（非事实源）

---

## 4) 按任务找文档

- 架构/设计：`docs/design-docs/index.md`、`core-beliefs.md`
- 产品规格：`docs/product-specs/index.md`
- 计划推进：`docs/PLANS.md`、`docs/exec-plans/`
- 技术债/风险：`tech-debt-tracker.md`、`RELIABILITY.md`、`SECURITY.md`
- 自动生成事实：`docs/generated/*`
- 外部参考：`docs/references/*`

---

## 5) 事实来源优先级

1. 代码与运行结果（最高）
2. `docs/generated/*`（自动化产出）
3. `docs/design-docs/*` / `docs/product-specs/*`
4. `README.md`
5. `AGENTS.md`（最低，仅导航）

如果文档与代码冲突，以代码和验证结果为准，并回写文档。

---

## 6) 文档写入规则

- 不要把所有内容写进一个文件。
- 设计写 `design-docs/`，规格写 `product-specs/`。
- 计划写 `exec-plans/`，技术债写 `tech-debt-tracker.md`。
- 影响入口信息时同步更新入口文件。

---

## 7) 维护闭环

1. 先读地图与目标域文档
2. 再改代码并验证
3. 最后回写文档（决策、影响、状态）

没有“只改代码不回写文档”的完成态。

---

## 8) 当前仓库边界说明

- 当前是静态前端模拟器项目。
- 尚未建立自动化测试与构建流水线。
- 若引入后端/数据库/构建系统，先更新地图再扩文档。

---

## 9) 给后续维护者的一句话

把 `AGENTS.md` 当导航，把 `docs/` 当知识库，把代码当最终事实。
