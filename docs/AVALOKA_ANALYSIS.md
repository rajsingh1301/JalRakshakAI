# Avaloka analysis evidence

## Verified status

**Pending: genuine manual web analysis outputs have not been provided or imported.**

The user confirmed they are logged into the Avaloka web dashboard and requested manual analysis instead of API integration. No token is requested or required for this chosen workflow. Dataset upload and completion of the four analyses are **not yet verified**. There are currently **zero verified Avaloka insights**.

Avaloka's [official documentation](https://avaloka.ai/documentation) and [guides](https://avaloka.ai/guides) were inspected. Its documented unauthenticated `/health` endpoint returned HTTP 200 on 12 October 2026. This verifies reachability only; it does not prove authenticated upload or analysis. No authenticated API operation was completed or claimed.

## Prepared dataset

- `data/processed/avaloka-ready.csv`: 902,954 bytes, 3,415 actual CGWB events, 55 districts, Haryana and Rajasthan, 2019–2023.
- Dataset SHA-256: `75df9c6e0dd86588388d2a7b1e78e932ad6b868d6f470a77c21c3d0b9af43227`.
- Exact questions: [AVALOKA_PROMPTS.md](AVALOKA_PROMPTS.md).
- Production insight status: `data/avaloka-insights.json` and `public/data/avaloka-insights.json`.

## Manual workflow

1. Open https://app.avaloka.ai and create/name a project **JalRakshak AI**.
2. Upload the prepared CSV and verify the row count, column names and sample previews.
3. Ask the four dataset-specific questions in `docs/AVALOKA_PROMPTS.md`.
4. Preserve each exact question and full, unedited original response. Download generated code, tables/charts or output artifacts when available.
5. Record the actual project URL, dataset ID or visible identifier, conversation/analysis IDs if available, and completion timestamps. Do not invent IDs when the UI does not expose them.
6. Save text exports as `.txt` or `.md` under `data/avaloka-evidence/`, preserving originals. Do not include account credentials or private account information in public evidence.
7. Independently compare reported numbers and denominators with the source CSV and `data/processed/dashboard.json`. Record limitations and any discrepancies.
8. Prepare the reviewed JSON import and import it only after findings are supported by actual responses and actual measurements.

## Import format

Copy `data/avaloka-import-template.json` to a new local JSON file and fill it with actual results. It deliberately contains **no example findings or invented numbers**.

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

The importer validates all entries before changing the insight JSON. Importing is an evidence-preservation and schema check, **not automated proof that an AI answer is correct or originates from Avaloka**; original service exports and human factual review remain essential. Invalid/pending/mismatched results cannot be displayed as verified insights.

After import, commit and push the genuine evidence and insight changes, update this evidence ledger and submission answers, and redeploy. The insight page always describes the full uploaded CSV; a dashboard filter does not rewrite an original AI answer.

## Evidence ledger

| Operation | Status | Evidence |
| --- | --- | --- |
| Official API documentation inspected | Complete | Linked documentation and guides |
| Service health probe | HTTP 200 | Reachability check only |
| Authentic CSV prepared | Complete | Prepared CSV and provenance/checksum |
| User web authentication | User-confirmed | User instruction in this session |
| Dataset ingested by Avaloka | Unverified | Awaiting dataset/project identifier and export |
| Data-quality analysis | Pending | Awaiting original response |
| Contamination analysis | Pending | Awaiting original response |
| Geographic comparison | Pending | Awaiting original response |
| Multiple-elevations analysis | Pending | Awaiting original response |
| Verified insights imported | None | Production insights array is empty |

Python metrics are intentionally **not** recorded as Avaloka evidence. The project must not be submitted as demonstrating completed Avaloka usage until genuine results are preserved and reviewed.
