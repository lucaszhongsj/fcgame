const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const uiSource = fs.readFileSync(path.resolve(__dirname, "../source/ui.js"), "utf8");
const readmeSource = fs.readFileSync(path.resolve(__dirname, "../README.md"), "utf8");

test("TD-001: 移动端 Select 事件应使用与 keyboard.js 一致的 Space(32)", function() {
    assert.match(
        uiSource,
        /\#joystick_btn_select[\s\S]*?touchstart[\s\S]*?keyCode:\s*32[\s\S]*?touchend[\s\S]*?keyCode:\s*32/,
        "Select 触摸事件必须使用 keyCode 32"
    );
    assert.doesNotMatch(
        uiSource,
        /\#joystick_btn_select[\s\S]*?touchstart[\s\S]*?keyCode:\s*17/,
        "Select 不应继续使用 keyCode 17"
    );
});

test("TD-001: README 按键映射需与 keyboard.js 真值一致", function() {
    assert.match(readmeSource, /\|\s*B\s*\|\s*K\s*\|\s*Num2\s*\|/, "README 中 B 键位应为 K / Num2");
    assert.match(readmeSource, /\|\s*A\s*\|\s*J\s*\|\s*Num1\s*\|/, "README 中 A 键位应为 J / Num1");
    assert.match(readmeSource, /\|\s*Select\s*\|\s*Space\s*\|\s*Num\/\s*\|/, "README 中 Select 键位应为 Space / Num/");
});
