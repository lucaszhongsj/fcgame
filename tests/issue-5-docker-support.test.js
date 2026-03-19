const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function readFile(relativePath) {
    const filePath = path.join(repoRoot, relativePath);
    assert.equal(fs.existsSync(filePath), true, `缺少文件: ${relativePath}`);
    return fs.readFileSync(filePath, 'utf8');
}

test('issue #5: 提供可运行的 Dockerfile', () => {
    const dockerfile = readFile('Dockerfile');
    assert.match(dockerfile, /^FROM\s+nginx:alpine$/m, 'Dockerfile 应基于 nginx:alpine');
    assert.match(dockerfile, /^COPY\s+\.\s+\/usr\/share\/nginx\/html$/m, 'Dockerfile 应复制静态站点到 nginx 目录');
    assert.match(dockerfile, /^EXPOSE\s+80$/m, 'Dockerfile 应暴露 80 端口');
});

test('issue #5: .dockerignore 需要排除无关内容', () => {
    const dockerignore = readFile('.dockerignore');
    assert.match(dockerignore, /^\.git$/m, '.dockerignore 需要忽略 .git');
    assert.match(dockerignore, /^node_modules$/m, '.dockerignore 需要忽略 node_modules');
    assert.match(dockerignore, /^tests$/m, '.dockerignore 需要忽略 tests');
});

test('issue #5: README 提供中文 Docker 运行说明', () => {
    const readme = readFile('README.md');
    assert.match(readme, /Docker 部署/, 'README 需要新增 Docker 部署章节');
    assert.match(readme, /docker build -t fcgame:local \./, 'README 需要提供 docker build 命令');
    assert.match(readme, /docker run --rm -p 8080:80 fcgame:local/, 'README 需要提供 docker run 命令');
    assert.match(readme, /http:\/\/localhost:8080/, 'README 需要给出访问地址');
});
