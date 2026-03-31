# Runtime Assets Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 去除 `index.html` 的 ROM 硬编码列表，改为清单驱动加载，并用 GitHub Actions 将 `main` + ROM 产物强制同步到 `runtime-assets` 分支。

**Architecture:** 采用“配置驱动下载 + 清单聚合 + 前端动态加载 + CI 派生分支发布”方案。`main` 只保留代码和配置，`runtime-assets` 承载运行时 ROM 与 manifest。前端仅消费 `roms/index.json`，不依赖目录遍历。

**Tech Stack:** Shell (`bash` + `jq` + `curl`), 原生 JavaScript (jQuery + JSNES), Node.js `node:test`, GitHub Actions。

---

## 文件结构与职责

- Create: `scripts/fetch-roms.sh`  
  负责读取 `rom-sources.json`，下载 ROM，生成 `roms/<repo>/manifest.json`、`roms/index.json`、`download-report.json`。
- Create: `rom-sources.json`  
  ROM 源配置（宽松模式：仅强制 `source_repo/name/rom_url`）。
- Create: `.github/workflows/runtime-assets-sync.yml`  
  在 `main` push 或手动触发时运行抓取脚本并强制覆盖推送到 `runtime-assets`。
- Create: `source/rom_catalog_loader.js`  
  前端 ROM 清单加载器，读取 `roms/index.json` 并转换为 `JSNESUI` 的分组结构。
- Modify: `index.html`  
  移除硬编码 ROM 列表，改为调用加载器初始化 NES。
- Modify: `tests/compliance-rom-policy.test.js`  
  从“硬编码白名单断言”改为“清单驱动机制断言”。
- Create: `tests/rom-catalog-loader.test.js`  
  覆盖清单转换逻辑与错误路径。
- Modify: `README.md`  
  增加本地脚本前置步骤、`runtime-assets` 机制说明。
- Modify: `docs/design-docs/fcgame-knowledge-baseline.md`  
  回写运行时资源加载机制与分支职责。

## Task 1: 建立失败测试（先锁定“去硬编码”行为）

**Files:**
- Modify: `tests/compliance-rom-policy.test.js`
- Create: `tests/rom-catalog-loader.test.js`
- Test: `tests/compliance-rom-policy.test.js`
- Test: `tests/rom-catalog-loader.test.js`

- [ ] **Step 1: 在合规测试中写入“禁止硬编码 ROM 列表”的失败断言**

```js
test('ROM 加载: index.html 不应内嵌硬编码 ROM 清单', () => {
    const indexHtml = readFile('index.html');
    assert.equal(indexHtml.includes('"Homebrew ROM": ['), false, '不应在 index.html 写死 ROM 列表');
    assert.match(indexHtml, /roms\/index\.json/, '应改为读取 roms/index.json');
});
```

- [ ] **Step 2: 为加载器写失败测试（清单转换）**

```js
test('rom-catalog-loader: 应将 index+manifest 转为 JSNESUI 分组结构', () => {
    const indexData = {
        generated_at: '2026-04-01T00:00:00Z',
        sources: [{ source_repo: 'nes-open-db', manifest: 'roms/nes-open-db/manifest.json' }]
    };
    const manifests = [{
        source_repo: 'nes-open-db',
        display_name: 'nes-open-db',
        roms: [{ name: 'Kubo', path: 'roms/nes-open-db/kubo.nes' }]
    }];
    const roms = loader.buildRomsConfig(indexData, manifests);
    assert.deepEqual(roms, { 'nes-open-db': [['Kubo', 'roms/nes-open-db/kubo.nes']] });
});
```

- [ ] **Step 3: 运行测试确认失败（RED）**

Run:
```bash
node --test tests/compliance-rom-policy.test.js tests/rom-catalog-loader.test.js
```

Expected:
```text
FAIL ... index.html 不应内嵌硬编码 ROM 清单
FAIL ... Cannot find module/source/rom_catalog_loader.js (or equivalent)
```

- [ ] **Step 4: Commit**

```bash
git add tests/compliance-rom-policy.test.js tests/rom-catalog-loader.test.js
git commit -m "test: lock rom catalog dynamic loading behavior"
```

## Task 2: 实现前端清单加载器并接入 index.html

**Files:**
- Create: `source/rom_catalog_loader.js`
- Modify: `index.html`
- Test: `tests/rom-catalog-loader.test.js`
- Test: `tests/compliance-rom-policy.test.js`

- [ ] **Step 1: 实现最小加载器（GREEN）**

```js
;(function(global) {
    function buildRomsConfig(indexData, manifests) {
        var result = {};
        for (var i = 0; i < manifests.length; i++) {
            var manifest = manifests[i];
            var group = manifest.display_name || manifest.source_repo;
            result[group] = [];
            for (var j = 0; j < manifest.roms.length; j++) {
                result[group].push([manifest.roms[j].name, manifest.roms[j].path]);
            }
        }
        return result;
    }

    function fetchJson(url) {
        return $.getJSON(url);
    }

    function loadCatalog(indexUrl) {
        return fetchJson(indexUrl).then(function(indexData) {
            var deferreds = [];
            for (var i = 0; i < indexData.sources.length; i++) {
                deferreds.push(fetchJson(indexData.sources[i].manifest));
            }
            return $.when.apply($, deferreds).then(function() {
                var manifests = Array.prototype.slice.call(arguments).map(function(item) {
                    return Array.isArray(item) ? item[0] : item;
                });
                return buildRomsConfig(indexData, manifests);
            });
        });
    }

    global.FCGameRomCatalog = {
        buildRomsConfig: buildRomsConfig,
        loadCatalog: loadCatalog
    };
}(window));
```

- [ ] **Step 2: 在 `index.html` 去除 ROM 硬编码并接入加载器**

```html
<script src="source/rom_catalog_loader.js" type="text/javascript" charset="utf-8"></script>
<script type="text/javascript" charset="utf-8">
    var nes;
    $(function() {
        FCGameRomCatalog.loadCatalog('roms/index.json')
            .then(function(romsConfig) {
                nes = new JSNES({
                    ui: $('#emulator').JSNESUI(romsConfig)
                });
            })
            .fail(function() {
                nes = new JSNES({
                    ui: $('#emulator').JSNESUI({})
                });
            });
    });
</script>
```

- [ ] **Step 3: 运行测试确认通过**

Run:
```bash
node --test tests/compliance-rom-policy.test.js tests/rom-catalog-loader.test.js
```

Expected:
```text
pass 2+ tests ... fail 0
```

- [ ] **Step 4: Commit**

```bash
git add source/rom_catalog_loader.js index.html tests/compliance-rom-policy.test.js tests/rom-catalog-loader.test.js
git commit -m "feat: load rom list from generated catalog manifests"
```

## Task 3: 实现宽松模式下载脚本与配置文件

**Files:**
- Create: `scripts/fetch-roms.sh`
- Create: `rom-sources.json`
- Test: `scripts/fetch-roms.sh` (命令行自测)

- [ ] **Step 1: 写脚本最小失败校验（配置缺失时失败）**

```bash
#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="${1:-rom-sources.json}"
if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "config file not found: $CONFIG_FILE" >&2
  exit 1
fi
```

- [ ] **Step 2: 实现下载与 manifest/index/report 生成**

```bash
jq -c '.sources[]' "$CONFIG_FILE" | while read -r source; do
  repo=$(echo "$source" | jq -r '.source_repo')
  mkdir -p "roms/$repo"
  echo "$source" | jq -c '.items[]' | while read -r item; do
    name=$(echo "$item" | jq -r '.name')
    url=$(echo "$item" | jq -r '.rom_url')
    file="roms/$repo/${name}.nes"
    if curl --retry 3 --retry-delay 2 --max-time 120 -fsSL "$url" -o "$file"; then
      echo "{\"source_repo\":\"$repo\",\"name\":\"$name\",\"path\":\"$file\",\"status\":\"success\"}" >> "$REPORT_TMP"
    else
      echo "{\"source_repo\":\"$repo\",\"name\":\"$name\",\"path\":\"$file\",\"status\":\"failed\",\"reason\":\"download_error\"}" >> "$REPORT_TMP"
    fi
  done
done
```

- [ ] **Step 3: 增加示例配置 `rom-sources.json`**

```json
{
  "sources": [
    {
      "source_repo": "nes-open-db",
      "display_name": "Homebrew (nes-open-db)",
      "items": [
        {
          "name": "kubo",
          "display_name": "Kubo",
          "rom_url": "https://example.invalid/kubo.nes",
          "license": "CC BY 4.0",
          "license_url": "https://example.invalid/kubo-license.txt"
        }
      ]
    }
  ]
}
```

- [ ] **Step 4: 本地命令自测**

Run:
```bash
bash scripts/fetch-roms.sh rom-sources.json
```

Expected:
```text
生成 roms/index.json
生成 roms/<repo>/manifest.json
生成 download-report.json
```

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-roms.sh rom-sources.json
git commit -m "feat: add configurable rom fetch script with manifest generation"
```

## Task 4: 添加 GitHub Actions 同步到 runtime-assets

**Files:**
- Create: `.github/workflows/runtime-assets-sync.yml`
- Test: `.github/workflows/runtime-assets-sync.yml`（YAML 结构 + 本地 dry-run 检查）

- [ ] **Step 1: 编写 workflow（main 触发 + 手动触发）**

```yaml
name: runtime-assets-sync
on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: sudo apt-get update && sudo apt-get install -y jq
      - run: bash scripts/fetch-roms.sh rom-sources.json
      - name: push runtime-assets
        env:
          PUSH_TOKEN: ${{ secrets.RUNTIME_ASSETS_PUSH_TOKEN }}
        run: |
          git config user.name "runtime-assets-bot"
          git config user.email "runtime-assets-bot@users.noreply.github.com"
          git checkout -B runtime-assets
          git add -A
          git commit -m "chore: sync runtime assets from main" || true
          git push "https://x-access-token:${PUSH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" runtime-assets --force
```

- [ ] **Step 2: 添加分支写入约束文档说明**

```md
- `runtime-assets` 仅允许 bot token 写入。
- 人工账号禁止直接 push。
- 若与历史冲突，CI 以 `--force` 覆盖。
```

- [ ] **Step 3: 本地静态检查**

Run:
```bash
node --test tests/*.test.js
```

Expected:
```text
all tests pass
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/runtime-assets-sync.yml README.md docs/design-docs/fcgame-knowledge-baseline.md
git commit -m "ci: sync runtime-assets branch from main via github actions"
```

## Task 5: 文档与回归收口

**Files:**
- Modify: `README.md`
- Modify: `docs/design-docs/fcgame-knowledge-baseline.md`
- Modify: `docs/exec-plans/active/index.md`

- [ ] **Step 1: README 增加前置步骤与运行方式**

```md
## ROM 资源准备（本地）
1. 编辑 `rom-sources.json` 配置来源。
2. 执行 `bash scripts/fetch-roms.sh rom-sources.json`。
3. 再启动页面，ROM 将按来源自动分组显示。
```

- [ ] **Step 2: 回写知识库**

```md
- 运行时 ROM 来源由 `roms/index.json` 驱动。
- `runtime-assets` 是派生分支，由 Actions 覆盖更新。
```

- [ ] **Step 3: 运行全量回归**

Run:
```bash
node --test tests/*.test.js
```

Expected:
```text
pass ... fail 0
```

- [ ] **Step 4: Commit**

```bash
git add README.md docs/design-docs/fcgame-knowledge-baseline.md docs/exec-plans/active/index.md
git commit -m "docs: describe rom catalog workflow and runtime-assets branch model"
```

## 最终验收清单

- [ ] `index.html` 不再硬编码 ROM 列表。
- [ ] `scripts/fetch-roms.sh` 可根据 `rom-sources.json` 生成 manifest/index/report。
- [ ] 前端可通过 `roms/index.json` 动态加载 ROM 分组。
- [ ] GitHub Actions 可将 `main` + 产物强制同步到 `runtime-assets`。
- [ ] 全量测试通过：`node --test tests/*.test.js`。

