# Avaloka analysis evidence

## Verified status

**One manual analysis CSV export is present and its numerical findings are verified against the original dataset.** The project owner supplied `data/processed/resultjalrakshakAi.csv` as an Avaloka web export on 13 October 2026. Its exact bytes are preserved and served on the AI Insights page.

The user requested manual analysis instead of API integration. No token is requested or required. The exported file contains a 21-district arsenic summary, but no Avaloka project/dataset ID, original chatbot response, prompt or timestamp. Its platform origin is therefore user-reported. The other planned analyses are not evidenced by this file.

Avaloka's [official documentation](https://avaloka.ai/documentation) and [guides](https://avaloka.ai/guides) were inspected. Its documented unauthenticated `/health` endpoint returned HTTP 200 on 12 October 2026. This verifies reachability only; no authenticated API operation was completed or claimed.

## Verified numerical export

- Export: `data/processed/resultjalrakshakAi.csv`, 907 bytes, SHA-256 `711040f4a91722bfdd42d454c3671328ad0e8ed954c5effa135a960f1beb544f`.
- Input: `data/processed/avaloka-ready.csv`, 3,415 events, SHA-256 `75df9c6e0dd86588388d2a7b1e78e932ad6b868d6f470a77c21c3d0b9af43227`.
- All 21 exported districts are Haryana districts with at least one valid arsenic result. Each district's `sample_count`, `mean_arsenic`, `max_arsenic`, `exceedance_count` and `exceedance_pct` match independent recomputation from the input events.
- The district counts sum to 365 measured events, leaving 3,050 events without usable arsenic results. All 2,102 Rajasthan events have no arsenic result in this subset.
- Sirsa has the only measured exceedance: 1 of 31 valid arsenic results, 3.2258%, maximum 0.14 mg/L. It is original sample `CGWB-01050`, Dabwali station, 13 June 2022, source row 1576 of `cgwb-haryana-1961-2025.csv`. The applicable acceptable reference is 0.01 mg/L, strict greater-than; values equal to the reference do not count.
- Sirsa has 114 selected events in total, so only 31 have valid arsenic measurements. The observed rate is not an estimate of district population exposure or current water safety.
- The export's `priority_score` is intentionally **not shown or used**: no method, inputs, meaning or uncertainty for that score were supplied.
- The site labels the file **user-provided Avaloka manual web export**. Arithmetic and source traceability are verified; authenticated service origin and conversational claims cannot be verified from this CSV alone.

Re-run `.venv/bin/python scripts/verify_avaloka_csv.py` to validate the export, reject altered numeric results and generate the public evidence bundle. This does not call an Avaloka API.

## Prepared dataset

- `data/processed/avaloka-ready.csv`: 902,954 bytes, 3,415 actual CGWB events, 55 districts, Haryana and Rajasthan, 2019–2023.
- Dataset SHA-256: `75df9c6e0dd86588388d2a7b1e78e932ad6b868d6f470a77c21c3d0b9af43227`.
- Exact questions: [AVALOKA_PROMPTS.md](AVALOKA_PROMPTS.md).
- Production insight status: `data/avaloka-insights.json` and `public/data/avaloka-insights.json`.

## Future conversational evidence

1. Open the existing project in https://app.avaloka.ai and record its actual URL or visible identifier, if available.
2. Preserve the original prompt/chat response or a screenshot showing the export in its project. This is useful to corroborate service origin; it is not necessary to validate the CSV's arithmetic.
3. Ask the remaining dataset-specific questions in `docs/AVALOKA_PROMPTS.md` only if they have not yet been run.
4. Preserve each exact question and full, unedited original response. Download generated code, tables/charts or output artifacts when available.
5. Record the actual project URL, dataset ID or visible identifier, conversation/analysis IDs if available, and completion timestamps. Do not invent IDs when the UI does not expose them.
6. Save text exports as `.txt` or `.md` under `data/avaloka-evidence/`, preserving originals. Do not include account credentials or private account information in public evidence.
7. Independently compare reported numbers and denominators with the source CSV and `data/processed/dashboard.json`. Record limitations and any discrepancies.
8. Prepare the reviewed JSON import and import it only after findings are supported by actual responses and actual measurements.

## Import format

For **additional chatbot findings**, copy `data/avaloka-import-template.json` to a new local JSON file and fill it with actual results. It deliberately contains **no example findings or invented numbers**. The existing verified CSV uses `scripts/verify_avaloka_csv.py` and does not invent an `original_response`.

Set the top-level `status` to `verified` only after review, preserve `provider: Avaloka` and `method: manual_web`, and use the exact prepared CSV hash. Supply the genuine dataset identifier and HTTPS project URL under `app.avaloka.ai`.

Each insight needs an ID, question, verbatim `original_response`, reviewed `finding`, `explanation`, geographic/temporal `coverage`, at least one numerical supporting value, limitations, evidence path, ISO review timestamp and `verified: true`.

Every `supporting_values` entry must have `label`, numerical `value` and `unit` (for example the actual unit may be `mg/L`, `events` or `%`). Values must come from the real response/source records; field names do not verify the factual claim automatically.

`evidence_file` must point to the original text export under `data/avaloka-evidence/`. The importer requires the verbatim response to appear in that file and calculates its SHA-256.

```sh
.venv/bin/python scripts/import_avaloka.py /path/to/reviewed-results.json
.venv/bin/python scripts/process_data.py
npm test
npm run build
```

The importer validates all entries before writing `data/avaloka-chat-insights.json` and `public/data/avaloka-chat-insights.json`. Chatbot responses have a separate bundle so importing them, or rerunning the CSV verifier, preserves both types of evidence on the Insights page. Importing is an evidence-preservation and schema check, **not automated proof that an AI answer is correct or originates from Avaloka**; original service exports and human factual review remain essential. Invalid/pending/mismatched results cannot be displayed as verified insights.

After import, commit and push the genuine evidence and insight changes, update this evidence ledger and submission answers, and redeploy. The insight page always describes the full uploaded CSV; a dashboard filter does not rewrite an original AI answer.

## Evidence ledger

| Operation | Status | Evidence |
| --- | --- | --- |
| Official API documentation inspected | Complete | Linked documentation and guides |
| Service health probe | HTTP 200 | Reachability check only |
| Authentic CSV prepared | Complete | Prepared CSV and provenance/checksum |
| User web authentication | User-confirmed | User instruction in this session |
| Dataset ingested by Avaloka | User-reported | Supplied CSV attributed to Avaloka; no project/dataset identifier in file |
| Data-quality analysis | Pending | Awaiting original response |
| District arsenic analysis | Numeric figures verified | Exact export and independent source-row comparison; service origin user-reported |
| Contamination analysis beyond arsenic | Pending | Awaiting original response |
| Geographic comparison | Pending | Awaiting original response |
| Multiple-elevations analysis | Pending | Awaiting original response |
| Reviewed CSV shown in AI Insights | Complete | Production evidence JSON and exact downloadable CSV |

Python dashboard metrics remain separately attributed. Describe only the source-checked district arsenic export as the Avaloka work currently supplied; the other analysis prompts have no preserved answers. The Google Form has not been submitted.
