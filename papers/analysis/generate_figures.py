"""papers/analysis/generate_figures.py — Generate paper figures from analysis CSVs."""
import csv
import os
from pathlib import Path

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.ticker as ticker
except ImportError:
    print("matplotlib not installed. Run: pip install matplotlib")
    exit(1)

ANALYSIS = Path(__file__).resolve().parent
FIGURES = ANALYSIS.parent / "figures"

def read_crosstab(filename):
    """Read a crosstab CSV into {row: {col: count}}."""
    with open(ANALYSIS / filename, newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        cols = header[1:-1]  # skip row label and Total
        data = {}
        for row in reader:
            if row[0] == "Total":
                continue
            data[row[0]] = {c: int(v) for c, v in zip(cols, row[1:-1])}
    return cols, data

def fig_country_subtype():
    """Stacked bar chart: HS subtypes by country."""
    cols, data = read_crosstab("hs_country_subtype.csv")
    countries = sorted(data.keys())
    fig, ax = plt.subplots(figsize=(10, 6))
    bottom = [0] * len(countries)
    for col in cols:
        values = [data[c].get(col, 0) for c in countries]
        ax.bar(countries, values, bottom=bottom, label=col)
        bottom = [b + v for b, v in zip(bottom, values)]
    ax.set_ylabel("Number of Posts")
    ax.set_title("Hate Speech Subtypes by Country")
    ax.legend(bbox_to_anchor=(1.05, 1), loc="upper left", fontsize=8)
    plt.tight_layout()
    plt.savefig(FIGURES / "fig_country_subtype.png", dpi=150)
    plt.close()
    print("Saved fig_country_subtype.png")

def fig_platform_distribution():
    """Grouped bar: HS volume by platform and country."""
    cols, data = read_crosstab("hs_country_platform.csv")
    countries = sorted(data.keys())
    fig, ax = plt.subplots(figsize=(8, 5))
    x = range(len(countries))
    width = 0.8 / max(len(cols), 1)
    for i, platform in enumerate(cols):
        values = [data[c].get(platform, 0) for c in countries]
        offset = (i - len(cols)/2 + 0.5) * width
        ax.bar([xi + offset for xi in x], values, width, label=platform)
    ax.set_xticks(x)
    ax.set_xticklabels(countries)
    ax.set_ylabel("Number of Posts")
    ax.set_title("Hate Speech Posts by Platform and Country")
    ax.legend()
    plt.tight_layout()
    plt.savefig(FIGURES / "fig_platform_distribution.png", dpi=150)
    plt.close()
    print("Saved fig_platform_distribution.png")

def fig_prediction_distribution():
    """Pie chart: overall prediction distribution."""
    cols, data = read_crosstab("hs_prediction_distribution.csv")
    totals = {c: sum(data[country].get(c, 0) for country in data) for c in cols}
    labels = list(totals.keys())
    sizes = list(totals.values())
    colors = {"Hate": "#d32f2f", "Abusive": "#f57c00", "Normal": "#757575",
              "Questionable": "#fbc02d"}
    fig, ax = plt.subplots(figsize=(7, 7))
    ax.pie(sizes, labels=labels, autopct="%1.1f%%",
           colors=[colors.get(l, "#999") for l in labels])
    ax.set_title("Overall Classification Distribution")
    plt.tight_layout()
    plt.savefig(FIGURES / "fig_prediction_distribution.png", dpi=150)
    plt.close()
    print("Saved fig_prediction_distribution.png")

def fig_temporal_trend():
    """Line chart: HS posts over time by country."""
    with open(ANALYSIS / "hs_temporal_distribution.csv", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        countries = header[1:-1]
        months = []
        data = {c: [] for c in countries}
        for row in reader:
            months.append(row[0])
            for i, c in enumerate(countries):
                data[c].append(int(row[i + 1]))
    fig, ax = plt.subplots(figsize=(10, 5))
    for c in countries:
        ax.plot(months, data[c], marker="o", label=c)
    ax.set_ylabel("Number of Posts")
    ax.set_title("Hate Speech Posts Over Time by Country")
    ax.legend()
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(FIGURES / "fig_temporal_trend.png", dpi=150)
    plt.close()
    print("Saved fig_temporal_trend.png")

def main():
    os.makedirs(FIGURES, exist_ok=True)
    fig_country_subtype()
    fig_platform_distribution()
    fig_prediction_distribution()
    fig_temporal_trend()
    print(f"\nAll figures saved to {FIGURES}")

if __name__ == "__main__":
    main()
