"""Independent CSV expectations for the browser audit (standard library only)."""
import csv
import hashlib
import json
from pathlib import Path
from statistics import median

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "data/processed/avaloka-ready.csv"
rows = list(csv.DictReader(path.open()))
parameters = {
    "chloride": ("Chloride (mg/L)", 250, 1000),
    "sulphate": ("Sulphate (mg/L)", 200, 400),
    "arsenic": ("Arsenic (mg/L)", .01, .01),
    "iron": ("Iron(mg/L)", 1, 1),
    "tds": ("Total Dissolved Solids (mg/L)", 500, 2000),
    "hardness": ("Total Hardness (mgCaCO3/L)", 200, 600),
}


def stats(selected, column, acceptable, permissible):
    values = [float(r[column]) for r in selected if r[column].strip()]
    above = sum(v > acceptable for v in values)
    ratios = [v / acceptable for v in values]
    return dict(valid=len(values), missing=len(selected) - len(values),
                exceedances=above, permissible=sum(v > permissible for v in values),
                rate=above / len(values) * 100 if values else None,
                median=median(values) if values else None, max=max(values) if values else None,
                bins=[sum(v <= .5 for v in ratios), sum(.5 < v <= 1 for v in ratios),
                      sum(1 < v <= 2 for v in ratios), sum(2 < v <= 4 for v in ratios),
                      sum(v > 4 for v in ratios)])


districts = {}
for parameter, limits in parameters.items():
    districts[parameter] = {}
    for state, district in sorted({(r['State'], r['District']) for r in rows}):
        selected = [r for r in rows if r['State'] == state and r['District'] == district]
        districts[parameter][f'{district}, {state}'] = stats(selected, *limits)

scopes = {}
for state in ["all", "Haryana", "Rajasthan"]:
    for year in ["all", "2019", "2020", "2021", "2022", "2023"]:
        selected = [r for r in rows if (state == "all" or r["State"] == state)
                    and (year == "all" or r["sample_year"] == year)]
        metrics = {key: stats(selected, *p) for key, p in parameters.items()}
        scopes[f"{state}:{year}"] = dict(samples=len(selected),
            districts=len({(r["State"], r["District"]) for r in selected}),
            measured_parameters=sum(v["valid"] > 0 for v in metrics.values()), metrics=metrics)

print(json.dumps(dict(sha256=hashlib.sha256(path.read_bytes()).hexdigest(), scopes=scopes, districts=districts,
    rows=[dict(id=r["sample_id"], state=r["State"], district=r["District"], station=r["Station"],
               values={key: float(r[p[0]]) if r[p[0]].strip() else None for key, p in parameters.items()}) for r in rows],
    missing={column: sum(not r[column].strip() for r in rows)
             for column in ["Fluoride (mg/L)", "Nitrate N (mgN/L)"]})))
