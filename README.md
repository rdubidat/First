# GrowthPilot Attendance + Belt Grade Suite

A plug-and-play dashboard module for martial arts schools running on a white-labeled GoHighLevel stack.

## What this solves

- Attendance tracking for converted members by class + date.
- Multi-art belt/grade tracking per member (e.g., BJJ + Kickboxing grades on one profile).
- Automatic tag generation on attendance actions and grade updates.
- Automation-ready event queue with payloads ready for webhook/Zapier/Make workflows.

## Core features

1. **Attendance Register**
   - Select class session and date.
   - Mark each eligible student as Present or Absent.
   - Attendance actions add consistent tags such as:
     - `member:attendance-tracked`
     - `attendance:present` / `attendance:absent`
     - `art:<art-name>`
     - `class:<class-name>`
     - `grade:<art>:<grade>`

2. **Member + Grade Management**
   - Add new members quickly.
   - Add additional arts/grades per member using `Art | Grade` format.
   - Preserve all tags on the member profile for segmentation in GoHighLevel campaigns.

3. **Automation Queue**
   - Every attendance mark emits an automation event.
   - Queue stores timestamp, member, trigger, and JSON payload.
   - Payload can be forwarded to GoHighLevel automation/webhook endpoints.

## Local development

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in terminal.

## How to add this into GoHighLevel (GrowthPilot)

> Short answer: you do **not import this React code directly into GHL**. You host it, then surface it in GHL, and wire automation payloads into GHL workflows.

### 1) Deploy the dashboard

Build and deploy this app to a public URL:

```bash
npm run build
```

Deploy `dist/` to Vercel, Netlify, Cloudflare Pages, or your own domain.

Example final URL:

- `https://ops.growthpilot.io/attendance`

### 2) Add it to the left menu in your white-label app

In GoHighLevel Agency view:

1. Go to **Settings → Company → Custom Menu Links** (or equivalent white-label menu config).
2. Add a new menu item:
   - **Name:** `Attendance & Grades`
   - **URL:** your deployed app URL
   - **Open mode:** same tab or iframe (based on your white-label setup)
3. Save and publish.

This makes it feel native in the GrowthPilot dashboard.

### 3) Create a webhook receiver (bridge)

This app currently stores data in browser localStorage for easy startup. For production:

1. Add a small backend endpoint (e.g. `/api/attendance-event`) that receives the automation queue payload.
2. From that endpoint, call GHL APIs to:
   - find/create contact
   - upsert tags
   - optionally write custom values / notes
3. Return `200 OK`.

### 4) Wire GoHighLevel workflows

In each sub-account:

1. Go to **Automation → Workflows → Create Workflow**.
2. Choose trigger like:
   - **Inbound Webhook** (recommended)
   - or tag-based triggers if your bridge applies tags first.
3. Add branches for:
   - `attendance:absent` → re-engagement SMS
   - `attendance:present` + high frequency → rewards
   - `grade:*` tags → belt-test reminders.

### 5) Recommended custom fields in GHL

Create these custom fields once per sub-account:

- `primary_art`
- `attendance_last_class_date`
- `attendance_last_status`
- `grades_json` (long text/json snapshot)

Keep the source-of-truth in your app/backend and mirror summary fields into GHL for filtering/reporting.

## Example webhook payload

```json
{
  "date": "2026-02-14",
  "classTitle": "Kids BJJ Fundamentals",
  "art": "Brazilian Jiu-Jitsu",
  "tags": [
    "member:attendance-tracked",
    "class:kids-bjj-fundamentals",
    "art:brazilian-jiu-jitsu",
    "attendance:present",
    "grade:brazilian-jiu-jitsu:gray-belt"
  ]
}
```

Use this payload in your bridge to update contacts and trigger workflows.

## Integration pattern with GoHighLevel

1. Keep this module embedded as a dashboard view in your white-label portal.
2. On attendance/grade updates, forward queue payloads to your GoHighLevel webhook.
3. In GoHighLevel workflows, branch using tags for:
   - Missed class follow-up
   - High-attendance reward automations
   - Belt test eligibility reminders
4. Use tags to trigger nurture/re-engagement campaigns and reporting snapshots.

## Storage model

The app uses browser `localStorage` (`growthpilot-attendance-suite-v1`) to keep setup friction low.

For production rollout, replace local storage writes with API endpoints while preserving event/tag structure.
