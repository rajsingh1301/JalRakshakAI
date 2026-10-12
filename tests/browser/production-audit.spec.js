import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const oracle = JSON.parse(execFileSync('python3', ['tests/csv_audit_oracle.py'], { maxBuffer: 4 * 1024 * 1024 }));
const fmt = (v, digits = 0) => v == null ? '—' : v.toLocaleString('en-IN', { maximumFractionDigits: digits });
const rate = v => v == null ? '—' : `${fmt(v, 1)}%`;
async function ready(page, route = 'overview') {
  await page.goto(`/#${route}`);
  await expect(page.locator('.scope-bar')).toBeVisible();
}

test('production CSV hash and every served measurement match the authentic CSV', async ({ request }) => {
  const csv = await request.get('/data/avaloka-ready.csv');
  expect(csv.status()).toBe(200);
  expect(createHash('sha256').update(await csv.body()).digest('hex')).toBe(oracle.sha256);
  const response = await request.get('/data/dashboard.json');
  expect(response.status()).toBe(200);
  const served = await response.json();
  expect(served.provenance.csv_sha256).toBe(oracle.sha256);
  expect(served.records).toHaveLength(oracle.rows.length);
  const parameters = Object.keys(oracle.scopes['all:all'].metrics);
  const records = served.records.map(record => ({
    id: record.id, state: record.state, district: record.district, station: record.station,
    values: Object.fromEntries(parameters.map(p => [p, record[p]])),
  })).sort((a, b) => a.id.localeCompare(b.id));
  expect(records).toEqual([...oracle.rows].sort((a, b) => a.id.localeCompare(b.id)));
});

test('every state/year scope has authentic dashboard totals and measured parameter counts', async ({ page }) => {
  await ready(page);
  for (const [key, expected] of Object.entries(oracle.scopes)) {
    const [state, year] = key.split(':');
    await page.getByRole('combobox', { name: 'State', exact: true }).selectOption(state);
    await page.getByRole('combobox', { name: 'Sampling year' }).selectOption(year);
    await expect(page.locator('.metric-value').nth(0), key).toHaveText(fmt(expected.samples));
    await expect(page.locator('.metric-value').nth(1), key).toHaveText(String(expected.districts));
    await expect(page.locator('.metric-value').nth(2), key).toHaveText(String(expected.measured_parameters));
    await expect(page.locator('.metric-value').nth(3), key).toHaveText(rate(expected.metrics.chloride.rate));
  }
});

test('all six parameter metrics, distribution bars and annual charts agree with CSV', async ({ page }) => {
  await ready(page, 'explorer');
  for (const [parameter, expected] of Object.entries(oracle.scopes['all:all'].metrics)) {
    await page.getByRole('combobox', { name: 'Chemical parameter' }).selectOption(parameter);
    const metrics = page.locator('.metric-value');
    await expect(metrics.nth(0)).toHaveText(fmt(expected.valid));
    await expect(metrics.nth(1)).toHaveText(rate(expected.rate));
    await expect(metrics.nth(2)).toHaveText(fmt(expected.median, 4));
    await expect(metrics.nth(3)).toHaveText(fmt(expected.max, 4));
    const distribution = page.locator('.card').filter({ has: page.getByRole('heading', { name: 'Concentration distribution', exact: true }) });
    await distribution.getByText('View chart values', { exact: true }).click();
    for (let i = 0; i < 5; i++) await expect(distribution.locator('tbody tr').nth(i).locator('td').last()).toHaveText(fmt(expected.bins[i]));
    // Check actual SVG bar geometry, as well as the accessible table values.
    await expect.poll(async () => {
      const heights = await distribution.locator('.recharts-bar-rectangle path').evaluateAll(paths => paths.map(p => p.getBBox().height));
      const counts = expected.bins.filter(v => v > 0);
      if (heights.length !== counts.length) return false;
      const scale = Math.max(...heights) / Math.max(...counts);
      return counts.every((v, i) => Math.abs(heights[i] - v * scale) < .5);
    }, { message: `${parameter}: SVG bar heights must match actual CSV bin counts` }).toBe(true);
    const annual = page.locator('.card').filter({ has: page.getByRole('heading', { name: 'Observed burden by sampling year', exact: true }) });
    await annual.getByText('View annual denominators', { exact: true }).click();
    for (let i = 0; i < 5; i++) {
      const value = oracle.scopes[`all:${2019 + i}`].metrics[parameter];
      await expect(annual.locator('tbody tr').nth(i).locator('td').nth(1)).toHaveText(`${value.exceedances} / ${value.valid}`);
      await expect(annual.locator('tbody tr').nth(i).locator('td').nth(2)).toHaveText(rate(value.rate));
    }
    await distribution.getByText('View chart values', { exact: true }).click();
    await annual.getByText('View annual denominators', { exact: true }).click();
    const districts = page.locator('.card').filter({ has: page.getByRole('heading', { name: 'District comparison', exact: true }) });
    await districts.getByText('View chart values', { exact: true }).click();
    const actual = await districts.locator('tbody tr').evaluateAll(rows => rows.map(row => [...row.cells].map(c => c.textContent)));
    for (const cells of actual) {
      const district = oracle.districts[parameter][cells[0]];
      expect(district).toBeDefined();
      expect(cells[1]).toBe(`${district.exceedances} / ${district.valid}`);
      expect(cells[2]).toBe(rate(district.rate));
    }
    await districts.getByText('View chart values', { exact: true }).click();
  }
});

test('missing chemicals and an unmeasured arsenic scope never imply zero contamination', async ({ page, request }) => {
  const data = await (await request.get('/data/dashboard.json')).json();
  expect(oracle.missing).toEqual({ 'Fluoride (mg/L)': 3415, 'Nitrate N (mgN/L)': 3415 });
  expect(data.parameters.map(p => p.id)).not.toContain('fluoride');
  expect(data.parameters.map(p => p.id)).not.toContain('nitrate');
  const arsenic = data.parameters.find(p => p.id === 'arsenic');
  expect(arsenic.acceptable).toBe(.01);
  expect(arsenic.permissible).toBe(.01);
  expect(arsenic.unit).toBe('mg/L');
  expect(data.statistics.arsenic.valid).toBe(365);
  expect(data.statistics.arsenic.exceedances).toBe(1);
  await ready(page, 'explorer');
  await page.getByRole('combobox', { name: 'State', exact: true }).selectOption('Rajasthan');
  await page.getByRole('combobox', { name: 'Sampling year' }).selectOption('2022');
  await page.getByRole('combobox', { name: 'Chemical parameter' }).selectOption('arsenic');
  await expect(page.locator('.metric-value').nth(0)).toHaveText('0');
  await expect(page.locator('.metric-value').nth(1)).toHaveText('—');
  await expect(page.locator('.metric-value').nth(2)).toHaveText('—');
  await expect(page.locator('.observation-table .badge-gray')).toHaveCount(2);
});

test('all routes have no console errors, uncaught exceptions or broken first-party assets', async ({ page, request }) => {
  const errors = [], links = new Set();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  page.on('requestfailed', r => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`request: ${r.url()} ${r.failure()?.errorText}`); });
  page.on('response', r => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(page.url()).origin) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  for (const route of ['overview', 'explorer', 'priorities', 'insights', 'methodology']) {
    await ready(page, route);
    const hrefs = await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href')));
    hrefs.filter(h => h.startsWith('/') && !h.startsWith('//')).forEach(h => links.add(h));
    expect(await page.locator('img').evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
  }
  for (const href of [...links, '/favicon.svg']) expect((await request.get(href)).status(), href).toBe(200);
  expect(errors).toEqual([]);
});

test('320, 375 and 768 pixel layouts allow every route and filter without overflow', async ({ page }) => {
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 812 });
    for (const route of ['overview', 'explorer', 'priorities', 'insights', 'methodology']) {
      await ready(page, route);
      await page.getByRole('combobox', { name: 'State', exact: true }).selectOption('Haryana');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px ${route}`).toBe(true);
    }
    await page.screenshot({ path: `test-results/audit-mobile-${width}.png`, fullPage: true });
  }
});

test('Avaloka output remains explicitly pending without fabricated insight cards', async ({ page, request }) => {
  const ai = await (await request.get('/data/avaloka-insights.json')).json();
  expect(ai.status).toBe('pending');
  expect(ai.insights).toEqual([]);
  expect(ai.dataset_id).toBeNull();
  await ready(page, 'insights');
  await expect(page.locator('.pending-analysis')).toContainText('No AI findings have been completed or verified yet');
  await expect(page.locator('.insight-grid')).toHaveCount(0);
});
