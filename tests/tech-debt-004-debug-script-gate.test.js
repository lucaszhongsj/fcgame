const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const htmlSource = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

test("TD-004: index.html 默认不直接加载 lib/debug.js", function() {
    assert.doesNotMatch(
        htmlSource,
        /<script\s+src=["']lib\/debug\.js["']/i,
        "默认不应直接加载反调试脚本"
    );
});

test("TD-004: index.html 需要提供 antiDebug=1 条件加载开关", function() {
    assert.match(htmlSource, /antiDebug=1/, "应包含 antiDebug=1 开关");
    assert.match(
        htmlSource,
        /createElement\(["']script["']\)[\s\S]*?lib\/debug\.js/,
        "应通过动态脚本方式按条件加载 lib/debug.js"
    );
});
