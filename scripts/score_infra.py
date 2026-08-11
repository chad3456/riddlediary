#!/usr/bin/env python3
"""Freshness and accuracy scoring for the India infrastructure indicator set.

WHAT THIS DOES
    Reads the canonical series produced by scripts/ingest_infra.py
    (data/infra/clean/indicators.json) and the corroborating copies fetched by
    scripts/refresh_infra.py (data/infra/cache/), and computes two independent
    things for every indicator:

    1. A FRESHNESS state - FRESH / DUE / STALE / BLOCKED / UNKNOWN, derived from
       when the upstream source was last observed to change and how often that
       publisher actually releases.

    2. An ACCURACY score 0-100, built only from properties that can be measured:
       how far the source sits from the body that produces the statistic, how
       many lineage-distinct sources corroborate it, how far those sources
       disagree, how much of the expected year range is present, whether a
       definition break is known, and how current the data is.

WHAT "IMPROVES ON ITS OWN" HONESTLY MEANS HERE
    Nothing in this file learns, and nothing here runs unattended. What it does
    is recompute every score from scratch on each run and append the result to
    score_history.jsonl. When a lineage-distinct source is added to the
    registry, when a publisher fills in a missing year, or when a divergence
    closes, the score moves and the movement is visible as a diff against the
    previous run.

    So the improvement is real but it is not autonomous: it happens because
    someone re-runs the pipeline, and because someone does the work of adding
    sources. The score will not improve while nobody is looking.

    The one thing it does do unsupervised is stop flattering itself: an
    indicator resting on a single provenance lineage is capped at 80 no matter
    how clean it looks, and an indicator whose source this environment cannot
    reach is capped at 60.

USAGE
    python3 scripts/score_infra.py
    python3 scripts/score_infra.py --json
    python3 scripts/score_infra.py --explain population_persons
    python3 scripts/score_infra.py --history population_persons

OUTPUTS
    data/infra/quality/indicators_quality.json  latest snapshot, for the UI
    data/infra/quality/score_history.jsonl      append-only, one line per run
"""

import argparse
import json
import os
import statistics
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from refresh_infra import (  # noqa: E402
    SOURCES, CORROBORATORS, UNSOURCED_INDICATORS, LINEAGE_OF_FILE, PUBLISHER_LINEAGE,
    BASE_YEAR, QUALITY, ROOT, load_cache, load_state, now_iso,
)

CANONICAL_PATH = os.path.join(ROOT, "data", "infra", "clean", "indicators.json")
SNAPSHOT_PATH = os.path.join(QUALITY, "indicators_quality.json")
HISTORY_PATH = os.path.join(QUALITY, "score_history.jsonl")

COUNTRY = "IND"

SOURCE_BY_ID = {s["id"]: s for s in SOURCES}
SOURCE_BY_URL = {s["url"]: s for s in SOURCES}


def source_for_lineage(lineage):
    """First registered source carrying this provenance root, or None."""
    for s in SOURCES:
        if s["lineage"] == lineage:
            return s
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Agent 2's schema, imported defensively.
#
# scripts/infra_schema.py is owned by another agent. It may be absent, or may
# change shape. We use it if it is there and never fail because of it.
# ─────────────────────────────────────────────────────────────────────────────

def load_partner_schema():
    try:
        import infra_schema  # type: ignore
    except ImportError:
        return None, "scripts/infra_schema.py not present; scoring on local metadata only"
    except Exception as e:  # noqa: BLE001
        return None, f"scripts/infra_schema.py failed to import ({type(e).__name__}: {e})"
    version = getattr(infra_schema, "SCHEMA_VERSION", "unknown")
    return infra_schema, f"scripts/infra_schema.py v{version} imported"


# ─────────────────────────────────────────────────────────────────────────────
# Scoring model
#
# Fixed weights summing to 100. Every component is computed from something
# observable in the data or the registry. The only judgement calls are the tier
# constants below, which are declared once, in the open, and applied uniformly.
# ─────────────────────────────────────────────────────────────────────────────

WEIGHTS = {
    "provenance": 25,
    "corroboration": 20,
    "divergence": 20,      # applicable only when there is something to compare
    "completeness": 15,
    "series_integrity": 10,
    "recency": 10,
}

#: Distance from the body that actually produces the statistic.
PROVENANCE_POINTS = {
    "official_direct": 25,    # the authoritative publisher itself
    "official_mirror": 21,    # that publisher's own mirror
    "community_mirror": 17,   # a third party republishing it verbatim
    "aggregator": 15,         # a compiler that re-derives or harmonises
    "media": 7,               # a news report of a number
}

#: Corroborators are lineage-distinct sources beyond the primary. Two files from
#: one publisher agreeing proves only that the publisher is self-consistent.
CORROBORATION_POINTS = {0: 0, 1: 14, 2: 18}
CORROBORATION_MAX = 20

#: Median relative spread across lineages, over the years where they overlap.
DIVERGENCE_BANDS = [(0.001, 20), (0.005, 17), (0.02, 13), (0.05, 8), (0.10, 4)]
DIVERGENCE_FLOOR = 0

#: Years behind the last complete calendar year.
RECENCY_POINTS = {0: 10, 1: 7, 2: 4}
RECENCY_FLOOR = 1

SERIES_INTEGRITY_CLEAN = 10
SERIES_INTEGRITY_KNOWN_BREAK = 4   # documented, not adjusted for

#: Explicit ceilings. Each states a specific epistemic limit, not a vague lack
#: of confidence, and each is reported on the indicator that it binds.
CAP_NO_DATA = 25          # we hold no values at all
CAP_UNCORROBORATED = 80   # exactly one lineage; nothing could contradict it
CAP_BLOCKED = 60          # cannot be verified from this environment at all


def _grace_days(cadence_days):
    """How long past an expected update before it stops being merely DUE."""
    return max(14, cadence_days * 0.5)


def freshness_for_source(source_id, state, today):
    """Freshness of one source, from the refresh state file."""
    src = SOURCE_BY_ID.get(source_id)
    entry = (state.get("sources") or {}).get(source_id, {})
    cadence = src["cadence_days"] if src else 365

    out = {
        "source_id": source_id,
        "cadence_days": cadence,
        "env_reachable": entry.get("env_reachable"),
        "last_status": entry.get("last_status"),
        "last_detail": entry.get("last_detail"),
    }

    # BLOCKED is a statement about this environment and it outranks staleness
    # arithmetic: we cannot know whether the source has moved.
    if entry.get("env_reachable") is False:
        out.update({"state": "BLOCKED", "last_updated": None,
                    "expected_next_update": None, "staleness_days": None,
                    "reason": "egress-blocked from this environment; upstream state unknown"})
        return out

    stamp = entry.get("last_changed_at") or entry.get("last_success")
    if not stamp:
        out.update({"state": "UNKNOWN", "last_updated": None,
                    "expected_next_update": None, "staleness_days": None,
                    "reason": "never fetched successfully by refresh_infra.py"})
        return out

    try:
        last = datetime.fromisoformat(stamp)
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
    except ValueError:
        out.update({"state": "UNKNOWN", "last_updated": stamp,
                    "expected_next_update": None, "staleness_days": None,
                    "reason": "unparseable timestamp in source_state.json"})
        return out

    expected_next = last + timedelta(days=cadence)
    staleness = (today - last).total_seconds() / 86400.0
    if today <= expected_next:
        st = "FRESH"
    elif staleness <= cadence + _grace_days(cadence):
        st = "DUE"
    else:
        st = "STALE"

    out.update({
        "state": st,
        "last_updated": last.replace(microsecond=0).isoformat(),
        "expected_next_update": expected_next.replace(microsecond=0).isoformat(),
        "staleness_days": round(staleness, 1),
        "reason": None,
    })
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Loading the indicator universe
# ─────────────────────────────────────────────────────────────────────────────

def lineage_of_record(rec):
    """Resolve a canonical record to a provenance root."""
    f = rec.get("source_dataset_file")
    if f in LINEAGE_OF_FILE:
        return LINEAGE_OF_FILE[f]
    src = SOURCE_BY_URL.get(rec.get("source_url"))
    if src:
        return src["lineage"]
    # Unknown provenance is labelled, not guessed at.
    return f"unregistered:{rec.get('source_publisher') or 'unknown'}"


def read_canonical_records():
    """Return (records, how) for the canonical India dataset.

    The canonical file is owned by another agent and its on-disk layout has
    already changed once (flat `records` -> columnar `infra-columnar-1`). So we
    try, in order:
      1. scripts/infra_store.load(), the owner's own reader, if importable;
      2. a flat `records` list, the earlier layout;
      3. inline decode of the columnar layout.
    Any step may fail without stopping the run.
    """
    if not os.path.exists(CANONICAL_PATH):
        return [], f"{os.path.relpath(CANONICAL_PATH, ROOT)} not present"

    try:
        import infra_store  # type: ignore
        recs = infra_store.load(CANONICAL_PATH)
        if isinstance(recs, list) and recs:
            return recs, "read via scripts/infra_store.load()"
    except Exception:  # noqa: BLE001 - fall through to the local readers
        pass

    try:
        with open(CANONICAL_PATH, encoding="utf-8") as fh:
            doc = json.load(fh)
    except (OSError, json.JSONDecodeError) as e:
        return [], f"canonical file unreadable ({type(e).__name__}: {e})"

    if isinstance(doc, list):
        return doc, "read as a bare record list"
    if isinstance(doc, dict) and isinstance(doc.get("records"), list):
        return doc["records"], "read from the flat `records` key"

    # Inline decode of the columnar layout, so a change to infra_store.py that
    # breaks its import does not blind the quality panel.
    if isinstance(doc, dict) and isinstance(doc.get("rows"), list) \
            and isinstance(doc.get("series_defs"), list):
        try:
            defs = doc["series_defs"]
            countries = doc.get("countries") or []
            out = []
            for row in doc["rows"]:
                # (series_idx, country_idx, year, value, value_absolute, ...)
                sidx, cidx, year, value = row[0], row[1], row[2], row[3]
                d = defs[sidx]
                iso, name = (countries[cidx] + [None, None])[:2] \
                    if isinstance(countries[cidx], list) else (countries[cidx], None)
                rec = dict(d)
                rec.update({"country_iso3": iso, "country_name": name,
                            "year": year, "value": value})
                out.append(rec)
            return out, f"decoded inline from {doc.get('format', 'columnar')}"
        except Exception as e:  # noqa: BLE001
            return [], f"columnar decode failed ({type(e).__name__}: {e})"

    return [], "canonical file has an unrecognised shape"


def load_canonical():
    """{indicator_id: {meta, series_by_lineage}} for India, from the ingest output.

    Returns ({}, note) when the canonical dataset is absent or unreadable, so
    this script still runs and still reports the unsourced gaps.
    """
    records, how = read_canonical_records()
    if not records:
        return {}, f"no canonical series scored: {how}"

    out = {}
    for r in records:
        if not isinstance(r, dict) or r.get("country_iso3") != COUNTRY:
            continue
        try:
            year = int(r["year"])
        except (KeyError, TypeError, ValueError):
            continue
        if year < BASE_YEAR:
            continue
        val = r.get("value")
        if val is None:
            continue
        iid = r.get("indicator_id")
        if not iid:
            continue
        slot = out.setdefault(iid, {
            "id": iid,
            "label": r.get("indicator_name") or iid,
            "unit": r.get("unit") or "",
            "category": r.get("category") or "other",
            "series_by_lineage": {},
            "publishers": set(),
            "source_urls": set(),
            "break_in_series": False,
            "definition_notes": set(),
            "estimated_points": 0,
        })
        lin = lineage_of_record(r)
        try:
            slot["series_by_lineage"].setdefault(lin, {})[year] = float(val)
        except (TypeError, ValueError):
            continue
        if r.get("source_publisher"):
            slot["publishers"].add(r["source_publisher"])
        if r.get("source_url"):
            slot["source_urls"].add(r["source_url"])
        if r.get("break_in_series"):
            slot["break_in_series"] = True
        if r.get("definition_note"):
            slot["definition_notes"].add(str(r["definition_note"])[:200])
        if r.get("is_estimated"):
            slot["estimated_points"] += 1

    return out, (f"{os.path.relpath(CANONICAL_PATH, ROOT)}: "
                 f"{len(out)} India indicators ({how})")


def cache_series(binding):
    """{year: value} for a corroborating binding, from this pipeline's cache."""
    cached = load_cache(binding["source"])
    if not cached:
        return {}
    scale = binding.get("scale", 1.0)
    field = binding["field"]
    out = {}
    for ystr, rec in (cached.get("rows") or {}).items():
        if not isinstance(rec, dict) or rec.get(field) is None:
            continue
        try:
            out[int(ystr)] = float(rec[field]) * scale
        except (TypeError, ValueError):
            continue
    return out


def compute_divergence(series_by_lineage):
    """Median and max relative spread across lineages.

    Returns (None, None, 0) when fewer than two lineages carry overlapping
    years, i.e. when there is genuinely nothing to compare.
    """
    series = [s for s in series_by_lineage.values() if s]
    if len(series) < 2:
        return None, None, 0
    common = set(series[0])
    for s in series[1:]:
        common &= set(s)
    if not common:
        return None, None, 0
    spreads = []
    for y in sorted(common):
        vals = [s[y] for s in series]
        centre = sum(vals) / len(vals)
        if centre == 0:
            continue
        spreads.append((max(vals) - min(vals)) / abs(centre))
    if not spreads:
        return None, None, 0
    return statistics.median(spreads), max(spreads), len(spreads)


# ─────────────────────────────────────────────────────────────────────────────
# Scoring
# ─────────────────────────────────────────────────────────────────────────────

def assemble(canonical, today):
    """Build the full indicator universe: canonical series + unsourced gaps."""
    items = []

    for iid, slot in canonical.items():
        series = {lin: dict(s) for lin, s in slot["series_by_lineage"].items()}
        extra = []
        for b in CORROBORATORS.get(iid, []):
            s = cache_series(b)
            if not s:
                continue
            src = SOURCE_BY_ID.get(b["source"])
            lin = src["lineage"] if src else f"cache:{b['source']}"
            series.setdefault(lin, {}).update(s)
            extra.append({"source_id": b["source"], "lineage": lin,
                          "field": b["field"], "scale": b.get("scale", 1.0),
                          "points": len(s), "note": b.get("note")})
        items.append({
            "id": iid, "label": slot["label"], "unit": slot["unit"],
            "category": slot["category"], "series_by_lineage": series,
            "canonical": True,
            "publishers": sorted(slot["publishers"]),
            "break_in_series": slot["break_in_series"],
            "definition_notes": sorted(slot["definition_notes"]),
            "estimated_points": slot["estimated_points"],
            "corroborator_bindings": extra,
            "series_break_note": None,
        })

    for ind in UNSOURCED_INDICATORS:
        items.append({
            "id": ind["id"], "label": ind["label"], "unit": ind["unit"],
            "category": ind["category"], "series_by_lineage": {},
            "canonical": False,
            "publishers": [SOURCE_BY_ID[ind["source"]]["publisher"]]
            if ind["source"] in SOURCE_BY_ID else [],
            "break_in_series": bool(ind.get("series_break")),
            "definition_notes": [],
            "estimated_points": 0,
            "corroborator_bindings": [],
            "series_break_note": ind.get("series_break"),
            "declared_source": ind["source"],
        })
    return items


def score_indicator(item, state, today):
    last_complete_year = today.year - 1
    expected_years = list(range(BASE_YEAR, last_complete_year + 1))

    series_by_lineage = item["series_by_lineage"]
    lineages = sorted(series_by_lineage)

    # Merged best estimate: every lineage contributes, first one wins ties.
    merged = {}
    for lin in lineages:
        for y, v in series_by_lineage[lin].items():
            merged.setdefault(y, v)

    # Which registered source is primary, for provenance and freshness.
    if item["canonical"]:
        primary_lineage = lineages[0] if lineages else None
        primary_src = source_for_lineage(primary_lineage) if primary_lineage else None
    else:
        primary_src = SOURCE_BY_ID.get(item.get("declared_source"))
        primary_lineage = primary_src["lineage"] if primary_src else None

    comp = {}
    notes = []

    tier = primary_src["provenance_tier"] if primary_src else "media"
    comp["provenance"] = PROVENANCE_POINTS.get(tier, 7)
    if not primary_src and item["canonical"]:
        notes.append("primary source is not in the refresh registry; provenance "
                     "scored at the lowest tier until it is registered")

    n_corr = max(0, len(lineages) - 1)
    comp["corroboration"] = CORROBORATION_POINTS.get(n_corr, CORROBORATION_MAX)

    med, mx, overlap = compute_divergence(series_by_lineage)
    if med is None:
        comp["divergence"] = None
        if n_corr == 0 and merged:
            notes.append("single provenance lineage: no cross-source check is possible")
        elif n_corr > 0:
            notes.append("corroborating lineages share no overlapping years")
    else:
        pts = DIVERGENCE_FLOOR
        for threshold, value in DIVERGENCE_BANDS:
            if med <= threshold:
                pts = value
                break
        comp["divergence"] = pts

    present = sum(1 for y in expected_years if y in merged)
    share = present / len(expected_years) if expected_years else 0.0
    comp["completeness"] = round(WEIGHTS["completeness"] * share, 2)

    if item["break_in_series"] or item.get("series_break_note"):
        comp["series_integrity"] = SERIES_INTEGRITY_KNOWN_BREAK
        notes.append("known break in series: " +
                     (item.get("series_break_note") or "flagged by the canonical ingest"))
    else:
        comp["series_integrity"] = SERIES_INTEGRITY_CLEAN

    if merged:
        latest = max(merged)
        lag = max(0, last_complete_year - latest)
        comp["recency"] = RECENCY_POINTS.get(lag, RECENCY_FLOOR)
        if latest >= today.year:
            notes.append(f"{latest} is the current year and is likely partial or projected")
    else:
        latest, lag = None, None
        comp["recency"] = 0

    if item["estimated_points"]:
        notes.append(f"{item['estimated_points']} point(s) flagged is_estimated by the ingest")

    applicable = {k: w for k, w in WEIGHTS.items() if comp.get(k) is not None}
    earned = sum(comp[k] for k in applicable)
    denom = sum(applicable.values())
    raw = (earned / denom * 100.0) if denom else 0.0

    score, caps = raw, []
    if not merged:
        if score > CAP_NO_DATA:
            caps.append(f"no data held for this indicator: capped at {CAP_NO_DATA}")
        score = min(score, CAP_NO_DATA)
    if n_corr == 0:
        if score > CAP_UNCORROBORATED:
            caps.append(f"single provenance lineage: capped at {CAP_UNCORROBORATED}")
        score = min(score, CAP_UNCORROBORATED)

    fresh = freshness_for_source(primary_src["id"], state, today) if primary_src else {
        "source_id": None, "state": "UNKNOWN", "cadence_days": None,
        "last_updated": None, "expected_next_update": None, "staleness_days": None,
        "env_reachable": None, "last_status": None, "last_detail": None,
        "reason": "no registered source for this indicator",
    }
    if fresh["state"] == "BLOCKED":
        if score > CAP_BLOCKED:
            caps.append(f"source unreachable from this environment: capped at {CAP_BLOCKED}")
        score = min(score, CAP_BLOCKED)

    return {
        "id": item["id"],
        "label": item["label"],
        "unit": item["unit"],
        "category": item["category"],
        "in_canonical_dataset": item["canonical"],
        "score": round(score, 1),
        "raw_score": round(raw, 1),
        "components": {k: (round(v, 2) if isinstance(v, (int, float)) else v)
                       for k, v in comp.items()},
        "component_weights": WEIGHTS,
        "caps_applied": caps,
        "freshness": fresh,
        "provenance_tier": tier,
        "primary_lineage": primary_lineage,
        "lineages": lineages,
        "corroborating_lineages": n_corr,
        "corroborator_bindings": item["corroborator_bindings"],
        "divergence_median": round(med, 6) if med is not None else None,
        "divergence_max": round(mx, 6) if mx is not None else None,
        "divergence_overlap_years": overlap,
        "completeness_share": round(share, 3),
        "years_present": present,
        "years_expected": len(expected_years),
        "latest_data_year": latest,
        "data_lag_years": lag,
        "publishers": item["publishers"],
        "definition_notes": item["definition_notes"],
        "notes": notes,
    }


# ─────────────────────────────────────────────────────────────────────────────
# History
# ─────────────────────────────────────────────────────────────────────────────

def read_history():
    if not os.path.exists(HISTORY_PATH):
        return []
    out = []
    try:
        with open(HISTORY_PATH, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except OSError:
        return []
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="Score the India infrastructure indicator set.")
    ap.add_argument("--json", action="store_true", help="emit the full snapshot as JSON")
    ap.add_argument("--explain", metavar="INDICATOR_ID", help="full breakdown for one indicator")
    ap.add_argument("--history", metavar="INDICATOR_ID", help="score movement across runs")
    ap.add_argument("--no-write", action="store_true", help="compute but write nothing")
    args = ap.parse_args(argv)

    today = datetime.now(timezone.utc)
    state = load_state()
    _, partner_note = load_partner_schema()
    canonical, canonical_note = load_canonical()

    history = read_history()
    prev = {}
    if history:
        prev = {k: v.get("score") for k, v in (history[-1].get("indicators") or {}).items()
                if isinstance(v, dict)}

    if args.history:
        rows = []
        for h in history:
            rec = (h.get("indicators") or {}).get(args.history)
            if isinstance(rec, dict):
                rows.append((h.get("run_id"), rec.get("score"), rec.get("corroborating_lineages"),
                             rec.get("divergence_median"), rec.get("completeness_share")))
        if not rows:
            print(f"no history recorded for {args.history}")
            return 0
        print(f"score history for {args.history}")
        print(f"  {'run':<20} {'score':>6} {'corrob':>7} {'diverg':>10} {'compl':>7}")
        for run_id, sc, cor, dv, cp in rows:
            print(f"  {run_id:<20} {sc:>6} {cor if cor is not None else '-':>7} "
                  f"{dv if dv is not None else '-':>10} "
                  f"{cp if cp is not None else '-':>7}")
        return 0

    results = {}
    for item in assemble(canonical, today):
        r = score_indicator(item, state, today)
        p = prev.get(r["id"])
        r["previous_score"] = p
        r["delta"] = round(r["score"] - p, 1) if p is not None else None
        results[r["id"]] = r

    scores = [r["score"] for r in results.values()]
    run_id = today.strftime("%Y%m%dT%H%M%SZ")
    snapshot = {
        "run_id": run_id,
        "generated_at": now_iso(),
        "base_year": BASE_YEAR,
        "model_version": 1,
        "weights": WEIGHTS,
        "caps": {"no_data": CAP_NO_DATA, "uncorroborated": CAP_UNCORROBORATED,
                 "blocked": CAP_BLOCKED},
        "provenance_points": PROVENANCE_POINTS,
        "partner_schema": partner_note,
        "canonical_source": canonical_note,
        "mean_score": round(sum(scores) / len(scores), 1) if scores else 0,
        "indicator_count": len(results),
        "blocked_count": sum(1 for r in results.values() if r["freshness"]["state"] == "BLOCKED"),
        "uncorroborated_count": sum(1 for r in results.values() if r["corroborating_lineages"] == 0),
        "indicators": results,
    }

    if args.explain:
        r = results.get(args.explain)
        if not r:
            ap.error(f"unknown indicator id: {args.explain}")
        print(json.dumps(r, indent=2, sort_keys=True))
        return 0

    if not args.no_write:
        os.makedirs(QUALITY, exist_ok=True)
        with open(SNAPSHOT_PATH, "w", encoding="utf-8") as fh:
            json.dump(snapshot, fh, indent=2, sort_keys=True)
            fh.write("\n")
        hist = {
            "run_id": run_id,
            "generated_at": snapshot["generated_at"],
            "model_version": snapshot["model_version"],
            "mean_score": snapshot["mean_score"],
            "indicators": {k: {
                "score": v["score"], "raw_score": v["raw_score"],
                "components": v["components"],
                "freshness_state": v["freshness"]["state"],
                "corroborating_lineages": v["corroborating_lineages"],
                "divergence_median": v["divergence_median"],
                "completeness_share": v["completeness_share"],
                "latest_data_year": v["latest_data_year"],
                "delta": v["delta"],
            } for k, v in results.items()},
        }
        with open(HISTORY_PATH, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(hist, sort_keys=True) + "\n")

    if args.json:
        print(json.dumps(snapshot, indent=2, sort_keys=True))
        return 0

    print(f"India infrastructure indicators - quality snapshot {run_id}")
    print(f"  {partner_note}")
    print(f"  {canonical_note}")
    print()
    print(f"  {'indicator':<46} {'score':>6} {'delta':>6}  {'fresh':<8} "
          f"{'corr':>4} {'compl':>6}  latest")
    print("  " + "-" * 92)
    for r in sorted(results.values(), key=lambda x: (-x["score"], x["id"])):
        delta = "" if r["delta"] is None else f"{r['delta']:+.1f}"
        print(f"  {r['id']:<46} {r['score']:>6.1f} {delta:>6}  "
              f"{r['freshness']['state']:<8} {r['corroborating_lineages']:>4} "
              f"{r['completeness_share']*100:>5.0f}%  {r['latest_data_year'] or '-'}")
    print()
    print(f"  mean {snapshot['mean_score']}  |  "
          f"{snapshot['blocked_count']}/{snapshot['indicator_count']} BLOCKED (source real, "
          f"unreachable here)  |  "
          f"{snapshot['uncorroborated_count']}/{snapshot['indicator_count']} rest on a single lineage")
    if not args.no_write:
        print(f"  snapshot: {os.path.relpath(SNAPSHOT_PATH, ROOT)}")
        print(f"  history:  {os.path.relpath(HISTORY_PATH, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
