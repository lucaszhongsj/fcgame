const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createKeyboard() {
    const sourcePath = path.join(__dirname, '..', 'source', 'keyboard.js');
    const sourceCode = fs.readFileSync(sourcePath, 'utf8');
    const sandbox = { JSNES: {} };
    vm.createContext(sandbox);
    vm.runInContext(sourceCode, sandbox);
    return new sandbox.JSNES.Keyboard();
}

test('Issue #7: P2 方向键应写入 state2', () => {
    const keyboard = createKeyboard();
    const arrowUpKeyCode = 38;

    const handled = keyboard.setKey(arrowUpKeyCode, 0x41);

    assert.equal(handled, false);
    assert.equal(keyboard.state2[keyboard.keys.KEY_UP], 0x41);
    assert.equal(keyboard.state1[keyboard.keys.KEY_UP], 0x40);
});
