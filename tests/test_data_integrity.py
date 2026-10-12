"""Independent checks of original measurements and manual evidence boundaries."""
from pathlib import Path
import hashlib
import importlib.util
import json
import unittest
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("import_avaloka", ROOT / "scripts/import_avaloka.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class DataIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.provenance = json.loads((ROOT / "data/processed/provenance.json").read_text())
        cls.dashboard = json.loads((ROOT / "public/data/dashboard.json").read_text())
        cls.csv = pd.read_csv(ROOT / "data/processed/avaloka-ready.csv")

    def test_originals_and_cleaned_file_match_documented_hashes(self):
        for source in self.provenance["sources"]:
            path = ROOT / source["file"]
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), source["sha256"])
            self.assertEqual(len(pd.read_csv(path)), source["rows"])
        self.assertEqual(hashlib.sha256((ROOT / "data/processed/avaloka-ready.csv").read_bytes()).hexdigest(), self.provenance["csv_sha256"])

    def test_every_selected_measurement_matches_the_preserved_original(self):
        originals = {s["file"].split("/")[-1]: pd.read_csv(ROOT / s["file"]).set_index("SlNo") for s in self.provenance["sources"]}
        columns = [p["source_column"] for p in self.dashboard["parameters"]]
        for _, row in self.csv.iterrows():
            original = originals[row["source_file"]].loc[row["source_row"]]
            self.assertEqual(row["State"], original["State"].strip())
            self.assertEqual(row["Station"], original["Station"].strip())
            for column in columns:
                if pd.isna(original[column]): self.assertTrue(pd.isna(row[column]))
                else: self.assertEqual(row[column], original[column])

    def test_subset_period_counts_and_missing_fields_are_authentic(self):
        self.assertEqual(len(self.csv), 3415)
        self.assertEqual(self.csv.groupby(["State", "District"]).ngroups, 55)
        self.assertTrue(self.csv["sample_year"].between(2019, 2023).all())
        for column in ["Fluoride (mg/L)", "Nitrate N (mgN/L)", "Total Alkalinity (mg/L as CaCO3)"]:
            self.assertEqual(self.csv[column].notna().sum(), 0)
        self.assertEqual(set(p["id"] for p in self.dashboard["parameters"]), {"chloride", "sulphate", "arsenic", "iron", "tds", "hardness"})

    def test_denominators_and_exceedances_are_recalculated_directly_from_csv(self):
        for p in self.dashboard["parameters"]:
            values = pd.to_numeric(self.csv[p["source_column"]], errors="coerce").dropna()
            values = values[values.ge(0)]
            metrics = self.dashboard["statistics"][p["id"]]
            self.assertEqual(len(values), metrics["valid"])
            self.assertEqual(int(values.gt(p["acceptable"]).sum()), metrics["exceedances"])
            self.assertEqual(int(values.gt(p["permissible"]).sum()), metrics["permissible_exceedances"])

    def test_pending_and_wrong_dataset_outputs_cannot_be_imported(self):
        pending = json.loads((ROOT / "data/avaloka-insights.json").read_text())
        if pending["status"] == "pending":
            self.assertEqual(pending["insights"], [])
            with self.assertRaises(ValueError): importer.validate(pending)
        template = json.loads((ROOT / "data/avaloka-import-template.json").read_text())
        with self.assertRaises(ValueError): importer.validate(template)


if __name__ == "__main__":
    unittest.main()
