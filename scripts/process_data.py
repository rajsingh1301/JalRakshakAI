"""Reproducible, parameter-specific monitoring metrics; no AI outputs generated."""
from pathlib import Path
import hashlib
import json
import shutil
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
STANDARD = "https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1843385&lang=2&reg=48"
PARAMETERS = [
    ("chloride", "Chloride", "Chloride (mg/L)", 250, 1000, "Cl"),
    ("sulphate", "Sulphate", "Sulphate (mg/L)", 200, 400, "SO₄"),
    ("arsenic", "Arsenic", "Arsenic (mg/L)", 0.01, 0.01, "As"),
    ("iron", "Iron", "Iron(mg/L)", 1, 1, "Fe"),
    ("tds", "Dissolved solids", "Total Dissolved Solids (mg/L)", 500, 2000, "TDS"),
    ("hardness", "Total hardness", "Total Hardness (mgCaCO3/L)", 200, 600, "TH"),
    ("alkalinity", "Total alkalinity", "Total Alkalinity (mg/L as CaCO3)", 200, 600, "Alk"),
]


def stats(records, parameter):
    values = np.array([r[parameter["id"]] for r in records if r[parameter["id"]] is not None], dtype=float)
    above = values[values > parameter["acceptable"]]
    return {"valid": len(values), "missing": len(records) - len(values),
            "exceedances": len(above), "permissible_exceedances": int((values > parameter["permissible"]).sum()),
            "rate": len(above) / len(values) * 100 if len(values) else None,
            "mean": float(np.mean(values)) if len(values) else None,
            "median": float(np.median(values)) if len(values) else None,
            "min": float(np.min(values)) if len(values) else None,
            "max": float(np.max(values)) if len(values) else None,
            "coverage": len(values) / len(records) * 100 if records else 0,
            "median_excess_ratio": float(np.median(above / parameter["acceptable"])) if len(above) else 0}


def priority(records, parameter):
    result = stats(records, parameter)
    stations = len({r["station"] for r in records if r[parameter["id"]] is not None})
    enough = result["valid"] >= 10 and stations >= 5 and result["coverage"] >= 50
    rate = result["rate"] or 0
    result.update({"stations": stations, "eligible": enough,
                   "band": "Insufficient evidence" if not enough else "High" if rate >= 40 else "Moderate" if rate >= 15 else "Lower"})
    return result


def process():
    path = ROOT / "data/processed/avaloka-ready.csv"
    provenance = json.loads((ROOT / "data/processed/provenance.json").read_text())
    if hashlib.sha256(path.read_bytes()).hexdigest() != provenance["csv_sha256"]:
        raise ValueError("Prepared CSV differs from its provenance. Rerun prepare_dataset.py.")
    df = pd.read_csv(path, low_memory=False)
    parameters = [{"id": p[0], "name": p[1], "source_column": p[2], "acceptable": p[3],
                   "permissible": p[4], "symbol": p[5], "unit": "mg/L",
                   "basis": "as CaCO₃" if p[0] in ["hardness", "alkalinity"] else "as As" if p[0] == "arsenic" else "as Fe" if p[0] == "iron" else "",
                   "source": STANDARD, "standard": "BIS IS 10500:2012, government extract (21 July 2022)"}
                  for p in PARAMETERS if df[p[2]].notna().any()]
    records = []
    for row in df.to_dict(orient="records"):
        record = {"id": row["sample_id"], "state": row["State"], "district": row["District"],
                  "station": row["Station"], "date": row["sample_date"], "year": int(row["sample_year"]),
                  "lat": row["Latitude"] if pd.notna(row["Latitude"]) else None,
                  "lng": row["Longitude"] if pd.notna(row["Longitude"]) else None,
                  "source_file": row["source_file"], "source_row": int(row["source_row"])}
        for p in parameters:
            number = row[p["source_column"]]
            record[p["id"]] = float(number) if pd.notna(number) and np.isfinite(number) and number >= 0 else None
        record["measured_parameters"] = sum(record[p["id"]] is not None for p in parameters)
        record["elevated_parameters"] = sum(record[p["id"]] is not None and record[p["id"]] > p["acceptable"] for p in parameters)
        records.append(record)
    district_metrics = []
    for (state, district), group in df.groupby(["State", "District"], sort=True):
        selected = [r for r in records if r["state"] == state and r["district"] == district]
        district_metrics.append({"state": state, "district": district, "samples": len(group),
                                 "parameters": {p["id"]: priority(selected, p) for p in parameters}})
    payload = {"schema_version": 1, "provenance": provenance, "parameters": parameters,
               "records": records, "statistics": {p["id"]: stats(records, p) for p in parameters},
               "district_metrics": district_metrics,
               "summary": {"samples": len(records), "districts": len(district_metrics),
                           "stations": len({(r["state"], r["district"], r["station"]) for r in records}),
                           "parameters": len(parameters),
                           "any_elevated": sum(r["elevated_parameters"] > 0 for r in records),
                           "multi_elevated": sum(r["elevated_parameters"] >= 2 for r in records),
                           "valid_events": sum(r["measured_parameters"] > 0 for r in records)},
               "priority_rules": {"minimum_valid": 10, "minimum_stations": 5, "minimum_coverage_percent": 50,
                                  "high_rate": 40, "moderate_rate": 15,
                                  "sort": "Eligible first, descending exceedance proportion, descending median excess ratio, descending valid sample count, then district name. One selected parameter only."}}
    encoded = json.dumps(payload, separators=(",", ":"), allow_nan=False)
    (ROOT / "data/processed/dashboard.json").write_text(encoded)
    public = ROOT / "public/data"
    public.mkdir(parents=True, exist_ok=True)
    (public / "dashboard.json").write_text(encoded)
    shutil.copyfile(path, public / "avaloka-ready.csv")
    insights_path = ROOT / "data/avaloka-insights.json"
    if not insights_path.exists():
        insights_path.write_text(json.dumps({"status": "pending", "provider": "Avaloka", "method": "manual_web",
            "dataset_sha256": provenance["csv_sha256"], "dataset_id": None, "project_url": None,
            "insights": [], "note": "Awaiting genuine Avaloka exports and human verification. No API integration is claimed."}, indent=2))
    insights = json.loads(insights_path.read_text())
    if insights.get("dataset_sha256") != provenance["csv_sha256"]:
        raise ValueError("Avaloka findings refer to another CSV. Review and import matching evidence.")
    shutil.copyfile(insights_path, public / "avaloka-insights.json")
    print(json.dumps(payload["summary"], indent=2))
    print("Processed metrics:", json.dumps(payload["statistics"], indent=2))


if __name__ == "__main__":
    process()
