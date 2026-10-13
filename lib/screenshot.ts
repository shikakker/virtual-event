/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

function getLocalExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  if (process.platform === 'win32') {
    return 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  }

  if (process.platform === 'linux') {
    return '/usr/bin/google-chrome';
  }

  return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

export default async function screenshot(url: string) {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_REGION);
  const executablePath = isServerless
    ? await chromium.executablePath()
    : getLocalExecutablePath();

  const browser = await puppeteer.launch({
    args: isServerless ? chromium.args : [],
    executablePath,
    headless: 'shell'
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 2000, height: 1000 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    const file = await page.screenshot({ type: 'png' });
    return Buffer.from(file);
  } finally {
    await browser.close();
  }
}
