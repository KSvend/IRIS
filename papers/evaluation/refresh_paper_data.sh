#!/bin/bash
# papers/evaluation/refresh_paper_data.sh — Regenerate all paper analysis with latest data.
set -e

cd "$(dirname "$0")/../.."
echo "=== IRIS Paper Data Refresh ==="
echo "Date: $(date -u +%Y-%m-%d)"

echo ""
echo "--- Step 1: Data summary ---"
python papers/analysis/load_data.py

echo ""
echo "--- Step 2: HS cross-tabulations ---"
python papers/analysis/hs_crosstabs.py

echo ""
echo "--- Step 3: Disinformation analysis ---"
python papers/analysis/disinfo_analysis.py

echo ""
echo "--- Step 4: Pipeline metrics ---"
python papers/analysis/pipeline_metrics.py

echo ""
echo "--- Step 5: Generate figures ---"
python papers/analysis/generate_figures.py

echo ""
echo "--- Step 6: Agreement analysis (if annotations available) ---"
python papers/evaluation/compute_agreement.py || echo "Skipped: annotations not yet available"

echo ""
echo "=== Refresh complete ==="
echo "Review papers/analysis/ and papers/figures/ for updated outputs."
echo "Don't forget to update paper drafts with new numbers!"
