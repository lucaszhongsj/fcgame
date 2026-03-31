const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const romSourcesConfigPath = path.join(repoRoot, 'rom-sources.json');
const fetchScriptPath = path.join(repoRoot, 'scripts', 'fetch-roms.sh');
const runtimeAssetsWorkflowPath = path.join(repoRoot, '.github', 'workflows', 'runtime-assets-sync.yml');

function readFile(relativePath) {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('合规: 仓库必须提供 GPL 许可证文件', () => {
    const licensePath = path.join(repoRoot, 'LICENSE');
    assert.equal(fs.existsSync(licensePath), true, '缺少 LICENSE 文件');

    const license = fs.readFileSync(licensePath, 'utf8');
    assert.match(license, /GNU GENERAL PUBLIC LICENSE/i, 'LICENSE 应包含 GPL 正文');
    assert.match(license, /Version 3/i, 'LICENSE 应为 GPLv3');
});

test('ROM 配置: 必须提供 rom-sources.json', () => {
    assert.equal(fs.existsSync(romSourcesConfigPath), true, '缺少 rom-sources.json');

    const config = JSON.parse(fs.readFileSync(romSourcesConfigPath, 'utf8'));
    assert.equal(Array.isArray(config.sources), true, 'rom-sources.json 必须包含 sources 数组');
    assert.equal(config.sources.length > 0, true, 'sources 不能为空');
});

test('ROM 拉取: 必须提供 fetch-roms.sh 脚本', () => {
    assert.equal(fs.existsSync(fetchScriptPath), true, '缺少 scripts/fetch-roms.sh');
});

test('CI: 必须提供 runtime-assets 同步工作流', () => {
    assert.equal(fs.existsSync(runtimeAssetsWorkflowPath), true, '缺少 runtime-assets-sync.yml');
    const workflowSource = fs.readFileSync(runtimeAssetsWorkflowPath, 'utf8');
    assert.match(workflowSource, /runtime-assets/, '工作流应包含 runtime-assets 分支同步');
    assert.match(workflowSource, /--force/, '工作流应使用 force push 覆盖冲突');
});

test('ROM 加载: index.html 应使用清单动态加载', () => {
    const indexHtml = readFile('index.html');
    assert.equal(
        indexHtml.includes('"Homebrew ROM": ['),
        false,
        '不应在 index.html 中硬编码 ROM 列表'
    );
    assert.match(indexHtml, /source\/rom_catalog_loader\.js/, '应引入 rom_catalog_loader.js');
    assert.match(indexHtml, /roms\/index\.json/, '应读取 roms/index.json');
});

test('功能: UI 提供本地导入 ROM 文件能力', () => {
    const uiSource = readFile('source/ui.js');
    assert.match(uiSource, /type=["']file["']/, '应提供 file input');
    assert.match(uiSource, /readAsArrayBuffer|readAsBinaryString/, '应通过 FileReader 读取本地 ROM');
    assert.match(uiSource, /loadLocalROM|loadLocalRom|loadLocalFile/, '应存在本地 ROM 加载入口');
});

test('文档: README 必须说明本地导入 ROM 使用方式', () => {
    const readme = readFile('README.md');
    assert.match(readme, /本地导入\s*ROM/);
    assert.match(readme, /内置白名单|合规白名单/);
});
