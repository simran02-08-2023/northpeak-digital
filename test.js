const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('index.html', 'utf8');
const scriptSrc = fs.readFileSync('script.js', 'utf8');

const results = [];
function check(label, condition, detail) {
  results.push({ label, pass: !!condition, detail: detail || '' });
}

const dom = new JSDOM(html, {
  url: 'https://example.com/',
  runScripts: 'outside-only',
  resources: 'usable',
  pretendToBeVisual: true
});

const { window } = dom;

// --- Polyfills jsdom doesn't provide ---
window.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; this.targets = []; }
  observe(el) { this.targets.push(el); this.cb([{ target: el, isIntersecting: true }], this); }
  unobserve() {}
  disconnect() {}
};

let rafId = 0;
window.requestAnimationFrame = (cb) => {
  rafId++;
  setTimeout(() => cb(Date.now()), 0);
  return rafId;
};

window.scrollTo = () => {};
window.navigator.clipboard = {
  writeText: () => Promise.resolve()
};
Object.defineProperty(window.document, 'execCommand', { value: () => true, writable: true });

try {
  window.localStorage.clear();
} catch (e) {
  // jsdom sometimes lacks full localStorage without a real origin; script.js has try/catch for this
}

let thrownErrors = [];
window.addEventListener('error', (e) => thrownErrors.push(e.error ? e.error.message : e.message));

// --- Run the actual script ---
try {
  window.eval(scriptSrc);
  check('Script executes without throwing on load', true);
} catch (e) {
  check('Script executes without throwing on load', false, e.message);
}

const doc = window.document;

// Give any setTimeout/rAF chains a moment
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  await wait(50);
  check('No uncaught runtime errors after load', thrownErrors.length === 0, thrownErrors.join(' | '));

  // --- Theme toggle ---
  const themeBtn = doc.getElementById('theme-toggle');
  const bodyBefore = doc.body.getAttribute('data-theme');
  themeBtn.dispatchEvent(new window.Event('click', { bubbles: true }));
  const bodyAfter = doc.body.getAttribute('data-theme');
  check('Theme toggle changes data-theme attribute', bodyAfter !== bodyBefore, `before="${bodyBefore}" after="${bodyAfter}"`);
  themeBtn.dispatchEvent(new window.Event('click', { bubbles: true })); // back to dark

  // --- Mobile menu ---
  const hamburger = doc.getElementById('hamburger-btn');
  const mobileMenu = doc.getElementById('mobile-menu');
  hamburger.dispatchEvent(new window.Event('click', { bubbles: true }));
  check('Hamburger opens mobile menu', mobileMenu.classList.contains('open'));
  check('Hamburger sets aria-expanded=true', hamburger.getAttribute('aria-expanded') === 'true');
  const firstMobileLink = mobileMenu.querySelector('a');
  firstMobileLink.dispatchEvent(new window.Event('click', { bubbles: true }));
  check('Clicking a mobile menu link closes the menu', !mobileMenu.classList.contains('open'));

  // --- Carousel ---
  const slidesBefore = doc.querySelectorAll('.testimonial-slide');
  const dotsBefore = doc.querySelectorAll('.carousel-dot');
  check('Carousel dots generated to match slide count', dotsBefore.length === slidesBefore.length, `slides=${slidesBefore.length} dots=${dotsBefore.length}`);
  const activeSlideBefore = [...slidesBefore].findIndex(s => s.classList.contains('active'));
  doc.getElementById('carousel-next').dispatchEvent(new window.Event('click', { bubbles: true }));
  const activeSlideAfter = [...doc.querySelectorAll('.testimonial-slide')].findIndex(s => s.classList.contains('active'));
  check('Next arrow advances the active slide', activeSlideAfter === (activeSlideBefore + 1) % slidesBefore.length, `before=${activeSlideBefore} after=${activeSlideAfter}`);
  doc.getElementById('carousel-prev').dispatchEvent(new window.Event('click', { bubbles: true }));
  const activeSlideBack = [...doc.querySelectorAll('.testimonial-slide')].findIndex(s => s.classList.contains('active'));
  check('Prev arrow returns to original slide', activeSlideBack === activeSlideBefore, `back=${activeSlideBack}`);

  // --- Pricing toggle ---
  const basecampPrice = doc.querySelector('.tier-price[data-base="3200"]');
  const standardText = basecampPrice.textContent.trim();
  const rushBtn = doc.querySelector('.pricing-toggle button[data-speed="rush"]');
  rushBtn.dispatchEvent(new window.Event('click', { bubbles: true }));
  await wait(200); // matches the 120ms setTimeout in the toggle handler
  const rushText = basecampPrice.textContent.trim();
  check('Pricing toggle recalculates displayed price', standardText !== rushText, `standard="${standardText}" rush="${rushText}"`);
  check('Rush price is ~20% higher than standard', (() => {
    const std = parseInt(standardText.replace(/\D/g, ''), 10);
    const rush = parseInt(rushText.replace(/\D/g, ''), 10);
    const expected = Math.round((std * 1.2) / 100) * 100;
    return rush === expected;
  })(), `expected≈${Math.round((3200*1.2)/100)*100}`);

  // --- FAQ accordion ---
  const firstFaq = doc.querySelector('.faq-item');
  const firstFaqQuestion = firstFaq.querySelector('.faq-question');
  firstFaqQuestion.dispatchEvent(new window.Event('click', { bubbles: true }));
  check('FAQ item opens on click', firstFaq.classList.contains('open'));
  const secondFaq = doc.querySelectorAll('.faq-item')[1];
  secondFaq.querySelector('.faq-question').dispatchEvent(new window.Event('click', { bubbles: true }));
  check('Opening a second FAQ item closes the first (accordion behavior)', !firstFaq.classList.contains('open') && secondFaq.classList.contains('open'));

  // --- Character counter ---
  const messageField = doc.getElementById('message');
  const charCount = doc.getElementById('char-count');
  messageField.value = 'Testing the character counter logic here.';
  messageField.dispatchEvent(new window.Event('input', { bubbles: true }));
  check('Character counter updates on input', charCount.textContent === `${messageField.value.length} / 500`, charCount.textContent);

  // --- Copy email button ---
  const copyBtn = doc.getElementById('copy-email');
  const originalCopyText = copyBtn.textContent;
  copyBtn.dispatchEvent(new window.Event('click', { bubbles: true }));
  await wait(20);
  check('Copy button changes label to confirm copy', copyBtn.textContent === 'Copied!', copyBtn.textContent);

  // --- Form validation: invalid submit should block and show errors ---
  const form = doc.getElementById('contact-form');
  const status = doc.getElementById('form-status');
  doc.getElementById('name').value = '';
  doc.getElementById('email').value = 'not-an-email';
  doc.getElementById('budget').value = '';
  doc.getElementById('message').value = 'short';
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  check('Invalid form submission shows an error status', status.textContent.includes('fix'), status.textContent);
  check('Invalid email shows a field-level error', doc.getElementById('error-email').textContent.length > 0);

  // --- Form validation: valid submit should show loading then success ---
  doc.getElementById('name').value = 'Jordan Lee';
  doc.getElementById('email').value = 'jordan@example.com';
  doc.getElementById('budget').value = '$5,000–$10,000';
  doc.getElementById('message').value = 'We need a full marketing site rebuild by next quarter.';
  const submitBtn = doc.getElementById('submit-btn');
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  const duringSubmit = submitBtn.disabled;
  check('Submit button disables during simulated send', duringSubmit === true);
  await wait(1300); // matches the 1100ms setTimeout in the submit handler
  check('Form shows success message after simulated send', status.textContent.includes('reply'), status.textContent);
  check('Submit button re-enables after send', submitBtn.disabled === false);

  // --- Scroll progress / back-to-top / scrollspy: check they don't throw ---
  Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });
  window.dispatchEvent(new window.Event('scroll'));
  const backToTop = doc.getElementById('back-to-top');
  check('Back-to-top button appears after scrolling past threshold', backToTop.classList.contains('show'));

  // --- Print results ---
  console.log('\n=== FUNCTIONAL TEST RESULTS ===\n');
  let failCount = 0;
  results.forEach(r => {
    console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.label + (r.detail ? '  [' + r.detail + ']' : ''));
    if (!r.pass) failCount++;
  });
  console.log('\n' + (results.length - failCount) + '/' + results.length + ' checks passed.');
  if (thrownErrors.length) {
    console.log('\nUncaught errors during run:', thrownErrors);
  }
  process.exit(failCount > 0 ? 1 : 0);
})();
