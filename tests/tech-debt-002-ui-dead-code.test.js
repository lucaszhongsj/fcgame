const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const uiSource = fs.readFileSync(path.resolve(__dirname, "../source/ui.js"), "utf8");

test("TD-002: ui.js 不应保留已废弃的 DOM 选择器与方向分支", function() {
    const legacyMarkers = [
        "controls-turbofire",
        "pc-controlls",
        "mobile-controlls",
        ".shang",
        "leftup",
        "rightup",
        "leftdown",
        "rightdown"
    ];

    for (const marker of legacyMarkers) {
        assert.equal(uiSource.includes(marker), false, "不应包含历史残留标记: " + marker);
    }
});
