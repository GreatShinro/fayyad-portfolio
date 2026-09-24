(function () {
  'use strict';

  var doc = document;
  var win = window;

  var BP = {
    default: [1440, Infinity],
    '1tfs4jz': [1200, 1439.98],
    '1xnmc73': [810, 1199.98],
    kgxcmu: [0, 809.98]
  };

  function currentBreakpoint() {
    var w = win.innerWidth;
    var keys = ['default', '1tfs4jz', '1xnmc73', 'kgxcmu'];
    for (var i = 0; i < keys.length; i++) {
      var r = BP[keys[i]];
      if (w >= r[0] && w < r[1]) return keys[i];
    }
    return 'default';
  }

  function revealWorkCards() {
    doc.querySelectorAll('[class*="hidden-72rtr7"][class*="hidden-1xnmc73"][class*="hidden-kgxcmu"]').forEach(function (el) {
      if (el.hasAttribute('data-framer-root')) return;
      el.classList.remove('hidden-72rtr7', 'hidden-1xnmc73', 'hidden-kgxcmu');
    });
  }

  function injectSmoothScroll() {
    var st = doc.createElement('style');
    st.textContent = 'html{scroll-behavior:smooth}';
    doc.head.appendChild(st);
  }

  function buildTransform(a) {
    var parts = [];
    if (a.x) parts.push('translateX(' + a.x + 'px)');
    if (a.y) parts.push('translateY(' + a.y + 'px)');
    if (a.scale && a.scale !== 1) parts.push('scale(' + a.scale + ')');
    if (a.rotate) parts.push('rotate(' + a.rotate + 'deg)');
    return parts.length ? parts.join(' ') : 'none';
  }

  function initAppear() {
    var jsonScript = doc.getElementById('__framer__appearAnimationsContent');
    if (!jsonScript) return;
    var cfg;
    try { cfg = JSON.parse(jsonScript.textContent); } catch (e) { return; }
    var bp = currentBreakpoint();
    var els = doc.querySelectorAll('[data-framer-appear-id]');
    if (!('IntersectionObserver' in win)) {
      els.forEach(function (el) {
        var id = el.getAttribute('data-framer-appear-id');
        var c = (cfg[id] && (cfg[id][bp] || cfg[id].default)) || null;
        if (c) {
          el.style.transition = 'opacity .8s cubic-bezier(0.22,1,0.36,1), transform .8s cubic-bezier(0.22,1,0.36,1)';
          el.style.opacity = c.animate.opacity;
          el.style.transform = buildTransform(c.animate);
        }
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var id = el.getAttribute('data-framer-appear-id');
        var c = (cfg[id] && (cfg[id][bp] || cfg[id].default)) || null;
        if (c) {
          var tr = c.animate.transition || {};
          var delay = tr.delay ? tr.delay + 's' : '0s';
          el.style.transition = 'opacity .8s cubic-bezier(0.22,1,0.36,1) ' + delay + ', transform .8s cubic-bezier(0.22,1,0.36,1) ' + delay;
          el.style.opacity = c.animate.opacity;
          el.style.transform = buildTransform(c.animate);
        }
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  var SCROLL_RE = /translate[XY]\(\s*-?[1-9]/;

  var REVEAL_SRCS = ['img17.png', 'img09.png', 'img24.png'];

  function isRevealImageEl(el) {
    var im = el.querySelector ? el.querySelector('img') : null;
    if (!im) return false;
    var src = im.getAttribute('src') || '';
    for (var i = 0; i < REVEAL_SRCS.length; i++) {
      if (src.indexOf(REVEAL_SRCS[i]) !== -1) return true;
    }
    return false;
  }

  function removeOrphans() {
    var keep = { main: 1, 'svg-templates': 1, 'fy-lightbox': 1, 'fayyad-mobile-menu': 1 };
    var svgSeen = false;
    var main = doc.getElementById('main');
    var desktopRoot = null;
    if (main) {
      var wrap = main.querySelector(':scope > .ssr-variant');
      desktopRoot = wrap ? wrap.querySelector('[data-framer-root]') : null;
    }
    var moved = {};
    var looseMore = [];
    var kids = Array.prototype.slice.call(doc.body.children);
    kids.forEach(function (el) {
      if (el.tagName === 'SCRIPT') return;
      if (el.classList && el.classList.contains('fy-more-wrap')) { looseMore.push(el); return; }
      if (el.tagName === 'DIV' && el.classList.contains('ssr-variant') && el.querySelector('[data-framer-root]')) return;
      if (el.tagName === 'SECTION' && !el.closest('#main')) {
        var name = el.getAttribute('data-framer-name');
        if (name && !moved[name] && desktopRoot) {
          moved[name] = true;
          desktopRoot.appendChild(el);
        } else {
          el.parentElement.removeChild(el);
        }
        return;
      }
      if (el.id && keep[el.id]) {
        if (el.id === 'svg-templates') {
          if (svgSeen) el.parentElement.removeChild(el);
          else svgSeen = true;
        }
        return;
      }
      el.parentElement.removeChild(el);
    });

    var sigKeys = ['hidden-1tfs4jz', 'hidden-1xnmc73', 'hidden-kgxcmu', 'hidden-72rtr7'];
    var groups = {};
    Array.prototype.slice.call(doc.querySelectorAll('.ssr-variant')).forEach(function (w) {
      if (!w.querySelector('[data-framer-root]')) return;
      var cls = w.className || '';
      var sig = [];
      sigKeys.forEach(function (k) { if (cls.indexOf(k) >= 0) sig.push(k); });
      sig = sig.join(' ');
      if (!sig) return;
      (groups[sig] = groups[sig] || []).push(w);
    });

    Object.keys(groups).forEach(function (sig) {
      var arr = groups[sig];
      if (arr.length < 2) return;
      var primary = null;
      arr.forEach(function (w) { if (w.parentNode === main && !primary) primary = w; });
      if (!primary) {
        var best = arr[0];
        arr.forEach(function (w) {
          var r = w.querySelector('[data-framer-root]');
          if (r && r.querySelectorAll('section').length > best.querySelectorAll('section').length) best = w;
        });
        primary = best;
      }
      var primRoot = primary.querySelector('[data-framer-root]');
      var primPort = primRoot ? primRoot.querySelector('section[data-framer-name="Portfolio"]') : null;
      arr.forEach(function (w) {
        if (w === primary) return;
        var wRoot = w.querySelector('[data-framer-root]');
        var wGrid = wRoot ? wRoot.querySelector('.fy-grid') : null;
        if (primPort && wGrid) {
          var primGrid = primPort.querySelector('.fy-grid');
          if (!primGrid) {
            primPort.appendChild(wGrid.parentElement);
          } else {
            Array.prototype.slice.call(wGrid.children).forEach(function (card) {
              if (card.classList && card.classList.contains('fy-card')) primGrid.appendChild(card);
            });
          }
        }
        var wMore = w.querySelector('.fy-more-wrap');
        if (wMore) looseMore.push(wMore);
        if (w.parentNode) w.parentNode.removeChild(w);
      });
      if (primary.parentNode !== main && main) main.appendChild(primary);
    });

    var morePool = Array.prototype.slice.call(doc.querySelectorAll('#main .fy-more-wrap')).concat(looseMore);
    Array.prototype.forEach.call(doc.querySelectorAll('#main > .ssr-variant'), function (w) {
      var root = w.querySelector('[data-framer-root]');
      if (!root) return;
      var grid = root.querySelector('.fy-grid');
      var more = w.querySelector('.fy-more-wrap');
      if (!more && grid) {
        more = morePool.shift() || null;
        if (more) {
          var b = more.querySelector('.fy-more');
          if (b) { b.setAttribute('aria-expanded', 'false'); b.innerHTML = 'View more \u2193'; }
          grid.parentNode.appendChild(more);
        }
      }
    });
  }

  function resolveVariants() {
    var w = win.innerWidth;
    var bp;
    if (w >= 1440) bp = '72rtr7';
    else if (w >= 1200) bp = '1tfs4jz';
    else if (w >= 810) bp = '1xnmc73';
    else bp = 'kgxcmu';
    var copies = Array.prototype.filter.call(
      doc.querySelectorAll('.ssr-variant'),
      function (wr) { return !!wr.querySelector('[data-framer-root]'); }
    );
    if (!copies.length) return;
    var chosen = null;
    for (var i = 0; i < copies.length; i++) {
      if ((copies[i].className || '').indexOf('hidden-' + bp) === -1) {
        chosen = copies[i];
        break;
      }
    }
    if (!chosen) return;
    copies.forEach(function (wr) {
      wr.style.display = (wr === chosen) ? '' : 'none';
    });
  }

  function parseBaked(t) {
    var o = { x: 0, y: 0, scale: 1 };
    var m = /translateX\((-?[\d.]+)px\)/.exec(t); if (m) o.x = parseFloat(m[1]);
    m = /translateY\((-?[\d.]+)px\)/.exec(t); if (m) o.y = parseFloat(m[1]);
    m = /scale\((-?[\d.]+)\)/.exec(t); if (m) o.scale = parseFloat(m[1]);
    return o;
  }

  function bakedFor(el) {
    var cached = el.getAttribute('data-fy-baked');
    if (cached === null) {
      cached = el.style.transform || 'none';
      el.setAttribute('data-fy-baked', cached);
    }
    return parseBaked(cached);
  }

  function bakedAt(b, k) {
    var parts = [];
    if (b.x) parts.push('translateX(' + (b.x * k).toFixed(2) + 'px)');
    if (b.y) parts.push('translateY(' + (b.y * k).toFixed(2) + 'px)');
    if (b.scale && b.scale !== 1) parts.push('scale(' + (1 + (b.scale - 1) * k).toFixed(4) + ')');
    return parts.length ? parts.join(' ') : 'none';
  }

  var BENEFITS_STATE = null;
  var SCROLL_TICK = false;

  function collectBenefits() {
    var groups = [];
    Array.prototype.forEach.call(
      doc.querySelectorAll('section[data-framer-name="Benefits"]'),
      function (sec) {
        if (sec.offsetParent === null) return;
        var secAbsTop = sec.getBoundingClientRect().top + win.pageYOffset;
        var list = [];
        Array.prototype.forEach.call(
          sec.querySelectorAll('[style*="will-change:transform"]'),
          function (el) {
            if (!SCROLL_RE.test(el.style.transform || '')) return;
            if (isRevealImageEl(el)) return;
            var baked = bakedFor(el);
            var prev = el.style.transform;
            el.style.transform = 'none';
            var r = el.getBoundingClientRect();
            el.style.transform = prev;
            list.push({
              el: el,
              baked: baked,
              off: r.top + win.pageYOffset - secAbsTop,
              h: r.height
            });
          }
        );
        if (list.length) groups.push({ sec: sec, list: list });
      }
    );
    return groups;
  }

  function applyBenefits() {
    if (!BENEFITS_STATE || !BENEFITS_STATE.length) return;
    var alive = false;
    for (var a = 0; a < BENEFITS_STATE.length; a++) {
      if (BENEFITS_STATE[a].sec.offsetParent !== null) { alive = true; break; }
    }
    if (!alive) { onResizeRefresh(); return; }
    var vh = win.innerHeight;
    for (var g = 0; g < BENEFITS_STATE.length; g++) {
      var grp = BENEFITS_STATE[g];
      var top = grp.sec.getBoundingClientRect().top;
      for (var i = 0; i < grp.list.length; i++) {
        var item = grp.list[i];
        var start = vh - item.off;
        var p = (start - top) / item.h;
        if (p < 0) p = 0; else if (p > 1) p = 1;
        item.el.style.transform = bakedAt(item.baked, 1 - p);
      }
    }
  }

  function onScrollTick() {
    if (SCROLL_TICK) return;
    SCROLL_TICK = true;
    requestAnimationFrame(function () {
      SCROLL_TICK = false;
      applyBenefits();
    });
  }

  function onResizeRefresh() {
    resolveVariants();
    requestAnimationFrame(function () {
      BENEFITS_STATE = collectBenefits();
      applyBenefits();
    });
  }

  function initScrollReveal() {
    var targets = Array.prototype.slice.call(
      doc.querySelectorAll('[style*="will-change:transform"]')
    ).filter(function (el) {
      return SCROLL_RE.test(el.getAttribute('style') || '');
    });
    if (!targets.length) return;

    function settle(el) {
      var t = el.style.transform
        .replace(/translate[XY]\([^)]*\)/g, '')
        .replace(/\bscale\([^)]*\)/g, '')
        .trim();
      el.style.transform = t || 'none';
    }

    var reduce = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      targets.forEach(settle);
      return;
    }

    targets.forEach(function (el) {
      var sec = el.closest ? el.closest('section[data-framer-name="Benefits"]') : null;
      if (!sec) settle(el);
    });

    BENEFITS_STATE = collectBenefits();
    if (!BENEFITS_STATE.length) return;
    applyBenefits();
    win.addEventListener('scroll', onScrollTick, { passive: true });
    win.addEventListener('resize', onResizeRefresh);
  }

  function initImageReveal() {
    var reduce = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var seen = [];
    var targets = doc.querySelectorAll(
      'section[data-framer-name="Benefits"] img[src*="img17.png"],' +
      'section[data-framer-name="Benefits"] img[src*="img09.png"],' +
      'section[data-framer-name="Benefits"] img[src*="img24.png"]'
    );
    Array.prototype.forEach.call(targets, function (im) {
      var w = im.closest ? im.closest('[style*="will-change:transform"]') : null;
      if (!w) return;
      if (seen.indexOf(w) !== -1) return;
      seen.push(w);
      w.style.transition = 'transform .8s cubic-bezier(0.22,1,0.36,1)';
      w.setAttribute('data-fayyad-reveal', 'pending');
    });
    if (!seen.length) return;

    var io = null;
    function reveal(w) {
      if (w.getAttribute('data-fayyad-reveal') === 'done') return;
      w.setAttribute('data-fayyad-reveal', 'done');
      w.style.transform = 'none';
      if (io) io.unobserve(w);
    }

    if (reduce) {
      seen.forEach(reveal);
      return;
    }

    if ('IntersectionObserver' in win) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          reveal(en.target);
        });
      }, { threshold: 0.15 });
      seen.forEach(function (w) { io.observe(w); });
    }

    function sweep() {
      var vh = win.innerHeight;
      seen.forEach(function (w) {
        if (w.getAttribute('data-fayyad-reveal') !== 'pending') return;
        if (w.offsetParent === null) return;
        var r = w.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) reveal(w);
      });
    }

    win.addEventListener('scroll', sweep, { passive: true });
    win.addEventListener('resize', sweep);
    sweep();
  }

  function initTickers() {
    var st = doc.createElement('style');
    st.textContent = '@keyframes fayyad-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}';
    doc.head.appendChild(st);
    doc.querySelectorAll('section[style*="overflow:hidden"]').forEach(function (sec) {
      if (!/opacity:0/.test(sec.getAttribute('style') || '')) return;
      var ul = sec.querySelector('ul');
      if (!ul || !ul.children.length) return;
      sec.style.opacity = '1';
      var items = Array.prototype.slice.call(ul.children);
      var holder = sec.parentElement;
      var cw = holder && holder.clientWidth ? holder.clientWidth : win.innerWidth;
      ul.style.width = 'max-content';
      ul.style.maxWidth = 'none';
      ul.style.transform = 'translateX(0)';
      var contentWidth = ul.scrollWidth;
      if (!contentWidth) {
        contentWidth = items.length * (items[0].offsetWidth || 200);
        ul.style.width = contentWidth + 'px';
      }
      var copies = Math.ceil((cw * 2) / contentWidth) + 1;
      for (var i = 1; i < copies; i++) {
        items.forEach(function (li) { ul.appendChild(li.cloneNode(true)); });
      }
      var half = ul.scrollWidth / 2;
      ul.style.animation = 'fayyad-marquee ' + Math.max(8, half / 50) + 's linear infinite';
    });
  }

  var COUNTERS = [
    { n: 6, suffix: '+' },
    { n: 53, suffix: '+' },
    { n: 99, suffix: '%' }
  ];

  function initCounters() {
    var roots = doc.querySelectorAll('[data-framer-root]');
    var jobs = [];
    roots.forEach(function (root) {
      var boxes = root.querySelectorAll('.framer-8ahafg-container');
      boxes.forEach(function (box, idx) {
        var p = box.querySelector('p[style*="position:absolute"]');
        if (!p) return;
        var conf = COUNTERS[idx] || null;
        if (!conf) return;
        var suffix = (p.textContent || '').replace(/^[\d\s.,]*/, '') || conf.suffix;
        jobs.push({ el: p, target: conf.n, suffix: suffix });
      });
    });
    if (!jobs.length) return;
    if (!('IntersectionObserver' in win)) {
      jobs.forEach(function (j) { runCounter(j.el, j.target, j.suffix); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var job = en.target.__fayyadJob;
        if (!job) return;
        runCounter(job.el, job.target, job.suffix);
        io.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    jobs.forEach(function (j) {
      j.el.__fayyadJob = j;
      io.observe(j.el);
    });
  }

  function runCounter(el, target, suffix) {
    if (el.getAttribute('data-fayyad-counted')) return;
    el.setAttribute('data-fayyad-counted', '1');
    var t0 = null;
    var dur = 1600;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      var v = Math.round(e * target);
      el.textContent = v + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function visibleSection(name) {
    var secs = doc.querySelectorAll('#main section[data-framer-name="' + name + '"]');
    for (var i = 0; i < secs.length; i++) {
      if (secs[i].offsetParent !== null) return secs[i];
    }
    return null;
  }

  function scrollToSection(name) {
    if (name === 'top') {
      win.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    var el = visibleSection(name);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initNavScroll() {
    var map = { '#top': 'top', '#about': 'About', '#work': 'Portfolio', '#contact': 'Contact' };
    doc.addEventListener('click', function (e) {
      var t = e.target;
      var a = t && t.closest ? t.closest('a[href^="#"]') : null;
      if (!a) return;
      if (a.closest && a.closest('#fayyad-mobile-menu')) return;
      var target = map[a.getAttribute('href')];
      if (target === undefined) return;
      e.preventDefault();
      scrollToSection(target);
    });
  }

  function initMobileMenu() {
    var toggle = doc.querySelector('[data-framer-name="Mobile Menu Icon"]');
    if (!toggle) return;

    var overlay = doc.createElement('div');
    overlay.id = 'fayyad-mobile-menu';
    overlay.setAttribute('aria-hidden', 'true');
    var closeBtn = doc.createElement('div');
    closeBtn.id = 'fayyad-mobile-close';

    var links = [
      { n: '01', t: 'Home', h: '#top' },
      { n: '02', t: 'About', h: 'about.html' },
      { n: '03', t: 'Work', h: '#work' },
      { n: '04', t: 'Contact', h: '#contact' }
    ];

    var open = false;

    function setState(state) {
      open = state;
      overlay.setAttribute('aria-hidden', String(!state));
      overlay.style.opacity = state ? '1' : '0';
      overlay.style.visibility = state ? 'visible' : 'hidden';
      doc.body.style.overflow = state ? 'hidden' : '';
      var line1 = toggle.querySelector('[data-framer-name="Line"]');
      var line2 = toggle.querySelectorAll('[data-framer-name="Line"]')[1];
      if (line1) line1.style.transform = state ? 'rotate(45deg)' : '';
      if (line2) line2.style.transform = state ? 'rotate(-45deg)' : '';
    }

    function scrollToHash(h) {
      scrollToSection(h === '#top' ? 'top' : { '#about': 'About', '#work': 'Portfolio', '#contact': 'Contact' }[h]);
    }

    function onPick(h) {
      setState(false);
      setTimeout(function () { scrollToHash(h); }, 260);
    }

    links.forEach(function (lk) {
      var a = doc.createElement('a');
      a.href = lk.h;
      a.className = 'fayyad-mobile-link';
      var num = doc.createElement('span');
      num.className = 'fayyad-mobile-num';
      num.textContent = lk.n;
      a.appendChild(num);
      a.appendChild(doc.createTextNode(lk.t));
      a.addEventListener('click', function (e) {
        e.preventDefault();
        onPick(lk.h);
      });
      overlay.appendChild(a);
    });

    overlay.appendChild(closeBtn);

    var base = doc.createElement('style');
    base.textContent =
      '#fayyad-mobile-menu{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;justify-content:center;padding:40px 32px;gap:6px;background:#5f1de9;opacity:0;visibility:hidden;transition:opacity .3s ease,visibility .3s ease}' +
      '#fayyad-mobile-menu .fayyad-mobile-link{display:flex;align-items:baseline;gap:18px;text-decoration:none;color:#f9f9f9;font-family:"Inter Display","Inter",sans-serif;font-size:clamp(44px,11vw,64px);font-weight:600;letter-spacing:-2px;line-height:1.15;padding:6px 0;transition:color .2s ease}' +
      '#fayyad-mobile-menu .fayyad-mobile-link:hover,#fayyad-mobile-menu .fayyad-mobile-link:focus{color:#FF462E}' +
      '#fayyad-mobile-menu .fayyad-mobile-num{font-size:.38em;font-weight:600;letter-spacing:0;opacity:.55}' +
      '#fayyad-mobile-close{position:absolute;top:27px;right:20px;width:50px;height:50px;border-radius:8px;background:rgba(255,255,255,.14);cursor:pointer;display:none}' +
      '#fayyad-mobile-close::before,#fayyad-mobile-close::after{content:"";position:absolute;left:50%;top:50%;width:22px;height:2px;background:#fff;border-radius:1px;transform:translate(-50%,-50%)}' +
      '#fayyad-mobile-close::before{transform:translate(-50%,-50%) rotate(45deg)}' +
      '#fayyad-mobile-close::after{transform:translate(-50%,-50%) rotate(-45deg)}';
    doc.head.appendChild(base);
    doc.body.appendChild(overlay);

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      setState(!open);
    });
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        setState(!open);
      }
    });
    closeBtn.addEventListener('click', function () { setState(false); });
  }

  function initForm() {
    doc.querySelectorAll('form.framer-14ftx7o').forEach(function (form) {
      if (form.getAttribute('data-fayyad-form')) return;
      form.setAttribute('data-fayyad-form', '1');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.getAttribute('data-fayyad-sent')) return;
        form.setAttribute('data-fayyad-sent', '1');
        var btn = form.querySelector('button[type="submit"]');
        if (btn) {
          var label = btn.querySelector('p');
          if (label) label.textContent = 'Message Sent!';
        }
        var inputs = form.querySelectorAll('input, textarea');
        for (var i = 0; i < inputs.length; i++) inputs[i].disabled = true;
      });
    });
  }

  function initBehanceGallery() {
    var dataScript = doc.getElementById('fayyad-behance');
    var lightbox = doc.getElementById('fy-lightbox');
    if (!dataScript || !lightbox) return;
    var data;
    try { data = JSON.parse(dataScript.textContent); } catch (e) { return; }
    if (!Array.isArray(data) || !data.length) return;

    var stage = lightbox.querySelector('.fy-lb-stage');
    var img = lightbox.querySelector('.fy-lb-img');
    var titleEl = lightbox.querySelector('.fy-lb-title');
    var catEl = lightbox.querySelector('.fy-lb-cat');
    var descEl = lightbox.querySelector('.fy-lb-desc');
    var thumbsEl = lightbox.querySelector('.fy-lb-thumbs');
    var closeBtn = lightbox.querySelector('.fy-lb-close');
    var prevBtn = lightbox.querySelector('.fy-lb-prev');
    var nextBtn = lightbox.querySelector('.fy-lb-next');
    var counter = doc.createElement('div');
    counter.className = 'fy-lb-counter';
    lightbox.appendChild(counter);

    var projectIdx = -1;
    var imageIdx = 0;
    var lastFocus = null;
    var currentView = 'project';
    var currentLive = '';

    var viewsBar = lightbox.querySelector('.fy-lb-views');
    var viewBtns = viewsBar ? Array.prototype.slice.call(viewsBar.querySelectorAll('.fy-lb-view')) : [];
    var liveViewBtn = viewsBar ? viewsBar.querySelector('[data-fy-view="live"]') : null;
    var liveBox = lightbox.querySelector('.fy-lb-live');
    var iframe = lightbox.querySelector('.fy-lb-iframe');
    var liveOpen = lightbox.querySelector('.fy-lb-open');

    function setView(view) {
      if (view !== 'live') view = 'project';
      currentView = view;
      var isLive = view === 'live';
      viewBtns.forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-fy-view') === view);
      });
      if (stage) stage.style.display = isLive ? 'none' : '';
      if (thumbsEl) thumbsEl.style.display = isLive ? 'none' : '';
      if (liveBox) {
        liveBox.classList.toggle('is-active', isLive);
        liveBox.setAttribute('aria-hidden', isLive ? 'false' : 'true');
      }
      if (isLive && iframe && currentLive && iframe.getAttribute('src') !== currentLive) {
        iframe.setAttribute('src', currentLive);
      }
    }

    var PREVIEW = 2;
    var STEP = 6;
    var currentFilter = 'All';
    var limit = PREVIEW;
    var allCards = Array.prototype.slice.call(doc.querySelectorAll('.fy-card'));
    var allGrids = Array.prototype.slice.call(doc.querySelectorAll('.fy-grid'));
    var allMore = Array.prototype.slice.call(doc.querySelectorAll('.fy-more'));
    var allLess = [];
    allMore.forEach(function (btn) {
      var less = doc.createElement('button');
      less.type = 'button';
      less.className = 'fy-less';
      less.innerHTML = 'View less \u2191';
      less.style.display = 'none';
      btn.parentElement.appendChild(less);
      allLess.push(less);
    });
    var gridEl = doc.querySelector('.fy-grid');
    var gridCards = gridEl ? Array.prototype.slice.call(gridEl.children).filter(function (c) {
      return c.classList.contains('fy-card');
    }) : [];

    function matchesFilter(card) {
      return currentFilter === 'All' || card.getAttribute('data-cat') === currentFilter;
    }

    function rankWithinFilter(cardIdx) {
      var rank = 0;
      for (var i = 0; i < gridCards.length; i++) {
        if (!matchesFilter(gridCards[i])) continue;
        if (parseInt(gridCards[i].getAttribute('data-idx'), 10) < cardIdx) rank++;
      }
      return rank;
    }

    function countMatching() {
      var n = 0;
      for (var i = 0; i < gridCards.length; i++) {
        if (matchesFilter(gridCards[i])) n++;
      }
      return n;
    }

    function applyGrid() {
      var filtered = currentFilter !== 'All';
      allGrids.forEach(function (g) { g.classList.toggle('fy-collapsed', !filtered && limit <= PREVIEW); });
      allCards.forEach(function (card) {
        if (!matchesFilter(card)) { card.style.display = 'none'; return; }
        var rank = rankWithinFilter(parseInt(card.getAttribute('data-idx'), 10));
        card.style.display = (rank < limit) ? '' : 'none';
      });
      var matching = countMatching();
      allMore.forEach(function (btn) {
        if (matching <= limit) { btn.style.display = 'none'; return; }
        btn.style.display = '';
        btn.setAttribute('aria-expanded', String(limit > PREVIEW));
        btn.innerHTML = 'View more \u2193';
      });
      allLess.forEach(function (btn) {
        btn.style.display = (limit > PREVIEW) ? '' : 'none';
        btn.innerHTML = 'View less \u2191';
      });
    }

    function openProject(idx, i0) {
      var p = data[idx];
      if (!p) return;
      projectIdx = idx;
      imageIdx = i0 || 0;
      currentView = 'project';
      if (iframe) iframe.removeAttribute('src');
      render();
      lightbox.setAttribute('aria-hidden', 'false');
      doc.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function render() {
      var p = data[projectIdx];
      if (!p) return;
      var files = p.images && p.images.length ? p.images : [p.cover];
      if (imageIdx >= files.length) imageIdx = 0;
      if (imageIdx < 0) imageIdx = files.length - 1;
      var base = p.dir || ('assets/behance/' + p.slug);
      img.src = base + '/' + files[imageIdx];
      img.alt = p.name;
      titleEl.textContent = p.name;
      catEl.textContent = p.category;
      descEl.textContent = p.description || '';
      descEl.style.display = p.description ? '' : 'none';
      counter.textContent = (imageIdx + 1) + ' / ' + files.length;
      currentLive = p.live || '';
      if (liveViewBtn) liveViewBtn.hidden = !currentLive;
      if (liveOpen) liveOpen.href = currentLive || '#';
      if (!currentLive && currentView === 'live') currentView = 'project';
      setView(currentView);
      var first = true;
      thumbsEl.innerHTML = '';
      files.forEach(function (f, i) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.className = 'fy-lb-thumb' + (i === imageIdx ? ' is-active' : '');
        b.setAttribute('aria-label', 'Image ' + (i + 1));
        var t = doc.createElement('img');
        t.loading = 'lazy';
        t.src = base + '/' + f;
        t.alt = '';
        b.appendChild(t);
        if (first && i === imageIdx) b.focus();
        first = false;
        b.addEventListener('click', function () { imageIdx = i; render(); });
        thumbsEl.appendChild(b);
      });
    }

    function closeLightbox() {
      lightbox.setAttribute('aria-hidden', 'true');
      doc.body.style.overflow = '';
      if (iframe) iframe.removeAttribute('src');
      currentLive = '';
      if (lastFocus) lastFocus.focus();
    }

    function prev() { setView('project'); imageIdx--; render(); }
    function next() { setView('project'); imageIdx++; render(); }

    doc.querySelectorAll('.fy-card').forEach(function (card) {
      card.addEventListener('click', function () {
        lastFocus = card;
        openProject(parseInt(card.getAttribute('data-idx'), 10) || 0, 0);
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          lastFocus = card;
          openProject(parseInt(card.getAttribute('data-idx'), 10) || 0, 0);
        }
      });
    });

    doc.querySelectorAll('.fy-more').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var matching = countMatching();
        limit = Math.min(matching, limit + STEP);
        applyGrid();
      });
    });
    allLess.forEach(function (btn) {
      btn.addEventListener('click', function () {
        limit = Math.max(PREVIEW, limit - STEP);
        applyGrid();
      });
    });

    doc.querySelectorAll('.fy-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentFilter = btn.getAttribute('data-filter');
        doc.querySelectorAll('.fy-filter').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        applyGrid();
      });
    });
    applyGrid();

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.querySelector('.fy-lb-backdrop').addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    viewBtns.forEach(function (b) {
      b.addEventListener('click', function () { setView(b.getAttribute('data-fy-view')); });
    });
    doc.addEventListener('keydown', function (e) {
      if (lightbox.getAttribute('aria-hidden') !== 'false') return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    });
  }

  function boot() {
    removeOrphans();
    resolveVariants();
    revealWorkCards();
    injectSmoothScroll();
    initTickers();
    initAppear();
    initScrollReveal();
    initImageReveal();
    initCounters();
    initNavScroll();
    initMobileMenu();
    initForm();
    initBehanceGallery();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
