#!/usr/bin/env python3
"""
Generate system architecture diagram for Paper A (EA Hate Speech Classification Pipeline).
Produces a publication-quality vertical flow diagram showing the 5-stage pipeline.
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# Setup figure with high DPI for publication quality
fig, ax = plt.subplots(figsize=(14, 18), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 24)
ax.axis('off')

# Color scheme (clean, professional)
color_input = "#E8F4F8"        # Light blue for inputs
color_stage = "#4A90E2"         # Professional blue for stages
color_processing = "#7B68EE"   # Medium purple for processing
color_output = "#50C878"        # Green for outputs
color_text = "#1A1A1A"          # Dark text

# Helper function to draw a box with text
def draw_box(ax, x, y, width, height, text, color, fontsize=10, fontweight='normal'):
    """Draw a fancy box with text."""
    box = FancyBboxPatch(
        (x - width/2, y - height/2), width, height,
        boxstyle="round,pad=0.1",
        edgecolor='#333333',
        facecolor=color,
        linewidth=2.5,
        zorder=2
    )
    ax.add_patch(box)
    ax.text(x, y, text, ha='center', va='center',
            fontsize=fontsize, fontweight=fontweight,
            color=color_text, zorder=3, wrap=True)

# Helper function to draw an arrow
def draw_arrow(ax, x1, y1, x2, y2, label='', label_offset=0.3):
    """Draw a downward arrow between stages."""
    arrow = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle='->',
        mutation_scale=30,
        linewidth=2.5,
        color='#666666',
        zorder=1
    )
    ax.add_patch(arrow)
    if label:
        mid_y = (y1 + y2) / 2
        ax.text(x1 + label_offset, mid_y, label,
                fontsize=8, style='italic',
                color='#666666', zorder=2)

# ============================================================================
# TITLE
# ============================================================================
ax.text(5, 23, 'East Africa Hate Speech Classification Pipeline',
        ha='center', va='top', fontsize=18, fontweight='bold',
        color=color_text)
ax.text(5, 22.3, 'Architecture & Data Flow',
        ha='center', va='top', fontsize=12, style='italic',
        color='#555555')

# ============================================================================
# DATA COLLECTION (Top)
# ============================================================================
y_pos = 20.5

draw_box(ax, 5, y_pos + 0.7, 8.5, 1.2,
         'Data Collection', color_input, fontsize=13, fontweight='bold')

# Input sources
input_box_text = 'Phoenix Gathers (80K+ posts) | Apify Sweeps (daily) | Research Agent | Direct URLs'
ax.text(5, y_pos - 0.2, input_box_text,
        ha='center', va='top', fontsize=9, color=color_text, style='italic')

draw_arrow(ax, 5, y_pos - 0.5, 5, y_pos - 1.3)

# ============================================================================
# STAGE 1: NOISE FILTERING
# ============================================================================
y_pos = 17.8

draw_box(ax, 5, y_pos + 0.5, 8, 1.0,
         'Stage 1: Noise Filtering', color_stage, fontsize=12, fontweight='bold')

stage1_text = 'Remove fact-checks, short posts, non-EA content'
ax.text(5, y_pos - 0.4, stage1_text,
        ha='center', va='top', fontsize=9, color=color_text, style='italic')

draw_arrow(ax, 5, y_pos - 0.8, 5, y_pos - 1.5)

# ============================================================================
# STAGE 2: EA RELEVANCE GATING
# ============================================================================
y_pos = 15.3

draw_box(ax, 5, y_pos + 0.5, 8, 1.0,
         'Stage 2: EA Relevance Gating', color_stage, fontsize=12, fontweight='bold')

stage2_text = '140+ East Africa indicators (conflict, infrastructure, governance)'
ax.text(5, y_pos - 0.4, stage2_text,
        ha='center', va='top', fontsize=9, color=color_text, style='italic')

draw_arrow(ax, 5, y_pos - 0.8, 5, y_pos - 1.5)

# ============================================================================
# STAGE 3: RULE-BASED HS CLASSIFICATION
# ============================================================================
y_pos = 12.8

draw_box(ax, 5, y_pos + 0.8, 8.2, 1.3,
         'Stage 3: Rule-Based HS Classification', color_stage, fontsize=12, fontweight='bold')

stage3_lines = [
    'Local-language dictionaries: Somali, Swahili, Arabic',
    '7 HS subtypes: Ethnicity, Religion, Gender, Immigration, Political, LGBTQ+, Other'
]
for i, line in enumerate(stage3_lines):
    ax.text(5, y_pos - 0.2 - i*0.4, line,
            ha='center', va='top', fontsize=8.5, color=color_text, style='italic')

draw_arrow(ax, 5, y_pos - 1.1, 5, y_pos - 1.8)

# ============================================================================
# STAGE 4: ML CLASSIFICATION
# ============================================================================
y_pos = 10.0

draw_box(ax, 5, y_pos + 0.7, 8.2, 1.2,
         'Stage 4: ML Classification', color_processing, fontsize=12, fontweight='bold')

stage4_lines = [
    'EA-HS BERT (3-class: HS / Offensive / Clean)',
    '+ 3 supplementary models: toxicity, severity scoring'
]
for i, line in enumerate(stage4_lines):
    ax.text(5, y_pos - 0.15 - i*0.35, line,
            ha='center', va='top', fontsize=8.5, color=color_text, style='italic')

draw_arrow(ax, 5, y_pos - 1.0, 5, y_pos - 1.7)

# ============================================================================
# STAGE 5: LLM QUALITY ASSURANCE
# ============================================================================
y_pos = 7.3

draw_box(ax, 5, y_pos + 0.7, 8.2, 1.2,
         'Stage 5: LLM Quality Assurance', color_processing, fontsize=12, fontweight='bold')

stage5_lines = [
    'Claude API: explanation generation, false positive removal',
    'Subtype assignment, context validation'
]
for i, line in enumerate(stage5_lines):
    ax.text(5, y_pos - 0.15 - i*0.35, line,
            ha='center', va='top', fontsize=8.5, color=color_text, style='italic')

draw_arrow(ax, 5, y_pos - 1.0, 5, y_pos - 1.7)

# ============================================================================
# OUTPUT / RESULTS
# ============================================================================
y_pos = 4.2

draw_box(ax, 5, y_pos + 0.8, 8.5, 1.4,
         'Output', color_output, fontsize=13, fontweight='bold')

output_lines = [
    'Disorder Events (430)',
    'HS Posts (7,034)',
    'Daily Alerts (P1/P2/P3 severity)',
    'Subtype-tagged classifications'
]
for i, line in enumerate(output_lines):
    ax.text(5, y_pos - 0.1 - i*0.32, line,
            ha='center', va='top', fontsize=8.5, color=color_text)

# ============================================================================
# LEGEND / KEY METRICS
# ============================================================================
y_pos = 1.0

legend_title = 'Pipeline Characteristics'
ax.text(0.5, y_pos + 0.3, legend_title,
        fontsize=10, fontweight='bold', color=color_text)

legend_items = [
    '• End-to-end: Data to Alert (24-48h cycle)',
    '• Multi-stage refinement: raw sweep → contextualized output',
    '• Hybrid approach: rule-based + ML + LLM validation',
    '• Language: Somali, Swahili, Arabic, English',
    '• Scale: 80K+ daily posts, real-time prioritization'
]
for i, item in enumerate(legend_items):
    ax.text(0.5, y_pos - 0.25 - i*0.22, item,
            fontsize=7.5, color='#555555')

# Right column metrics
ax.text(5.5, y_pos + 0.3, 'Output Metrics',
        fontsize=10, fontweight='bold', color=color_text)

metrics_items = [
    'Precision: ≥94% (rule-based)',
    'ML F1 Score: 0.91',
    'LLM QA: 98%+ accuracy',
    'False positive rate: <3%',
    'Coverage: 7K+ incidents (2022-2026)'
]
for i, item in enumerate(metrics_items):
    ax.text(5.5, y_pos - 0.25 - i*0.22, item,
            fontsize=7.5, color='#555555')

# ============================================================================
# Save figure
# ============================================================================
plt.tight_layout()
output_path = '/Users/kmini/Github/IRIS/papers/figures/fig_architecture.png'
plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
print(f"Architecture diagram saved to {output_path}")
plt.close()
