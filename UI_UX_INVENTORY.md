# Redesign preservation inventory

## Routes and interactions
- `/`: localized brand, farm photograph, entry to email authentication, checker-to-CEO explainer, settings.
- `/auth`: email sign-in/sign-up, confirmation email, account name, signed-in redirect, settings.
- Authenticated shared shell: role-derived navigation, profile, sign-out, notification unread polling/realtime, owner settings synchronization.
- `/dashboard`: all accessible harvests in ordered 500-row pages; currency, crop and harvest-date filters; approved weight, expected revenue, recorded costs and expected gross profit; crop/month, field, destination, grade, exception and source-record views; batch-to-guide links; evidence disclosures.
- `/harvest`: camera/file upload, local resizing, server AI estimate, editable confirmation, standard crop, kg, grade, field, date, destination, recorded currency, expected revenue/cost, notes; private photo storage and submission; own recent reports and guide links.
- `/approvals`: staff-only pending/approved/rejected views, signed photos, farmer details, historical price checks, notes, approve/reject, locked reviewed data and trigger-delivered notifications.
- `/guide`: private history, new/focused/goal chats, rename/delete confirmation; mood reflection; findings, goal CRUD/pause/progress, memory CRUD/confirmation and recall switch; evidence.
- `/guide/$threadId`: saved messages, streamed authenticated replies, source formatting, user-message memory confirmation, persistence after navigation.
- `/notifications`: localized structured notifications, mark read, approval/guide links, private weekly reports and snapshots.

## Data and dependencies
Existing migrations define profiles, protected user_roles, harvests, reflections, notifications, guide_threads/messages, farmer_memories/preferences/goals, user_settings, farm_monitor_state, farm_alert_state and farm_reports. Owner/staff RLS and validation/notification triggers remain untouched. Harvest photos use private storage and signed URLs. First signup role and existing CEO assignments are preserved.

AI uses the Lovable gateway through server-only functions/context and the authenticated streaming endpoint. Context combines owner records, approved-only summaries, confirmed memory, relevant user statements, goals, reflections and dated external evidence. No actual payments, unsold stock, losses, weather or field area are invented.

Monitoring uses an authenticated five-minute managed callback, durable round-robin processing and atomic database deduplication. Weekly snapshots use completed local calendar weeks, selected currency and approved records. Hosted unattended delivery was previously unverified; a UI redesign cannot establish that it works.

Settings persist four languages, five currencies, IANA zone, week start, monitoring and proactive alerts. Existing currencies are never converted. Timestamps and calendar dates retain their semantics.

## Preservation strategy
Keep existing backend, routes, calculations, permissions, saved data and AI prompts. Reuse existing frontend controls, pure analytics and owner-scoped reads. Add presentation-only contextual views and interactive crop summaries; do not create organization reports or imply staff can access farmers' private assistant data.

## Confirmed constraints
Harvest shows the latest 20 own records; approval lists are capped at 100, historical comparison at 1000; notifications show 50. These existing caps are not silently expanded or described as complete history. Existing swallowed read errors in those screens are pre-existing, not evidence of successful reads. Dashboard and assistant record reads are paginated. Tests cover finance, approval boundaries, reporting periods, recall and goals. Live monitoring requires an accessible hosted deployment.

## Redesign verification
- All 48 regression tests pass; final affected-file rerun also passes. Preview build log reports build OK.
- Signed-in CEO checked all main routes with real existing harvests. USD overview reads 2.7 kg, $10.50 expected revenue, $3.20 cost and $7.30 expected gross profit. Carrot selection reads 1.3 kg, $5 revenue, $2 cost and 60% expected margin.
- Crop selection, fields/destinations/attention/source tabs, approved harvest photos and notes, saved weekly-report expansion, memory controls and mobile goal form are usable.
- A temporary chat received a real assistant response distinguishing expected gross profit from payments; navigation and reload preserved it, rename persisted, deletion removed only the test conversation.
- Four language settings persisted through the existing save flow; dark/light selection and dark reload persistence passed. Existing currency and zone settings remained unchanged.
- At 1280px desktop, 948px tablet and 390px phone, primary pages rendered without horizontal page overflow or browser runtime errors. Mobile Guide context collapses separately from the conversation. Home/sign-in images load.
- No real harvests, approvals, memory, goals, reflections or notifications were modified for testing. Creation/submission/approval writes, photo AI estimation, signup permissions and unattended hosted monitoring were not re-executed in this presentation-only redesign. Their handlers remain unchanged; passing existing tests and read-through checks do not prove hosted scheduling.
- No invented weather/current conditions, actual payment figures or organization-wide private assistant report was added. Context shows the signed-in farmer's own records only; no AI-generated interactive figures replace saved measurements.
## Complete product redesign verification
- Replaced fixed desktop sidebar with horizontal primary navigation; phone destinations remain fixed at the bottom. Existing URLs, permissions and validated chat search stay unchanged.
- Recomposed Insights into a photo-led operations introduction, approved financial/weight summary, harvest-check-destination strip, filtered analytical workspace and image-led crop comparisons. All figures still use existing pure calculations and selected-currency rows.
- Reorganized Harvest into photograph capture and record details alongside recent reports; approvals use wide photo/evidence layouts; notifications and weekly snapshots occupy parallel sections. Guide retains history, assistant context, goals, memory, mood and evidence.
- All sourced photographs are labeled Reference photo / Unsplash and are not claimed as the organization’s farm. Original private harvest photos are unchanged.
- 48 regression tests pass. Signed-in Insights shows 2.7 kg, $10.50 expected revenue, $3.20 costs and $7.30 expected gross profit; Carrot selection shows 1.3 kg, $5 revenue, $2 costs, 60% margin. Fields, destination, attention and record tabs work.
- Checked all primary routes at 1280px desktop, 948px tablet and 390px phone: no document overflow, no page errors, all displayed reference images loaded. Dark theme survives reload; mobile goal dialog and history toggle are usable; saved weekly report reads back through the UI.
- Approval tab data was still empty at the brief interaction capture, so populated approval evidence and approval writes are not newly verified. Harvest submission, photo AI, signup, chat generation/persistence writes and hosted unattended monitoring were not re-executed in this presentation-only work; unchanged handlers and passing tests do not establish those hosted flows.
