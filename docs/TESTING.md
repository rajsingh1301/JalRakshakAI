# Executed validation

Baseline deployment checks were executed on **12 October 2026**. The supplied Avaloka CSV and updated local application were checked on **13 October 2026**. Only successful, actually executed checks are listed as passed.

## Production

Public URL: **https://jalrakshak-ai-opal.vercel.app**.

- Vercel production deployment returned **READY**.
- Plain unauthenticated HTTPS requests to `/` and `/data/dashboard.json`: **HTTP 200**.
- Public processed JSON matches the local CSV SHA-256 and every summary value.
- The original **10 Chrome end-to-end tests passed against the 12 October production alias** (16.9 seconds). The expanded 18-test audit also passed against that earlier revision; see [PRODUCTION_AUDIT.md](PRODUCTION_AUDIT.md).
- With the new Avaloka CSV integration, **all 18 browser tests passed locally** (40.5 seconds). The Insights page additionally passed a targeted screenshot check.
- On 13 October, GitHub-linked Vercel deployment of commit `c7933523dc48d4b0810a2434e003a4ae2918ee1b` reached **READY** (Vite build phase 13.2 seconds). The public alias served the exact export SHA-256 and the reviewed `verified_csv` bundle. **All 18 browser tests passed against the updated public URL** (36.4 seconds), including download, source counts, all five routes, filters, charts and mobile viewports.
- [GitHub CI for the Avaloka CSV integration](https://github.com/rajsingh1301/JalRakshakAI/actions/runs/38348310280) passed data reproduction, source/export verification, JavaScript/Python tests, build and Linux browser workflows.
- Recent `vercel logs --level error --since 1h` scan returned no logs. The direct CLI deploy reported `Not authorized`, but the connected GitHub deployment completed successfully and was verified on the public alias.
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
6. Avaloka Insights displays the source-checked district arsenic export, 21 district rows and the exact downloadable CSV; it labels the manual web origin and its provenance limits.
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
- Only source-matched reviewed CSV figures or complete original-response bundles can display as verified; malformed and mismatched bundles are rejected.

## Source integrity tests: 6 passed

```sh
.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
```

- Both original CSV row counts and SHA-256 checksums match recorded provenance.
- **Every tracked concentration in every cleaned event matches its preserved original source row**, including missing values.
- Geographic/period counts and genuinely empty chemical fields are checked.
- Each contaminant’s valid denominator, acceptable and permissible exceedance counts are recalculated directly from the prepared CSV.
- Altered district counts or exceedances in the supplied Avaloka CSV are rejected. Incorrect-dataset chatbot imports are rejected.

## Build and reproducibility

```sh
.venv/bin/python scripts/prepare_dataset.py
.venv/bin/python scripts/process_data.py
.venv/bin/python scripts/verify_avaloka_csv.py
npm run build
```

Data preparation and processing executed successfully. Vite production builds passed locally and on Vercel. Chart dependencies are split into a separate production bundle. `npm install` initially reported zero dependency vulnerabilities.

`.github/workflows/ci.yml` reproduces the dataset, checks originals, runs calculation tests, builds and runs browser tests on pushes and pull requests. Its remote run status must be checked independently; creating the workflow is not itself evidence that GitHub CI passed.

Verified remote runs: [initial workflow run](https://github.com/rajsingh1301/JalRakshakAI/actions/runs/38245497165) and [subsequent validation](https://github.com/rajsingh1301/JalRakshakAI/actions/runs/38245965437) both completed with **success**. Future commits generate their own runs and must be checked separately.

Security verification inspected the tracked file list and compared local credential values in memory against all tracked files and production assets. **Passed:** no local credentials were present, and only `.env.example` was tracked. No credential values were printed.

## Known limits

- District arsenic CSV arithmetic and source traceability have been verified; the file's Avaloka service origin cannot be independently authenticated without a project ID, original response or screenshot.
- Other planned Avaloka conversational analyses have no supplied original responses and cannot be tested.
- The station map is a coordinate plot with maximum observations, not an administrative-boundary GIS product.
- Coverage gates are project rules and do not certify statistical representativeness or drinking-water safety.
