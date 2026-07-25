# Optimization changelog — NorthPeak Digital

## Accessibility fixes

**1. Ambiguous link text (6 instances)**
Every service card had a link that just said "Learn more →". A screen reader user
navigating by link list would hear "Learn more, Learn more, Learn more..." six times
with no way to tell them apart.
*Fix:* added `aria-label="Learn more about [Service Name]"` to each one, so the
visible text stays short but the accessible name is specific.

**2. Icon-only buttons announcing twice**
Buttons like the theme toggle, hamburger menu, carousel arrows, and back-to-top
button already had `aria-label` on the `<button>`, but their inner `<svg>` had no
`aria-hidden`, so some screen readers announce the SVG's implicit role on top of
the button's label.
*Fix:* added `aria-hidden="true"` to every purely decorative icon SVG (5 total).
The button's `aria-label` is now the only thing announced.

**3. Color contrast — checked, not changed**
Ran the numbers on the two riskiest pairs before assuming they were fine:
- Dimmed text (`#9797AC`) on the dark background (`#0B0B14`): **6.84:1**
- Dimmed text on card surfaces (`#14141F`): **6.38:1**

Both clear the WCAG AA threshold (4.5:1) comfortably, so no color changes were
needed — but it was worth verifying rather than assuming the palette was safe.

## Performance

**4. Script loading**
`script.js` was already placed just before `</body>`, so it wasn't blocking
first paint. Added the `defer` attribute anyway — it lets the browser fetch the
script in parallel with HTML parsing instead of waiting, which is best practice
even when the practical difference here is small given the script's position.

**5. Font weights — audited, not trimmed**
Checked which font weights are actually used in the CSS (`500`, `600`, `700` for
the display face; `400` default plus the same three for body) against what's
requested from Google Fonts. They matched exactly — nothing to cut.

## What I deliberately did not "fix," and why

This build has real interactivity: a testimonial carousel, animated counters,
a live pricing calculator, an accordion, a theme toggle. All of that JS has a
performance cost — more script to parse, more listeners, more layout work than
a static page would need. I chose not to strip any of it down to inflate the
Performance number, because:

- None of it blocks rendering (script loads after content, IntersectionObservers
  are lazy by nature).
- The honest trade-off is: a more capable page costs a few Performance points
  versus a page that does nothing. I'd rather ship the capable page and be able
  to explain that trade-off than quietly gut the functionality between Task A
  and Task B to chase a number.

The one thing I'd change with more time: self-host the two Google Fonts instead
of loading them from `fonts.googleapis.com`. That removes a third-party request
and DNS lookup entirely, which is usually worth more to Performance than
anything else on this list. I didn't do it here because it requires downloading
and committing the actual font files, which needs to happen from your machine
(my sandbox can't reach `fonts.gstatic.com`) — happy to give you the exact
steps if you want to do that pass too.

## How to reproduce the Lighthouse run

1. Open the deployed site in Chrome (not a local file — Lighthouse behaves
   differently on `file://` URLs).
2. Open DevTools → Lighthouse tab.
3. Select **Performance** and **Accessibility**, device = Desktop (or Mobile,
   whichever you want to report — running both is even stronger).
4. Click **Analyze page load**.
5. Screenshot the summary screen showing both scores — that's your Task B
   deliverable.
