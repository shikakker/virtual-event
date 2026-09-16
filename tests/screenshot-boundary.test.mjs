import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const screenshot = await readFile(new URL('../lib/screenshot.ts', import.meta.url), 'utf8');

test('serverless screenshot runtime uses maintained Chromium instead of chrome-aws-lambda', () => {
  assert.doesNotMatch(screenshot, /chrome-aws-lambda/);
  assert.match(screenshot, /@sparticuz\/chromium/);
  assert.match(screenshot, /puppeteer-core/);
});

test('screenshot browser is always closed after capture or failure', () => {
  assert.match(screenshot, /try\s*\{/);
  assert.match(screenshot, /finally\s*\{/);
  assert.match(screenshot, /await browser\.close\(\)/);
});

test('local Chromium path is explicit and serverless detection includes Vercel', () => {
  assert.match(screenshot, /PUPPETEER_EXECUTABLE_PATH/);
  assert.match(screenshot, /process\.env\.VERCEL/);
});
