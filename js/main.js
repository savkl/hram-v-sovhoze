/* Общий скрипт сайта Преображенского храма */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  var MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  var MONTHS_NOM = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  var DAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var key = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var addDays = function (d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
  var fmtRub = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽"; };

  /* ---------- Славянские заголовки ---------- */
  function lettering(el) {
    if (typeof GLYPHS === "undefined" || el.dataset.done) return;
    var text = el.textContent.trim();
    el.dataset.done = "1";
    el.setAttribute("aria-label", text);
    var html = text.toUpperCase().split(/\s+/).map(function (w) {
      return '<span class="lw">' + Array.from(w).map(function (ch) {
        var g = GLYPHS[ch];
        return g ? '<span class="lg" style="width:' + g.ratio + 'em"><i style="top:' + g.top + "em;height:" + g.height + "em;-webkit-mask-image:url(" + g.src + ");mask-image:url(" + g.src + ')"></i></span>' : esc(ch);
      }).join("") + "</span>";
    }).join(" ");
    el.innerHTML = '<span class="lt" aria-hidden="true">' + html + "</span>";
  }
  $$("[data-slav]").forEach(lettering);

  /* ---------- Меню ---------- */
  var burger = $(".burger");
  if (burger) burger.addEventListener("click", function () {
    var open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) { document.body.classList.remove("menu-open"); if (burger) { burger.setAttribute("aria-expanded", "false"); burger.focus(); } }
  });
  $$(".nav-drop > button").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = b.parentNode, open = !p.classList.contains("open");
      $$(".nav-drop.open").forEach(function (x) { x.classList.remove("open"); x.firstElementChild.setAttribute("aria-expanded", "false"); });
      if (open) { p.classList.add("open"); b.setAttribute("aria-expanded", "true"); }
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-drop")) $$(".nav-drop.open").forEach(function (x) { x.classList.remove("open"); x.firstElementChild.setAttribute("aria-expanded", "false"); });
  });

  /* ---------- Данные из настроек ---------- */
  $$("[data-site]").forEach(function (el) {
    var v = S[el.dataset.site];
    if (v === undefined) return;
    if (!v) { var hide = el.closest("[data-hide-empty]"); if (hide) hide.hidden = true; return; }
    el.textContent = v;
  });
  $$("[data-site-href]").forEach(function (el) {
    var f = el.dataset.siteHref, v = S[f];
    if (!v) return;
    if (f === "phoneLink") el.href = "tel:" + v;
    else if (f === "email") el.href = "mailto:" + v;
    else el.href = v;
  });
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Церковный календарь ----------
     Ранг: 2 — двунадесятые праздники и Пасха, 1 — великие и храмовые (служба как в праздник),
     0 — память святого или особый день (только подпись в календаре). */
  function easter(y) {
    var a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7;
    var m = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
    return addDays(new Date(y, m - 1, day), 13);
  }
  var FIXED = {
    "01-07": ["Рождество Христово", "Рождество Господа Бога и Спаса нашего Иисуса Христа", 2],
    "01-14": ["Обрезание Господне", "Обрезание Господне. Свт. Василия Великого", 1],
    "01-19": ["Крещение Господне", "Святое Богоявление. Крещение Господне", 2],
    "01-25": ["Мц. Татианы", "Мученицы Татианы", 0],
    "02-15": ["Сретение Господне", "Сретение Господа нашего Иисуса Христа", 2],
    "04-07": ["Благовещение", "Благовещение Пресвятой Богородицы", 2],
    "05-06": ["Вмч. Георгия", "Великомученика Георгия Победоносца", 1],
    "05-22": ["Свт. Николая", "Перенесение мощей святителя Николая Чудотворца", 1],
    "05-24": ["Кирилла и Мефодия", "Равноапостольных Кирилла и Мефодия, учителей Словенских", 0],
    "06-11": ["Свт. Луки Крымского", "Святителя Луки Крымского (мощи — в нашем храме)", 0],
    "07-07": ["Рождество Предтечи", "Рождество честного славного Пророка, Предтечи и Крестителя Господня Иоанна", 1],
    "07-08": ["Петра и Февронии", "Благоверных князя Петра и княгини Февронии Муромских", 0],
    "07-12": ["Петра и Павла", "Славных и всехвальных первоверховных апостолов Петра и Павла", 1],
    "07-24": ["Равноап. Ольги", "Равноапостольной великой княгини Ольги", 0],
    "07-28": ["Равноап. Владимира", "Равноапостольного великого князя Владимира", 0],
    "08-01": ["Прп. Серафима", "Обретение мощей преподобного Серафима Саровского", 0],
    "08-02": ["Прор. Илии", "Пророка Илии", 0],
    "08-05": ["Прав. Феодора Ушакова", "Праведного воина Феодора Ушакова (мощи — в нашем храме)", 0],
    "08-09": ["Вмч. Пантелеимона", "Великомученика и целителя Пантелеимона (мощи — в нашем храме)", 0],
    "08-14": ["Медовый Спас", "Происхождение Честных Древ Животворящего Креста Господня", 0],
    "08-19": ["Преображение. Престольный", "Преображение Господне. Престольный праздник нашего храма", 2],
    "08-28": ["Успение", "Успение Пресвятой Владычицы нашей Богородицы", 2],
    "08-29": ["Ореховый Спас", "Перенесение Нерукотворного Образа Господа Иисуса Христа", 0],
    "09-11": ["Усекновение главы", "Усекновение главы Пророка, Предтечи и Крестителя Господня Иоанна. Строгий пост", 1],
    "09-21": ["Рождество Богородицы", "Рождество Пресвятой Владычицы нашей Богородицы", 2],
    "09-27": ["Воздвижение", "Воздвижение Честного и Животворящего Креста Господня. Строгий пост", 2],
    "10-08": ["Прп. Сергия", "Преставление преподобного Сергия, игумена Радонежского", 1],
    "10-09": ["Ап. Иоанна Богослова", "Преставление апостола и евангелиста Иоанна Богослова", 0],
    "10-14": ["Покров", "Покров Пресвятой Владычицы нашей Богородицы", 1],
    "10-15": ["Прав. Феодора Ушакова", "Праведного воина Феодора Ушакова (мощи — в нашем храме)", 0],
    "10-26": ["Иверская икона", "Иверской иконы Божией Матери — чтимая икона нашего храма", 1],
    "11-04": ["Казанская икона", "Казанской иконы Божией Матери", 1],
    "11-08": ["Вмч. Димитрия", "Великомученика Димитрия Солунского (мощи — в нашем храме)", 0],
    "11-21": ["Арх. Михаила", "Собор Архистратига Михаила и прочих Небесных Сил бесплотных", 1],
    "11-22": ["Свт. Нектария", "Святителя Нектария Эгинского (мощи — в нашем храме)", 0],
    "12-04": ["Введение", "Введение во храм Пресвятой Богородицы", 2],
    "12-07": ["Вмц. Екатерины", "Великомученицы Екатерины", 0],
    "12-17": ["Вмц. Варвары", "Великомученицы Варвары", 0],
    "12-19": ["Свт. Николая", "Святителя Николая, архиепископа Мир Ликийских, чудотворца", 1]
  };
  var MOVE = [
    [-70, "Неделя о мытаре", "Неделя о мытаре и фарисее", 0],
    [-57, "Родительская суббота", "Вселенская мясопустная родительская суббота", 0],
    [-49, "Прощёное воскресенье", "Прощёное воскресенье. Воспоминание Адамова изгнания", 0],
    [-48, "Начало поста", "Начало Великого поста", 0],
    [-8, "Лазарева суббота", "Воскрешение праведного Лазаря", 0],
    [-7, "Вход Господень", "Вход Господень в Иерусалим", 2],
    [-3, "Великий четверг", "Великий четверг. Воспоминание Тайной Вечери", 0],
    [-2, "Великая пятница", "Великая пятница. Воспоминание Святых Страстей", 0],
    [-1, "Великая суббота", "Великая суббота", 0],
    [0, "Пасха", "Светлое Христово Воскресение. Пасха", 2],
    [2, "Иверская икона", "Иверской иконы Божией Матери (Светлый вторник)", 0],
    [9, "Радоница", "Радоница. Поминовение усопших", 0],
    [14, "Жён-мироносиц", "Неделя святых Жён-мироносиц", 0],
    [39, "Вознесение", "Вознесение Господне", 2],
    [48, "Родительская суббота", "Троицкая родительская суббота", 0],
    [49, "Троица", "День Святой Троицы. Пятидесятница", 2],
    [50, "День Св. Духа", "День Святого Духа", 0]
  ];
  var feastCache = {};
  function addFeast(f, k, e) {
    if (f[k]) { f[k] = { s: f[k].s + " · " + e[0], f: f[k].f + ". " + e[1], r: Math.max(f[k].r, e[2]) }; }
    else f[k] = { s: e[0], f: e[1], r: e[2] };
  }
  function feasts(y) {
    if (feastCache[y]) return feastCache[y];
    var f = {}, e = easter(y);
    Object.keys(FIXED).forEach(function (md) { addFeast(f, y + "-" + md, FIXED[md]); });
    MOVE.forEach(function (m) { addFeast(f, key(addDays(e, m[0])), m.slice(1)); });
    var dm = new Date(y, 10, 8); do { dm = addDays(dm, -1); } while (dm.getDay() !== 6);
    addFeast(f, key(dm), ["Димитриевская суббота", "Димитриевская родительская суббота", 0]);
    return (feastCache[y] = f);
  }
  function feastInfo(d) { return feasts(d.getFullYear())[key(d)] || null; }
  function feastOf(d) { var f = feastInfo(d); return f ? f.f : ""; }
  function fastOf(d) {
    var y = d.getFullYear(), e = easter(y), md = (d.getMonth() + 1) * 100 + d.getDate();
    if (d >= addDays(e, -48) && d < e) return "Великий пост";
    var pS = addDays(e, 57), pE = new Date(y, 6, 11);
    if (d >= pS && d <= pE) return "Петров пост";
    if (md >= 814 && md <= 827) return "Успенский пост";
    if (md >= 1128 || md <= 106) return "Рождественский пост";
    return "";
  }

  /* ---------- Расписание храма из файла raspisanie.txt ----------
     Службы берутся только из этого файла. Даты вне файла — «расписание ещё не опубликовано». */
  var MONTH_NUM = { "января": 0, "февраля": 1, "марта": 2, "апреля": 3, "мая": 4, "июня": 5, "июля": 6, "августа": 7, "сентября": 8, "октября": 9, "ноября": 10, "декабря": 11 };
  var SCHED = {}, schedFrom = null, schedTo = null;
  function parseSchedule(txt) {
    var cur = null;
    String(txt).replace(/\r/g, "").split("\n").forEach(function (raw) {
      var line = raw.trim();
      if (!line || line.charAt(0) === "#") { cur = line ? cur : null; return; }
      var dm = line.match(/^(\d{1,2})\s+([а-яё]+)\s+(\d{4})$/i);
      if (dm && MONTH_NUM[dm[2].toLowerCase()] !== undefined) {
        var d = new Date(+dm[3], MONTH_NUM[dm[2].toLowerCase()], +dm[1]);
        cur = SCHED[key(d)] = { feast: "", big: false, list: [] };
        if (!schedFrom || d < schedFrom) schedFrom = d;
        if (!schedTo || d > schedTo) schedTo = d;
        return;
      }
      if (!cur) return;
      var tm = line.match(/^(\d{1,2})[:.\-](\d{2})\s*[–—-]?\s*(.+)$/);
      if (tm) { cur.list.push([+tm[1] + ":" + tm[2], tm[3].replace(/\.$/, "")]); return; }
      if (line.charAt(0) === "!") { cur.big = true; line = line.slice(1).trim(); }
      cur.feast = cur.feast ? cur.feast + ". " + line : line;
    });
    if (schedTo) schedTo = new Date(schedTo.getFullYear(), schedTo.getMonth(), schedTo.getDate());
  }
  var schedReady = fetch("raspisanie.txt?v=" + Date.now(), { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("нет файла"); return r.text(); })
    .then(parseSchedule).catch(function () {});

  function published(d) { return schedFrom && d >= schedFrom && d <= schedTo; }
  function services(d) {
    var e = SCHED[key(d)], fi = feastInfo(d);
    return { list: e ? e.list : [], feast: e && e.feast ? e.feast : "", big: !!(e && e.big), info: fi, known: published(d) };
  }

  function serviceRows(list) {
    return list.map(function (s) {
      return '<div class="svc"><span class="svc-time">' + esc(s[0]) + '</span><span class="svc-name">' + esc(s[1]) + "</span></div>";
    }).join("");
  }

  schedReady.then(function () {
    /* Ближайшие богослужения на главной */
    var near = $("#nearest");
    if (near) {
      var now = new Date(), d = new Date(now.getFullYear(), now.getMonth(), now.getDate()), found = null;
      for (var i = 0; i < 21 && !found; i++) {
        var day = addDays(d, i), sv = services(day), list = sv.list;
        if (i === 0) list = list.filter(function (s) { var t = s[0].split(":"); return +t[0] * 60 + +t[1] > now.getHours() * 60 + now.getMinutes() - 60; });
        if (list.length) found = { day: day, list: list, feast: sv.feast, i: i };
      }
      if (found) {
        $(".near-label", near).textContent = found.i === 0 ? "Сегодня в храме" : found.i === 1 ? "Завтра в храме" : "Ближайшее богослужение";
        var dn = DAYS[found.day.getDay()];
        $(".near-date", near).textContent = dn.charAt(0).toUpperCase() + dn.slice(1) + ", " + found.day.getDate() + " " + MONTHS[found.day.getMonth()];
        $(".near-list", near).innerHTML = (found.feast ? '<p class="near-feast">' + esc(found.feast) + "</p>" : "") + serviceRows(found.list);
      } else {
        $(".near-label", near).textContent = "Расписание богослужений";
        $(".near-date", near).textContent = "Смотрите во ВКонтакте";
        $(".near-list", near).innerHTML = "";
      }
    }

    /* Календарь на странице расписания */
    var cal = $("#calendar");
    if (!cal) return;
    var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var view = new Date(today.getFullYear(), today.getMonth(), 1), sel = today;
    var SV = window.SVYATCY || {};
    var dayName = function (dd, sv) {
      if (sv.feast) return sv.feast;
      if (sv.info && sv.info.r >= 1) return sv.info.f;
      var s = SV[key(dd)];
      return s && s.m && s.m.length ? s.m[0] : (sv.info ? sv.info.f : "");
    };
    var renderDay = function () {
      var sv = services(sel), box = $("#day-info"), fast = fastOf(sel), main = dayName(sel, sv);
      var body = sv.list.length ? serviceRows(sv.list)
        : sv.known ? '<p class="muted day-empty">Богослужения не совершаются. Храм открыт с ' + esc(S.openHours || "8:00–20:00").replace("–", " до ") + ".</p>"
        : '<p class="muted day-empty">Расписание на этот день ещё не опубликовано. Следите за объявлениями <a class="link" href="' + esc(S.vk) + '" target="_blank" rel="noopener">во ВКонтакте</a>.</p>';
      box.innerHTML = '<p class="eyebrow">' + DAYS[sel.getDay()] + (fast ? " · " + fast : "") + "</p>" +
        '<h2 class="day-title">' + sel.getDate() + " " + MONTHS[sel.getMonth()] + "</h2>" +
        (main ? '<p class="day-feast">' + esc(main) + "</p>" : "") + body;
    };
    var renderCal = function () {
      $("#cal-title").textContent = MONTHS_NOM[view.getMonth()] + " " + view.getFullYear();
      var first = (view.getDay() + 6) % 7, days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      var h = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map(function (x, i) { return '<span class="cal-dow' + (i === 6 ? " red" : "") + '">' + x + "</span>"; }).join("");
      for (var i = 0; i < first; i++) h += '<span class="cal-empty"></span>';
      for (var n = 1; n <= days; n++) {
        var dd = new Date(view.getFullYear(), view.getMonth(), n), sv = services(dd), fi = sv.info, name = dayName(dd, sv);
        var cls = ["cal-day"];
        if (sv.list.length) cls.push("has");
        if (sv.big || (fi && fi.r >= 1) || dd.getDay() === 0) cls.push("red");
        if (sv.big || (fi && fi.r === 2)) cls.push("great");
        if (fastOf(dd)) cls.push("fast");
        if (+dd === +today) cls.push("today");
        if (+dd === +sel) cls.push("sel");
        h += '<button type="button" class="' + cls.join(" ") + '" data-d="' + key(dd) + '" aria-label="' + n + " " + MONTHS[dd.getMonth()] + (name ? ", " + esc(name) : "") + (sv.list.length ? ", есть богослужение" : "") + '">' +
          '<span class="cd-n">' + n + "</span>" +
          (name ? '<span class="cd-f">' + esc(name) + "</span>" : "") +
          (+dd === +today ? '<span class="cd-today">сегодня</span>' : "") + "</button>";
      }
      $("#cal-grid").innerHTML = h;
    };
    $("#cal-grid").addEventListener("click", function (e) {
      var b = e.target.closest(".cal-day"); if (!b) return;
      var p = b.dataset.d.split("-"); sel = new Date(+p[0], +p[1] - 1, +p[2]);
      renderCal(); renderDay();
      if (window.innerWidth < 900) $("#day-info").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    $("#cal-prev").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
    $("#cal-next").addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });
    renderCal(); renderDay();

    /* Ближайшие праздники: большие праздники из расписания и церковного календаря */
    var fl = $("#feast-list");
    if (fl) {
      var items = [];
      for (var j = 0; j < 400 && items.length < 10; j++) {
        var dd = addDays(today, j), sv = services(dd);
        var nm = sv.big ? sv.feast : (sv.info && sv.info.r >= 1 ? sv.info.f : "");
        if (nm) items.push('<li><span class="fl-date">' + dd.getDate() + " " + MONTHS[dd.getMonth()] + ", " + DAYS[dd.getDay()] + "</span><span>" + esc(nm) + "</span></li>");
      }
      fl.innerHTML = items.join("");
    }
  });

  /* ---------- Новости и расписание из ВКонтакте ---------- */
  function vkDate(ts) { var d = new Date(ts * 1000); return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function vkText(t, max) {
    t = String(t || "").replace(/\[(club|public|id)\d+\|([^\]]+)\]/g, "$2");
    if (max && t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, "") + "…";
    return esc(t).replace(/\n/g, "<br>");
  }
  function vkTitle(t) {
    var first = String(t || "").split(/\n/)[0].replace(/\[(club|public|id)\d+\|([^\]]+)\]/g, "$2").trim();
    return first.length > 90 ? first.slice(0, 90).replace(/\s+\S*$/, "") + "…" : first;
  }
  var vkPromise = null;
  function loadVK() {
    if (!S.vkApi) return Promise.reject(new Error("vk off"));
    if (!vkPromise) vkPromise = fetch("api/vk.php?count=40", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("vk");
      return r.json();
    }).then(function (j) { if (!j || !j.items) throw new Error("vk"); return j.items; });
    return vkPromise;
  }
  function vkFallback(box, what) {
    box.innerHTML = '<div class="vk-fallback"><p>' + (what || "Новости прихода") + ' публикуются в нашей группе ВКонтакте.</p><a class="btn solid" href="' + esc(S.vk) + '" target="_blank" rel="noopener">Открыть группу ВКонтакте<span class="arr">↗</span></a></div>';
  }

  /* Официальный виджет ВКонтакте: показывает записи группы без ключа доступа */
  function vkWidget(box, height) {
    if (!S.vkGroupId) return false;
    box.innerHTML = '<div class="vk-widget"><div id="vk_groups"></div></div>';
    var draw = function () {
      try {
        var w = Math.max(300, Math.min(900, $(".vk-widget", box).clientWidth || box.clientWidth || 600));
        VK.Widgets.Group("vk_groups", { mode: 4, wide: 1, no_cover: 1, width: w, height: height, color1: "FCF5EC", color2: "29231F", color3: "8B1D2C" }, S.vkGroupId);
      } catch (e) { vkFallback(box); }
    };
    if (window.VK && VK.Widgets) return draw(), true;
    var s = document.createElement("script");
    s.src = "https://vk.com/js/api/openapi.js?169";
    s.onload = draw;
    s.onerror = function () { vkFallback(box); };
    document.head.appendChild(s);
    return true;
  }

  var feed = $("#news-feed");
  if (feed) {
    var limit = +feed.dataset.limit || 30;
    loadVK().then(function (items) {
      items = items.filter(function (p) { return p.text || (p.photos && p.photos.length); }).slice(0, limit);
      if (!items.length) return vkFallback(feed);
      feed.innerHTML = items.map(function (p, idx) {
        var img = p.photos && p.photos[0];
        var title = vkTitle(p.text) || "Фотографии";
        var body = String(p.text || "").split(/\n/).slice(1).join("\n").trim();
        return '<article class="news-card">' +
          (img ? '<a class="news-img" href="' + esc(p.url) + '" target="_blank" rel="noopener"><img loading="lazy" src="' + esc(img) + '" alt=""></a>' : "") +
          '<div class="news-body"><p class="news-date">' + vkDate(p.date) + "</p>" +
          '<h3 class="news-title"><a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(title) + "</a></h3>" +
          (body ? '<p class="news-text">' + vkText(body, feed.dataset.short ? 160 : 420) + "</p>" : "") +
          '<a class="link" href="' + esc(p.url) + '" target="_blank" rel="noopener">Читать во ВКонтакте<span class="arr">→</span></a></div></article>';
      }).join("");
    }).catch(function () { vkWidget(feed, 640) || vkFallback(feed); });
  }

  var vkSched = $("#vk-schedule");
  if (vkSched) {
    loadVK().then(function (items) {
      var p = items.filter(function (x) { return /расписани/i.test(x.text || ""); })[0];
      if (!p) { vkSched.hidden = true; return; }
      vkSched.innerHTML = '<p class="eyebrow">Опубликовано ' + vkDate(p.date) + ' во ВКонтакте</p><h2 class="h2">' + esc(vkTitle(p.text)) + "</h2>" +
        (p.text ? '<div class="vk-sched-text">' + vkText(String(p.text).split(/\n/).slice(1).join("\n")) + "</div>" : "") +
        (p.photos || []).map(function (u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img class="vk-sched-img" loading="lazy" src="' + esc(u) + '" alt="Расписание богослужений"></a>'; }).join("") +
        '<a class="link" href="' + esc(p.url) + '" target="_blank" rel="noopener">Открыть запись во ВКонтакте<span class="arr">↗</span></a>';
    }).catch(function () { vkSched.hidden = true; });
  }

  /* ---------- Сбор на иконы ---------- */
  $$("[data-icons]").forEach(function (el) {
    var ic = S.icons || {}, total = ic.total || 120, done = ic.done || 0, pct = Math.round(done / total * 100);
    $(".ip-done", el).textContent = done;
    $(".ip-total", el).textContent = total;
    var bar = $(".ip-bar", el);
    if (bar) { $("i", bar).style.width = pct + "%"; bar.setAttribute("aria-valuenow", pct); }
    var grid = $(".icon-grid", el);
    if (grid) { var h = ""; for (var k = 0; k < total; k++) h += k < done ? '<i class="on"></i>' : "<i></i>"; grid.innerHTML = h; }
    var ps = $(".ip-small", el); if (ps) ps.textContent = fmtRub(ic.priceSmall || 13000);
    var pm = $(".ip-medium", el); if (pm) pm.textContent = fmtRub(ic.priceMedium || 23000);
  });

  /* ---------- QR-код для оплаты в приложении банка ---------- */
  function payString(sum, purpose) {
    var b = S.bank || {};
    var parts = ["ST00012", "Name=" + b.name, "PersonalAcc=" + b.account, "BankName=" + b.bankName, "BIC=" + b.bic, "CorrespAcc=" + b.corr, "PayeeINN=" + b.inn, "KPP=" + b.kpp];
    if (sum) parts.push("Sum=" + Math.round(sum * 100));
    parts.push("Purpose=" + (purpose || b.purpose));
    return parts.join("|");
  }
  function drawQR(box, sum, purpose) {
    if (typeof qrcode === "undefined") return;
    qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
    var q = qrcode(0, "M");
    q.addData(payString(sum, purpose), "Byte");
    q.make();
    box.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    box.querySelector("svg").setAttribute("role", "img");
    box.querySelector("svg").setAttribute("aria-label", "QR-код для перевода пожертвования");
  }
  $$("[data-qr]").forEach(function (box) {
    var wrap = box.closest(".qr-wrap"), sumIn = wrap && $("[data-qr-sum]", wrap), purIn = wrap && $("[data-qr-purpose]", wrap);
    var redraw = function () {
      var sum = sumIn ? parseInt(String(sumIn.value).replace(/\D/g, ""), 10) || 0 : 0;
      var pur = purIn ? purIn.value : box.dataset.purpose;
      drawQR(box, sum, pur);
    };
    if (sumIn) sumIn.addEventListener("input", redraw);
    if (purIn) purIn.addEventListener("change", redraw);
    $$("[data-sum]", wrap || document).forEach(function (b) {
      b.addEventListener("click", function () { if (sumIn) { sumIn.value = b.dataset.sum; redraw(); } });
    });
    redraw();
  });
  $$("[data-bank]").forEach(function (el) { var v = (S.bank || {})[el.dataset.bank]; if (v) el.textContent = v; });
  $$("[data-card-pay]").forEach(function (el) {
    if (S.cardPaymentUrl) { el.hidden = false; var a = $("a", el); if (a) a.href = S.cardPaymentUrl; }
  });
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = $(b.dataset.copy).innerText;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () {
        var o = b.textContent; b.textContent = "Скопировано"; setTimeout(function () { b.textContent = o; }, 1800);
      }).catch(function () {});
    });
  });

  /* ---------- Паломнические поездки ---------- */
  var trips = $("#trips");
  if (trips) {
    var t0 = key(new Date());
    var list = (S.trips || []).filter(function (t) { return t.date >= t0; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (list.length) {
      trips.innerHTML = list.map(function (t) {
        var p = t.date.split("-"), dd = new Date(+p[0], +p[1] - 1, +p[2]);
        return '<article class="trip"><div class="trip-date"><b>' + dd.getDate() + "</b>" + MONTHS[dd.getMonth()] + "<br>" + DAYS[dd.getDay()] + '</div><div class="trip-body"><h3>' + esc(t.title) + "</h3>" + (t.text ? "<p>" + esc(t.text) + "</p>" : "") + (t.price ? '<p class="muted">Пожертвование: ' + esc(t.price) + "</p>" : "") + '<a class="link" href="#zapis" data-trip="' + esc(t.title + ", " + dd.getDate() + " " + MONTHS[dd.getMonth()]) + '">Записаться<span class="arr">→</span></a></div></article>';
      }).join("");
      var sel = $("#trip-select");
      if (sel) list.forEach(function (t) { var o = document.createElement("option"); o.textContent = t.title + " — " + t.date.split("-").reverse().join("."); sel.insertBefore(o, sel.lastElementChild); });
      $$("[data-trip]", trips).forEach(function (a) { a.addEventListener("click", function () { if (sel) sel.selectedIndex = Array.prototype.findIndex.call(sel.options, function (o) { return o.textContent.indexOf(a.dataset.trip.split(",")[0]) === 0; }); }); });
    }
  }

  /* ---------- Формы ---------- */
  var FORM_TITLES = { treba: "Заявка на требу с сайта храма", zapiska: "Записка с сайта храма", palomnichestvo: "Запись на паломничество с сайта храма", vopros: "Вопрос с сайта храма" };

  /* Собирает заполненную форму в обычный текст сообщения */
  function formText(f) {
    var lines = [FORM_TITLES[f.dataset.form] || "Сообщение с сайта"], names = [];
    $$("input,select,textarea", f).forEach(function (el) {
      if (el.name === "website" || el.name === "agree" || el.type === "submit") return;
      var v = String(el.value || "").trim();
      if ((el.type === "radio" || el.type === "checkbox") && !el.checked) return;
      if (!v) return;
      if (el.name === "names[]") { names.push(v); return; }
      if (el.type === "date") v = v.split("-").reverse().join(".");
      var lab = el.id && $('label[for="' + el.id + '"]', f);
      if (!lab) { var fs = el.closest("fieldset"); lab = fs && $("legend", fs); }
      lines.push((lab ? lab.textContent.trim() + ": " : "") + v);
    });
    if (names.length) lines.push("Имена:\n" + names.map(function (n, i) { return (i + 1) + ". " + n; }).join("\n"));
    return lines.join("\n");
  }

  /* Показывает кнопки отправки готового сообщения на телефон храма */
  function showSend(f, msg) {
    var text = formText(f), phone = S.whatsappPhone || String(S.phoneLink || "").replace(/\D/g, "");
    var enc = encodeURIComponent(text);
    msg.className = "form-msg send-box";
    msg.innerHTML = '<span class="send-t">Сообщение готово. Отправьте его на телефон храма удобным способом:</span>' +
      '<span class="send-btns">' +
      '<a class="btn solid" href="https://wa.me/' + esc(phone) + "?text=" + enc + '" target="_blank" rel="noopener">Отправить в WhatsApp<span class="arr">↗</span></a>' +
      '<a class="btn" href="sms:+' + esc(phone) + "?&body=" + enc + '">Отправить СМС</a>' +
      '<button class="btn" type="button" data-copy-text>Скопировать текст</button>' +
      "</span>" +
      '<span class="send-pre">' + esc(text).replace(/\n/g, "<br>") + "</span>" +
      '<span class="muted send-call">Или позвоните: <a href="tel:' + esc(S.phoneLink) + '">' + esc(S.phone) + "</a></span>";
    $("[data-copy-text]", msg).addEventListener("click", function (e) {
      var b = e.currentTarget;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
        b.textContent = "Скопировано";
        setTimeout(function () { b.textContent = "Скопировать текст"; }, 1800);
      }).catch(function () {});
    });
    msg.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  $$("form[data-form]").forEach(function (f) {
    var msg = $(".form-msg", f);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = $$("[required]", f).filter(function (i) { return i.type === "checkbox" ? !i.checked : !String(i.value).trim(); });
      $$(".invalid", f).forEach(function (i) { i.classList.remove("invalid"); });
      if (bad.length) {
        bad.forEach(function (i) { i.classList.add("invalid"); });
        msg.className = "form-msg err"; msg.textContent = "Заполните отмеченные поля.";
        bad[0].focus(); return;
      }
      if (!S.formsEmail) return showSend(f, msg);
      var btn = $("button[type=submit]", f); btn.disabled = true;
      msg.className = "form-msg"; msg.textContent = "Отправляем…";
      var fd = new FormData(f); fd.append("form", f.dataset.form); fd.append("page", location.pathname);
      fetch("api/send.php", { method: "POST", body: fd }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) throw new Error(j.error || "");
        f.reset();
        msg.className = "form-msg ok";
        msg.textContent = f.dataset.ok || "Спасибо! Заявка отправлена. Мы свяжемся с вами.";
      }).catch(function () {
        msg.className = "form-msg err";
        msg.innerHTML = "Не удалось отправить. Пожалуйста, позвоните в храм: <a href=\"tel:" + esc(S.phoneLink) + "\">" + esc(S.phone) + "</a>.";
      }).then(function () { btn.disabled = false; });
    });
    $$("input,textarea,select", f).forEach(function (i) { i.addEventListener("input", function () { i.classList.remove("invalid"); }); });
  });

  /* Добавление имён в записке */
  var names = $("#names");
  if (names) {
    var addBtn = $("#add-name");
    var count = function () { return $$("input", names).length; };
    addBtn.addEventListener("click", function () {
      if (count() >= 10) return;
      var inp = document.createElement("input");
      inp.type = "text"; inp.name = "names[]"; inp.placeholder = "Имя " + (count() + 1); inp.autocomplete = "off";
      names.appendChild(inp); inp.focus();
      if (count() >= 10) addBtn.hidden = true;
    });
  }

  /* ---------- Просмотр фотографий ---------- */
  var gal = $$("[data-lightbox] a");
  if (gal.length) {
    var lb = document.createElement("div");
    lb.className = "lightbox"; lb.hidden = true;
    lb.innerHTML = '<button class="lb-close" aria-label="Закрыть">×</button><button class="lb-prev" aria-label="Предыдущее фото">‹</button><img alt=""><button class="lb-next" aria-label="Следующее фото">›</button>';
    document.body.appendChild(lb);
    var idx = 0, img = $("img", lb);
    var show = function (i) { idx = (i + gal.length) % gal.length; img.src = gal[idx].href; img.alt = ($("img", gal[idx]) || {}).alt || ""; lb.hidden = false; document.body.style.overflow = "hidden"; };
    var close = function () { lb.hidden = true; document.body.style.overflow = ""; img.src = ""; };
    gal.forEach(function (a, i) { a.addEventListener("click", function (e) { e.preventDefault(); show(i); }); });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") show(idx - 1); else if (e.key === "ArrowRight") show(idx + 1);
    });
  }
})();
