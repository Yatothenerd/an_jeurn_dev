# Invitation Platform — Workflow Redesign

_Evaluation of the current theme builder + event flows, and the redesigned
target workflows. 2026-07-06._

---

## Part 1 — Evaluation of the current system

### 1.1 Structural flaws

**F1. Three rendering pipelines compete for the same invitation.**
The invite page (`app/invite/[slug]/page.tsx`) picks a renderer by sniffing
JSON keys on `Invitation.overlayConfig`:

| Pipeline | Trigger | Editor | Renderer |
|---|---|---|---|
| Builder canvas | `overlayConfig.builderDraft` present | EventBuilder | `BuilderInvite` |
| Theme module | `overlayConfig.themeId` present | Theme Editor | registry sections |
| Legacy tokens | neither present | none (EventWizard is unmounted) | standard/DB sections |

Precedence is implicit (themeId > builderDraft > tokens) and lives only in
page code. Consequence: applying a builder Template to an event that has a
`themeId` produces **no visible change** — `TemplateService.applyToEvent`
transplants a `builderDraft`, but the renderer keeps using the theme. A
silent no-op is the worst kind of failure for an admin tool.

**F2. Two sources of truth for section content.**
`Invitation.defaultSections` (JSON column) and the `Section` table both store
sections. The renderer prefers `defaultSections` and silently ignores
`Section` rows when it exists. Seeds write rows; editors write JSON; nothing
reconciles them.

**F3. The Template model is a schema clone, not an abstraction.**
`Template` duplicates nine design columns from `Invitation`
(contentType, defaultSections, overlayConfig, backgroundUrl, coverUrl, …).
Applying a template is a column-by-column copy with fragile overlay merging
(`{...existingOverlay, ...tplOverlay}` can resurrect stale keys such as an
old `themeId`).

**F4. Preview is re-implemented three times.**
EventBuilder has its own canvas replica, `PhonePreview` (1,039 lines) is a
second replica shared by two wizards (one dead), and the Theme Editor uses
the real invite in an iframe. Replicas drift from reality — the
`DB_SECTIONS` override bug existed precisely because a preview and the real
renderer disagreed.

### 1.2 Illogical steps

**F5. Event creation forks into contradictory editors with no guidance.**
After creating an event, the admin lands on EventBuilder; a separate button
opens the Theme Editor. The two editors write conflicting state (a builder
save rewrites `overlayConfig` and can drop `themeId`). Nothing tells the
admin which door is correct.

**F6. The client theme picker is a fake affordance.**
`dashboard/.../ThemeTab.tsx` renders a full theme-switching UI, but its API
(`/api/dashboard/invitation/[id]/theme`) unconditionally returns
403 "Theme is managed by your administrator". The client selects a theme,
waits for a spinner, then gets an error. Either the capability exists or the
UI shouldn't.

**F7. Template creation starts with a naming modal before any design exists.**
"New Template" asks for a name first, then opens a blank builder. Users name
things they haven't made; the catalog fills with "New Template (3)".

**F8. Built-in code themes are second-class.**
Sweet Hearts / Royal Khmer appear only as a passive strip on the Template
Library page: they cannot be templated, package-gated, or previewed from
there, while builder templates can. Two kinds of "theme" with different
capabilities and no path between them.

### 1.3 Inconsistencies

**F9. Vocabulary.** The nav says "Theme Builder", the page says "Template
Library", the route is `/admin/themes`, and it edits `Template` rows.
Section type systems differ per pipeline: wizard (`cover, wording,
countdown, details, gallery, video, wishing, khqr`), builder (`wording,
agenda, memory, aba, map, wishing, rsvp, custom`), theme modules (adds
`image, guestlist`; maps legacy `agenda` → details renderer).

**F10. Publish state is duplicated.** `Event.status` ("draft"/"published")
and `Invitation.isPublished` both exist; surfaces read whichever they like.
There is no publish validation (past dates, missing cover, empty sections
all publish fine).

**F11. Package gating is partial.** Templates are package-gated via
`PackageTemplate`; code themes aren't gated at all. Feature flags
(`hasWishing`, `hasKhqr`, …) are enforced at render for some sections, never
in the editors; numeric limits (`maxSections`, `maxPhotos`, `maxGuests`) are
enforced nowhere.

**F12. Dead surface area.** EventWizard (1,706 lines) and NewThemeWizard
(1,149 lines) are unmounted; `/preview/theme/[id]` is a redirect stub;
`/api/admin/themes/assign-event` returns 410; `theme.service.ts` is a stub;
`/admin/themes/assign` duplicates the package chips already on the library
cards. Dead code advertises flows that no longer exist.

---

## Part 2 — Target architecture (one vocabulary, one contract)

```
Theme      = code. A rendering engine in lib/themes/registry
             (sections, CSS, tokens, layout). Versioned by developers.
             The builder canvas becomes just another theme: "Freeform".

Template   = data. themeId + design overrides + placeholder content,
             saved by an admin in the Theme Studio, gated to packages.
             The ONLY catalog users ever choose from.

Event      = an instance. Identity (client, date, venue) + a design
             snapshot copied from a template + real content + lifecycle.
```

**The design document** — one JSON contract stored identically on
`Template.design` and `Invitation.design`:

```jsonc
{
  "themeId":  "theme-sweet-hearts",       // which engine renders
  "palette":  { "title": "#d64545", … },  // optional token overrides
  "fonts":    { "heading": "…", "body": "…" },
  "gate":     { "reveal": "fade", "position": "center", … },
  "sections": [                            // single source of truth
    { "type": "cover",   "included": true, "content": { … } },
    { "type": "agenda",  "included": true, "content": { … } }
  ]
}
```

Rules that eliminate the current failure modes:

1. **One renderer key.** `design.themeId` alone decides rendering.
   No key-sniffing, no precedence table. "Freeform" wraps the builder
   canvas, so builder invites are ordinary themed invites.
2. **One section vocabulary** shared by every theme, editor, and API:
   `cover, wording, countdown, agenda, details, gallery, video, khqr,
   wishing, guestlist`. Themes may ignore types they don't style (the
   standard renderer covers them).
3. **One preview.** Every editing surface embeds the real
   `/invite/[slug]?preview=1` page. No replicas.
4. **One publish flag** (`Invitation.isPublished`); `Event.status` is
   derived, never written independently.
5. **One gating function.** `canUse(pkg, template)` and
   `sectionAllowance(pkg)` used by catalog, editor, and render alike.

---

## Part 3 — Flow A: Theme Studio (admin creates reusable designs)

> Route: `/admin/studio`. Rename everything "Template Library / Theme
> Builder" to **Theme Studio**; it produces **Templates** from **Themes**.

**Step 1 — Browse.**
One gallery shows every base theme (code) and every saved template, each
rendered as a live thumbnail against the shared demo dataset
(`npm run db:demo`). No more empty-state guesswork; every card previews
real output.

**Step 2 — Create.**
"New template" → pick a base theme (Sweet Hearts, Royal Khmer, Freeform…).
The studio opens immediately with demo content loaded. Naming happens at
save time, not before (fixes F7).

**Step 3 — Design.**
Left panel: palette, fonts, gate settings, default section set with
placeholder content. Right panel: the real invite in a phone iframe,
autosaved (debounced) to a draft template and reloaded on every save —
identical mechanics to the event Theme Editor, same component.

**Step 4 — Publish to catalog.**
Name the template, auto-capture a thumbnail from the preview, assign
package tiers with the gating function, toggle Active. Active templates
appear in the catalog for event creation. (Deletes `/admin/themes/assign`
as a separate page — assignment is a property of the template, edited here.)

```
Browse ──▶ Create (pick base theme) ──▶ Design (live preview, autosave)
                                              │
                                              ▼
                              Publish: name + thumbnail + packages + activate
                                              │
                                              ▼
                                     Template catalog
```

---

## Part 4 — Flow B: Event lifecycle (admin, with optional client steps)

> One stepper across the top of the event page:
> **Details → Design → Content → Guests → Publish**, then a **Live** state.
> Each step is a screen with a single job; steps are revisitable.

**Step 1 — Details.**
Client (with package shown inline), event type, date, venue, map URL.
Creates `Event` + empty `Invitation` in draft. Nothing about design yet.

**Step 2 — Design.**
Template catalog filtered by the client's package (uses the same gating
function as the studio). Choosing a template **snapshots**
`template.design → invitation.design` — a copy, never a live link, so later
template edits can't mutate shipped events. Because rendering is keyed on
`design.themeId` only, the choice is visible instantly in the preview and
switching templates is always a visible, predictable act (fixes F1's
silent no-op).

**Step 3 — Content.**
The live Theme Editor (already built): per-section forms on the left, the
real invite iframe on the right, debounced autosave, gallery write-through.
Package limits enforced inline and server-side: a section counter
("4 of 6 sections"), locked sections labelled with the tier that unlocks
them, photo cap on the uploader (fixes F11).

**Step 4 — Guests.**
Guest list (import/add), per-guest tokens and personal links, RSVP and
guest-control settings per package. Personalized preview ("view as Lina ▸")
uses a real guest token in the same iframe.

**Step 5 — Publish.**
An automated checklist gates the publish button: date is in the future,
cover image set, no empty included sections, watermark notice per package,
share link + QR ready. Publishing sets the one flag and surfaces the share
link. Publishing is reversible (Unpublish), and post-publish edits show a
"live — changes appear to guests within seconds" banner (the existing
version poller already delivers this).

**Live.**
Guests open the gate, RSVP, and leave wishes; the dashboard shows RSVP
counts and wishes against the same data. Client dashboard access is honest:
read-only design, plus exactly the content/guest steps their package's
guest-control tier allows — the theme picker either works (templates from
their package) or is not rendered (fixes F6).

```
1 Details ─▶ 2 Design ─▶ 3 Content ─▶ 4 Guests ─▶ 5 Publish ─▶ Live
   event      snapshot     live edit     tokens      checklist    poller
   + inv      catalog ▲    + limits      + RSVP      one flag     refresh
              │
   Template catalog (from Theme Studio, package-gated)
```

---

## Part 5 — Migration map (apply to the real system)

| # | Status | Action | Touches |
|---|---|---|---|
| 1 | ✅ done (2026-07-06) | `design` contract + `resolveDesign` adapter reading legacy `overlayConfig`/`defaultSections`/`Section` rows; invite page consumes only the design | `lib/themes/design.ts`, invite page |
| 2 | ✅ done | `theme-freeform` + `theme-standard` registered; `design.themeId` is the sole renderer key — key-sniffing precedence deleted | registry, `lib/themes/themes/{standard,freeform}.ts`, invite page, ThemeEditor picker |
| 3 | ⏳ pending (schema) | Migrate `Section` rows → `design.sections`; drop dual reads (keep `Photo`, `Wish`, `Guest` — live data, not design). Non-urgent: the adapter already unifies reads | prisma migration, seeds |
| 4 | ✅ behavior done / ⏳ schema pending | `applyToEvent` rewritten as wholesale snapshot copy (no overlay merging — stale keys can't survive; copies `defaultSections` too; preserves event identity). Column collapse into one `design` JSON still pending | `template.service.ts` (also: its pre-existing TS errors fixed) |
| 5 | ✅ light rename done | "Theme Builder"/"Template Library" → **Theme Studio** (nav, page title, headings, breadcrumb). Full studio flow (base-theme picker, name-at-save, demo thumbnails) still pending | `AdminShell`, `ThemesPageClient`, `TemplateHeader` |
| 6 | ⏳ pending | Event page becomes the 5-step stepper; Theme Editor is the Content step | `app/admin/events/[id]/*` |
| 7 | ⏳ pending | Server-side package gating in event PATCH + photos API; limits surfaced in editors | API routes |
| 8 | ⏳ pending | Unify publish flag + checklist gate | schema, publish UI |
| 9 | ✅ done | Fake client ThemeTab removed (it and the whole client BuilderClient tab cluster were unmounted dead code; the live client page is an honest read-only overview) | dashboard builder |
| 10 | ✅ done | Deleted: EventWizard, NewThemeWizard, PhonePreview, ThemePreviewModal, ThemeFormModal, EventThemeManager, client builder tab cluster, `/preview/theme`, `/admin/themes/assign`, all 410/403 stub routes, `theme.service.ts` (~5,800 lines) | app + api |

**Verified after phase 1:** all three legacy data shapes render through the
single key — no-key invite → `theme-standard`, `builderDraft` invite →
`theme-freeform` (BuilderInvite), `themeId` invite → its code theme; the Theme
Editor picker now lists Standard / Freeform / Royal Khmer / Sweet Hearts with
an always-explicit `themeId` on save; `tsc` is clean project-wide.
