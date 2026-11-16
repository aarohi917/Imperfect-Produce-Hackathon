<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Roles live in `public.user_roles` (farmer, hq, ceo); first signup becomes CEO, others farmer. Why: avoid privilege escalation via profile data.
- Harvest notifications are created by a DB trigger (`notify_harvest`), not app code. Why: recipient rules apply regardless of client.
- Analytics totals only include harvests with status `approved` (`src/lib/analytics.ts`). Why: HQ approval gates all outputs.
- AI calls run server-side in `src/lib/ai.functions.ts` via `src/lib/ai.server.ts` (Lovable AI Responses, streamed then consumed). Why: keep key and prompts on the server.
- Vegetable names, kg rounding and non-negative money are enforced by DB trigger `validate_harvest`; the list in `src/lib/vegetables.ts` must match it. Reviewed harvests' numbers are locked. Why: data accuracy can't depend on the client.
- The AI guide receives the farmer's per-crop stats (via `summarize`) and an optional focused harvest id. Why: advice must cite real data.
- UI text uses the shared localization translator and four-language catalog; crops retain standard stored names and render through vegLabel. Why: one stored value with a single selected display language.
- Owner-only user_settings synchronize language, currency and IANA time zone; browser settings hydrate after mount, including monitoring and weekly-calendar controls. Why: preferences persist across devices without SSR mismatches.
- Harvests and financial goals retain recorded currency; analysis filters by selected currency and never converts or sums different currencies. Why: switching a display preference must not falsify financial values.
- Timestamp instants remain UTC; calendar dates stay unchanged, and automatic chat titles derive from topic plus selected-zone start date while renamed titles remain untouched. Why: localization must not move actual events or overwrite user titles.
- Curated evidence lives in `src/lib/evidence.ts` and supplies both the guide context and collapsible source notes; each item retains date, scope and limitations. Why: one reviewed source of truth prevents research drift between advice and UI.
- Guide queries fail explicitly on record-read errors and use farmers' own notes separately from external research. Why: missing data must never masquerade as an empty farm or inferred farmer sentiment.
- Effects invoking browser methods use block bodies with no returned value unless returning a cleanup function. Why: browser wrappers must not become non-callable React cleanups.
- Agriculture analysis is computed in `farm-analysis.ts` from filtered source harvests, using approved-only field, crop, grade and destination comparisons; the dashboard reads all accessible rows in ordered pages. Why: comparisons remain traceable and do not silently truncate totals.
- Assistant guide messages render through GuideReply with AI Elements MessageResponse, while user messages remain plain text. Why: streamed headings and source links remain readable.
- Guide history uses owner-scoped guide_threads and guide_messages with route-derived thread IDs; server streaming saves user messages before generation and completed assistant messages in onFinish. Why: navigation and reload cannot erase conversations or mix users' histories.
- Guide context is shared in guide-context.server.ts by buffered photo-independent guide calls and the authenticated streaming endpoint. Why: persisted chats retain the same evidence and accuracy boundaries.
- Farmer memory and goals use owner-only tables and explicit confirmation; recall reuses only user statements from undeleted chats and can be disabled. Why: personalization must not infer facts or expose private data to staff.
- Farmer assistant findings and goal measurements share pure functions in farmer-assistant.ts, with paginated owner-scoped record reads. Why: proactive advice and plan progress must remain traceable, approved-only, and distinct from actual sales or payments.

- Farm monitoring uses a managed authenticated five-minute callback with a durable round-robin queue; database delivery functions atomically deduplicate alerts and reports. Why: analysis works without chat and retries do not duplicate deliveries.
- Weekly report snapshots are deterministic approved-only calculations, localized when displayed, for the last completed local-calendar week due at 08:00 on its chosen first day; delayed runs catch up. Why: preserve evidence and currency without AI-fabricated figures.
- Goal measurements stop at the deadline; expected_profit means expected revenue minus recorded cost, and forecasts remain unknown without feasibility evidence. Why: late records and guesses must not claim timely actual earnings.
- Guide recall ranks relevant user statements within the latest 500 saved statements, and conversational memory requires an editable confirmation. Why: recover older context without silently storing inferred facts.

- Presentation-only redesign reuses existing routes, pure analytics and authenticated data flows; contextual charts never infer missing metrics. Why: visual changes must preserve financial and privacy boundaries.
- Theme is a browser-hydrated local preference in the shared Settings control, separate from existing server settings. Why: both themes work without changing the settings schema or hydration behavior.

- Reference photography uses descriptive reference alt text and asset pointers; organization photos remain signed original harvest uploads. Why: illustrative imagery must not be represented as farm evidence.
- Guide opens an owner-scoped conversation after mount. Why: immediate composer, preserved history and harvest context.
- Communication validates membership before privileged writes; invitations are atomic and files private. Why: partners cannot access unrelated records.
- Shared primary navigation is horizontal on larger screens and fixed at the bottom on phones; all original route and search contracts remain intact. Why: a new composition must preserve discoverability and saved conversations.
- YOLO loads ONNX WASM after camera start. Why: keep inference browser-only and preserve SSR.

