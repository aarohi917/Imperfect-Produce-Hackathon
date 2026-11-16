# Field Friend: four-system audit and verification

## Before this change
| System | Status | Concrete evidence |
| --- | --- | --- |
| Persistent memory | Partial | Owner-only `farmer_memories`, `guide_threads`, `guide_messages`; saved messages replayed by `guide-chat.server.ts`; only 20 recent cross-chat statements and manual confirmed notes. |
| Autonomous monitoring and weekly reports | Missing | `farmingFindings` ran only when loading the guide or asking a question. Notifications handled harvest submission/review. Live schedule inventory was empty. No reports or monitoring controls existed. |
| Goal-oriented advice | Partial | `farmer_goals`, approved-only calculations and planning chats existed. Only margin/cost/kg/custom metrics; measurements ignored deadline; no supported progress assessment. |
| Multi-source investigation | Partial | Existing guide combined harvest summaries, 60 recent approved batches, notes, goals, private history and curated evidence. Older relevant statements could fall out; no automatic observation handoff. |

## Added or improved
- Confirm/edit/save a conversational statement into existing private farm memory. Rank relevant history within the latest 500 user statements; supply up to 20 relevant/recent statements. Historical recall can still be disabled, and deleted chats are excluded.
- Durable harvest-change queue, authenticated `/api/public/farm-monitor` callback, five-minute managed schedule, atomic alert/report deduplication, error/retry checkpointing. No model edits farm records.
- Private notifications for supported declining-margin and rising-cost patterns, with recorded source IDs, practical next checks and relevant goal references. No unsupported unsold/loss or actual-payment conclusions.
- Deterministic weekly snapshots with crop weights, expected revenue, recorded expenses, expected gross profit, prior-week comparison when both weeks contain checked records, findings and active goal measurements. Read through existing Notifications; localize into all four selected languages.
- Sunday/Monday, monitoring and proactive-notification controls in existing Settings. Last completed local calendar week becomes eligible at 08:00 local time on the next week start; missed runs catch up on the next successful check. Notifications off still stores reports; monitoring off stops generation. Bounded round-robin processing handles 10 farms per callback, so larger populations can have longer delivery latency.
- Expected gross-profit amount goal metric; upper-bound measurements at deadline; explicit unknown/target observed/behind/paused assessments. Do not forecast being on track without feasibility evidence. Saved planning conversations remain the plan/revision history.
- Whole accessible approved-data field/grade/destination summary supplied to the existing guide, along with explicit farmer-reported problem investigation, relevant goal linking and planting-constraint rules.

## Verification
- All automated tests pass, including Sunday/Monday periods, selected time zones, 08:00 eligibility, currency/approval boundaries, fingerprints, deadline limits, $5 expected-profit target, paused goals, disabled monitoring/alerts and relevant older recall.
- Authenticated callback returned 200: generated two private reports; repeat generated none. Synthetic approved INR tomato batches triggered one declining-margin alert and one report; repeated callback generated neither again.
- Populated report read back in signed-in UI: 30 kg, INR 300 expected revenue, INR 120 recorded cost, INR 180 expected gross profit, margin decline 80% to 40%. Four-language report rendering checked.
- Settings week start persisted after reload. Desktop and 390px phone rendering checked without horizontal overflow or browser errors.
- Conversation-to-memory confirmation persisted through Harvest navigation; a new guide reply referenced the remembered pump/labour constraints and kept test-only statements separate from verified records.
- Goal saved/reloaded; ordinary crop-performance question linked the active USD 5 target to recorded USD 7.30 expected gross profit, did not claim actual payment/completion, and considered water/labour limitations.
- Signed-in staff account received zero rows for another owner's private memories, goals, threads and reports. Unauthenticated callback returned 401.
- Synthetic harvests, notifications, INR report, goals, memory and three conversations removed; real records preserved.

## Remaining limitations / release checks
- Managed schedule is active, but actual hosted scheduled invocation is **not verified**. The hosted preview callback returned 401 with the managed credential; local authenticated invocation passed. Publish the current app and verify hosted job delivery before relying on unattended monitoring. Schedule history inspection was unavailable through the permitted tools.
- No organization tenant model exists; calendar and monitoring settings are per farmer, matching existing owner-only preferences. No organization-wide settings or cross-organization authorization are claimed.
- No sold/unsold weight, payment receipts, buyer deductions, area or itemized inputs exist in current records; reports and goals explicitly do not invent those metrics.
- Long-term facts require confirmation; recall is bounded, not unlimited semantic memory. Plans/revisions are saved guide conversations, not automatically executed tasks.
- Reports are deterministic evidence summaries, not independently AI-written research. Source truth still depends on correct farmer input and checker review.