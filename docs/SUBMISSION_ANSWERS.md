# JalRakshak AI — submission answers

**Current status:** one user-supplied Avaloka manual web CSV export has been independently checked against the original government measurements and added to the public dashboard. It contains no project ID or original chatbot response, so its service origin is user-reported. The other planned questions have no preserved responses. The form has not been submitted.

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

These dashboard numbers are Python-computed and independently validated against the preserved government measurements. The separate district arsenic export described below is the only Avaloka result currently supplied.

## How did Avaloka help you?

The project owner downloaded a district arsenic analysis CSV through Avaloka's manual web interface. The exported file contains 21 Haryana districts and 365 arsenic measurements. We compared every district's measured sample count, mean, maximum and exceedance percentage with the original CGWB data, and preserved the exact export for download from the AI Insights page. Sirsa is the only district in this export with an arsenic measurement above the 0.01 mg/L reference: one of 31 measured samples, with a maximum of 0.14 mg/L. The observation traces to Dabwali station, sample CGWB-01050. Of 3,415 selected events, 3,050 have no usable arsenic measurement, including all Rajasthan events.

The export's `priority_score` has no supplied definition, so we did not use or display it. The CSV contains no Avaloka project identifier or original chat response; its origin as an Avaloka web export is based on the project owner's statement. No API integration or additional Avaloka findings are claimed. Historical monitoring samples do not establish current district-wide drinking-water safety.

## Supporting Link

https://jalrakshak-ai-opal.vercel.app

The public Vercel production website was verified without login, and desktop/mobile browser workflows passed on the deployed site.

## Anything else you'd like to share?

Code and reproducible analysis are available at https://github.com/rajsingh1301/JalRakshakAI. The repository preserves original government CSVs, source URLs and SHA-256 checksums, a Python cleaning pipeline, parameter-specific reference thresholds, a transparent explanation for every monitoring priority, and the exact user-supplied Avaloka CSV export with independent verification. Current test status is recorded in `docs/TESTING.md`.

JalRakshak AI is decision support for additional monitoring. It does not certify drinking-water safety, predict medical outcomes or treat historical station observations as a representative household survey. The checked manual Avaloka CSV findings are separately attributed to the exact export and its limitations.

## Remaining actions before submission

1. If available, preserve the Avaloka project URL or a screenshot/original chatbot response showing where this CSV was generated. The numerical CSV review is complete; this would strengthen service provenance.
2. Supply your name/email, review all form answers and explicitly approve final form submission.
