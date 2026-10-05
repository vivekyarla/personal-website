# Instinct API — tasks, calendar, habits, readings

Read/write access to the four areas of Vivek's admin (Tasks, Calendar,
Habits, Readings) on `https://vivekyarla.com`.

## Auth — two options

**Browser (for agents whose vault fills form fields):** open
`https://vivekyarla.com/admin/instinct`, fill the token into the password
field (username is `instinct`), and submit. That sets a session cookie for
the browser, then lands on `/admin/tasks` (the hub, also at `/admin/hub`). From there you can use the pages
(`/admin/tasks`, `/admin/calendar`, `/admin/habits`, `/admin/inbound`) or call
the endpoints below from the same browser. The cookie authenticates them, and
no header is needed.

**HTTP header:** send the token on every request:

```
Authorization: Bearer <INSTINCT_TOKEN>
```

Either way, access covers only the pages and endpoints below. Anything else
(admin home, tweets, categories, analytics) redirects to the admin login or
returns `401`. Bodies are JSON
(`Content-Type: application/json`); errors come back as `{ "error": "..." }`.

## Conventions

- Dates are `YYYY-MM-DD` in **Pacific Time**. Calendar times are PT, 24-hour
  (`"13:30"`).
- IDs are UUID strings.
- Lists are ordered by `position` (0, 1, 2, …). To reorder, send the full new
  order of ids to a `reorder` endpoint.

---

## Tasks

A task: `{ id, title, tag, due_date, done, done_at, position, prev_tag, created_at }`.

- `tag` is free text. **Rox** and **McK** (any capitalization) are the two
  work labels; every other tag, or none, counts as **All**. Use `"Rox"` and
  `"McK"` when setting them.
- `prev_tag` holds a task's tag from before it was moved into Rox/McK (so
  moving it back restores it). Leave it alone unless you're doing that.
- Tasks never roll over. Each belongs to exactly one `due_date`.

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| GET | `/api/tasks` | `?from=&to=` (default: last 14 days → end of this week) | `{ today, from, to, tasks, tags }` |
| POST | `/api/tasks` | `{ title, due_date, tag?, position? }` | `{ task }` |
| PATCH | `/api/tasks/{id}` | any of `{ title, tag, due_date, position, done, prev_tag }` | `{ ok }` |
| DELETE | `/api/tasks/{id}` | — | `{ ok }` |
| POST | `/api/tasks/reorder` | `{ ids: [...] }` (one day's tasks, new order) | `{ ok }` |

`done: true` also stamps `done_at`. To add at the end of a day, set `position`
to that day's task count.

## Calendar (Google Calendar, read-only + local renames/hides)

Events come live from Google Calendar. **Nothing here writes to Google.**
Renames and hides only change how events appear on the site.

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| GET | `/api/calendar` | `?dates=2026-10-01,2026-10-02` (1–7 dates) | `{ events, overrides }` |
| POST | `/api/calendar-override` | `{ uid, date_key, custom_title?, hidden? }` | `{ ok }` |

- `events` maps each date to raw events:
  `{ uid, title, dateKey, timeLabel, startMs, endMs, location, allDay, recurring }`
  (`timeLabel` is `null` for all-day events).
- `overrides` are the site's renames/hides:
  `{ uid, date_key, custom_title, hidden }`. `date_key: ""` applies to every
  occurrence of a recurring event, and `"YYYY-MM-DD"` to that day only. A
  day-level override beats a series-level one. Shown title = override's
  `custom_title` if set, else `title`. Hidden if either level has
  `hidden: true`.
- To rename: `custom_title: "New name"` (send `""` or `null` to reset). To hide
  or unhide: `hidden: true/false`. Only the fields you send change.

## Habits

A habit: `{ id, name, is_core, show_chart, reminder, position, created_at }`.
An entry means the habit was done that day: `{ id, habit_id, date, done }`.

| Method | Path | Body / query | Returns |
| --- | --- | --- | --- |
| GET | `/api/habits` | `?since=YYYY-MM-DD` (default ~8 weeks back) | `{ today, since, habits, entries }` |
| POST | `/api/habit-entries` | `{ habit_id, date, done }` | `{ ok }` |
| POST | `/api/habits` | `{ name, is_core?, show_chart?, reminder?, position? }` | `{ habit }` |
| PATCH | `/api/habits/{id}` | any of `{ name, is_core, show_chart, reminder, position }` | `{ ok }` |
| DELETE | `/api/habits/{id}` | — | `{ ok }` |
| POST | `/api/habits/reorder` | `{ ids: [...] }` | `{ ok }` |

`POST /api/habit-entries` with `done: true` checks a habit off for `date`;
`done: false` un-checks it.

## Readings

⚠️ **Readings are public.** They appear on vivekyarla.com/writing the moment
they're created or edited.

A reading: `{ id, title, url, source, tag, date_published, summary, quotes,
pinned, kind, created_at }`. `kind` is `"article"` (needs `url`) or `"book"`
(`url` optional, `source` = author, no quotes).

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/inbound` | — | `{ readings }` (newest first) |
| POST | `/api/inbound` | `{ title, summary, kind?, url?, source?, tag?, date_published?, quotes?, pinned? }` | `{ reading }` |
| PATCH | `/api/inbound/{id}` | any of the fields above | `{ ok }` |
| DELETE | `/api/inbound/{id}` | — | `{ ok }` |

---

## Example

```bash
curl -s https://vivekyarla.com/api/tasks \
  -H "Authorization: Bearer $INSTINCT_TOKEN"

curl -s -X POST https://vivekyarla.com/api/tasks \
  -H "Authorization: Bearer $INSTINCT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Prep for Rox sync","tag":"Rox","due_date":"2026-10-01"}'
```

---

## Tweet capture (Instinct, headless)

Instinct can only make plain GET requests, so tweets are saved with one:

```
GET /api/capture/tweet?url=<tweet url>&category=<slug>&note=<optional>&key=<TWEET_CAPTURE_KEY>
```

- Uses its own key, `TWEET_CAPTURE_KEY` (Vercel env var). It is not
  `INSTINCT_TOKEN` or `CAPTURE_TOKEN` and can only save a tweet into an
  existing category (e.g. `takes`). Delete or rotate the env var to revoke.
- Also accepts `Authorization: Bearer <key>`.
- The key sits in the URL, so it can show in Vercel request logs. Rotate it
  if that matters.
- Tracking params on the tweet URL are dropped; re-saving a URL updates it.
- 30 saves per hour per server instance, then `429`.
- Returns `{ ok, tweet, category }`; `400` bad URL or unknown category,
  `401` bad key.
