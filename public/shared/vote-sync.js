// Shared vote sync for The Paradox Archive / The Literary Archive.
// Posts each ruling to a public Supabase table (anon, no PII beyond a random
// per-browser visitor id used only to prevent double-voting on the same case)
// and reads back aggregated percentages from a view. Best-effort: any
// network failure just leaves the page on its static illustrative sample.
(function (global) {
  "use strict";

  const SUPABASE_URL = "https://vbkausjuwdpdglbirogt.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_Yz1ekPLAlrD2s3WlOARyMA_QsCLLwUS";
  const VISITOR_KEY = "riddlediaryArchive.visitorId.v1";

  function getVisitorId() {
    try {
      let id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch (e) {
      return crypto.randomUUID();
    }
  }

  function recordVote(archive, caseId, choiceIndex, tag) {
    fetch(`${SUPABASE_URL}/rest/v1/riddlediary_archive_responses?on_conflict=archive,case_id,visitor_id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        archive,
        case_id: caseId,
        choice_index: choiceIndex,
        tag,
        visitor_id: getVisitorId(),
      }),
    }).catch(() => {});
  }

  function fetchStats(archive) {
    return fetch(`${SUPABASE_URL}/rest/v1/riddlediary_archive_stats?archive=eq.${encodeURIComponent(archive)}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        const byCase = {};
        rows.forEach((row) => {
          if (!byCase[row.case_id]) byCase[row.case_id] = {};
          byCase[row.case_id][row.choice_index] = { votes: row.votes, total: row.total_votes };
        });
        return byCase;
      })
      .catch(() => ({}));
  }

  global.ArchiveVotes = { getVisitorId, recordVote, fetchStats };
})(window);
