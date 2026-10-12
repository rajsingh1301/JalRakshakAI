"""Create an authentic 2019–2023 subset for manual Avaloka analysis."""
from pathlib import Path
import hashlib
import json
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "cgwb-haryana-1961-2025.csv": "https://nwdp.nwic.gov.in/dataset/7bb1e7c7-bcc1-48bb-8bcd-32c19473804a/resource/d71827b0-9ef4-41e8-92d6-cceec9a26446/download/gwq_chemical_parameter_manual_cgwb_hr_1961_2025.csv",
    "cgwb-rajasthan-1961-2025.csv": "https://nwdp.nwic.gov.in/dataset/7bb1e7c7-bcc1-48bb-8bcd-32c19473804a/resource/d81750a4-c383-43b1-96f1-b7cb13a176c8/download/gwq_chemical_parameter_manual_cgwb_rj_1961_2025.csv",
}


def prepare():
    frames, provenance = [], []
    for name, url in SOURCES.items():
        path = ROOT / "data/raw" / name
        df = pd.read_csv(path, low_memory=False)
        provenance.append({"file": str(path.relative_to(ROOT)), "url": url,
                           "rows": len(df), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
        df["source_file"] = name
        df["source_row"] = df["SlNo"]
        frames.append(df)
    data = pd.concat(frames, ignore_index=True)
    data["sample_date"] = pd.to_datetime(data["Data Acquisition Time"], dayfirst=True, errors="coerce")
    invalid_dates = int(data["sample_date"].isna().sum())
    subset = data[data["sample_date"].dt.year.between(2019, 2023)].copy()
    for column in ["State", "District", "Station", "Village", "Block", "Tehsil"]:
        subset[column] = subset[column].astype("string").str.strip()
    subset["District"] = subset["District"].str.title()
    chemical_columns = list(data.columns[19:46])
    invalid_counts = {}
    for column in chemical_columns:
        original = subset[column]
        numeric = pd.to_numeric(original, errors="coerce")
        invalid = numeric.lt(0) | (original.notna() & numeric.isna())
        invalid_counts[column] = int(invalid.sum())
        subset[column] = numeric.mask(invalid)
    identity = ["State", "District", "Station", "sample_date"]
    duplicate_columns = identity + chemical_columns
    duplicate_count = int(subset.duplicated(duplicate_columns).sum())
    subset = subset.drop_duplicates(duplicate_columns).sort_values(identity)
    conflicts = int(subset.duplicated(identity, keep=False).sum())
    subset["sample_date"] = subset["sample_date"].dt.strftime("%Y-%m-%dT%H:%M:%S")
    subset["sample_year"] = pd.to_datetime(subset["sample_date"]).dt.year
    subset["sample_id"] = [f"CGWB-{i:05d}" for i in range(1, len(subset) + 1)]
    out = ROOT / "data/processed/avaloka-ready.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    subset.to_csv(out, index=False, na_rep="")
    metadata = {
        "name": "CGWB manual groundwater chemical parameters — Haryana and Rajasthan, 2019–2023",
        "agency": "Central Ground Water Board, Government of India",
        "portal": "https://nwdp.nwic.gov.in/en/dataset/ground-water-quality-manual-chemical-parameters-cgwb-f-gfg",
        "retrieved_at": "2026-10-12", "sources": provenance,
        "selection": "All rows with parsed sampling year between 2019 and 2023 inclusive; no concentration-based selection.",
        "raw_rows": len(data), "selected_rows": len(subset), "exact_duplicates_removed": duplicate_count,
        "conflicting_station_date_rows": conflicts, "invalid_source_dates": invalid_dates,
        "invalid_numeric_counts": invalid_counts,
        "states": sorted(subset["State"].dropna().unique().tolist()),
        "districts": int(subset.groupby(["State", "District"]).ngroups),
        "period_start": subset["sample_date"].min(), "period_end": subset["sample_date"].max(),
        "csv_sha256": hashlib.sha256(out.read_bytes()).hexdigest(),
        "missing_counts": {c: int(subset[c].isna().sum()) for c in chemical_columns},
        "warnings": [
            "Fluoride and Nitrate N columns contain no measurements in these source resources; no findings can be inferred for them.",
            "Nitrate N is labelled mgN/L, not nitrate as NO3 mg/L. It must not be compared directly to a 45 mg/L nitrate limit.",
            "Records are station sampling events, not distinct wells or a representative household survey.",
            "Sampling coverage varies by district and year; missing measurements are not zero.",
            "Zero concentrations are preserved as published; detection limits are not supplied.",
            "Historical 2019–2023 observations do not describe current drinking-water safety.",
        ],
    }
    (ROOT / "data/processed/provenance.json").write_text(json.dumps(metadata, indent=2))
    print(json.dumps({"file": str(out), "bytes": out.stat().st_size, "records": len(subset),
                      "districts": metadata["districts"], "period": [metadata["period_start"], metadata["period_end"]]}, indent=2))


if __name__ == "__main__":
    prepare()
