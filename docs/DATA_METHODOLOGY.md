# Data methodology

## Purpose and analytical boundary

JalRakshak AI prioritizes **additional groundwater monitoring**, using historical station measurements and explicit evidence gates. It does not certify drinking-water safety, predict illness, estimate population exposure or provide an official district risk score.

## Provenance and reproducibility

- Agency: Central Ground Water Board (CGWB), Government of India.
- Publisher: National Water Data Portal, National Water Informatics Centre, Ministry of Jal Shakti.
- [Official catalog](https://nwdp.nwic.gov.in/en/dataset/ground-water-quality-manual-chemical-parameters-cgwb-f-gfg).
- [CGWB quality reference page](https://cgwb.gov.in/en/ground-water-quality).
- Retrieved: **12 October 2026**, India client date.
- Original Haryana CSV: `data/raw/cgwb-haryana-1961-2025.csv`, 7,033 rows.
- Original Rajasthan CSV: `data/raw/cgwb-rajasthan-1961-2025.csv`, 12,350 rows.
- Exact download URLs and SHA-256 checksums: `data/processed/provenance.json`.
- Download filenames describe a 1961–2025 archive; actual downloaded measurements span 2000–2024. Filenames are not treated as evidence of period coverage.
- Subset rule: every row whose parsed sampling year is **2019–2023 inclusive**, independently of concentration.
- Cleaned file: `data/processed/avaloka-ready.csv`, **3,415 events**, **55 state/district pairs**, **1,362 state/district/station identities**, **902,954 bytes**.
- Selected timestamps: **2019-05-30 to 2023-12-06**.
- A row is a **station sampling event**, not a unique well, a household or a population denominator.
- Dataset SHA-256: `75df9c6e0dd86588388d2a7b1e78e932ad6b868d6f470a77c21c3d0b9af43227`.

Run from the project root:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/prepare_dataset.py
.venv/bin/python scripts/process_data.py
npm test
```

## Cleaning and audit

`prepare_dataset.py` inspects the 46-column CSV schema and retains all original fields, source filename and original `SlNo`. It adds a stable sample ID, ISO timestamp and sampling year. Dates use explicit day-first parsing. Geographic names are trimmed; district names are normalized to title case without joining or remapping administrative boundaries.

Chemical values are parsed numerically. Missing/non-numeric/negative concentrations are excluded from valid chemical denominators, not imputed. Published zeros remain zeros; detection limits and laboratory qualifiers are absent. No concentration outlier is silently removed. Per-field missingness and invalid numeric counts are recorded.

Exact duplicates are identified by state, district, station, timestamp and every chemical field. Repeat observations at different dates are preserved. Conflicting station/timestamp rows are separately counted. In this subset: **0 exact duplicates removed**, **0 conflicting station/date rows**, **0 invalid original dates**, and **0 negative/non-numeric chemical values detected**.

Station identities combine state, district and station name; they are not a national station-ID registry. Coordinates are preserved in degrees without interpolation. The geographic view plots actual coordinates and a station's maximum measured value within the chosen scope; it is a schematic longitude/latitude view, with no claim of exact administrative boundaries.

## Available chemistry and units

The source contains 27 chemical fields. Six parameters with verified reference limits and at least one selected-period measurement are tracked by the dashboard: chloride, sulphate, arsenic, iron, total dissolved solids and total hardness.

**Fluoride and nitrate N have no measurements anywhere in the two downloaded resources.** Total alkalinity has historical observations, but none in the 2019–2023 selected period. These parameters are excluded from threshold charts and ranking. Other measured source fields remain in the upload CSV and missingness audit, but do not receive unsupported dashboard thresholds.

`Nitrate N (mgN/L)` is nitrogen-basis nitrate, not nitrate as NO₃. No conversion or 45 mg/L comparison is applied. No unit normalization is needed for the six selected dashboard fields. Hardness is expressed as CaCO₃; the original source labels arsenic as mg/L without further speciation metadata.

## Threshold sources and comparison rules

Reference standard: **BIS IS 10500:2012**, as reproduced in the Government of India [Ministry of Jal Shakti / PIB extract of 21 July 2022, Annex I](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1843385&lang=2&reg=48), corroborated by the [July 2023 Jal Jeevan Samvad](https://jaljeevanmission.gov.in/sites/default/files/2025-05/JalJeevanSamvad-July-2023-en.pdf).

The exact adopted published extract is versioned in this methodology. Reference comparisons do not constitute a legal compliance determination for the original sampling dates. Older tables can show different iron/arsenic values; they are not silently substituted.

| Parameter | Unit / basis | Acceptable | Permissible in absence of alternate source |
| --- | --- | ---: | ---: |
| Chloride | mg/L | 250 | 1,000 |
| Sulphate | mg/L | 200 | 400 |
| Arsenic | mg/L, source arsenic compared to total arsenic reference | 0.01 | 0.01, no relaxation |
| Iron | mg/L as Fe | 1.0 | 1.0, no relaxation |
| Total dissolved solids | mg/L | 500 | 2,000 |
| Total hardness | mg/L as CaCO₃ | 200 | 600 |

Acceptable and permissible exceedances are reported separately. **Strict `value > limit`** defines an exceedance. A value exactly equal to a limit is not counted as exceeding it. Missing values never become zeros or within-limit observations.

For each parameter and each chosen scope:

```text
valid = finite, nonnegative measured concentrations
acceptable_exceedance_rate = count(value > acceptable_limit) / valid_count × 100
coverage = valid_count / all_sampling_events_in_scope × 100
```

A zero valid denominator yields `null` and an empty state, not a 0% assertion. Mean, median, extrema and distribution use valid values only. Distribution bins are ≤0.5×, >0.5–1×, >1–2×, >2–4× and >4× of the acceptable limit.

## Verified local calculations

These are Python-computed statistics, **not Avaloka findings**.

| Parameter | Measured | Above acceptable | Above permissible | Acceptable exceedance % | Coverage % |
| --- | ---: | ---: | ---: | ---: | ---: |
| Chloride | 3,413 | 1,377 | 451 | 40.35 | 99.94 |
| Sulphate | 1,969 | 569 | 303 | 28.90 | 57.66 |
| Arsenic | 365 | 1 | 1 | 0.27 | 10.69 |
| Iron | 364 | 10 | 10 | 2.75 | 10.66 |
| Total dissolved solids | 1,469 | 1,218 | 435 | 82.91 | 43.02 |
| Total hardness | 2,688 | 1,984 | 588 | 73.81 | 78.71 |

**1,540 sampling events** have two or more available tracked parameters above acceptable limits. Chemical parameters differ in meaning; counting co-elevations does not create a comparable health risk score. Measurement breadth varies by event.

## District prioritization

The rank uses **one user-selected parameter** so incompatible chemical quantities are never added together.

1. A district is eligible only with at least **10 valid events**, **5 distinct measured station names** and **50% measured coverage** for that selected parameter.
2. Eligible districts sort by descending acceptable-limit exceedance proportion.
3. Ties sort by descending median `value / acceptable_limit` among exceedances, then descending valid event count, district name and state.
4. Evidence bands are project-defined: **High ≥40%**, **Moderate ≥15% and <40%**, **Lower <15%**. They are observed monitoring burden, not BIS categories or health labels.
5. Ineligible districts receive **Insufficient evidence** and no numeric rank. Their concentrations remain inspectable and missing sampling coverage is explicit.

The website explains numerator, denominator, measured stations, coverage, tie-breaker severity and the number of tracked parameters with any district measurements. Parameter breadth is context, not a weighting factor. Severity influences ties only; sparse data never gains confidence because a single value is extreme.

These gates do not prove statistical representativeness. Repeated stations and pooled years make independent-observation confidence intervals inappropriate without additional design assumptions, so none are claimed.

## Uneven temporal coverage

| Year | Haryana events | Rajasthan events | Total |
| --- | ---: | ---: | ---: |
| 2019 | 185 | 537 | 722 |
| 2020 | 185 | 537 | 722 |
| 2021 | 157 | 608 | 765 |
| 2022 | 407 | 2 | 409 |
| 2023 | 379 | 418 | 797 |

Rajasthan's **two 2022 records** are a major coverage limitation. Year charts show observed rates with actual denominators; they do not establish contamination trends or causal changes.

## Attribution and limitations

- **Python/JavaScript:** deterministic cleaning, statistics, filters, distribution and monitoring priorities.
- **Avaloka:** one user-supplied manual web district-arsenic CSV export; all 21 rows' source-checkable numbers are verified. Its service origin is user-reported because no project ID or original response was supplied. Other Auto Insights/chat findings are not attributed without preserved evidence.
- **JalRakshak recommendations:** suggestions for confirmatory monitoring based on observed burden and evidence gaps.
- **Scope:** two states, historical observations, uneven stations and chemical coverage, uncharacterized detection limits, no household/public-health inference.
- A low or zero sampled exceedance rate cannot certify district water safety, especially for sparsely measured arsenic or iron.

No raw source files are put in the publicly served frontend. The small cleaned upload CSV and processed JSON are intentionally available to reproduce the dashboard.
