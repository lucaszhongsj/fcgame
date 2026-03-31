const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const bundledRomRepo = 'nes-open-db';
const bundledRomDir = path.join(repoRoot, 'roms', bundledRomRepo);
const expectedBundledRoms = [
    'kubo.nes',
    'megamountain.nes',
    'melojellos2.nes',
    'nesert-golfing.nes',
    'robo-ninja-climb.nes',
    'spacey-mcracey.nes',
    'super-homebrew-war.nes'
];

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

test('合规: 仅允许内置白名单 ROM 文件', () => {
    assert.equal(fs.existsSync(bundledRomDir), true, 'roms/nes-open-db 目录必须存在');

    const romFiles = fs.readdirSync(bundledRomDir).filter((name) => /\.nes$/i.test(name)).sort();
    assert.deepEqual(romFiles, expectedBundledRoms, 'roms/nes-open-db 目录中的 ROM 必须与白名单一致');
});

test('合规: index.html 仅可引用白名单内置 ROM', () => {
    const indexHtml = readFile('index.html');
    const matched = indexHtml.match(/roms\/nes-open-db\/[^'"]+\.nes/g) || [];
    const unique = Array.from(new Set(matched.map((item) => item.replace('roms/nes-open-db/', '')))).sort();
    assert.deepEqual(unique, expectedBundledRoms, 'index.html 只允许引用白名单 ROM');
});

test('合规: 白名单 ROM 必须存在版权与来源清单', () => {
    const manifestPath = path.join(repoRoot, 'roms', 'WHITELIST.md');
    assert.equal(fs.existsSync(manifestPath), true, '缺少 roms/WHITELIST.md');

    const manifest = fs.readFileSync(manifestPath, 'utf8');
    for (const rom of expectedBundledRoms) {
        assert.match(manifest, new RegExp(rom.replace('.', '\\.')), `WHITELIST.md 必须记录 ${rom}`);
    }
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
