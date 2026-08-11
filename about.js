(function () {
  'use strict';

  var doc = document;
  var win = window;

  function breakpointHashes() {
    var list = [];
    var s = doc.getElementById('__framer__breakpoints');
    if (!s) return list;
    try { list = JSON.parse(s.textContent); } catch (e) { return list; }
    return list;
  }

  function currentHash() {
    var list = breakpointHashes();
    for (var i = 0; i < list.length; i++) {
      var bp = list[i];
      if (!bp.mediaQuery) continue;
      var mm;
      try { mm = win.matchMedia(bp.mediaQuery); } catch (e) { continue; }
      if (mm.matches) return bp.hash;
    }
    return 'default';
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
    var hash = currentHash();
    var els = doc.querySelectorAll('[data-framer-appear-id]');
    if (!('IntersectionObserver' in win)) {
      els.forEach(function (el) {
        var id = el.getAttribute('data-framer-appear-id');
        var c = (cfg[id] && (cfg[id][hash] || cfg[id].default)) || null;
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
        var c = (cfg[id] && (cfg[id][hash] || cfg[id].default)) || null;
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

  function removeOrphans() {
    var keep = { main: 1, 'svg-templates': 1, 'fayyad-mobile-menu': 1 };
    var svgSeen = false;
    var kids = Array.prototype.slice.call(doc.body.children);
    kids.forEach(function (el) {
      if (el.tagName === 'SCRIPT') return;
      if (el.tagName === 'SECTION' && !el.closest('#main')) {
        el.parentElement.removeChild(el);
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
  }

  function resolveVariants() {
    var hash = currentHash();
    var variants = doc.querySelectorAll('.ssr-variant');
    variants.forEach(function (w) {
      var hidden = (w.className || '').match(/hidden-[A-Za-z0-9]+/g) || [];
      var isHidden = false;
      for (var i = 0; i < hidden.length; i++) {
        if (hidden[i].slice(7) === hash) { isHidden = true; break; }
      }
      w.style.display = isHidden ? 'none' : '';
    });
  }

  function initMobileMenu() {
    var toggles = doc.querySelectorAll('[data-framer-name="Mobile Menu Icon"]');
    if (!toggles.length) return;
    var toggle = null;
    for (var i = 0; i < toggles.length; i++) {
      var v = toggles[i].closest('.ssr-variant');
      if (!v || v.style.display !== 'none') { toggle = toggles[i]; break; }
    }
    if (!toggle) toggle = toggles[0];

    var overlay = doc.createElement('div');
    overlay.id = 'fayyad-mobile-menu';
    overlay.setAttribute('aria-hidden', 'true');
    var closeBtn = doc.createElement('div');
    closeBtn.id = 'fayyad-mobile-close';

    var links = [
      { n: '01', t: 'Home', h: 'index.html' },
      { n: '02', t: 'About', h: 'about.html' },
      { n: '03', t: 'Work', h: 'index.html#work' },
      { n: '04', t: 'Contact', h: 'index.html#contact' }
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

    function onPick(h) {
      setState(false);
      setTimeout(function () { win.location.href = h; }, 140);
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
    doc.querySelectorAll('form.framer-1h7gull').forEach(function (form) {
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

  function boot() {
    removeOrphans();
    resolveVariants();
    injectSmoothScroll();
    initAppear();
    initMobileMenu();
    initForm();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
