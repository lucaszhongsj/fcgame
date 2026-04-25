const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadCatalogLoader() {
    const sourcePath = path.join(__dirname, '..', 'source', 'rom_catalog_loader.js');
    const sourceCode = fs.readFileSync(sourcePath, 'utf8');
    const sandbox = {
        window: {},
        console: console
    };
    vm.createContext(sandbox);
    vm.runInContext(sourceCode, sandbox);
    return sandbox.window.FCGameRomCatalog;
}

function normalize(value) {
    return JSON.parse(JSON.stringify(value));
}

test('rom-catalog-loader: buildRomsConfig 应转换为 JSNESUI 分组结构', () => {
    const loader = loadCatalogLoader();
    const indexData = {
        generated_at: '2026-04-01T00:00:00Z',
        sources: [{ source_repo: 'nes-open-db', manifest: 'roms/nes-open-db/manifest.json' }]
    };
    const manifests = [{
        source_repo: 'nes-open-db',
        display_name: 'nes-open-db',
        roms: [{ name: 'Kubo', path: 'roms/nes-open-db/kubo.nes' }]
    }];

    const romsConfig = normalize(loader.buildRomsConfig(indexData, manifests));

    assert.deepEqual(romsConfig, {
        'nes-open-db': [['Kubo', 'roms/nes-open-db/kubo.nes']]
    });
});

test('rom-catalog-loader: 空 ROM 列表应返回空对象', () => {
    const loader = loadCatalogLoader();
    const romsConfig = normalize(loader.buildRomsConfig({ sources: [] }, []));
    assert.deepEqual(romsConfig, {});
});
