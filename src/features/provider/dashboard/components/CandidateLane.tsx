"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Clock, MessageSquare, Users } from "lucide-react";
import { dashboardCopy } from "../copy/dashboard";
import "./CandidateLane.css";
import { FlagChip } from "./FlagChip";
import { useBeat, useLaneRows } from "./candidate-lane-hooks";
import type { Candidate } from "../types";
import {
  COL,
  DARK,
  LIGHT,
  MID,
  MONO,
  ROW,
  STRENGTH_DARK,
  STRENGTH_LIGHT,
  TIERS,
  strengthAt,
  tierAt,
} from "./candidate-lane-tokens";

export type CandidateLaneProps = {
  actives: Candidate[];
  waitingCount: number;
  announceWaitingStatus?: boolean;
  theme?: "dark" | "light";
  capacity?: number;
};

export function CandidateLane({
  actives,
  waitingCount,
  announceWaitingStatus = true,
  theme = "dark",
  capacity = 5,
}: CandidateLaneProps) {
  const observed = useRef<HTMLDivElement | null>(null);
  const ro = useRef<ResizeObserver | null>(null);
  const [width, setWidth] = useState(1200);

  const measure = useCallback(() => {
    const el = observed.current;
    if (!el || !el.isConnected) return;
    const cs = getComputedStyle(el);
    setWidth(
      el.clientWidth -
        parseFloat(cs.paddingLeft || "0") -
        parseFloat(cs.paddingRight || "0"),
    );
  }, []);

  const setLaneRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (observed.current === el) return;
      ro.current?.disconnect();
      ro.current = null;
      observed.current = el;
      if (!el) return;
      if (typeof ResizeObserver !== "undefined") {
        ro.current = new ResizeObserver((entries) => {
          const entry = entries[entries.length - 1];
          if (entry) setWidth(entry.contentRect.width);
        });
        ro.current.observe(el);
      }
      measure();
    },
    [measure],
  );

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.current?.disconnect();
    };
  }, [measure]);

  const narrow = width < 660;
  const mid = !narrow && width < 1000;

  const rows = useLaneRows(actives);
  const liveCount = rows.length;
  const waiting = waitingCount;
  const hasWaiting = waiting > 0;

  const countBeat = useBeat(liveCount);
  const waitBeat = useBeat(waiting);

  const light = theme === "light";

  const ti = useMemo(
    () =>
      Math.max(
        0,
        TIERS.findIndex((x) => waiting <= x.max),
      ),
    [waiting],
  );
  const tier = tierAt(ti);

  const tierColor = light ? tier.light : tier.dark;
  const strength = strengthAt(light ? STRENGTH_LIGHT : STRENGTH_DARK, ti);
  const prevRgb = tierAt(Math.max(0, ti - 1)).rgb;
  const mid1 = `rgba(${prevRgb},${(strength * 0.45).toFixed(3)})`;
  const end1 = `rgba(${tier.rgb},${strength})`;

  const shell = {
    ...(light ? LIGHT : DARK),
    ...(narrow ? COL : ROW),
    ...(mid ? MID : null),
    "--rq-press": tierColor,
    "--rq-press-hatch": `rgba(${tier.rgb},${(light ? 0.3 + ti * 0.04 : 0.055 + ti * 0.015).toFixed(3)})`,
    "--rq-press-glow": `rgba(${tier.rgb},${(light ? 0.45 : 0.11 + ti * 0.04).toFixed(3)})`,
  } as CSSProperties;

  const seamAt = narrow ? 52 : mid ? 84 : 118;
  const bandThick = 9 + ti * 2.2;

  const pressBand: CSSProperties = narrow
    ? {
        position: "absolute",
        pointerEvents: "none",
        zIndex: 0,
        bottom: seamAt,
        right: 0,
        width: bandThick,
        height: Math.round(tier.band * 0.62),
        background: `linear-gradient(to bottom, transparent, ${mid1} 52%, ${end1})`,
        animation: `rqPressPushY ${tier.ms}s cubic-bezier(.4,0,.5,1) infinite`,
      }
    : {
        position: "absolute",
        pointerEvents: "none",
        zIndex: 0,
        bottom: 0,
        right: seamAt,
        width: tier.band,
        height: bandThick,
        background: `linear-gradient(to right, transparent, ${mid1} 52%, ${end1})`,
        animation: `rqPressPushX ${tier.ms}s cubic-bezier(.4,0,.5,1) infinite`,
      };

  const pressSeam: CSSProperties = narrow
    ? {
        position: "absolute",
        pointerEvents: "none",
        zIndex: 3,
        left: 0,
        right: 0,
        bottom: seamAt,
        height: 1 + ti * 0.5,
        background: `linear-gradient(to right, transparent, ${tierColor} 22%, ${tierColor} 78%, transparent)`,
        animation: `rqSeamPulse ${tier.ms}s ease-in-out infinite`,
      }
    : {
        position: "absolute",
        pointerEvents: "none",
        zIndex: 3,
        top: 0,
        bottom: 0,
        right: seamAt,
        width: 1 + ti * 0.5,
        background: `linear-gradient(to bottom, transparent, ${tierColor} 18%, ${tierColor} 82%, transparent)`,
        animation: `rqSeamPulse ${tier.ms}s ease-in-out infinite`,
      };

  const fillerCount = Math.max(0, capacity - rows.length);
  const { candidates: candidateCopy, waitingQueue: waitingCopy } =
    dashboardCopy;
  const waitLabel = waitingCopy.badge(waiting);
  const waitingStatus = hasWaiting ? waitLabel : waitingCopy.capacity(capacity);
  const queueLabel =
    waiting > 4
      ? waitingCopy.queuePosition(liveCount + 1, liveCount + waiting)
      : waitingCopy.queueLabel;
  const railLabel =
    hasWaiting && !narrow
      ? waitingCopy.capacityWithQueue(capacity)
      : waitingCopy.capacity(capacity);

  const teaserAnim = narrow
    ? waitBeat % 2
      ? "rqTeaserInColA"
      : "rqTeaserInColB"
    : waitBeat % 2
      ? "rqTeaserInA"
      : "rqTeaserInB";

  return (
    <div
      ref={setLaneRef}
      data-rq-lane=""
      className="bg-background-muted rounded-lg"
      style={{
        ...shell,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Roboto, system-ui, sans-serif",
        padding: "var(--rq-panel-pad)",
        overflow: "hidden",
        boxShadow: "0 0 0 1px var(--rq-edge)",
      }}
    >
      {announceWaitingStatus ? (
        <span
          role="status"
          aria-label={waitingStatus}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {waitingStatus}
        </span>
      ) : null}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 14px",
          alignItems: "baseline",
          marginBottom: 5,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "Geist, sans-serif",
            fontSize: 17,
            fontWeight: 600,
            color: "var(--rq-text)",
          }}
        >
          {candidateCopy.title}
        </h2>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 13,
            color: "var(--rq-text)",
            animation:
              countBeat === 0
                ? undefined
                : `${countBeat % 2 ? "rqCountTickA" : "rqCountTickB"} .45s ease-out both`,
          }}
        >
          {liveCount} / {capacity} aktiv
        </span>

        {hasWaiting && (
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 12,
              color: "var(--rq-press)",
              animation: `${teaserAnim} .5s ease-out both`,
            }}
          >
            <Clock size={12} strokeWidth={2} style={{ flex: "0 0 auto" }} />
            <span style={{ whiteSpace: "nowrap" }}>{waitLabel}</span>
            {ti > 0 && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  paddingLeft: 9,
                  boxShadow: "inset 1px 0 0 var(--rq-div)",
                  whiteSpace: "nowrap",
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--rq-press)",
                    animation: `rqSeamPulse ${tier.ms}s ease-in-out infinite`,
                  }}
                />
                {tier.label}
              </span>
            )}
          </span>
        )}
      </div>

      <p
        style={{
          margin: "0 0 18px",
          fontSize: 12.5,
          lineHeight: 1.5,
          color: "var(--rq-sub)",
          maxWidth: 460,
        }}
      >
        {candidateCopy.lead}
      </p>

      <div
        style={{
          position: "relative",
          marginRight: "var(--rq-bleed-r)",
          marginBottom: "var(--rq-bleed-b)",
          borderRadius: "var(--rq-lane-radius)",
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1px var(--rq-lane-edge)",
          padding: 6,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
            opacity: 0.55,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "38%",
              background:
                "linear-gradient(90deg, transparent, var(--rq-streak), transparent)",
              animation: "rqLaneFlow 9s linear infinite",
            }}
          />
        </div>

        {hasWaiting && (
          <>
            <div style={pressBand} />
            <div style={pressSeam} />
          </>
        )}

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: narrow ? "column" : "row",
            alignItems: "stretch",
          }}
        >
          {rows.map(({ item, state }) => {
            const enterName = narrow ? "rqRowEnter" : "rqCardEnter";
            const anim =
              state === "entering"
                ? `${enterName} .55s cubic-bezier(.22,.61,.36,1) both`
                : undefined;
            const warnings = item.warnings;

            return (
              <div
                key={item.id}
                style={{
                  flex: "var(--rq-field-flex)",
                  minWidth: 0,
                  animation: anim,
                }}
              >
                <article
                  data-rq-candidate-card=""
                  className={
                    warnings.includes("smoking_by_arrangement") ||
                    warnings.includes("pets_by_arrangement")
                      ? "border-t-2 border-t-warning-vivid"
                      : undefined
                  }
                  style={{
                    position: "relative",
                    height: "100%",
                    boxSizing: "border-box",
                    padding: "var(--rq-pad)",
                    boxShadow: "var(--rq-card-sep-shadow)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--rq-card-hover)";
                    e.currentTarget.style.boxShadow =
                      "var(--rq-card-sep-shadow), var(--card-shadow-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.boxShadow =
                      "var(--rq-card-sep-shadow)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        flex: "0 0 auto",
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "var(--rq-avatar-bg)",
                        border: "1px solid var(--rq-avatar-bd)",
                        color: "var(--rq-avatar-tx)",
                        fontSize: 10.5,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.initials}
                    </span>
                    <span
                      style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        fontSize: "var(--rq-name-fs)",
                        fontWeight: 500,
                        color: "currentColor",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </span>
                    <MessageSquare
                      size={13}
                      strokeWidth={2}
                      style={{
                        flex: "0 0 auto",
                        color: "currentColor",
                        display: mid ? "none" : "block",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--rq-meta-gap)",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        minWidth: 0,
                        flex: "1 1 auto",
                      }}
                    >
                      <Users
                        size={11}
                        strokeWidth={2}
                        style={{ flex: "0 0 auto", color: "currentColor" }}
                      />
                      <span
                        style={{
                          fontSize: 11.5,
                          color: "currentColor",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          minWidth: 0,
                        }}
                      >
                        {item.household}
                      </span>
                    </div>
                    {warnings.includes("smoking_by_arrangement") && (
                      <FlagChip warning="smoking_by_arrangement" />
                    )}
                    {warnings.includes("pets_by_arrangement") && (
                      <FlagChip warning="pets_by_arrangement" />
                    )}
                  </div>
                </article>
              </div>
            );
          })}

          {Array.from({ length: fillerCount }, (_, i) => (
            <div
              key={`rq-filler-${i}`}
              style={{ flex: "var(--rq-field-flex)", minWidth: 0 }}
            >
              <div
                style={{
                  height: "100%",
                  boxSizing: "border-box",
                  padding: "var(--rq-pad)",
                  boxShadow: "var(--rq-sep)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  background:
                    "repeating-linear-gradient(120deg, var(--rq-empty-hatch) 0 1px, transparent 1px 9px)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      flex: "0 0 auto",
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      border: "1px dashed var(--rq-empty-bd)",
                    }}
                  />
                  <span
                    style={{
                      flex: "1 1 auto",
                      minWidth: 0,
                      fontSize: 12.5,
                      color: "var(--rq-empty-tx)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {candidateCopy.freeSlot}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "var(--rq-empty-tx)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minWidth: 0,
                  }}
                >
                  {candidateCopy.slot(rows.length + i + 1)}
                </span>
              </div>
            </div>
          ))}

          {hasWaiting && (
            <div
              style={{
                flex: "var(--rq-teaser-flex)",
                height: "var(--rq-teaser-h)",
                overflow: "hidden",
                boxShadow: "var(--rq-sep)",
                WebkitMaskImage: "var(--rq-mask)",
                maskImage: "var(--rq-mask)",
                animation: `${teaserAnim} .6s cubic-bezier(.22,.61,.36,1) both`,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "var(--rq-teaser-iw)",
                  height: "var(--rq-teaser-ih)",
                  boxSizing: "border-box",
                  padding: "var(--rq-pad)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  background:
                    "repeating-linear-gradient(120deg, var(--rq-press-hatch) 0 1px, transparent 1px 8px)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: "56%",
                      background:
                        "linear-gradient(180deg, transparent, var(--rq-press-glow), transparent)",
                      animation: `rqQueueSweep ${tier.sweep}s cubic-bezier(.4,0,.5,1) infinite`,
                    }}
                  />
                </div>

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      flex: "0 0 auto",
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      border: "1px dashed var(--rq-wait-bd)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "var(--rq-press)",
                        animation: `rqDotBreathe ${tier.ms}s ease-in-out infinite`,
                      }}
                    />
                  </span>
                  <span
                    style={{
                      height: 7,
                      borderRadius: 3,
                      background: "var(--rq-skel1)",
                      flex: "1 1 auto",
                      animation: "rqSkelBreathe 3.6s ease-in-out infinite",
                    }}
                  />
                </div>

                <span
                  style={{
                    position: "relative",
                    height: 7,
                    borderRadius: 3,
                    background: "var(--rq-skel2)",
                    width: "56%",
                  }}
                />

                <span
                  style={{
                    position: "relative",
                    fontFamily: MONO,
                    fontSize: 9.5,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: "var(--rq-press)",
                    whiteSpace: "nowrap",
                    opacity: 0.85,
                  }}
                >
                  {queueLabel}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: 10,
          marginTop: 14,
        }}
      >
        <span
          style={{
            display: "flex",
            gap: 3,
            flex: "1 1 0",
            minWidth: 52,
            alignItems: "center",
          }}
        >
          {Array.from({ length: capacity }, (_, i) => (
            <span
              key={i}
              style={{
                flex: "1 1 0",
                height: 2,
                borderRadius: 1,
                background:
                  i < liveCount ? "var(--rq-rail-on)" : "var(--rq-rail-off)",
                transition: "background 200ms ease",
              }}
            />
          ))}
          {hasWaiting && (
            <span
              style={{
                flex: "0 0 68px",
                height: 2,
                borderRadius: 1,
                opacity: 0.6,
                background:
                  "repeating-linear-gradient(90deg, var(--rq-press) 0 4px, transparent 4px 8px)",
                animation: `rqRailCrawl ${tier.crawl}s linear infinite`,
              }}
            />
          )}
        </span>
        <span
          style={{
            flex: "0 0 auto",
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--rq-faint)",
            whiteSpace: "nowrap",
          }}
        >
          {railLabel}
        </span>
      </div>
    </div>
  );
}

export default CandidateLane;
