"""papers/analysis/hs_crosstabs.py — Generate HS cross-tabulations for Paper D."""
import json
import csv
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = Path(__file__).resolve().parent

def load_hs_posts():
    with open(ROOT / "docs/data/hate_speech_posts.json") as f:
        return json.load(f)

def crosstab(posts, row_key, col_key):
    """Build a row_key x col_key frequency table."""
    table = defaultdict(Counter)
    for p in posts:
        r = p.get(row_key, "unknown")
        c = p.get(col_key, "unknown")
        table[r][c] += 1
    return table

def write_crosstab(table, filename, row_label, col_labels=None):
    """Write crosstab to CSV."""
    if col_labels is None:
        col_labels = sorted({c for row in table.values() for c in row})
    with open(OUT / filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([row_label] + col_labels + ["Total"])
        for row_name in sorted(table):
            counts = [table[row_name].get(c, 0) for c in col_labels]
            writer.writerow([row_name] + counts + [sum(counts)])
        # Totals row
        totals = [sum(table[r].get(c, 0) for r in table) for c in col_labels]
        writer.writerow(["Total"] + totals + [sum(totals)])

def main():
    posts = load_hs_posts()
    print(f"Loaded {len(posts)} posts")

    # Country x Subtype
    ct1 = crosstab(posts, "c", "gt")
    write_crosstab(ct1, "hs_country_subtype.csv", "Country")
    print("Wrote hs_country_subtype.csv")

    # Country x Platform
    ct2 = crosstab(posts, "c", "p")
    write_crosstab(ct2, "hs_country_platform.csv", "Country")
    print("Wrote hs_country_platform.csv")

    # Country x Prediction (Normal/Abusive/Hate)
    ct3 = crosstab(posts, "c", "pr")
    write_crosstab(ct3, "hs_prediction_distribution.csv", "Country")
    print("Wrote hs_prediction_distribution.csv")

    # Country x Toxicity level
    ct4 = crosstab(posts, "c", "tx")
    write_crosstab(ct4, "hs_country_toxicity.csv", "Country")
    print("Wrote hs_country_toxicity.csv")

    # Platform x Subtype
    ct5 = crosstab(posts, "p", "gt")
    write_crosstab(ct5, "hs_platform_subtype.csv", "Platform")
    print("Wrote hs_platform_subtype.csv")

    # Temporal distribution (month x country)
    month_country = defaultdict(Counter)
    for p in posts:
        date = p.get("d", "")
        if len(date) >= 7:
            month = date[:7]  # YYYY-MM
            month_country[month][p.get("c", "unknown")] += 1
    countries = sorted({c for row in month_country.values() for c in row})
    with open(OUT / "hs_temporal_distribution.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Month"] + countries + ["Total"])
        for month in sorted(month_country):
            counts = [month_country[month].get(c, 0) for c in countries]
            w.writerow([month] + counts + [sum(counts)])
        # Totals row
        totals = [sum(month_country[m].get(c, 0) for m in month_country) for c in countries]
        w.writerow(["Total"] + totals + [sum(totals)])
    print("Wrote hs_temporal_distribution.csv")

if __name__ == "__main__":
    main()
