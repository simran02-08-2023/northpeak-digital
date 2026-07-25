(function(){

  /* ---------- Theme toggle ---------- */
  var themeToggle = document.getElementById('theme-toggle');
  var themeState = 'dark';
  try {
    var saved = localStorage.getItem('northpeak-theme');
    if(saved){ themeState = saved; document.body.setAttribute('data-theme', saved); }
  } catch(e){ /* localStorage unavailable in this preview — fall back to in-memory state only */ }

  themeToggle.addEventListener('click', function(){
    themeState = themeState === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', themeState);
    try { localStorage.setItem('northpeak-theme', themeState); } catch(e){}
  });

  /* ---------- Mobile menu ---------- */
  var hamburgerBtn = document.getElementById('hamburger-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  function openMobileMenu(){
    mobileMenu.classList.add('open');
    mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
    hamburgerBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMobileMenu(){
    mobileMenu.classList.remove('open');
    mobileMenu.style.maxHeight = null;
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }
  hamburgerBtn.addEventListener('click', function(){
    if(mobileMenu.classList.contains('open')) closeMobileMenu();
    else openMobileMenu();
  });
  mobileMenu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeMobileMenu);
  });

  /* ---------- Scroll progress + back to top + scrollspy ---------- */
  var progressBar = document.getElementById('scroll-progress');
  var backToTop = document.getElementById('back-to-top');
  var sections = document.querySelectorAll('main section, main#top');
  var navLinks = document.querySelectorAll('.navlinks a');

  function onScroll(){
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? scrollTop / docHeight : 0;
    progressBar.style.transform = 'scaleX(' + pct + ')';

    backToTop.classList.toggle('show', scrollTop > 500);

    var current = 'top';
    document.querySelectorAll('section[id]').forEach(function(sec){
      var rect = sec.getBoundingClientRect();
      if(rect.top <= 140 && rect.bottom > 140){ current = sec.id; }
    });
    if(scrollTop < 200) current = 'top';
    navLinks.forEach(function(link){
      link.classList.toggle('active', link.dataset.section === current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener('click', function(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- Animated stat counters ---------- */
  var statEls = document.querySelectorAll('.stat-num');
  function animateCount(el){
    var target = parseFloat(el.dataset.target);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var suffix = el.dataset.suffix || '';
    var duration = 1400;
    var start = null;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if(progress < 1){ requestAnimationFrame(step); }
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var statObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statEls.forEach(function(el){ statObserver.observe(el); });
  }

  /* ---------- Testimonial carousel ---------- */
  var slides = document.querySelectorAll('.testimonial-slide');
  var dotsWrap = document.getElementById('carousel-dots');
  var current = 0;
  var autoplayTimer;

  slides.forEach(function(_, i){
    var dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
    dot.addEventListener('click', function(){ goToSlide(i); resetAutoplay(); });
    dotsWrap.appendChild(dot);
  });
  var dots = document.querySelectorAll('.carousel-dot');

  function goToSlide(i){
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  document.getElementById('carousel-prev').addEventListener('click', function(){ goToSlide(current - 1); resetAutoplay(); });
  document.getElementById('carousel-next').addEventListener('click', function(){ goToSlide(current + 1); resetAutoplay(); });

  function startAutoplay(){ autoplayTimer = setInterval(function(){ goToSlide(current + 1); }, 6000); }
  function resetAutoplay(){ clearInterval(autoplayTimer); startAutoplay(); }
  startAutoplay();

  var carouselEl = document.getElementById('carousel');
  carouselEl.addEventListener('mouseenter', function(){ clearInterval(autoplayTimer); });
  carouselEl.addEventListener('mouseleave', function(){ startAutoplay(); });

  /* ---------- Pricing toggle ---------- */
  var pricingToggle = document.getElementById('pricing-toggle');
  var priceEls = document.querySelectorAll('.tier-price');
  var currentSpeed = 'standard';

  function formatPrice(value, prefix){
    var rounded = Math.round(value / 100) * 100;
    return (prefix || '') + '$' + rounded.toLocaleString('en-US');
  }

  pricingToggle.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click', function(){
      pricingToggle.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      currentSpeed = btn.dataset.speed;
      priceEls.forEach(function(el){
        el.style.opacity = '0';
        setTimeout(function(){
          var base = parseFloat(el.dataset.base);
          var prefix = el.dataset.prefix || '';
          var value = currentSpeed === 'rush' ? base * 1.2 : base;
          el.textContent = formatPrice(value, prefix);
          el.style.opacity = '1';
        }, 120);
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function(item){
    var question = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    question.addEventListener('click', function(){
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(openItem){
        if(openItem !== item){
          openItem.classList.remove('open');
          openItem.querySelector('.faq-answer').style.maxHeight = null;
          openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', !isOpen);
      question.setAttribute('aria-expanded', String(!isOpen));
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Copy email ---------- */
  var copyBtn = document.getElementById('copy-email');
  copyBtn.addEventListener('click', function(){
    var email = 'hello@northpeak.digital';
    function fallbackCopy(){
      var ta = document.createElement('textarea');
      ta.value = email;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch(e){}
      document.body.removeChild(ta);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(email).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
    var originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(function(){ copyBtn.textContent = originalText; }, 1800);
  });

  /* ---------- Character counter ---------- */
  var messageField = document.getElementById('message');
  var charCount = document.getElementById('char-count');
  messageField.addEventListener('input', function(){
    charCount.textContent = messageField.value.length + ' / 500';
  });

  /* ---------- Contact form validation + simulated submit ---------- */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  var submitBtn = document.getElementById('submit-btn');

  function setError(fieldId, msg){
    var field = document.getElementById('field-' + fieldId);
    var err = document.getElementById('error-' + fieldId);
    if(msg){ field.classList.add('invalid'); err.textContent = msg; }
    else { field.classList.remove('invalid'); err.textContent = ''; }
  }

  function isValidEmail(val){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var valid = true;

    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var budget = document.getElementById('budget').value.trim();
    var message = document.getElementById('message').value.trim();

    if(name.length < 2){ setError('name', 'Enter your full name.'); valid = false; } else setError('name', '');
    if(!isValidEmail(email)){ setError('email', 'Enter a valid email address.'); valid = false; } else setError('email', '');
    if(budget.length < 2){ setError('budget', 'Give us a rough range.'); valid = false; } else setError('budget', '');
    if(message.length < 10){ setError('message', 'Tell us a bit more.'); valid = false; } else setError('message', '');

    if(!valid){
      status.textContent = 'Please fix the highlighted fields.';
      status.style.color = '#F87171';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Sending…';
    status.textContent = '';

    setTimeout(function(){
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
      status.style.color = '';
      status.textContent = "Thanks — we'll reply within 1 business day.";
      charCount.textContent = '0 / 500';
      form.reset();
    }, 1100);
  });

})();
