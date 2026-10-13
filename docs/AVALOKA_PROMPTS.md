# Manual Avaloka analysis prompts

Upload `data/processed/avaloka-ready.csv` to https://app.avaloka.ai and name the project **JalRakshak AI**. It contains 3,415 CGWB sampling events across 55 districts in Haryana and Rajasthan (2019–2023). Keep the project/dataset identifier or dashboard URL and export the full responses and any generated code/charts.

## 1. Data quality

Analyze the uploaded groundwater CSV. Report geographic and temporal coverage, row and distinct station counts, missing values for every chemical field, exact duplicates and conflicting station-date records. Treat blank concentrations as missing, not zero. Identify uneven sampling coverage and unusual published zero values. Fluoride (mg/L) and Nitrate N (mgN/L) have no measurements; explicitly flag them as unavailable. Nitrate N units must not be treated as nitrate as NO3.

## 2. Observed exceedances

Using actual concentrations, analyze arsenic and iron by sampling location and district. Compare Arsenic (mg/L) strictly greater than 0.01 mg/L and Iron(mg/L) strictly greater than 1.0 mg/L. These limits are from the Government of India BIS extract at https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1843385&lang=2&reg=48. Use valid nonnegative measured values as the denominator separately for each parameter. Report numerator, denominator, percentage, maxima, units, station names and sample dates. Do not infer health outcomes or certify district-wide drinking-water safety.

## 3. Geographic comparison

Compare districts and the two states for arsenic, iron, chloride and sulphate. Chloride acceptable/permissible limits are 250/1000 mg/L and sulphate 200/400 mg/L from the same BIS extract. Clearly distinguish acceptable and permissible exceedances. Report individual parameter denominators and temporal/station coverage. Highlight districts needing additional testing and warn about small or unrepresentative samples. Historical pooled measurements must not be presented as current district conditions or population exposure.

## 4. Multiple elevations

Find actual sampling events with two or more elevated parameters among arsenic >0.01 mg/L, iron >1.0 mg/L, chloride >250 mg/L and sulphate >200 mg/L. Report the actual concentrations, dates, stations and measured parameter count. Missing measurements cannot be counted as within limits. Explain that these are different parameters with different significance and this count is not a medical risk score. Include data limitations and any reproducible code used.

## Results handoff

Provide the full original answers (export or text), the exact question for each answer, dataset/project URL or ID, analysis/thread IDs if shown, and generated code/charts if available. Save original exports in `data/avaloka-evidence/`. The importer accepts original responses plus human-reviewed findings; it never creates answers automatically.

Website AI Insights displays the reviewed district-arsenic CSV export. Additional conversational findings remain pending until their original responses and matching dataset evidence are supplied and reviewed.
