import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const captures = join(root, 'captures');
const base = `file://${join(root, 'index.html')}`;
const screens = ['entry', 'world', 'conversation', 'feedback', 'handoff', 'training'];
const viewports = [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }];
const expectedHeadings = { entry: 'ことばから、', world: '今日、どこへ行く？', conversation: 'YOUR MOVE · REACT + SUPPORT', feedback: '伝わった。次は、続けてみよう。', handoff: '「いっしょに行こう」を', training: '今日の学習室' };
const actionTimeout = 6000;

await mkdir(captures, { recursive: true });
const browser = await chromium.launch();
const failures = [];
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(actionTimeout);
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()); });
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const screen of screens) {
      await page.goto(`${base}?screen=${screen}&capture=1`, { waitUntil: 'load', timeout: actionTimeout });
      await page.waitForFunction((heading) => document.body.innerText.includes(heading), expectedHeadings[screen], { timeout: actionTimeout });
      if ((await page.locator('#app').innerText()).trim().length < 80) throw new Error(`${screen}-${viewport.name}: learner content is empty`);
      if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) throw new Error(`horizontal overflow at ${viewport.width}x${viewport.height} on ${screen}`);
      const unnamed = await page.locator('#app button, #app a, #app [role="button"]').evaluateAll((items) => items.filter((item) => !(item.getAttribute('aria-label') || item.textContent || '').trim()).length);
      if (unnamed) throw new Error(`${screen}-${viewport.name}: ${unnamed} control(s) lack an accessible name`);
      await page.screenshot({ path: join(captures, `${screen}-${viewport.name}.png`), fullPage: false });
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}?screen=entry&capture=1`, { waitUntil: 'load', timeout: actionTimeout });
  // Use the real tab order to reach the second product entry, then activate it.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  if (!(await page.evaluate(() => document.activeElement?.textContent?.includes('Life を開く')))) throw new Error('tab traversal did not reach Life entry');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'この場面へ' }).focus();
  await page.keyboard.press('Enter');
  await page.locator('.intent').scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(captures, 'conversation-mobile-actions.png'), fullPage: false });

  // A brief reaction is natural and understandable, but is a contextual dead end.
  await page.getByRole('button', { name: '短く反応する' }).focus();
  await page.keyboard.press('Enter');
  if (!(await page.locator('.record-card').innerText()).includes('短く反応する')) throw new Error('brief response is not reflected in feedback');
  if (!(await page.locator('.dimension-list').innerText()).includes('会話が続きにくい')) throw new Error('brief response did not show continuation needs-work');

  // Retry into the richer care response and verify the continuation result changes.
  await page.getByRole('button', { name: 'もう一度、この場面で言う' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '気づかう' }).focus();
  await page.keyboard.press('Enter');
  if (!(await page.locator('.record-card').innerText()).includes('気づかう')) throw new Error('richer response is not reflected in feedback');
  if (!(await page.locator('.dimension-list').innerText()).includes('相手が返しやすい一言')) throw new Error('richer response did not show continuation met');

  await page.getByRole('button', { name: 'もう一度、この場面で言う' }).focus();
  await page.keyboard.press('Enter');
  const ruby = page.locator('rt');
  if (!(await ruby.first().isVisible())) throw new Error('ruby is not visible before toggle');
  await page.getByRole('button', { name: 'ふりがな' }).focus();
  await page.keyboard.press('Enter');
  if (await ruby.first().isVisible()) throw new Error('ruby toggle did not hide rt');
  await page.getByRole('button', { name: 'ふりがな' }).focus();
  await page.keyboard.press('Enter');
  if (!(await ruby.first().isVisible())) throw new Error('ruby toggle did not restore rt');
  await page.getByRole('button', { name: '言い換えのヒント' }).focus();
  await page.keyboard.press('Enter');
  if (!(await page.locator('#support-note').isVisible())) throw new Error('support toggle did not open by keyboard');
  await page.getByRole('button', { name: '言い換えのヒント' }).focus();
  await page.keyboard.press('Enter');
  if (await page.locator('#support-note').isVisible()) throw new Error('support toggle did not close by keyboard');

  // Select again to reach feedback before using its feedback-only handoff.
  await page.getByRole('button', { name: '気づかう' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '学習室で表現を練習' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '文法ミニ練習へ' }).focus();
  await page.keyboard.press('Enter');
  await page.locator('.training-grid').scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(captures, 'training-mobile-destinations.png'), fullPage: false });
  await page.getByRole('button', { name: 'この練習を選ぶ' }).focus();
  await page.keyboard.press('Enter');
  if (!(await page.locator('.training-selection').innerText()).includes('誘いかけ · 文法ミニ練習')) throw new Error('featured training selection did not update the facility preview');
  await page.getByRole('button', { name: '世界の場面へ戻る' }).focus();
  await page.keyboard.press('Enter');
  if (!(await page.locator('.conversation-meta').innerText()).includes('駅前')) throw new Error('training return did not preserve exact conversation context');
  if (pageErrors.length) throw new Error(`page errors: ${[...new Set(pageErrors)].join(' | ')}`);
  const manifest = { status: 'success', generatedBy: 'capture.mjs', viewports, screens, captures: screens.length * viewports.length, supplementalCaptures: ['conversation-mobile-actions.png', 'training-mobile-destinations.png'], pageErrors: [] };
  await writeFile(join(captures, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest));
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  await writeFile(join(captures, 'manifest.json'), `${JSON.stringify({ status: 'failed', generatedBy: 'capture.mjs', failures }, null, 2)}\n`);
  throw error;
} finally { await browser.close(); }
