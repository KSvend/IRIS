"""papers/evaluation/export_annotations.py — Export human annotations from Supabase to JSON."""
import json
import os
from pathlib import Path

try:
    from supabase import create_client
except ImportError:
    print("supabase not installed. Run: pip install supabase")
    exit(1)

OUT = Path(__file__).resolve().parent


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("Set SUPABASE_URL and SUPABASE_KEY environment variables")
        exit(1)

    client = create_client(url, key)

    result = client.table("blind_annotations").select("*").eq("pass", 1).execute()
    annotations = result.data if result.data else []
    print(f"Fetched {len(annotations)} blind annotations (pass 1)")

    normalized = []
    for a in annotations:
        normalized.append({
            "post_id": a["post_id"],
            "reviewer": a["reviewer"],
            "classification": a["classification"],
            "subtype": a.get("subtype"),
            "confidence": a.get("confidence"),
            "note": a.get("note"),
            "created_at": a.get("created_at"),
        })

    with open(OUT / "human_annotations.json", "w") as f:
        json.dump(normalized, f, indent=2, ensure_ascii=False)
    print(f"Wrote human_annotations.json ({len(normalized)} annotations)")

    result2 = client.table("blind_annotations").select("*").eq("pass", 2).execute()
    corrections = result2.data if result2.data else []
    print(f"Fetched {len(corrections)} correction annotations (pass 2)")

    if corrections:
        with open(OUT / "pass2_corrections.json", "w") as f:
            json.dump(corrections, f, indent=2, ensure_ascii=False)
        print(f"Wrote pass2_corrections.json")


if __name__ == "__main__":
    main()
