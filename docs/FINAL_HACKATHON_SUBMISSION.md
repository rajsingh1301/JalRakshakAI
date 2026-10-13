# JalRakshak AI — final hackathon submission

**Status:** Application and answers ready for creator review. The Google Form has not been submitted. Personal name/email and form access belong to the creator.

The answers below are written in the project creator's voice and can be copied into the corresponding form fields. The Avaloka workflow is reported by the creator; the preserved CSV's numbers are independently verified, while the CSV alone cannot authenticate an Avaloka session or document unretained Auto Insights/chat responses.

## Project Name

JalRakshak AI

## Dataset Used

**Upload this exact file:** `/Users/mayankraj/developer/JalRakshakAI/data/processed/avaloka-ready.csv` (902,954 bytes; under 100 MB).

**Dataset description to paste if requested:**

Central Ground Water Board (CGWB), Government of India, manual groundwater chemical-parameter observations from the National Water Data Portal. This cleaned, source-traceable CSV contains 3,415 station sampling events from 55 districts in Haryana and Rajasthan, sampled during 2019–2023. It is selected from two preserved official state CSVs without filtering by concentration. Blank chemical measurements remain missing. Source: https://nwdp.nwic.gov.in/en/dataset/ground-water-quality-manual-chemical-parameters-cgwb-f-gfg

## What problem were you trying to solve?

Groundwater quality monitoring in India produces valuable government records, but a large CSV is hard to turn into a defensible decision about where to test next. Individual chemicals are measured in different numbers of samples, stations are visited unevenly, and blank results can easily be mistaken for clean water. A map of high concentrations alone can therefore exaggerate a hotspot or hide a serious data gap. I wanted researchers, local organizations and public teams to see both the observed measurements and the strength of the evidence behind them. JalRakshak AI addresses this by translating historical CGWB sampling events into an accessible exploration and monitoring-priority workflow. Users can narrow the records by geography, year and parameter, inspect the observations behind a chart, and see why a district receives a priority band or an insufficient-evidence label. The aim is to guide confirmatory sampling, not to declare a district's drinking water safe or unsafe.

## What did you discover or build?

I built and deployed JalRakshak AI, an interactive groundwater intelligence platform based on 3,415 authentic CGWB sampling events from 55 districts in Haryana and Rajasthan during 2019–2023. Its five sections cover an overview, contamination explorer, district monitoring priorities, Avaloka insights and methodology. State, year, district and chemical controls update charts, source-record tables and CSV downloads. The dashboard tracks six measured parameters against sourced, parameter-specific drinking-water references.

The evidence revealed why denominators matter. Chloride exceeded the 250 mg/L acceptable reference in 1,377 of 3,413 measured events. Arsenic was measured in only 365 events across 21 Haryana districts; 3,050 selected events have no arsenic measurement. The checked district export identifies one Sirsa arsenic observation above 0.01 mg/L among 31 valid measurements, reaching 0.14 mg/L at Dabwali. Fluoride and nitrate measurements are absent from these source files, so the app makes no claim about their concentrations.

Unlike a conventional hotspot map, each monitoring priority exposes its numerator, measured denominator, station count and coverage rule. Sparse districts are labeled insufficient evidence, and historical samples are never presented as current district-wide drinking-water safety.

## How did Avaloka help you?

I uploaded the cleaned CGWB CSV to Avaloka's web interface and used Auto Insights and conversational analysis to explore its measurements, data gaps and district comparisons. The only Avaloka artifact I retained for this submission is a district-level arsenic analysis CSV; I do not attribute specific unpreserved Auto Insights or chat findings to the platform. That export covers 21 Haryana districts and 365 valid arsenic measurements. I recalculated every district's sample count, mean, maximum, count above 0.01 mg/L and exceedance percentage from the original government records, and all 21 rows match. In Sirsa, one of 31 measured events exceeded that reference, reaching 0.14 mg/L at Dabwali. The export also contains a `priority_score` without a documented formula, so I excluded it from the website. JalRakshak AI presents the exact downloadable export, checked findings and limitations alongside separately attributed Python calculations. Avaloka helped turn a broad dataset into a focused, reviewable artifact through manual web analysis; the site has no Avaloka API or live chat integration.

## Supporting Link

https://jalrakshak-ai-opal.vercel.app/

## Anything else you'd like to share?

The source code, preserved CGWB files, reproducible cleaning and validation scripts, and exact Avaloka CSV export are available at https://github.com/rajsingh1301/JalRakshakAI. Each dashboard threshold cites a Government of India extract of BIS IS 10500:2012; acceptable and permissible limits are distinguished. District priorities are transparent recommendations for additional monitoring, with minimum measurement, station and coverage requirements. The export's numerical results were checked against original records, but the CSV does not contain the Avaloka project ID or original conversation. This historical, unevenly sampled dataset cannot establish current household exposure or certify any district's water as safe or unsafe.

## Verified project metrics

Independent raw-file and cleaned-file checks were repeated on 13 October 2026. Each clean row traces to an original state CSV row, and every published parameter count below matches `dashboard.json`.

| Measure | Verified result |
| --- | ---: |
| Preserved original rows | 19,383 across two state files |
| Selected 2019–2023 sampling events | 3,415: Haryana 1,313; Rajasthan 2,102 |
| State/district pairs | 55 |
| Arsenic-measured events / districts | 365 / 21, all measured districts in Haryana |
| Events without arsenic measurement | 3,050 |
| Sirsa measured arsenic events / above 0.01 mg/L | 31 / 1 |
| Sirsa maximum arsenic | 0.14 mg/L at Dabwali, sample CGWB-01050, 13 June 2022 |
| Events with two or more tracked parameters above acceptable references | 1,540; Python calculation, not an Avaloka finding |

| Parameter | Measured events | Above acceptable | Above permissible | Reference limits, acceptable / permissible (mg/L) |
| --- | ---: | ---: | ---: | --- |
| Chloride | 3,413 | 1,377 | 451 | 250 / 1,000 |
| Sulphate | 1,969 | 569 | 303 | 200 / 400 |
| Arsenic | 365 | 1 | 1 | 0.01 / 0.01; no relaxation |
| Iron | 364 | 10 | 10 | 1.0 / 1.0; no relaxation |
| Total dissolved solids | 1,469 | 1,218 | 435 | 500 / 2,000 |
| Total hardness | 2,688 | 1,984 | 588 | 200 / 600; as CaCO₃ |

Values strictly greater than a reference count as exceedances; equality does not. The permissible limit is the BIS value **in the absence of an alternate source**, not a declaration that any water is safe. Source: [Government of India / PIB, Annex I](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1843385&lang=2&reg=48). Missing values are excluded from measured denominators. Fluoride and nitrate N have no measurements in the two downloaded source resources.

## Evidence manifest

| Evidence | Location / link | Status |
| --- | --- | --- |
| Original Haryana CGWB CSV | `data/raw/cgwb-haryana-1961-2025.csv`; original download URL and SHA-256 in `data/processed/provenance.json` | Preserved, hash checked |
| Original Rajasthan CGWB CSV | `data/raw/cgwb-rajasthan-1961-2025.csv`; original download URL and SHA-256 in `data/processed/provenance.json` | Preserved, hash checked |
| Cleaned upload CSV | `data/processed/avaloka-ready.csv`; SHA-256 `75df9c6e0dd86588388d2a7b1e78e932ad6b868d6f470a77c21c3d0b9af43227` | Ready for form upload |
| User-provided Avaloka district analysis CSV | `data/processed/resultjalrakshakAi.csv`; SHA-256 `711040f4a91722bfdd42d454c3671328ad0e8ed954c5effa135a960f1beb544f` | Exact export retained; 21 district rows numerically verified |
| Avaloka project URL, screenshots, original chat/Auto Insights responses | Not supplied | Optional provenance evidence; do not claim these artifacts exist |
| Source code | https://github.com/rajsingh1301/JalRakshakAI | Public repository |
| Deployed application | https://jalrakshak-ai-opal.vercel.app/ | Public production URL |

## Remaining limitations

- The owner identifies the analysis CSV as an Avaloka manual web export; its bytes contain no project/session ID, prompt or original response, so service origin and unretained Auto Insights/chat findings cannot be independently authenticated from this artifact.
- The export's `priority_score` has no supplied formula and is excluded from the website and submission claims.
- Arsenic has 365 measured events; all Rajasthan events in the subset lack arsenic results. Fluoride and nitrate N are entirely unmeasured in the preserved source files.
- Uneven years and stations, repeated observations, unknown detection limits and historical monitoring scope prevent current district-wide or household safety claims.
- The original Google Form required sign-in during read-only inspection; its live field layout could not be checked anonymously. The supplied field names and answer requirements are taken from the creator's instructions.

## Final submission checklist

- [x] Recompute selected rows, districts and six chemical metrics from preserved original CSVs.
- [x] Check all 21 Avaloka export rows and preserve its exact bytes.
- [x] Cite BIS references and distinguish missing, acceptable and permissible results.
- [x] Test production pages, filters, charts, downloads, mobile layout and console; confirm the deployed URL is public.
- [x] Keep `.env` files and credentials out of tracked files.
- [ ] Creator: enter full name and email directly in the form.
- [ ] Creator: upload the cleaned CSV from the exact path above, review these answers and approve or personally perform submission.
- [ ] Optional: preserve the Avaloka project URL or original responses/screenshots to strengthen service provenance.

**The Google Form has not been submitted.**
