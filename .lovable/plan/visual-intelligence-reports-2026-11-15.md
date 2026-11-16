# Visual Intelligence reports

## What will change
- Add **Send Report** below the live video, with sending, success, and error states. Empty detections show “Nothing detected.”
- Capture a JPEG containing the video frame and its current boxes and labels. Freeze the report’s item details at capture time while camera detection continues uninterrupted.
- Save the image in the existing private Harvest photo storage and the report in the existing Harvest records. Add only the missing report-type and per-item fields.
- Include item count, counts per crop, average quality, grade breakdown, confidence, calibrated size when available, and blemish percentage. Unavailable measurements remain unknown; scores remain visual estimates, not food-safety findings.
- Notify the CEO through the existing notification mechanism for **Visual Intelligence reports only**. Keep ordinary Harvest notifications and Checker access unchanged.
- Display the annotated photo and item table in the same review view used for Harvest records, accessible from notifications.

## Accuracy and privacy
- Scanner item counts must never become kilograms, confirmed harvest grades, revenue, or costs.
- Treat these records as visual observations and exclude them from harvest totals, financial calculations, monitoring, and goal measurements, even after review.
- Keep images private and apply the same farmer ownership and authorized management access as existing Harvest records.
- Public demonstration visitors must not submit real records or access private reports.

## Technical details
- Extend `harvests` additively with `report_type` and a JSONB breakdown; preserve existing Harvest submission behavior and defaults.
- Extend the existing authenticated submission and database notification path with a validated visual-report branch. Derive summaries from validated items, not caller-supplied totals or notification recipients.
- Use the existing private `harvest-photos` bucket and signed-image access.
- Do not alter `src/lib/yolo.ts` or detection, tracking, quality analysis, or calibration logic.

## Small-step verification
1. Add and test the report data contract and schema compatibility; check that the app still loads.
2. Add capture and send, checking empty detections, failed submissions, and continued scanning.
3. Verify a signed-in submission, saved image and breakdown after reload, CEO notification and report opening, and unauthorized access denial.
4. Run targeted regression tests for existing Harvest behavior and the exclusion of scanner observations from harvest calculations; check desktop and phone layouts.