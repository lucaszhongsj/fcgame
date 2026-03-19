const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const romSource = fs.readFileSync(path.resolve(__dirname, "../source/rom.js"), "utf8");

function createRom(mapperType) {
    const statusMessages = [];
    const sandbox = {
        JSNES: {
            Mappers: {
                0: function Mapper0(nes) {
                    this.nes = nes;
                },
                5: function Mapper5(nes) {
                    this.nes = nes;
                }
            }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(romSource, sandbox);

    const nes = {
        ui: {
            updateStatus: function(message) {
                statusMessages.push(message);
            }
        }
    };
    const rom = new sandbox.JSNES.ROM(nes);
    rom.mapperType = mapperType;

    return { rom, statusMessages };
}

test("TD-003: Mapper5 需要被显式标记为不支持", function() {
    const { rom, statusMessages } = createRom(5);

    assert.equal(rom.mapperSupported(), false, "Mapper5 应返回不支持");
    assert.equal(rom.createMapper(), null, "Mapper5 createMapper 应返回 null");
    assert.equal(statusMessages.length > 0, true, "应给出不支持提示");
    assert.match(statusMessages[0], /MMC5|Mapper/i);
});

test("TD-003: 非黑名单 mapper 仍可正常创建实例", function() {
    const { rom, statusMessages } = createRom(0);

    assert.equal(rom.mapperSupported(), true, "Mapper0 应继续支持");
    assert.notEqual(rom.createMapper(), null, "Mapper0 应可创建实例");
    assert.equal(statusMessages.length, 0, "支持的 mapper 不应输出错误提示");
});
