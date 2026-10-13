import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { filterRecords, statistics, rankDistricts, distribution, verifyInsightBundle, verifyCsvBundle } from '../src/utils/analysis.js';

const data = JSON.parse(fs.readFileSync(new URL('../public/data/dashboard.json', import.meta.url)));
const chloride = data.parameters.find(p => p.id === 'chloride');

test('all browser statistics agree with independently generated Python outputs', () => {
  for (const p of data.parameters) {
    const calculated = statistics(data.records, p);
    for (const [key, value] of Object.entries(data.statistics[p.id])) {
      if (typeof value === 'number') assert.ok(Math.abs(calculated[key] - value) < 1e-8, `${p.id}: ${key}`);
      else assert.equal(calculated[key], value);
    }
  }
});

test('state, district, year and intersection filters return exact source rows', () => {
  assert.equal(filterRecords(data.records, { state: 'Haryana' }).length, 1313);
  assert.equal(filterRecords(data.records, { state: 'Rajasthan' }).length, 2102);
  assert.equal(filterRecords(data.records, { year: '2022' }).length, 409);
  const selected = filterRecords(data.records, { state: 'Haryana', year: '2022', district: 'Panchkula' });
  assert.ok(selected.length > 0);
  assert.ok(selected.every(r => r.state === 'Haryana' && r.year === 2022 && r.district === 'Panchkula'));
  assert.equal(filterRecords(data.records, { state: 'Rajasthan', district: 'Panchkula' }).length, 0);
});

test('missing values and threshold equality are never counted as exceedances', () => {
  const records = [null, undefined, -5, NaN, 0, 250, 251].map(value => ({ chloride: value }));
  const stats = statistics(records, chloride);
  assert.equal(stats.valid, 3);
  assert.equal(stats.exceedances, 1);
  assert.equal(stats.missing, 4);
  assert.ok(Math.abs(stats.rate - 100 / 3) < 1e-10);
  assert.equal(statistics([], chloride).rate, null);
});

test('district priority evidence gates and calculations agree with Python', () => {
  for (const p of data.parameters) {
    const ranked = rankDistricts(data.records, p);
    for (const d of ranked) {
      const original = data.district_metrics.find(x => x.state === d.state && x.district === d.district).parameters[p.id];
      assert.equal(d.band, original.band);
      assert.equal(d.eligible, original.eligible);
      assert.equal(d.stations, original.stations);
      assert.equal(d.valid, original.valid);
      assert.equal(d.exceedances, original.exceedances);
    }
    const firstInsufficient = ranked.findIndex(d => !d.eligible);
    if (firstInsufficient >= 0) assert.ok(ranked.slice(firstInsufficient).every(d => !d.eligible));
  }
});

test('one extreme measurement cannot create a confident priority', () => {
  const sparse = rankDistricts([{ state: 'X', district: 'Y', station: 'S', chloride: 100000 }], chloride)[0];
  assert.equal(sparse.band, 'Insufficient evidence');
  assert.equal(sparse.rate, 100);
  assert.equal(sparse.eligible, false);
});

test('distribution bins partition every valid value exactly once', () => {
  for (const p of data.parameters) assert.equal(distribution(data.records, p).reduce((a, b) => a + b.count, 0), data.statistics[p.id].valid);
});

test('only source-matched reviewed CSV or complete original responses can render as verified', () => {
  const reviewed = JSON.parse(fs.readFileSync(new URL('../public/data/avaloka-insights.json', import.meta.url)));
  assert.equal(verifyCsvBundle(reviewed, data.provenance.csv_sha256), true);
  assert.equal(verifyInsightBundle(reviewed, data.provenance.csv_sha256), true);
  assert.equal(verifyCsvBundle({ ...reviewed, dataset_sha256: 'wrong' }, data.provenance.csv_sha256), false);
  assert.equal(verifyCsvBundle({ ...reviewed, summary: { ...reviewed.summary, exceedance_events: 3 } }, data.provenance.csv_sha256), false);
  assert.equal(verifyInsightBundle({ status: 'pending', dataset_sha256: data.provenance.csv_sha256 }, data.provenance.csv_sha256), false);
  assert.equal(verifyInsightBundle({ status: 'verified', dataset_sha256: data.provenance.csv_sha256, insights: [{ finding: 'invented' }] }, data.provenance.csv_sha256), false);
  assert.equal(verifyInsightBundle(null, data.provenance.csv_sha256), false);
});
