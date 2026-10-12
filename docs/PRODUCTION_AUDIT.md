# Production audit · 12 October 2026

Production: https://jalrakshak-ai-opal.vercel.app/

The audit found and fixed one dashboard defect: **Analyzed parameters** displayed six even when the selected state/year had measurements for fewer tracked chemicals. For example, all states in 2019 have three measured tracked parameters. The card now counts parameters with at least one valid measurement within the current scope and explains that scope explicitly. All six remain available for inspecting missing coverage.

The fix and independent CSV regression tests were pushed in commit `cc581e291e7f94eee88bdf74cddc6a237916f19f`. Vercel rebuilt production successfully; deployment `dpl_Gnzwu2RjXJgGHyXo6WVJbMTzemr9` was READY and its commit metadata matched. [GitHub CI for the fix passed](https://github.com/rajsingh1301/JalRakshakAI/actions/runs/38250946741).

## Requested checks

| # | Check | Result | Evidence / limitation |
|---|---|---|---|
| 1 | Every page loads | PASS | All five hash routes load, navigate and survive refresh. |
| 2 | Navigation and filters | PASS | Navigation, all 18 state/year combinations, six parameters, district selection, observation search, elevation checkbox, reset, priority search, evidence dropdown/cards, both pagers, map toggles and CSV exports exercised. |
| 3 | Charts reflect authentic CSV | PASS | Six-parameter distribution counts, actual distribution SVG bar proportions, annual denominators/rates and district chart tables match independent CSV calculations. Station counts and elevated maximum-per-station selection also match CSV measurements. |
| 4 | Dashboard totals | PASS after fix | 3,415 events, 55 districts, six measured tracked parameters in the full scope. Every state/year scope matches the CSV, including the corrected parameter count. |
| 5 | Missing fluoride / nitrate | PASS | Both columns are blank in all 3,415 events; neither appears as zero contamination or as a measured selector option. Unmeasured arsenic in Rajasthan 2022 displays an undefined rate/median (—), with observations marked Not measured. |
| 6 | Arsenic calculations / references | PASS | 365 valid events, 3,050 missing, one event above 0.01 mg/L; rate is 1/365 × 100 = 0.2739726%, displayed 0.3%. Acceptable and permissible references are both 0.01 mg/L, no relaxation; strict greater-than comparison, missing values excluded. Official references below. |
| 7 | Real Avaloka insights with evidence / limitations | FAIL — incomplete | Served bundle remains status pending, dataset_id null, insights empty. Genuine outputs and their evidence are unavailable; their correctness and limitations cannot be tested. |
| 8 | Mobile layout | PASS in browser emulation | All five routes and state filter tested at widths 320, 375 and 768 pixels with no document overflow. Mobile menu navigation separately exercised at 375 pixels. |
| 9 | Console errors / broken assets | PASS in tested flows | No browser console errors or warnings, uncaught exceptions, unexpected failed requests or first-party HTTP errors on the five normal routes. First-party downloads and favicon return 200. Recent Vercel error scan returned No logs found. |
| 10 | No placeholders or fabricated analysis remains | FAIL — pending section remains | No fabricated results, dummy measurement rows or fake Avaloka findings were found. However, the incomplete Avaloka section still displays its honest pending workflow; the strict requirement of no remaining placeholder analysis section is unmet. |

Checks 7 and 10 cannot be completed by inventing findings. The remaining input is genuine Avaloka output, its dataset/project identity and original evidence, followed by review against this exact CSV.

## Scientific reference and provenance checks

- [Government of India, Ministry of Jal Shakti / PIB, 21 July 2022, Annex I](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1843385&lang=2&reg=48) reproduces the BIS IS 10500:2012 extract: total arsenic 0.01 mg/L with no relaxation.
- [WHO arsenic fact sheet](https://www.who.int/news-room/fact-sheets/detail/arsenic) corroborates the provisional guideline of 10 μg/L, equivalent to 0.01 mg/L. A threshold comparison does not certify water safety or predict health effects.
- Downloaded production CSV SHA-256 matches the processed file: `75df9c6e0dd86588388d2a7b1e78e932ad6b868d6f470a77c21c3d0b9af43227`.
- Every served event's identity and all six tracked concentrations match the independent CSV oracle. Python integrity checks separately compare every selected tracked concentration with its preserved original government source row.
- Missing values are excluded from denominators. Published zeros are preserved as source observations; the source does not supply laboratory detection limits. Arsenic coverage is only about 10.7%, so its observed exceedance rate does not describe every sampled event or population exposure.

## Reproduce the audit

```sh
npm test
.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
npm run build
E2E_BASE_URL=https://jalrakshak-ai-opal.vercel.app npm run test:e2e
```

Browser suite: 18 tests (10 existing workflow checks and 8 additional production-audit checks). The independent oracle is `tests/csv_audit_oracle.py`, using Python's standard-library CSV reader and documented reference limits, without importing application calculation code. JavaScript calculation suite: seven passing tests. Python provenance suite: five passing tests.

The sandbox initially prevented Chrome launching. Re-running with authorized browser access succeeded; this was an execution-environment restriction, not a website failure. An additional export assertion initially used the abbreviated label Hardness; it was corrected to the actual CSV label Total hardness and passed without an application change.

## Not tested

- Genuine Avaloka execution, authenticated workspace, output artifacts and evidence review: outputs have not been supplied. No API-token request or API integration claim was added.
- Physical Android/iOS devices, Safari, Firefox, screen readers and laboratory remeasurement.
- Exhaustive combinations of every district, year, parameter and search string, or continuous availability outside the audit window.
- External services' authenticated user workflows. The official threshold sources were independently opened and inspected; this audit does not certify every external service's availability.
- Vercel log drains and long-term monitoring configuration. No recent error logs were returned, which is a limited observation rather than proof of continuous error-free operation.

