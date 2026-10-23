/* ==========================================================================
   MS.FITS MEDIA — interactions (vanilla JS, no libraries)
   1. Cover animation (logo assembles → dive into the sparkle → slide away)
   2. Header state + mobile menu
   3. Scroll-driven hero (phone settles, scraps fly in, headline lands)
   4. Scraps: mouse parallax + drag
   5. Scroll reveals
   6. Footer year
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)');
  var READY = 'msfits:ready';

  /* Easing curves (close equivalents of back.out / power3.in / power4.inOut) */
  var EASE_BACK = 'cubic-bezier(.34, 1.8, .64, 1)';
  var EASE_IN = 'cubic-bezier(.32, 0, .67, 0)';
  var EASE_INOUT = 'cubic-bezier(.76, 0, .24, 1)';

  /* ---------- 1. Cover animation ---------- */
  function runIntro() {
    var pre = document.getElementById('preloader');
    if (!pre || !root.classList.contains('intro') || !pre.animate) return finishIntro(pre);

    root.classList.add('is-locked');   // no scrolling while the cover plays
    // Hard safety net: whatever happens, the page unlocks and the cover goes away
    var safety = setTimeout(function () { finishIntro(pre); }, 4500);

    var q = function (s) { return pre.querySelector(s); };
    var mark = q('.preloader__mark');
    var copy = q('.preloader__copy');
    var flood = q('.preloader__flood');
    var at = function (el, frames, opts) { return el.animate(frames, Object.assign({ fill: 'both' }, opts)); };

    // Wait briefly for the logo's serif "M" to load so it doesn't swap mid-animation
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 900); })]).then(function () {
      // the blue tile spins up from nothing
      at(q('.pc--tile'), [{ transform: 'scale(0) rotate(-90deg)' }, { transform: 'none' }],
        { duration: 450, delay: 150, easing: EASE_BACK });
      // loading line
      at(copy, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 300 });
      // the M drops in from the top-right, the dot from the bottom-left
      at(q('.pc--m'), [{ transform: 'translate(1400px, -1100px)' }, { transform: 'none' }],
        { duration: 320, delay: 500, easing: EASE_BACK });
      at(q('.pc--dot'), [{ transform: 'translate(-1400px, 1100px)' }, { transform: 'none' }],
        { duration: 320, delay: 620, easing: EASE_BACK });
      // the sparkle pops and twinkles
      at(q('.pc--spark'), [
        { transform: 'scale(0) rotate(-180deg)' },
        { transform: 'scale(1.6) rotate(-20deg)', offset: .6 },
        { transform: 'none' }
      ], { duration: 520, delay: 800, easing: 'ease-out' });
      at(copy, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, delay: 1450, fill: 'forwards' });

      // dive into the sparkle: the logo pushes in while a yellow circle
      // grows out of the sparkle until it fills the screen.
      // (A modest scale + a clip-path circle is far lighter for the browser
      // than scaling the logo hundreds of times.)
      var r = mark.getBoundingClientRect();
      var fx = r.left + r.width * .83, fy = r.top + r.height * .34;   // sparkle centre on screen
      var reach = Math.hypot(Math.max(fx, innerWidth - fx), Math.max(fy, innerHeight - fy)) + 20;
      at(mark, [{ transform: 'scale(1)' }, { transform: 'scale(8)' }],
        { duration: 600, delay: 1500, easing: EASE_IN, fill: 'forwards' });
      at(flood, [
        { clipPath: 'circle(0px at ' + fx + 'px ' + fy + 'px)' },
        { clipPath: 'circle(' + reach + 'px at ' + fx + 'px ' + fy + 'px)' }
      ], { duration: 480, delay: 1620, easing: EASE_IN, fill: 'both' });

      setTimeout(function () {
        pre.style.background = '#EAA18E';
        mark.style.display = 'none';
        // the cover slides up and away
        pre.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
          { duration: 600, easing: EASE_INOUT, fill: 'forwards' });
        // finish on a timer rather than waiting for the animation's "finish" event
        setTimeout(function () { clearTimeout(safety); finishIntro(pre); }, 640);
      }, 2120);
    }).catch(function () { clearTimeout(safety); finishIntro(pre); });
  }

  /* Gentle cover for reduced motion: the logo fades in, holds, and the cover fades away */
  function runGentleIntro() {
    var pre = document.getElementById('preloader');
    if (!pre || !pre.animate) return finishIntro(pre);
    root.classList.add('is-locked');
    var safety = setTimeout(function () { finishIntro(pre); }, 3000);
    var mark = pre.querySelector('.preloader__mark');
    var copy = pre.querySelector('.preloader__copy');
    mark.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 100, fill: 'both' });
    copy.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 250, fill: 'both' });
    setTimeout(function () {
      pre.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease', fill: 'forwards' });
      setTimeout(function () { clearTimeout(safety); finishIntro(pre); }, 420);
    }, 1200);
  }

  var introDone = false;
  function finishIntro(pre) {
    if (introDone) return;
    introDone = true;
    root.classList.remove('intro', 'is-locked');
    root.classList.add('is-ready');   // lets the hero fade in (gentle mode)
    if (pre) {
      if (pre.getAnimations) pre.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
      pre.style.display = 'none';
    }
    try { sessionStorage.setItem('msfits-intro', '1'); } catch (e) {}
    window.dispatchEvent(new Event(READY));
  }

  // Start at the top on every load (and when returning via the back button)
  function toTop() {
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = '';
  }
  toTop();
  window.addEventListener('pageshow', toTop);

  if (!root.classList.contains('intro')) finishIntro(document.getElementById('preloader'));
  else if (reduceMotion) runGentleIntro();
  else runIntro();

  /* ---------- 2. Header + mobile menu ---------- */
  var header = document.getElementById('site-header');
  var hero = document.getElementById('hero');

  function headerState() {
    if (!header) return;
    // transparent over the hero, solid blue once the hero has scrolled past
    var heroEnd = hero ? hero.offsetTop + hero.offsetHeight - header.offsetHeight : 0;
    header.classList.toggle('is-scrolled', window.scrollY > heroEnd - 1);
  }

  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('nav-panel');

  function setMenu(open) {
    if (!toggle || !panel) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (header) header.classList.toggle('menu-shown', open);
  }

  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.site-nav')) setMenu(false); });
    var onWiden = function (e) { if (e.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onWiden);
    else if (desktop.addListener) desktop.addListener(onWiden);
  }

  /* ---------- 3. Scroll-driven hero ---------- */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function heroProgress() {
    if (!hero) return;
    if (!desktop.matches || reduceMotion) {
      hero.style.setProperty('--p', 1);
      hero.style.setProperty('--e', 1);
      return;
    }
    var travel = hero.offsetHeight - window.innerHeight;
    var p = travel > 0 ? clamp(-hero.getBoundingClientRect().top / travel, 0, 1) : 1;
    // the phone and scraps finish settling at 75% of the scroll; headline follows
    var t = clamp(p / .75, 0, 1);
    var e = 1 - Math.pow(1 - t, 3);
    hero.style.setProperty('--p', p.toFixed(4));
    hero.style.setProperty('--e', e.toFixed(4));
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      heroProgress();
      headerState();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  heroProgress();
  headerState();

  /* ---------- 4. Scraps: mouse parallax + drag ---------- */
  var scraps = document.querySelectorAll('.scrap');
  scraps.forEach(function (s) { s.style.setProperty('--depth', s.getAttribute('data-depth') || 0); });

  if (hero && !reduceMotion) {
    hero.addEventListener('mousemove', function (e) {
      if (!desktop.matches) return;
      hero.style.setProperty('--mx', ((e.clientX / window.innerWidth) - .5).toFixed(3));
      hero.style.setProperty('--my', ((e.clientY / window.innerHeight) - .5).toFixed(3));
    });
  }

  scraps.forEach(function (s) {
    var startX, startY, baseX = 0, baseY = 0;
    s.addEventListener('pointerdown', function (e) {
      if (!desktop.matches) return;
      e.preventDefault();
      try { s.setPointerCapture(e.pointerId); } catch (err) { /* drag still works without capture */ }
      s.classList.add('is-dragging');
      startX = e.clientX; startY = e.clientY;
      var move = function (ev) {
        s.style.setProperty('--dx', (baseX + ev.clientX - startX) + 'px');
        s.style.setProperty('--dy', (baseY + ev.clientY - startY) + 'px');
      };
      var up = function (ev) {
        baseX += ev.clientX - startX;
        baseY += ev.clientY - startY;
        s.classList.remove('is-dragging');
        s.removeEventListener('pointermove', move);
        s.removeEventListener('pointerup', up);
        s.removeEventListener('pointercancel', up);
      };
      s.addEventListener('pointermove', move);
      s.addEventListener('pointerup', up);
      s.addEventListener('pointercancel', up);
    });
  });

  /* ---------- Brand bar: keep "Strategy-led ✦ Story-driven ✦ Social-first" on one line ----------
     Phones render text at different widths (font loading, text-size settings),
     so instead of trusting a fixed size, shrink the text until the line fits. */
  var barLine = document.querySelector('.ticker__line');
  function fitBar() {
    if (!barLine || !barLine.children.length) return;
    barLine.style.fontSize = '';                       // start from the CSS size
    var size = parseFloat(getComputedStyle(barLine).fontSize);
    var first = barLine.children[0];
    var last = barLine.children[barLine.children.length - 1];
    var room = barLine.clientWidth;
    var used = function () { return last.getBoundingClientRect().right - first.getBoundingClientRect().left; };
    while (used() > room && size > 8) {
      size -= 0.5;
      barLine.style.fontSize = size + 'px';
    }
  }
  fitBar();
  window.addEventListener('resize', fitBar);
  window.addEventListener('orientationchange', fitBar);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitBar);
  window.addEventListener('load', fitBar);

  /* ---------- Result numbers count up when a work card scrolls into view ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    var countUp = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var start = null, dur = 1400;
      var step = function (now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var countObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObs.observe(el); });
  }

  /* ---------- Reels: play silently while on screen; one at a time with sound ---------- */
  var reels = document.querySelectorAll('.reel__video');
  if (reels.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      // no autoplay: show the normal video controls instead
      reels.forEach(function (v) {
        v.controls = true;
        v.preload = 'metadata';
        v.closest('.reel').classList.add('reel--manual');
      });
    } else {
      // On phones only the first reel starts by itself; the others wait for a tap on play.
      // A reel the viewer paused (or started) stays that way until they change it.
      var phone = window.matchMedia('(max-width: 899px), (hover: none) and (pointer: coarse)');
      var play = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
      var reelObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          var wants = v.dataset.choice === 'play' ||
            (!v.dataset.choice && (!phone.matches || v === reels[0]));
          if (entry.isIntersecting && wants) play(v);
          else v.pause();
        });
      }, { threshold: 0.5 });
      reels.forEach(function (v) {
        reelObs.observe(v);

        // play / pause button (tapping the video itself does the same)
        var btn = document.createElement('button');
        btn.className = 'reel__play';
        btn.type = 'button';
        v.parentNode.appendChild(btn);
        var sync = function () {
          var paused = v.paused;
          btn.setAttribute('aria-label', paused ? 'Play reel' : 'Pause reel');
          btn.classList.toggle('is-paused', paused);
        };
        var toggle = function () {
          if (v.paused) { v.dataset.choice = 'play'; play(v); }
          else { v.dataset.choice = 'pause'; v.pause(); }
        };
        btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="reel__pl" d="M8 5v14l11-7z"/><path class="reel__pa" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
        btn.addEventListener('click', toggle);
        v.addEventListener('click', toggle);
        v.addEventListener('play', sync);
        v.addEventListener('pause', sync);
        sync();
      });
    }

    document.querySelectorAll('.reel__sound').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.closest('.reel').querySelector('.reel__video');
        var turnOn = v.muted;
        // mute every reel first, so only one ever plays with sound
        reels.forEach(function (o) { o.muted = true; });
        document.querySelectorAll('.reel__sound').forEach(function (b) {
          b.setAttribute('aria-pressed', 'false');
          b.setAttribute('aria-label', 'Turn sound on');
        });
        if (turnOn) {
          v.muted = false;
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', 'Turn sound off');
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        }
      });
    });
  }

  /* ---------- Posts open full size ---------- */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('.lightbox__img');
    var closeLb = function () { if (lightbox.open) lightbox.close(); };
    document.querySelectorAll('.gallery__item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var img = btn.querySelector('img');
        lbImg.src = btn.getAttribute('data-full');
        lbImg.alt = img ? img.alt : '';
        if (lightbox.showModal) lightbox.showModal();
        else window.open(lbImg.src, '_blank');
      });
    });
    lightbox.querySelector('.lightbox__close').addEventListener('click', closeLb);
    // a click on the dimmed backdrop (outside the image) closes it too
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLb(); });
  }

  /* ---------- 6. Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 5. Scroll reveals ---------- */
  // (With reduced motion these are plain fades; the CSS removes the slide.)
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  revealEls.forEach(function (el) { observer.observe(el); });

  // Safety net: at the very bottom of the page, show anything still waiting
  window.addEventListener('scroll', function () {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }, { passive: true });
})();

/* Work posts: on narrow screens the row scrolls sideways, so start it on the centre post */
(function () {
  var row = document.querySelector('.flower');
  var mid = row && row.querySelector('.flower__item--center');
  if (!mid) return;
  function centre() {
    if (window.matchMedia('(max-width: 899px), (hover: none) and (pointer: coarse)').matches) { row.scrollLeft = 0; return; }   // phones start at the first post
    row.scrollLeft = mid.offsetLeft - (row.clientWidth - mid.offsetWidth) / 2;
  }
  centre();
  window.addEventListener('load', centre);
  window.addEventListener('resize', centre);
})();

/* Contact numbers: on a computer there's no dialler, so a click copies the number and says so.
   On touch devices the tel: link still opens the phone app. */
(function () {
  var toast = document.getElementById('toast');
  var links = document.querySelectorAll('[data-copy]');
  if (!toast || !links.length || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var timer;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('is-on'); }, 3200);
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    ta.remove();
    return ok;
  }
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var num = a.getAttribute('data-copy');
      var done = function () { say('Copied ' + num + ' to your clipboard. Call us, we’d love to hear what you’re building.'); };
      var fail = function () { say('Our number is ' + num + '. Call us, we’d love to hear what you’re building.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(num).then(done, function () { fallbackCopy(num) ? done() : fail(); });
      } else {
        fallbackCopy(num) ? done() : fail();
      }
    });
  });
})();
