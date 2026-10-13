"""Verify a user-supplied Avaloka CSV export against the original CGWB events.

Only source-checkable arsenic figures are published. The export's priority_score
has no supplied definition and is deliberately excluded from the public bundle.
"""
from collections import defaultdict
from decimal import Decimal, InvalidOperation
from pathlib import Path
import csv
import hashlib
import json
import math
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/processed/avaloka-ready.csv"
EXPORT = ROOT / "data/processed/resultjalrakshakAi.csv"
FIELDS = ["District", "sample_count", "mean_arsenic", "max_arsenic",
          "exceedance_count", "exceedance_pct", "priority_score"]
LIMIT = Decimal("0.01")
TOLERANCE = Decimal("0.000000001")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def integer(value, field):
    if not re.fullmatch(r"\d+", value):
        raise ValueError(f"{field} must be a nonnegative integer")
    return int(value)


def decimal(value, field):
    try:
        parsed = Decimal(value)
    except (InvalidOperation, TypeError):
        raise ValueError(f"{field} must be numeric") from None
    if not parsed.is_finite() or parsed < 0:
        raise ValueError(f"{field} must be finite and nonnegative")
    return parsed


def close(actual, expected, name):
    if abs(actual - expected) > TOLERANCE:
        raise ValueError(f"{name} mismatch: exported {actual}, source {expected}")


def validate(export_path=EXPORT):
    provenance = json.loads((ROOT / "data/processed/provenance.json").read_text())
    if sha256(SOURCE) != provenance["csv_sha256"]:
        raise ValueError("Prepared source CSV hash changed")
    with SOURCE.open(newline="", encoding="utf-8-sig") as f:
        source_rows = list(csv.DictReader(f))
    if len(source_rows) != provenance["selected_rows"]:
        raise ValueError("Prepared source event count changed")
    grouped = defaultdict(list)
    all_events = defaultdict(int)
    for source in source_rows:
        key = (source["State"], source["District"])
        all_events[key] += 1
        value = source["Arsenic (mg/L)"].strip()
        if value:
            measured = Decimal(value)
            if not measured.is_finite() or measured < 0:
                raise ValueError("Invalid source arsenic measurement")
            grouped[key].append((measured, source))
    by_name = defaultdict(list)
    for state, district in grouped:
        by_name[district].append(state)

    with export_path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != FIELDS:
            raise ValueError("Avaloka CSV columns differ from the reviewed export schema")
        exported = list(reader)
    if len(exported) != len(grouped):
        raise ValueError("Export has missing or extra measured districts")
    seen = set()
    reviewed = []
    for row in exported:
        district = row["District"].strip()
        if district in seen or len(by_name[district]) != 1:
            raise ValueError(f"Duplicate or ambiguous district: {district}")
        seen.add(district)
        state = by_name[district][0]
        key = (state, district)
        entries = grouped[key]
        count = len(entries)
        exceedances = [source for value, source in entries if value > LIMIT]
        expected_mean = sum((value for value, _ in entries), Decimal(0)) / count
        expected_max = max(value for value, _ in entries)
        expected_rate = Decimal(100) * len(exceedances) / count
        if integer(row["sample_count"], "sample_count") != count:
            raise ValueError(f"{district}: measured sample count mismatch")
        if integer(row["exceedance_count"], "exceedance_count") != len(exceedances):
            raise ValueError(f"{district}: exceedance count mismatch")
        close(decimal(row["mean_arsenic"], "mean_arsenic"), expected_mean, f"{district} mean")
        close(decimal(row["max_arsenic"], "max_arsenic"), expected_max, f"{district} maximum")
        close(decimal(row["exceedance_pct"], "exceedance_pct"), expected_rate, f"{district} exceedance %")
        decimal(row["priority_score"], "priority_score")  # Format only; formula not supplied.
        reviewed.append({"state": state, "district": district, "sample_count": count,
                         "total_events": all_events[key], "mean_arsenic": float(expected_mean),
                         "max_arsenic": float(expected_max), "exceedance_count": len(exceedances),
                         "exceedance_pct": float(expected_rate)})
    if seen != set(by_name):
        raise ValueError("Export does not cover every district with an arsenic measurement")
    sum_measured = sum(row["sample_count"] for row in reviewed)
    sum_exceeded = sum(row["exceedance_count"] for row in reviewed)
    observations = []
    for entries in grouped.values():
        for value, source in entries:
            if value > LIMIT:
                observations.append({"state": source["State"], "district": source["District"],
                                     "station": source["Station"], "sample_id": source["sample_id"],
                                     "date": source["sample_date"], "value": float(value),
                                     "source_file": source["source_file"], "source_row": int(source["source_row"])})
    reviewed.sort(key=lambda row: (-row["exceedance_count"], -row["exceedance_pct"], row["district"]))
    return {"status": "verified_csv", "provider": "Avaloka", "method": "manual_web",
            "artifact_type": "district_arsenic_csv", "origin": "user_provided_export",
            "origin_note": "Project owner supplied this file as an Avaloka web export; the CSV contains no project ID or chatbot response, so service origin is not independently authenticated.",
            "dataset_sha256": sha256(SOURCE), "artifact_sha256": sha256(export_path),
            "artifact_url": "/data/resultjalrakshakAi.csv", "parameter": "arsenic",
            "unit": "mg/L", "acceptable_limit": float(LIMIT), "scope": "2019–2023 selected events; Haryana districts with measured arsenic",
            "summary": {"districts": len(reviewed), "measured_events": sum_measured,
                        "source_events": len(source_rows), "exceedance_events": sum_exceeded,
                        "unmeasured_events": len(source_rows) - sum_measured},
            "districts": reviewed, "exceedance_observations": observations,
            "excluded_export_fields": ["priority_score"],
            "limitations": ["The export has no project ID, original question, chatbot response, or definition of priority_score.",
                            "Arsenic is measured in only 365 of 3,415 selected events; all measured arsenic records are from Haryana.",
                            "A zero exceedance count only describes tested samples, not untested events or safe drinking water.",
                            "Historical monitoring wells do not represent current household exposure; laboratory detection limits are not supplied."]}


def main():
    bundle = validate()
    encoded = json.dumps(bundle, indent=2, ensure_ascii=False, allow_nan=False) + "\n"
    for target in (ROOT / "data/avaloka-insights.json", ROOT / "public/data/avaloka-insights.json"):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(encoded)
    shutil.copyfile(EXPORT, ROOT / "public/data/resultjalrakshakAi.csv")
    print(f"Verified {bundle['summary']['measured_events']} arsenic measurements in {bundle['summary']['districts']} districts; preserved exact export.")


if __name__ == "__main__":
    main()
