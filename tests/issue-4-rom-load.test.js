const test = require("node:test");
const assert = require("node:assert/strict");

const {
    getRomRequestUrl,
    shouldStartRomFromAjaxResult,
    getRomLoadErrorMessage
} = require("../source/rom_load_helpers.js");

test("getRomRequestUrl_保留原始相对路径_不做escape编码", function() {
    const romUrl = "roms/超级马里奥.nes";
    assert.equal(getRomRequestUrl(romUrl), romUrl);
});

test("shouldStartRomFromAjaxResult_请求失败_不允许进入启动流程", function() {
    const result = shouldStartRomFromAjaxResult("error", 404, "");
    assert.equal(result, false);
});

test("shouldStartRomFromAjaxResult_请求成功且有数据_允许进入启动流程", function() {
    const result = shouldStartRomFromAjaxResult("success", 200, "NESDATA");
    assert.equal(result, true);
});

test("getRomLoadErrorMessage_file协议_提示使用本地HTTP服务", function() {
    const message = getRomLoadErrorMessage({
        protocol: "file:",
        url: "roms/mario.nes",
        status: 0,
        textStatus: "error"
    });
    assert.match(message, /本地 HTTP 服务/);
});

test("getRomLoadErrorMessage_http失败_包含状态码与资源地址", function() {
    const message = getRomLoadErrorMessage({
        protocol: "http:",
        url: "roms/mario.nes",
        status: 404,
        textStatus: "error"
    });
    assert.match(message, /404/);
    assert.match(message, /roms\/mario\.nes/);
});
