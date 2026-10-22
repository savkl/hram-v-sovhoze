/* Движение на сайте: «Фаворский свет».
   Если в системе включено «уменьшение движения» — всё показывается сразу, без анимации. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var doors = document.querySelector(".doors");

  function finish() {
    root.classList.remove("intro", "motion-pending");
    if (doors && doors.parentNode) doors.parentNode.removeChild(doors);
  }
  if (reduce || !window.gsap || !window.ScrollTrigger) { finish(); return; }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  root.classList.add("motion");
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Плавная прокрутка ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on("scroll", ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -90, duration: 1.4 });
      });
    });
    var obsMenu = new MutationObserver(function () {
      document.body.classList.contains("menu-open") ? lenis.stop() : lenis.start();
    });
    obsMenu.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- Шапка: прячется при прокрутке вниз ---------- */
  var header = document.querySelector(".site-header"), lastY = 0;
  ST.create({
    start: 0, end: "max",
    onUpdate: function (self) {
      var y = self.scroll();
      header.classList.toggle("scrolled", y > 30);
      if (!document.body.classList.contains("menu-open")) header.classList.toggle("hide", y > 320 && y > lastY);
      lastY = y;
    }
  });

  /* ---------- Главный экран: Преображение ---------- */
  var hero = document.querySelector(".hero");
  function heroIn(delay) {
    root.classList.remove("motion-pending");
    if (!hero) return gsap.timeline();
    var media = hero.querySelector(".hero-media");
    var slides = $$(".slide", media), dots = $$(".hero-dots button", hero), cur = 0;
    var first = slides[0];
    var tl = gsap.timeline({ delay: delay || 0, defaults: { ease: "expo.out" } });
    tl.fromTo(first, { filter: "grayscale(.8) brightness(.35)" }, { filter: "grayscale(0) brightness(1.18)", duration: 2.4, ease: "power2.out", clearProps: "filter" }, 0)
      .fromTo(hero.querySelector(".tabor-glow"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.8, ease: "power2.out" }, 0.2)
      .fromTo(hero.querySelector(".tabor-rays"), { opacity: 0, scale: .4 }, { opacity: 1, scale: 1, duration: 3.2, ease: "power2.out" }, 0.4)
      .to(hero.querySelector(".tabor-glow"), { opacity: .6, duration: 2.4, ease: "sine.inOut" }, 3)
      .from(hero.querySelector(".hero-kicker"), { y: 18, opacity: 0, duration: 1 }, 0.4)
      .from($$(".hero h1 .lg", hero), { yPercent: 70, opacity: 0, filter: "blur(10px)", duration: 1.2, stagger: 0.035 }, 0.5)
      .from($$(".hero-next > *", hero), { y: 26, opacity: 0, duration: 1, stagger: 0.09 }, 1.1)
      .from(dots, { opacity: 0, x: 10, duration: .8, stagger: .08 }, 1.4);

    /* смена кадров: колокольня, свечи, иконостас */
    function show(n) {
      slides[cur].classList.remove("is-on");
      if (dots[cur]) dots[cur].classList.remove("on");
      cur = (n + slides.length) % slides.length;
      void slides[cur].offsetWidth;
      slides[cur].classList.add("is-on");
      if (dots[cur]) dots[cur].classList.add("on");
    }
    if (slides.length > 1) {
      var timer = setInterval(function () { show(cur + 1); }, 7000);
      dots.forEach(function (d, i) { d.addEventListener("click", function () { clearInterval(timer); show(i); timer = setInterval(function () { show(cur + 1); }, 7000); }); });
    }

    /* свет следует за курсором, кадр чуть смещается */
    if (fine) {
      var xTo = gsap.quickTo(media, "x", { duration: 1.4, ease: "power3.out" });
      var yTo = gsap.quickTo(media, "y", { duration: 1.4, ease: "power3.out" });
      var follow = hero.querySelector(".tabor-follow");
      var lx = gsap.quickTo(follow, "x", { duration: .9, ease: "power3.out" });
      var ly = gsap.quickTo(follow, "y", { duration: .9, ease: "power3.out" });
      gsap.set(media, { scale: 1.04 });
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        xTo(px * -24); yTo(py * -16);
        lx(e.clientX - r.left); ly(e.clientY - r.top);
        hero.classList.add("lit");
      });
      hero.addEventListener("pointerleave", function () { xTo(0); yTo(0); hero.classList.remove("lit"); });
    }
    /* при прокрутке фото уходит медленнее текста */
    gsap.to(media, { yPercent: 18, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(hero.querySelector(".hero-content"), { y: -80, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true } });
    return tl;
  }

  /* Широкое фото в шапке внутренних страниц */
  var ph = document.querySelector(".page-hero");
  if (ph) {
    var phImg = ph.querySelector("img");
    gsap.fromTo(phImg, { scale: 1.18, filter: "brightness(.4)" }, { scale: 1.04, filter: "brightness(1)", duration: 2.6, ease: "power2.out", clearProps: "filter" });
    gsap.to(phImg, { yPercent: 16, ease: "none", scrollTrigger: { trigger: ph, start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- Вход: открытие Царских врат ---------- */
  var firstVisit = root.classList.contains("intro") && doors;
  if (firstVisit) {
    try { sessionStorage.setItem("doors", "1"); } catch (e) {}
    if (lenis) lenis.stop();
    var emb = doors.querySelector(".doors-emblem");
    var tl = gsap.timeline({
      defaults: { ease: "expo.out" },
      onComplete: function () { finish(); if (lenis) lenis.start(); ST.refresh(); }
    });
    tl.fromTo(emb, { clipPath: "inset(100% 0% 0% 0%)", y: 12 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.6, ease: "expo.inOut" }, .1)
      .fromTo(emb, { filter: "drop-shadow(0 0 0 rgba(230,200,140,0))" }, { filter: "drop-shadow(0 0 24px rgba(230,200,140,.5))", duration: .9, ease: "sine.out" }, 1.3)
      .from(doors.querySelector(".doors-name"), { y: 14, opacity: 0, duration: .9 }, 1.15)
      .to(doors.querySelector(".doors-center"), { opacity: 0, scale: .92, duration: .5, ease: "power2.in" }, 2.15)
      .to(doors.querySelector(".door-l"), { rotateY: 78, xPercent: -18, duration: 1.5, ease: "power3.inOut" }, 2.3)
      .to(doors.querySelector(".door-r"), { rotateY: -78, xPercent: 18, duration: 1.5, ease: "power3.inOut" }, 2.3)
      .to(doors.querySelector(".doors-light"), { opacity: 1, duration: .6, ease: "power1.out" }, 2.35)
      .to(doors, { opacity: 0, duration: .6, ease: "power1.out" }, 3.25);
    tl.add(heroIn(), 2.55);
    doors.addEventListener("click", function () { tl.timeScale(4); });
    window.addEventListener("keydown", function skip() { tl.timeScale(4); window.removeEventListener("keydown", skip); });
  } else {
    finish();
    heroIn(0.05);
  }

  /* ---------- Заголовки страниц: вязь по буквам ---------- */
  $$(".page-head h1").forEach(function (h) { gsap.fromTo(h, { clipPath: "inset(0 0 100% 0)", y: 40 }, { clipPath: "inset(0 0 -20% 0)", y: 0, duration: 1.4, ease: "expo.out", delay: .15 }); });
  $$(".page-head .lead, .crumbs").forEach(function (el) { gsap.from(el, { y: 16, opacity: 0, duration: 1, ease: "expo.out", delay: .35 }); });

  /* ---------- Подзаголовки: выезжают из-под маски ---------- */
  $$(".h2, .prose h2, .person h2").forEach(function (el) {
    gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)", y: 34 }, {
      clipPath: "inset(0 0 -20% 0)", y: 0, duration: 1.2, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });

  /* ---------- Фото-арки раскрываются снизу, как окно ---------- */
  $$(".card-img, .about-a, .about-b, .help-img, .shrine img, .wide-photo, .aside img, .prose figure img").forEach(function (el) {
    var img = el.tagName === "IMG" ? null : el.querySelector("img");
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" });
    if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2, ease: "expo.out" }, 0.15);
  });

  /* ---------- Остальные блоки появляются волной ---------- */
  ST.batch(".task, .soc-card, .row, .reg, .trip, .person, .feast-list li, .news-card, .gallery a, .about-text > *, .card-t, .card p, .cs-item, .c-block, .qr-wrap, .req, .icon-groups li, .note", {
    start: "top 92%", once: true,
    onEnter: function (els) { gsap.fromTo(els, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: .08, ease: "expo.out", overwrite: true }); }
  });

  /* ---------- Иконостас: свечи загораются одна за другой ---------- */
  $$("[data-icons]").forEach(function (box) {
    var grid = box.querySelector(".icon-grid");
    if (!grid) return;
    var on = $$("i.on", grid), off = $$("i:not(.on)", grid);
    var num = box.querySelector(".ip-num .ip-done"), total = on.length;
    on.forEach(function (c) { c.classList.add("wait"); });
    gsap.set(off, { opacity: 0, scale: .6 });
    ST.create({
      trigger: grid, start: "top 82%", once: true,
      onEnter: function () {
        gsap.to(off, { opacity: 1, scale: 1, duration: .6, stagger: { each: .006, from: "start" }, ease: "back.out(2)" });
        on.forEach(function (c, i) {
          gsap.delayedCall(.35 + i * .085, function () {
            c.classList.remove("wait"); c.classList.add("lit");
            c.style.animationDelay = (Math.random() * 3).toFixed(2) + "s";
          });
        });
        if (num) {
          var o = { v: 0 };
          gsap.to(o, { v: total, duration: .35 + total * .085, ease: "power1.inOut", onUpdate: function () { num.textContent = Math.round(o.v); } });
        }
      }
    });
  });

  /* ---------- Кнопки: магнит и волна света от пальца ---------- */
  $$(".btn, .task, .soc-card, .nav .help").forEach(function (b) {
    b.addEventListener("pointerdown", function (e) {
      var r = b.getBoundingClientRect(), s = document.createElement("span");
      s.className = "ripple";
      s.style.left = (e.clientX - r.left) + "px"; s.style.top = (e.clientY - r.top) + "px";
      b.appendChild(s);
      setTimeout(function () { s.remove(); }, 900);
    });
    b.addEventListener("pointermove", function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty("--mx", (e.clientX - r.left) + "px");
      b.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
  if (fine) {
    $$(".hero .btn, .help-actions .btn.solid, .send-btns .btn.solid, .form .btn.solid").forEach(function (b) {
      var xTo = gsap.quickTo(b, "x", { duration: .6, ease: "elastic.out(1,.45)" });
      var yTo = gsap.quickTo(b, "y", { duration: .6, ease: "elastic.out(1,.45)" });
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .28); yTo((e.clientY - r.top - r.height / 2) * .38);
      });
      b.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Календарь: дни появляются при смене месяца ---------- */
  var grid = document.getElementById("cal-grid");
  if (grid) {
    var pop = function () { gsap.from(grid.querySelectorAll(".cal-day"), { scale: .6, opacity: 0, duration: .5, stagger: { each: .012, grid: "auto", from: "start" }, ease: "back.out(1.8)" }); };
    ["cal-prev", "cal-next"].forEach(function (id) { var b = document.getElementById(id); if (b) b.addEventListener("click", function () { requestAnimationFrame(pop); }); });
    var day = document.getElementById("day-info");
    grid.addEventListener("click", function () { requestAnimationFrame(function () { gsap.from(day.children, { y: 18, opacity: 0, duration: .6, stagger: .05, ease: "expo.out" }); }); });
  }

  window.addEventListener("load", function () { ST.refresh(); });
})();
