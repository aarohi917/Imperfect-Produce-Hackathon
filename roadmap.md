# Interface restoration
- [x] Restore original role-specific entry and compact farmer layout/header while retaining later controls, Field Intelligence, Visual Intelligence reports, Guide, Settings and private records. Signed-in farmer Get started and demo entry, Field Intelligence and Guide navigation, three viewport widths and signed-out examples verified; role entry and preservation tests pass. Management Insights implementation remains unchanged; a separate manager session was not used.

# Visual Intelligence report submission
- [x] Capture annotated JPEG and tracked-item snapshot without altering inference; reuse private Harvest storage, authenticated submission and review views, add visual-only CEO notifications and exclude observations from harvest calculations. Signed-in submission, persisted breakdown and image, continued scanning, empty warning, phone layout, farmer denial of financial rows and staff notifications, and attached-image protection verified; 40 tests and preview pass. Synthetic test record, notification and photo removed.
- [ ] Verify CEO notification opening and item table after reload using an authorized CEO session: account-specific session minting is unavailable to the requesting workspace role. Notification creation is verified in saved records; cross-account UI is not claimed verified.

# Public demonstration
- [x] Open Get started and old auth entry directly into public demonstration pages without exposing private records; remove Communication navigation, page and discussion links. Nine public sections, sample harvest/review/Guide actions, satellite selection, phone/tablet/desktop layouts and old-entry redirects verified; 17 tests pass and build OK. Public examples are ephemeral; Guide replies are illustrative, not live AI. Existing private records retained.

# Layout clarity
- [x] Organize shared navigation, Back and Settings controls, Guide and Communication spacing; preserve data/access. Signed-in desktop/tablet/phone checks pass, conversation send/reload/read-back and Back verified; approval filter overflow corrected; 17 regression tests and build pass. Temporary verification records removed.

# Field Intelligence
- [ ] Add interactive color-coded vegetation, parcel compactness and observation layers, map key, zone details and clearly marked fictional vegetation values; verify controls and calculations.
- [x] Align eight fictional zones to visible parcels in real satellite imagery on a fixed uncropped canvas; preserve reporting and real-farm geometry. Signed-in selection, zoom, boundary toggle and phone overflow verified; seven geography tests and build pass. Tracing is illustrative, not surveyed; crop labels and areas remain fictional demo records.
- [x] Replace the flat demo map with real aerial reference photography, translucent yellow field outlines and a boundary-layer toggle; verify selection, zoom and phone layout. Imagery is illustrative, not live or georeferenced satellite coverage of the fictional farm. Geographic parser packaging corrected; seven geography tests and preview checks pass.
- [x] Add a separate Field Intelligence tab for both workspaces without replacing existing pages.
- [x] Persist organization-scoped farms, fields, versioned boundaries, reports, private evidence and review activity; isolate fictional demo data using PostGIS validation.
- [x] Build a selectable eight-zone Green Valley demonstration map, farmer report submission and management investigation.
- [x] Add parsed GeoJSON/KML/Shapefile ZIP imports, preview, manual coordinate-boundary drawing, explicit field matching and employee assignment. GeoJSON persistence and replacement verified; broader KML/Shapefile sample compatibility remains unverified, not claimed complete.
- [x] Add accessible-record unresolved/quality counts, per-field patterns and recurring batch counts without changing approvals or finances. Advanced spatial analysis, geographic basemaps, GeoPackage and automated discrepancy measurements remain future capabilities.
- [x] Verify signed-in farmer submission/read-back/reload, management resolution, private image upload, real GeoJSON persistence, boundary replacement retaining history, desktop/phone layout and 17 regression tests; temporary verification records and manager membership removed. Cross-account evidence-denial checks remain unverified. Related-record links currently open their existing record pages rather than a focused batch detail.

# Role-based workspaces
- [x] Enrich farmer Overview with reference crop photography, crop/status filters, photo toggle, list/grid view and import/export tabs; signed-in controls and phone layout verified with no overflow or page errors; 10 permission/calculation tests pass. Existing operational-only data services remain unchanged.
- [x] Secure harvest finances, reports, alerts, goals and Guide responses using verified management access; retain organization scopes.
- [x] Add farmer Overview, operational harvest capture and authorized import-export request updates; retain management Insights and Checker access. Actual shipment tracking is not yet recorded.
- [x] Send automatic harvest alerts to Checkers, not farmers; align approval explanations.
- [x] Test role boundaries, direct requests, existing workflows, and desktop/phone views: 42 tests pass; temporary farmer submission/read-back, direct financial read/insert denial, and Guide refusal verified; management Insights and Guide checked. Existing cross-account communication and hosted scheduling blockers below remain outside this change.

# Visual Intelligence
- [x] Replaced TensorFlow with onnxruntime-web and a standard YOLOv8n adapter in src/lib/yolo.ts; six tests and preview build passed, signed-in test-camera inference/stop/restart verified at 2 fps without page errors. Real-produce accuracy remains unverified; model AGPL licensing requires commercial-deployment review.
- [x] Sweep camera/photo entry points; fix harvest image-decoding recovery and repeat attachment selection. Audit recorded in CAMERA_RECOVERY_AUDIT.md; signed-in unreadable-photo recovery verified, six tests passed, build OK; records/settings/permissions unchanged.
- [x] Improve startup with unconstrained-camera fallback, explicit WebGL/CPU initialization and CPU model-load fallback; distinguish permission/device/model failures and retry in one click. Verified signed-in live → stop → denied permission → retry → live, three regressions and build OK; the user's physical device failure is not directly observable in captured logs.
- [x] Install requested browser vision libraries and adapt supplied detector for camera lifecycle safety, estimate labels and shared localization.
- [x] Add authenticated Visual Intelligence page and primary navigation without changing approval or harvest data.
- [x] Verified signed-in model loading/inference with a browser test camera, stream shutdown, permission-denied recovery, and 948px/390px layouts; four regression tests passed and build OK. Real produce accuracy remains unverified; photo uploads, saved history and an external vision service are outside this requested code integration.

# Navigation adjustment
- [x] Keep role-authorized Approvals visible in the top bar at the current tablet/desktop width; verified navigation at 948px, phone access at 390px, no overflow or browser errors, and successful builds.

# Communication workspace
- [x] Inspect authentication, roles, storage, notifications and approval records; no organization/member model exists, and current approvals are harvest checks rather than import-export requests.
- [x] Confirmed CEO-only organization creation and discussions for both existing harvest approvals and new import-export requests.
- [x] Phase 1: Add secure organization membership/invitations, channels, direct/group conversations, persistent messages, unread indicators and Communication navigation.
- [x] Phase 2: Add explicit cross-organization invitations, replies, private attachments, permission-scoped message/conversation search and mention/direct-message notifications with mute controls; reliable five-second updates.
- [x] Phase 3: Link authorized harvest/request discussions and contextual record links; add manager appointments and conversation participant controls.
- [x] Verify signed-in organization/channel creation, reload persistence, replies, reactions, private text-file sharing, invitation generation, request-linked discussion and unchanged pending status; desktop/tablet/phone have no horizontal overflow; 51 regression tests passed and direct privilege-write bypass attempts were denied. Temporary organization/test records removed.
- [ ] Verify cross-account invitation acceptance, direct/group delivery, unread notifications and unrelated-account file denial: requires a second participant's authorized session. Full multi-organization trade-partner workflow, dedicated thread view, attachment image previews and people/organization search remain a follow-up implementation, not claimed complete.

# Complete product experience redesign
- [x] Remove visible reference-photo credits and open a new Guide conversation immediately; keep farm companion and crops expanded, with only mood and evidence collapsible; verified signed-in phone/tablet/desktop and four regression tests.
- [x] Audit the current functional foundation and redesign compositions, not just styling.
- [x] Add contextual sourced photography, a new navigation layout, visual operations overview and image-led analysis.
- [x] Recompose harvest capture, approvals and the Guide while preserving every existing control.
- [x] Verify signed-in data interactions, photography, themes and desktop/tablet/phone layouts; run regression tests.

# Accuracy update
## Complete editorial UI/UX redesign
- [x] Audit routes, data, calculations, AI, settings, permissions and monitoring; record preservation inventory.
- [x] Establish shared editorial brand, tokens, controls and light/dark themes.
- [x] Redesign shell, Insights and interactive crop summaries using real accessible records.
- [x] Make Guide conversation primary; preserve history, mood, memory, goals, evidence and contextual records.
- [x] Redesign Harvest, Approvals, notifications, home and sign-in without backend changes.
- [x] Run regression tests and signed-in desktop/tablet/mobile interaction checks; document verification limits in UI_UX_INVENTORY.md.
## Four-system audit and completion
- [x] Audit actual storage, guide workflows, permissions and schedules; share findings before implementation.
- [x] Add scheduled monitoring code and active managed schedule, deduplicated private farmer alerts and timezone-aware weekly reports in existing notifications.
- [x] Add monitoring, alert and Sunday/Monday week-start settings, persisted across devices.
- [x] Improve goal deadline/progress assessment, expected gross-profit targets and relevant investigation context without assuming actual sales.
- [x] Verify populated signed-in memory/goal/report flows, authenticated local callback, duplicate prevention, scheduling periods and four languages; remove synthetic records and document limits in FARM_AI_AUDIT.md.
- [ ] Verify actual hosted scheduled delivery after publishing: hosted callback returned 401, despite successful local managed-credential checks; awaiting accessible hosted deployment.
## Centralized localization
- [x] Replace language toggles with extensible top-right Settings.
- [x] Localize interface and crops into Chinese, English, Hindi and Marathi; original user text, renamed titles and saved replies remain unchanged.
- [x] Apply manually selected recorded currencies to financial displays and guide context; no exchange conversion or mixed-currency sums.
- [x] Apply selected time zone to automatic chat titles, timestamps and date defaults, preserving calendar dates.
- [x] Verify persisted settings, all four interface languages, Hindi/Marathi/English AI replies, approved sample-harvest totals, Los Angeles dates and phone layout; remove synthetic test records afterward. Existing saved replies are not automatically translated.
## Farmer assistant priorities
- [x] Add private, reviewable farmer memory and cross-conversation context.
- [x] Add record-based early warnings without inferring unrecorded sales or losses.
- [x] Add measurable goals, baseline/progress tracking and connected planning chats.
- [x] Strengthen joined-up guide investigation; verify calculations, owner privacy, memory editing/recall/deletion, goal planning/editing/pause/deletion, Chinese and English advice, reload and phone layout. Populated live warning/progress checks remain unavailable because this account has no harvest records; synthetic calculation tests cover those patterns. Unsold weights, buyer deductions and actual payments remain unrecorded and are never inferred.

## Guide chat history
- [x] Persist private conversations and messages with owner-only access.
- [x] Add dated topic titles, thread URLs, sidebar, rename and delete.
- [x] Verify two conversations, continuation, reload, navigation and phone layout.

- [x] Add verified, dated research with explicit scope and source links.
- [x] Ground guide answers in confirmed records and farmers' own reflections; fail clearly when records cannot be read.
- [x] Show evidence within existing pages and distinguish expected money from actual earnings.
- [x] Test evidence boundaries and verify the signed-in guide on desktop and phone.

# Agriculture-first analysis
- [x] Add crop, field, destination and quality comparisons with date and crop filters.
- [x] Add actionable exceptions and traceable source records linked to the guide.
- [x] Make missing measurements and loading failures explicit; keep expected money distinct from actual payments.
- [x] Verify analysis calculations and signed-in desktop/phone controls; populated live analysis remains unverified because this account has no harvest records.

# Farmer guide writing and formatting
- [x] Keep background analysis internal while preserving actionable uncertainty and evidence.
- [x] Render guide replies with clear headings and readable paragraphs in both languages.
- [x] Verify signed-in Chinese reply, English follow-up and phone layout; no overflow or browser errors.