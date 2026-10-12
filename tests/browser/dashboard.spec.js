import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { statistics, rankDistricts } from '../../src/utils/analysis.js';
const data = JSON.parse(fs.readFileSync(new URL('../../public/data/dashboard.json', import.meta.url)));

async function ready(page, hash = '') {
  await page.goto(`/${hash}`);
  await expect(page.locator('.scope-bar')).toBeVisible();
}

test('overview renders real metrics and charts without browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ready(page);
  await expect(page.getByRole('heading', { name: 'Every sample tells a story.' })).toBeVisible();
  await expect(page.locator('.metric-value').nth(0)).toHaveText('3,415');
  await expect(page.locator('.metric-value').nth(1)).toHaveText('55');
  await expect(page.locator('.metric-value').nth(2)).toHaveText('6');
  await expect(page.locator('.metric-value').nth(3)).toHaveText('40.3%');
  await expect(page.locator('.station-map svg circle')).not.toHaveCount(0);
  await expect(page.locator('.recharts-wrapper')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/overview-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('global state/year filters and chemical selectors update real metrics', async ({ page }) => {
  await ready(page);
  await page.getByRole('combobox', { name: 'State', exact: true }).selectOption('Haryana');
  await expect(page.locator('.metric-value').nth(0)).toHaveText('1,313');
  await page.getByRole('combobox', { name: 'Sampling year' }).selectOption('2022');
  await expect(page.locator('.metric-value').nth(0)).toHaveText('407');
  await page.getByRole('button', { name: 'As Arsenic', exact: true }).click();
  const p = data.parameters.find(p => p.id === 'arsenic');
  const expected = statistics(data.records.filter(r => r.state === 'Haryana' && r.year === 2022), p);
  await expect(page.locator('.metric-value').nth(3)).toHaveText(`${expected.rate.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`);
  await page.getByRole('button', { name: 'Reset scope filters' }).click();
  await expect(page.locator('.metric-value').nth(0)).toHaveText('3,415');
});

test('explorer district/chemical filters, source search, pagination and clear work', async ({ page }) => {
  await ready(page, '#explorer');
  await page.getByRole('combobox', { name: 'District', exact: true }).selectOption('Haryana::Panchkula');
  await page.getByRole('combobox', { name: 'Chemical parameter' }).selectOption('iron');
  const p = data.parameters.find(p => p.id === 'iron');
  const expected = statistics(data.records.filter(r => r.state === 'Haryana' && r.district === 'Panchkula'), p);
  await expect(page.locator('.metric-value').first()).toHaveText(String(expected.valid));
  await page.getByRole('textbox', { name: 'Search observations' }).fill('no-station-matches-this');
  await expect(page.getByRole('heading', { name: 'No observations match' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(page.getByRole('combobox', { name: 'Chemical parameter' })).toHaveValue('chloride');
  await expect(page.locator('.metric-value').first()).toHaveText('3,413');
  const firstID = await page.locator('.observation-table tbody tr').first().textContent();
  await page.getByRole('button', { name: 'Next observations' }).click();
  expect(await page.locator('.observation-table tbody tr').first().textContent()).not.toEqual(firstID);
  await page.getByRole('checkbox', { name: 'Above acceptable only' }).check();
  await expect(page.locator('.observation-table tbody .badge-teal')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/explorer-desktop.png', fullPage: true });
});

test('explorer download contains selected real source records', async ({ page }) => {
  await ready(page, '#explorer');
  await page.getByRole('combobox', { name: 'District', exact: true }).selectOption('Haryana::Panchkula');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export selection' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('jalrakshak-chloride-selection.csv');
  const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv).toContain('"Chloride (mg/L)"');
  expect(csv).toContain('"Panchkula"');
  expect(csv).not.toContain('"Rajasthan"');
});

test('district priorities explain real ranks and preserve evidence gating', async ({ page }) => {
  await ready(page, '#priorities');
  const p = data.parameters.find(p => p.id === 'chloride');
  const expected = rankDistricts(data.records, p)[0];
  await expect(page.locator('.priority-table tbody tr').first()).toContainText(expected.district);
  await page.getByRole('button', { name: `Explain priority for ${expected.district}` }).click();
  await expect(page.getByRole('heading', { name: `Evidence behind ${expected.district}` })).toBeVisible();
  await expect(page.locator('.explanation-cell')).toContainText(`${expected.exceedances} of ${expected.valid}`);
  await page.getByRole('button', { name: 'As Arsenic', exact: true }).click();
  const arsenicRanks = rankDistricts(data.records, data.parameters.find(p => p.id === 'arsenic'));
  await expect(page.locator('.band-card').last().locator('strong')).toContainText(String(arsenicRanks.filter(d => !d.eligible).length));
  await page.getByRole('combobox', { name: 'Evidence band' }).selectOption('Insufficient evidence');
  await expect(page.locator('.rank-number').first()).toHaveText('—');
});

test('Avaloka page shows honest pending state and valid dataset download', async ({ page }) => {
  await ready(page, '#insights');
  await expect(page.locator('.pending-analysis')).toContainText('Analysis pending');
  await expect(page.locator('.pending-analysis')).toContainText('No AI findings have been completed or verified yet');
  await expect(page.locator('.insight-grid')).toHaveCount(0);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Get the upload-ready CSV' }).click();
  const download = await downloadPromise;
  const csv = fs.readFileSync(await download.path(), 'utf8');
  expect(csv.split('\n').filter(Boolean)).toHaveLength(3416);
});

test('all five routes navigate and remain available after refresh', async ({ page }) => {
  await ready(page);
  for (const [name, hash] of [['Contamination explorer', 'explorer'], ['District priorities', 'priorities'], ['Avaloka AI insights', 'insights'], ['Methodology & about', 'methodology'], ['Overview', 'overview']]) {
    await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    await page.reload();
    await expect(page.locator('.scope-bar')).toBeVisible();
    await expect(page.getByRole('navigation').getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
  }
});

test('methodology lists actual sources, reference values and quality audit', async ({ page }) => {
  await ready(page, '#methodology');
  await expect(page.getByRole('link', { name: 'Official dataset catalog' })).toHaveAttribute('href', data.provenance.portal);
  await expect(page.locator('.dataset-hash')).toContainText(data.provenance.csv_sha256);
  await page.getByText('Inspect missingness for every source field', { exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Nitrate N (mgN/L)', exact: true })).toBeVisible();
});

test('mobile navigation, charts and tables fit a 375px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await ready(page);
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  for (const [name, hash] of [['Contamination explorer', 'explorer'], ['District priorities', 'priorities'], ['Avaloka AI insights', 'insights'], ['Methodology & about', 'methodology'], ['Overview', 'overview']]) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
    await expect(page.locator('.sidebar')).not.toHaveClass(/is-open/);
    const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(width.scroll, `${hash} horizontal overflow`).toBeLessThanOrEqual(width.viewport);
  }
  await page.screenshot({ path: 'test-results/overview-mobile.png', fullPage: true });
});

test('unavailable data produces a visible error and retry action', async ({ page }) => {
  await page.route('**/data/dashboard.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dataset unavailable' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload dataset' })).toBeVisible();
});
