# NorthPeak Digital — one-page agency site

A fictional web-development agency landing page, built for the Digital Heroes
Web Development internship task kit. No frameworks, no build step, no
dependencies beyond one Google Fonts request — open `index.html` and it runs.

**Live site:** _add your deployed URL here once GitHub Pages is live_
**Repo:** _add your GitHub repo URL here_

---

## Tech stack

- Vanilla HTML5, CSS3, JavaScript (ES5-leaning syntax, no transpiler needed)
- Google Fonts: Space Grotesk (display) + Inter (body)
- Zero npm dependencies, zero build tooling — deploys as static files

## File structure

```
├── index.html      → markup only
├── styles.css      → all styling, design tokens, responsive rules
├── script.js       → all interactive behavior, wrapped in a single IIFE
├── README.md        → this file
└── CHANGELOG.md      → Task B optimization notes
```

Keep all three code files in the same directory when deploying — `index.html`
references the other two by relative path.

---

## Task A — the build

### Sections
Hero, 6-item services grid, testimonials, 3-tier pricing, FAQ, contact form
with client-side validation — plus a stat bar and a mini illustration in the
hero representing "a site we'd build," rather than a stock photo.

### Design direction
Dark theme with a purple → pink → blue gradient system, rounded 18px cards,
pill-shaped nav and buttons. Pricing tiers are named Basecamp / Ascent /
Summit rather than Basic/Pro/Enterprise, tying into the agency's name and a
"planning the route before the climb" framing used in the hero copy and the
FAQ section.

### Interactive functionality
- Responsive mobile menu (hamburger → slide-down panel, height calculated
  dynamically from content so it never clips)
- Scrollspy — nav link highlights the section currently in view
- Scroll-reveal animations via `IntersectionObserver`
- Animated stat counters that count up when scrolled into view
- Testimonial carousel — autoplay, pause-on-hover, manual arrows + dot
  navigation
- Pricing toggle ("Standard" vs "Expedited +20%") that recalculates all
  three displayed prices live from source data, rather than swapping
  pre-written strings
- FAQ accordion (one section open at a time)
- Scroll progress bar + back-to-top button
- Light/dark theme toggle (persisted via `localStorage` where available,
  degrades to a session-only toggle if it isn't)
- Copy-to-clipboard on the contact email, with an `execCommand` fallback
  for browsers without the Clipboard API
- Live character counter and full client-side validation on the contact
  form, with a simulated loading state on submit

### Responsiveness
Tested at 360px, 768px, and 1440px per the brief. Layout collapses from a
4-column services grid → 2 → 1, and pricing/contact panels stack vertically
below 900px/860px respectively.

### Functional verification
Every interactive feature above was exercised with an automated test
(`test.js`, using jsdom) that loads the real `index.html` and `script.js`,
simulates clicks/input/form submission, and asserts the resulting DOM state —
not just a visual check. All 21 assertions pass. This isn't a substitute for
testing in a real browser yourself before submitting, but it did catch one
real bug during development (see below).

**Bug found and fixed during testing:** the mobile menu originally used a
guessed fixed `max-height: 400px` for its open state. Given six links plus a
CTA button, that was close enough to the actual content height that it risked
clipping the last item on some font/zoom settings. Fixed by calculating the
menu's real height in JavaScript (`scrollHeight`) instead of guessing a
number in CSS.

---

## Task B — optimization

Full detail, reasoning, and honest trade-offs are in `CHANGELOG.md`. Short
version:

- Fixed 6 instances of ambiguous link text ("Learn more →" with no context)
  by adding descriptive `aria-label`s
- Added `aria-hidden="true"` to 5 decorative icon SVGs that were at risk of
  being announced twice alongside their parent button's label
- Verified (not assumed) color contrast on the two riskiest text/background
  pairs — both clear WCAG AA
- Added `defer` to the script tag
- Documented one optimization I deliberately didn't make (self-hosting the
  Google Fonts) and why, plus what it would take to do it properly

---

## Running it locally

No server required — just open `index.html` in a browser. If you want to
run the functional test suite yourself:

```
npm install jsdom
node test.js
```

---

## Deployment (GitHub Pages)

1. **Create the repository**
   - Go to [github.com/new](https://github.com/new)
   - Name it something like `northpeak-digital` — this becomes part of your
     live URL
   - Set visibility to **Public** (private repos need GitHub Pro for Pages)
   - Don't initialize with a README — you're uploading your own

2. **Upload the files**
   - On the new repo page, click **"uploading an existing file"**
   - Drag in `index.html`, `styles.css`, `script.js`, `README.md`, and
     `CHANGELOG.md` together
   - Write a commit message (e.g. "Initial site build") → **Commit changes**

   *(Command-line alternative: `git init`, `git add .`,
   `git commit -m "Initial site build"`,
   `git remote add origin <your-repo-url>`, `git push -u origin main`)*

3. **Enable Pages**
   - **Settings → Pages** (left sidebar)
   - Under "Build and deployment" → Source: **Deploy from a branch**
   - Branch: `main`, folder: **/ (root)** → **Save**
   - Wait 1–2 minutes, refresh — your live URL will appear, formatted like
     `https://yourusername.github.io/northpeak-digital/`

4. **Verify**
   - Open the URL in an incognito window to avoid cache confusion
   - Click through every feature listed above — nav, form, carousel,
     pricing toggle, theme toggle, FAQ — before treating it as done
   - This is the URL you submit as your "Live URL" deliverable for Task A

If Pages shows an error, the most common cause is a typo in the branch or
folder setting in step 3 — double-check `main` and `/ (root)` match exactly
what you pushed.
