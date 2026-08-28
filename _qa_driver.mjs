import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:5173';
const OUT = 'C:/Users/nihar/AppData/Local/Temp/claude/c--Users-nihar-Downloads-EducationAI-office/1c2e7a69-3e6e-492f-ad6b-77f74a835acb/scratchpad/shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('shot:', name);
}

async function loginAs(email, password) {
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  console.log('login page url:', page.url());
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.waitFor({ timeout: 15000 });
  await emailInput.fill(email);
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

const CREDS = {
  super: ['admin@eduai.local', 'ChangeMe-Now-1'],
  school: ['e2e-admin@eduai.local', 'Admin-Demo-2026'],
  teacher: ['mr.rao.5d2a15@sps.delhi.01.eduai.local', 'Teacher-Demo-2026'],
  student: ['dev.kumar.c43f1a@sps.delhi.01.eduai.local', '2uBUAVW3'],
};

const args = process.argv.slice(2);
const cmd = args[0];

try {
  if (cmd === 'goto') {
    const role = args[1];
    const path = args[2];
    const name = args[3] || (role + '_' + path).replace(/\W+/g, '_');
    await loginAs(...CREDS[role]);
    if (path && path !== '/') {
      await page.goto(BASE + '/#' + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
    }
    await shot(name);
    console.log('FINAL_URL:', page.url());
  }
  console.log('CONSOLE_ERRORS:', JSON.stringify(errors.slice(0, 20)));
} catch (err) {
  console.error('DRIVER_ERROR:', err.message);
  try { await shot('error-state-' + Date.now()); } catch {}
} finally {
  await browser.close();
}
