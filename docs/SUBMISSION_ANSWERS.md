# JalRakshak AI — submission answers

**Current verdict: BLOCKED pending genuine Avaloka analysis evidence.** The working dashboard is publicly deployed and tested. Do not submit as demonstrating completed Avaloka usage until real outputs have been received, reviewed and imported. The form has not been submitted.

Submission form: https://docs.google.com/forms/d/e/1FAIpQLSf2CCOwrVf7_0Uz5APq6_m-Ne4suYbbwczPKKbq3VlMLJHWpw/viewform

## Full Name

[Enter your full name. Personal details have not been inferred.]

## Email Address

[Enter your email address.]

## Avaloka Project Name

JalRakshak AI

## Dataset Used — file upload

Upload **avaloka-ready.csv** from:

```text
/Users/mayankraj/developer/JalRakshakAI/data/processed/avaloka-ready.csv
```

Dataset description:

CGWB manual groundwater chemical parameter observations published by the Government of India’s National Water Data Portal. The prepared dataset contains 3,415 genuine station sampling events from 55 districts in Haryana and Rajasthan, sampled between 2019 and 2023. It is a concentration-independent temporal subset of two preserved official CSVs, with original source-row references, measurement units and sampling timestamps. File size: 902,954 bytes.

Source: https://nwdp.nwic.gov.in/en/dataset/ground-water-quality-manual-chemical-parameters-cgwb-f-gfg

## What problem were you trying to solve?

Government groundwater datasets contain valuable chemical observations, but translating them into district monitoring priorities is difficult. Comparisons can be misleading when chemical measurements are missing, sampling coverage is uneven or historical monitoring wells are mistaken for current household drinking-water evidence. We wanted to help researchers, NGOs and public-sector teams identify where additional testing deserves attention, while showing the measurements and limitations behind each recommendation.

## What did you discover or build?

We built JalRakshak AI, a publicly deployed, interactive groundwater intelligence application with five sections: overview, contamination explorer, district monitoring priorities, Avaloka insights and methodology. It analyzes 3,415 authentic CGWB sampling events across 55 districts in Haryana and Rajasthan, with state, year, district and chemical filters, charts, source-record search and CSV exports.

Our reproducible local calculations found 1,377 of 3,413 measured chloride events above the 250 mg/L acceptable reference, and 569 of 1,969 measured sulphate events above 200 mg/L. We also identified 1,540 events with multiple tracked parameters above their acceptable references. These are historical sampled observations, not estimates of population exposure or district-wide water safety.

Missingness is a central finding: arsenic and iron were measured in only about 11% of selected events, while fluoride and nitrate columns were empty in the downloaded source files. The monitoring ranking therefore uses parameter-specific denominators and minimum sample/station/coverage rules, keeping insufficient evidence explicit rather than turning sparse data into a confident score.

These numerical findings are Python-computed and independently validated against the preserved government measurements. They must not be represented as completed Avaloka analysis.

## How did Avaloka help you?

**This answer is not yet ready for an eligible final submission. Replace it only after genuine analysis outputs are verified. Current accurate status:**

We prepared an authentic, cleaned CGWB CSV for manual analysis in Avaloka’s web interface and developed four dataset-specific investigations covering data quality, arsenic/iron observations, district comparisons and multiple elevated parameters. The application includes an evidence-preserving workflow for importing original Avaloka responses, supporting numerical values, dataset identifiers and analytical limitations. At the time these answers were prepared, the actual Avaloka outputs had not yet been supplied, reviewed or imported; no completed Avaloka findings or authenticated API integration are claimed.

After the real outputs are available, describe the actual dataset upload, questions answered, supported findings and preserved evidence from `docs/AVALOKA_ANALYSIS.md`. Do not describe planned analyses as completed work.

## Supporting Link

https://jalrakshak-ai-opal.vercel.app

The public Vercel production website was verified without login, and desktop/mobile browser workflows passed on the deployed site.

## Anything else you'd like to share?

Code and reproducible analysis are available at https://github.com/rajsingh1301/JalRakshakAI. The repository preserves original government CSVs, source URLs and SHA-256 checksums, a Python cleaning pipeline, parameter-specific reference thresholds and a transparent explanation for every monitoring priority. Seven calculation tests, five source-integrity tests and ten browser tests passed; the browser tests were also executed against the public production deployment.

JalRakshak AI is decision support for additional monitoring. It does not certify drinking-water safety, predict medical outcomes or treat historical station observations as a representative household survey. Genuine Avaloka findings will remain separately attributed to their original responses and evidence.

## Remaining actions before submission

1. Upload the prepared CSV to Avaloka and run the questions in `docs/AVALOKA_PROMPTS.md`.
2. Preserve actual project/dataset identifiers and original responses/artifacts, then provide them for factual review and import.
3. Update the Avaloka evidence ledger and “How did Avaloka help you?” answer with the work that actually completed.
4. Redeploy the verified insight changes and check the public website.
5. Supply your name/email, review all form answers and explicitly approve final form submission.
