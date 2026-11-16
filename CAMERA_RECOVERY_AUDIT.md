# Camera and photo recovery check

Rule: Camera and photo tools must explain failures, permit retry, and not block manual harvest entry.

| User-facing place | Code reviewed | Result |
| --- | --- | --- |
| Visual Intelligence camera startup and detection | VisualIntelligence.tsx, visual-camera.ts | Camera fallback, WebGL/CPU startup, stage-specific errors and one-click retry implemented; live→denied→retry→live verified with a browser test camera. Physical-device failure remains unverified. |
| Harvest native camera/file selection and image preparation | harvest.tsx | Fixed an uncaught image-decoding failure; releases object URLs and clears file selection for repeated retries. Repeated unreadable-image selection shows a recovery message; manual fields remain usable. |
| Harvest AI photo estimate | ai.functions.ts, ai.server.ts and harvest.tsx | Server errors propagate to the existing caught failure state; photo and manual fields remain available. No permission, model or estimate changes made. |
| Harvest photo storage/submission | harvest.tsx | Upload failures are caught; draft remains for retry. No records were submitted during this check. |
| Communication photo/file attachments | CommunicationWorkspace.tsx, communication.functions.ts | Existing upload and signed-link errors are caught. File selection now clears after upload attempts so the same file can be retried; limits and access checks unchanged. |
| Approvals photo viewing | approvals.tsx, harvest photo policies | Display-only signed originals; no camera or model startup. Existing access boundaries unchanged. |
| Guide composer | GuideChat.tsx, ai-elements/prompt-input.tsx | No visible camera or capture control is mounted. Unused screen-capture helper is not a user flow; unchanged. |
| Home, sign-in and reference photographs | Static imports and ReferencePhoto.tsx | Display-only imagery; no camera or model invocation. |
| Monitoring, weekly reports and database functions | Monitoring code and migration search | No camera/model invocation; saved structured records only. No background or database changes needed. |

Validation: six regression tests passed; build OK. No permissions, settings, stored records or example data changed.