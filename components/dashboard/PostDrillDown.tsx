"use client";

import { useState, useEffect, useCallback } from "react";
import { NARRATIVE_TOPICS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/constants";
import type { CountryCode, NarrativeCategory, ToxicityLevel } from "@/lib/types";

interface PostSummary {
  postId: string;
  platform: string;
  postDate: string;
  postText: string;
  commentId?: string;
  commentText?: string;
  commentDate?: string;
  country: string;
  primaryTopic: string;
  eaHsPred: string;
  eaHsConf: number;
  eaHsNormal: number;
  eaHsAbusive: number;
  eaHsHate: number;
  probToxicity: ToxicityLevel;
  probSevereToxicity: ToxicityLevel;
  probInsult: ToxicityLevel;
  probIdentityAttack: ToxicityLevel;
  probThreat: ToxicityLevel;
  countryModelPred?: string;
  countryModelConf?: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
}

interface Props {
  topicId: string;
  country?: CountryCode;
  onClose: () => void;
}

const EA_HS_COLORS: Record<string, string> = {
  Hate: "#D05454",
  Abusive: "#E07B39",
  Normal: "#3BAA7F",
};

const TOXICITY_COLORS: Record<ToxicityLevel, string> = {
  high: "#D05454",
  medium: "#E07B39",
  low: "#D4922A",
  none: "#9A9A94",
};

function EaHsBar({ normal, abusive, hate }: { normal: number; abusive: number; hate: number }) {
  const total = normal + abusive + hate;
  if (total === 0) return null;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
      {hate > 0 && (
        <div
          className="h-full"
          style={{ width: `${(hate / total) * 100}%`, backgroundColor: EA_HS_COLORS.Hate }}
        />
      )}
      {abusive > 0 && (
        <div
          className="h-full"
          style={{ width: `${(abusive / total) * 100}%`, backgroundColor: EA_HS_COLORS.Abusive }}
        />
      )}
      {normal > 0 && (
        <div
          className="h-full"
          style={{ width: `${(normal / total) * 100}%`, backgroundColor: EA_HS_COLORS.Normal }}
        />
      )}
    </div>
  );
}

function ToxicityPill({ level, label }: { level: ToxicityLevel; label: string }) {
  if (level === "none") return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: `${TOXICITY_COLORS[level]}12`,
        color: TOXICITY_COLORS[level],
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: TOXICITY_COLORS[level] }}
      />
      {label}
    </span>
  );
}

export function PostDrillDown({ topicId, country, onClose }: Props) {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const topic = NARRATIVE_TOPICS.find((t) => t.id === topicId);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ topic: topicId, limit: "30" });
    if (country) params.set("country", country);

    try {
      const res = await fetch(`/api/posts?${params}`);
      const json = await res.json();
      setPosts(json.posts || []);
      setTotalCount(json.totalCount || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [topicId, country]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (!topic) return null;

  const categoryColor = CATEGORY_COLORS[topic.category];

  // Aggregate EA-HS distribution across all posts
  const eaHsDist = posts.reduce(
    (acc, p) => {
      if (p.eaHsPred === "Hate") acc.hate++;
      else if (p.eaHsPred === "Abusive") acc.abusive++;
      else acc.normal++;
      return acc;
    },
    { hate: 0, abusive: 0, normal: 0 }
  );

  // Aggregate toxicity levels
  const toxAgg = posts.reduce(
    (acc, p) => {
      if (p.probToxicity === "high") acc.high++;
      else if (p.probToxicity === "medium") acc.medium++;
      else if (p.probToxicity === "low") acc.low++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">
              {CATEGORY_LABELS[topic.category]} &middot; {topic.subcategory}
            </span>
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)]">
            {topic.label}
          </h3>
          {topic.description && (
            <p className="text-[13px] leading-relaxed text-[var(--text-secondary)] max-w-[480px]">
              {topic.description}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-all duration-[150ms]"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md bg-[var(--surface-muted)] px-3 py-2.5">
          <div className="text-[20px] font-medium text-[var(--text-primary)] tabular-nums">
            {totalCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">Total posts</div>
        </div>
        <div className="rounded-md bg-[var(--surface-muted)] px-3 py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] font-medium tabular-nums" style={{ color: EA_HS_COLORS.Hate }}>
              {eaHsDist.hate}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">hate</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">EA-HS classification</div>
        </div>
        <div className="rounded-md bg-[var(--surface-muted)] px-3 py-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] font-medium tabular-nums" style={{ color: TOXICITY_COLORS.high }}>
              {toxAgg.high}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">high tox.</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">Phoenix toxicity</div>
        </div>
      </div>

      {/* EA-HS distribution bar */}
      {posts.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-[var(--text-muted)]">
            EA-HS model distribution
          </div>
          <EaHsBar
            normal={eaHsDist.normal}
            abusive={eaHsDist.abusive}
            hate={eaHsDist.hate}
          />
          <div className="flex gap-4 text-[10px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: EA_HS_COLORS.Hate }} />
              Hate {eaHsDist.hate}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: EA_HS_COLORS.Abusive }} />
              Abusive {eaHsDist.abusive}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: EA_HS_COLORS.Normal }} />
              Normal {eaHsDist.normal}
            </span>
          </div>
        </div>
      )}

      {/* Post list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-[13px] text-[var(--text-muted)]">Loading posts&hellip;</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-[13px] text-[var(--text-muted)]">No posts found for this topic</div>
        </div>
      ) : (
        <div className="max-h-[440px] overflow-y-auto space-y-2 scrollbar-thin">
          {posts.map((post, idx) => {
            const text = post.commentText || post.postText;
            const date = post.commentDate || post.postDate;
            const predColor = EA_HS_COLORS[post.eaHsPred] || "#9A9A94";

            return (
              <div
                key={`${post.postId}-${post.commentId || idx}`}
                className="rounded-md border border-[var(--border-subtle)] px-4 py-3 space-y-2 hover:border-[var(--border-strong)] transition-all duration-[150ms]"
              >
                {/* Post meta row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <span className="font-medium uppercase">{post.platform}</span>
                    <span>&middot;</span>
                    <span>{date}</span>
                    {post.commentId && (
                      <>
                        <span>&middot;</span>
                        <span className="text-[var(--accent)]">comment</span>
                      </>
                    )}
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${predColor}15`,
                      color: predColor,
                    }}
                  >
                    {post.eaHsPred || "—"}
                    {post.eaHsConf > 0 && (
                      <span className="ml-1 opacity-70">
                        {(post.eaHsConf * 100).toFixed(0)}%
                      </span>
                    )}
                  </span>
                </div>

                {/* Post text */}
                <p className="text-[13px] leading-relaxed text-[var(--text-primary)] line-clamp-3">
                  {text || "—"}
                </p>

                {/* EA-HS bar + toxicity pills */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 max-w-[120px]">
                    <EaHsBar
                      normal={post.eaHsNormal}
                      abusive={post.eaHsAbusive}
                      hate={post.eaHsHate}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <ToxicityPill level={post.probToxicity} label="Toxic" />
                    <ToxicityPill level={post.probSevereToxicity} label="Severe" />
                    <ToxicityPill level={post.probIdentityAttack} label="Identity" />
                    <ToxicityPill level={post.probThreat} label="Threat" />
                    <ToxicityPill level={post.probInsult} label="Insult" />
                  </div>
                </div>

                {/* Engagement */}
                {(post.likeCount > 0 || post.shareCount > 0 || post.commentCount > 0) && (
                  <div className="flex gap-3 text-[10px] text-[var(--text-muted)]">
                    {post.likeCount > 0 && <span>{post.likeCount.toLocaleString()} likes</span>}
                    {post.shareCount > 0 && <span>{post.shareCount.toLocaleString()} shares</span>}
                    {post.commentCount > 0 && <span>{post.commentCount.toLocaleString()} comments</span>}
                  </div>
                )}
              </div>
            );
          })}

          {totalCount > posts.length && (
            <div className="text-center py-2 text-[11px] text-[var(--text-muted)]">
              Showing {posts.length} of {totalCount.toLocaleString()} posts
            </div>
          )}
        </div>
      )}
    </div>
  );
}
