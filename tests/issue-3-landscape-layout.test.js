const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.resolve(__dirname, '../css/jsnes.css');
const css = fs.readFileSync(cssPath, 'utf8');

function getMediaBlock(content, mediaHeader) {
  const mediaIndex = content.indexOf(mediaHeader);
  assert.notStrictEqual(mediaIndex, -1, `缺少媒体查询: ${mediaHeader}`);

  const openBraceIndex = content.indexOf('{', mediaIndex);
  assert.notStrictEqual(openBraceIndex, -1, `媒体查询缺少起始大括号: ${mediaHeader}`);

  let depth = 0;
  for (let index = openBraceIndex; index < content.length; index += 1) {
    const char = content[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(openBraceIndex + 1, index);
      }
    }
  }

  throw new Error(`媒体查询未正确闭合: ${mediaHeader}`);
}

function getRuleBlock(content, selector) {
  const selectorIndex = content.indexOf(selector);
  assert.notStrictEqual(selectorIndex, -1, `缺少选择器: ${selector}`);

  const openBraceIndex = content.indexOf('{', selectorIndex);
  assert.notStrictEqual(openBraceIndex, -1, `选择器缺少起始大括号: ${selector}`);

  let depth = 0;
  for (let index = openBraceIndex; index < content.length; index += 1) {
    const char = content[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(openBraceIndex + 1, index);
      }
    }
  }

  throw new Error(`选择器规则未正确闭合: ${selector}`);
}

test('landscape 低高度场景下 screen 支持纵向滚动以访问 ROM 与控制按钮', () => {
  const landscapeBlock = getMediaBlock(css, '@media screen and (orientation: landscape)');
  const screenRuleBlock = getRuleBlock(landscapeBlock, '.screen');

  assert.match(screenRuleBlock, /overflow-y\s*:\s*auto\s*;/, '横屏下 .screen 需要开启纵向滚动');
  assert.match(screenRuleBlock, /-webkit-overflow-scrolling\s*:\s*touch\s*;/, '横屏下 .screen 需要触摸惯性滚动');
});

test('landscape 低高度场景下 #emulator 释放高度避免 ROM 与控制按钮被裁剪', () => {
  const landscapeBlock = getMediaBlock(css, '@media screen and (orientation: landscape)');
  const emulatorRuleBlock = getRuleBlock(landscapeBlock, '.screen #emulator');

  assert.match(emulatorRuleBlock, /height\s*:\s*auto\s*!important\s*;/, '横屏下 #emulator 需要覆盖内联高度');
  assert.match(emulatorRuleBlock, /min-height\s*:\s*100%\s*;/, '横屏下 #emulator 需要保持最小可视高度');
});
