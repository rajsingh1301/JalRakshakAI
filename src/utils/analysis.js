export const isMeasured = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function median(values) {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

export function filterRecords(records, { state = 'all', year = 'all', district = 'all' } = {}) {
  return records.filter(r => (state === 'all' || r.state === state) &&
    (year === 'all' || r.year === Number(year)) && (district === 'all' || r.district === district));
}

export function statistics(records, parameter) {
  const values = records.map(r => r[parameter.id]).filter(isMeasured);
  const elevated = values.filter(v => v > parameter.acceptable);
  return {
    valid: values.length, missing: records.length - values.length,
    exceedances: elevated.length,
    permissible_exceedances: values.filter(v => v > parameter.permissible).length,
    rate: values.length ? elevated.length / values.length * 100 : null,
    mean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    median: median(values), min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    coverage: records.length ? values.length / records.length * 100 : 0,
    median_excess_ratio: elevated.length ? median(elevated.map(v => v / parameter.acceptable)) : 0,
  };
}

export function rankDistricts(records, parameter) {
  const groups = new Map();
  for (const r of records) {
    const key = `${r.state}::${r.district}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return [...groups.values()].map(group => {
    const stats = statistics(group, parameter);
    const stations = new Set(group.filter(r => isMeasured(r[parameter.id])).map(r => r.station)).size;
    const eligible = stats.valid >= 10 && stations >= 5 && stats.coverage >= 50;
    const band = !eligible ? 'Insufficient evidence' : stats.rate >= 40 ? 'High' : stats.rate >= 15 ? 'Moderate' : 'Lower';
    const missingRules = [stats.valid < 10 && 'fewer than 10 measured events', stations < 5 && 'fewer than 5 measured stations', stats.coverage < 50 && 'less than 50% parameter coverage'].filter(Boolean);
    return { state: group[0].state, district: group[0].district, samples: group.length, stations,
      ...stats, eligible, band, explanation: eligible ? `${stats.exceedances} of ${stats.valid} measured events exceed ${parameter.acceptable} ${parameter.unit}; ${stations} stations represented. Prioritize confirmatory sampling based on this parameter.` : `Additional sampling needed: ${missingRules.join('; ')}. Observed measurements remain available.` };
  }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || (b.rate ?? -1) - (a.rate ?? -1) ||
    b.median_excess_ratio - a.median_excess_ratio || b.valid - a.valid || a.district.localeCompare(b.district) || a.state.localeCompare(b.state));
}

export function distribution(records, parameter) {
  const ranges = [{ name: '≤ 0.5×', low: 0, high: 0.5 }, { name: '0.5–1×', low: 0.5, high: 1 },
    { name: '1–2×', low: 1, high: 2 }, { name: '2–4×', low: 2, high: 4 }, { name: '> 4×', low: 4, high: Infinity }];
  const values = records.map(r => r[parameter.id]).filter(isMeasured).map(v => v / parameter.acceptable);
  return ranges.map((bin, i) => ({ name: bin.name, count: values.filter(v => (i === 0 ? v >= bin.low : v > bin.low) && v <= bin.high).length, elevated: i > 1 }));
}

export function yearlyStatistics(records, parameter) {
  return [...new Set(records.map(r => r.year))].sort().map(year => ({ year, ...statistics(records.filter(r => r.year === year), parameter) }));
}

export function verifyInsightBundle(bundle, datasetHash) {
  if (bundle?.status === 'verified_csv') return verifyCsvBundle(bundle, datasetHash);
  return bundle?.status === 'verified' && bundle.dataset_sha256 === datasetHash &&
    typeof bundle.dataset_id === 'string' && !!bundle.dataset_id.trim() &&
    Array.isArray(bundle.insights) && bundle.insights.length > 0 &&
    bundle.insights.every(i => i.verified === true && typeof i.question === 'string' && !!i.question.trim() &&
      typeof i.finding === 'string' && !!i.finding.trim() && typeof i.original_response === 'string' && !!i.original_response.trim() &&
      Array.isArray(i.supporting_values) && i.supporting_values.length > 0 &&
      typeof i.evidence_file === 'string' && !!i.evidence_file &&
      typeof i.coverage === 'string' && !!i.coverage.trim() && typeof i.explanation === 'string' && !!i.explanation.trim() &&
      Array.isArray(i.limitations) && i.limitations.length > 0 && typeof i.reviewed_at === 'string' && !!i.reviewed_at);
}

export function verifyCsvBundle(bundle, datasetHash) {
  if (bundle?.status !== 'verified_csv' || bundle.provider !== 'Avaloka' ||
      bundle.method !== 'manual_web' || bundle.origin !== 'user_provided_export' ||
      bundle.dataset_sha256 !== datasetHash || bundle.parameter !== 'arsenic' ||
      bundle.unit !== 'mg/L' || bundle.acceptable_limit !== 0.01 ||
      bundle.artifact_url !== '/data/resultjalrakshakAi.csv' ||
      !/^[a-f0-9]{64}$/.test(bundle.artifact_sha256 ?? '') ||
      !Array.isArray(bundle.districts) || !bundle.districts.length ||
      !Array.isArray(bundle.limitations) || !bundle.limitations.length ||
      !Array.isArray(bundle.exceedance_observations)) return false;
  const s = bundle.summary;
  if (!s || !Number.isInteger(s.measured_events) || !Number.isInteger(s.source_events) ||
      !Number.isInteger(s.exceedance_events) || s.source_events < s.measured_events ||
      s.districts !== bundle.districts.length || s.unmeasured_events !== s.source_events - s.measured_events ||
      s.measured_events !== bundle.districts.reduce((n, d) => n + d.sample_count, 0) ||
      s.exceedance_events !== bundle.districts.reduce((n, d) => n + d.exceedance_count, 0) ||
      s.exceedance_events !== bundle.exceedance_observations.length) return false;
  return bundle.districts.every(d => d.state === 'Haryana' && typeof d.district === 'string' &&
    Number.isInteger(d.sample_count) && d.sample_count > 0 && Number.isInteger(d.total_events) &&
    d.total_events >= d.sample_count && Number.isInteger(d.exceedance_count) &&
    d.exceedance_count >= 0 && d.exceedance_count <= d.sample_count &&
    Number.isFinite(d.mean_arsenic) && Number.isFinite(d.max_arsenic) &&
    Number.isFinite(d.exceedance_pct) &&
    Math.abs(d.exceedance_pct - 100 * d.exceedance_count / d.sample_count) < 1e-8);
}

export const number = (n, digits = 0) => n == null || !Number.isFinite(n) ? '—' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(n);
export const percent = (n) => n == null ? '—' : `${number(n, 1)}%`;
