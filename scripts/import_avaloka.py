"""Import manually reviewed, original Avaloka responses. Never generate findings."""
from pathlib import Path
from datetime import datetime
import argparse
import hashlib
import json
import math
import shutil
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]


def require_text(obj, key):
    value = obj.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} must contain original / reviewed text")


def validate(bundle):
    provenance = json.loads((ROOT / "data/processed/provenance.json").read_text())
    if bundle.get("dataset_sha256") != provenance["csv_sha256"]:
        raise ValueError("Dataset hash does not match avaloka-ready.csv")
    if bundle.get("status") != "verified" or bundle.get("provider") != "Avaloka" or bundle.get("method") != "manual_web":
        raise ValueError("Only reviewed manual Avaloka findings can be imported")
    require_text(bundle, "dataset_id")
    url = urlparse(bundle.get("project_url") or "")
    if url.scheme != "https" or url.hostname != "app.avaloka.ai":
        raise ValueError("Provide the actual HTTPS Avaloka project URL")
    insights = bundle.get("insights")
    if not isinstance(insights, list) or not insights:
        raise ValueError("At least one actual finding is required")
    used_ids = set()
    for insight in insights:
        for key in ["id", "question", "finding", "original_response", "explanation", "coverage", "evidence_file", "reviewed_at"]:
            require_text(insight, key)
        if insight["id"] in used_ids:
            raise ValueError("Insight IDs must be unique")
        used_ids.add(insight["id"])
        if insight.get("verified") is not True:
            raise ValueError("Each finding requires explicit human verification")
        datetime.fromisoformat(insight["reviewed_at"].replace("Z", "+00:00"))
        values = insight.get("supporting_values")
        if not isinstance(values, list) or not values:
            raise ValueError("Provide the supporting measured / computed values")
        for value in values:
            require_text(value, "label")
            require_text(value, "unit")
            number = value.get("value")
            if isinstance(number, bool) or not isinstance(number, (int, float)) or not math.isfinite(number):
                raise ValueError("Supporting values must be finite numbers from the actual analysis")
        limitations = insight.get("limitations")
        if not isinstance(limitations, list) or not limitations or not all(isinstance(x, str) and x.strip() for x in limitations):
            raise ValueError("Every finding needs specific analytical limitations")
        evidence = (ROOT / insight["evidence_file"]).resolve()
        evidence_root = (ROOT / "data/avaloka-evidence").resolve()
        if not evidence.is_relative_to(evidence_root) or not evidence.is_file() or evidence.suffix not in [".txt", ".md"]:
            raise ValueError("Original evidence must be a .txt or .md file under data/avaloka-evidence/")
        if insight["original_response"].strip() not in evidence.read_text():
            raise ValueError("Original response must appear verbatim in the evidence file")
        insight["evidence_sha256"] = hashlib.sha256(evidence.read_bytes()).hexdigest()
        insight["evidence_file"] = str(evidence.relative_to(ROOT))
    return bundle


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="JSON containing actual responses and reviewed findings")
    args = parser.parse_args()
    bundle = validate(json.loads(args.input.read_text()))
    # Keep the independently checked CSV export intact. Conversational evidence
    # has its own bundle so either verifier can be rerun without erasing the other.
    for insight in bundle["insights"]:
        source = ROOT / insight["evidence_file"]
        target = ROOT / "public/data/avaloka-evidence" / source.name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        insight["public_evidence_url"] = f"/data/avaloka-evidence/{source.name}"
    encoded = json.dumps(bundle, indent=2, allow_nan=False)
    (ROOT / "data/avaloka-chat-insights.json").write_text(encoded + "\n")
    (ROOT / "public/data/avaloka-chat-insights.json").write_text(encoded + "\n")
    print(f"Imported {len(bundle['insights'])} human-reviewed Avaloka findings. Rebuild and redeploy the dashboard.")


if __name__ == "__main__":
    main()
