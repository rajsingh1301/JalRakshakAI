# Executed validation

Executed on **12 October 2026**, using the India client date. Only successful, actually executed checks are listed as passed.

## Production

Public URL: **https://jalrakshak-ai-opal.vercel.app**.

- Vercel production deployment returned **READY**.
- Plain unauthenticated HTTPS requests to `/` and `/data/dashboard.json`: **HTTP 200**.
- Public processed JSON matches the local CSV SHA-256 and every summary value.
- All **10 Chrome end-to-end tests passed against the deployed production alias** (16.9 seconds).
- The same **10 tests passed locally** (19.2 seconds).
- Full-page desktop and mobile screenshots generated and visually inspected. They are local QA artifacts under the ignored `test-results/` directory; overview examples are preserved in `docs/screenshots/`.

Production browser command:

```sh
E2E_BASE_URL=https://jalrakshak-ai-opal.vercel.app npm run test:e2e
```

## Functional browser coverage

1. Real overview metrics, station marks and charts render without uncaught browser errors.
2. State/year filters and selected parameter update metrics to values calculated from the actual records.
3. District and chemical selectors, observation search, pagination, elevated-only view and clear/reset work.
4. Filtered CSV download contains the real selected district records and correct chemical units.
5. District ordering and expanded explanations match calculations; insufficient evidence produces no numeric rank.
6. Avaloka shows an honest pending state; upload CSV download contains the actual 3,415 events.
7. All five navigation destinations and refreshes work.
8. Methodology source links, dataset hash and source-field missingness are present.
9. All five pages fit a 375px mobile viewport; navigation opens/closes and document width does not overflow.
10. Failed dataset loading produces an explicit error and reload action.

Browser environment: installed Google Chrome on macOS, Playwright, headless. Automated mobile verification uses viewport emulation, not a physical device. Additional browsers and screen-reader software were not tested.

## Calculation tests: 7 passed

```sh
npm test
```

- Every JavaScript overall statistic matches independently computed Python output within floating-point tolerance.
- State, district, year and intersection filtering yields exact source counts.
- Nulls, undefined, NaN and negatives do not enter valid denominators; zero is retained; equality does not count as exceedance.
- Per-parameter district counts, station coverage and evidence gates agree with Python.
- One extreme sparse measurement cannot create a confident priority.
- Distribution bins partition all valid concentrations exactly once.
- Pending/malformed/mismatched AI bundles cannot display verified findings.

## Source integrity tests: 5 passed

```sh
.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
```

- Both original CSV row counts and SHA-256 checksums match recorded provenance.
- **Every tracked concentration in every cleaned event matches its preserved original source row**, including missing values.
- Geographic/period counts and genuinely empty chemical fields are checked.
- Each contaminant’s valid denominator, acceptable and permissible exceedance counts are recalculated directly from the prepared CSV.
- Pending and incorrect-dataset Avaloka imports are rejected.

## Build and reproducibility

```sh
.venv/bin/python scripts/prepare_dataset.py
.venv/bin/python scripts/process_data.py
npm run build
```

Data preparation and processing executed successfully. Vite production builds passed locally and on Vercel. Chart dependencies are split into a separate production bundle. `npm install` initially reported zero dependency vulnerabilities.

`.github/workflows/ci.yml` reproduces the dataset, checks originals, runs calculation tests, builds and runs browser tests on pushes and pull requests. Its remote run status must be checked independently; creating the workflow is not itself evidence that GitHub CI passed.

## Known limits

- Genuine Avaloka dataset upload/analysis cannot be verified until original web outputs are supplied.
- Positive insight-import behavior will be checked with actual results; the pending/rejection boundary is tested now.
- The station map is a coordinate plot with maximum observations, not an administrative-boundary GIS product.
- Coverage gates are project rules and do not certify statistical representativeness or drinking-water safety.
