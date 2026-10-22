/* Временная панель «Подбор цвета»: палитра и форма кнопок. После выбора удалить файл и строку в build.py */
(function () {
  "use strict";
  var root = document.documentElement;
  var PAL = [
    ["brass", "Воск", "#e8dcc6", "#b9a27e"],
    ["garnet", "Гранат", "#8f2733", "#c7a68a"],
    ["champagne", "Шампань", "#f1e7d4", "#d0bf9f"],
    ["copper", "Медь", "#b65a37", "#c48b62"],
    ["gold", "Золото", "#cfa95f", "#c9a463"]
  ];
  var BTN = [["sharp", "Прямые", "2px"], ["soft", "Мягкие", "10px"], ["pill", "Овальные", "999px"]];
  function get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var box = document.createElement("div");
  box.className = "picker";
  box.innerHTML = '<div class="picker-body" role="dialog" aria-label="Подбор цвета">' +
    "<h4>Цвет</h4><div class=\"picker-row\">" +
    PAL.map(function (p) { return '<button type="button" class="sw" data-pal="' + p[0] + '"><span class="dot" style="background:linear-gradient(135deg,' + p[2] + " 50%," + p[3] + ' 50%)"></span>' + p[1] + "</button>"; }).join("") +
    "</div><h4>Кнопки</h4><div class=\"picker-row three\">" +
    BTN.map(function (b) { return '<button type="button" class="sw" data-btn="' + b[0] + '"><span class="shape" style="border-radius:' + b[2] + '"></span>' + b[1] + "</button>"; }).join("") +
    '</div><p class="picker-note">Выбор запоминается и применяется ко всем страницам. Это временная панель — уберу её, когда выберете.</p></div>' +
    '<button type="button" class="picker-toggle" aria-expanded="false"><i></i>Подбор цвета</button>';
  document.body.appendChild(box);

  function mark() {
    var pal = root.getAttribute("data-palette") || "brass", btn = root.getAttribute("data-btn") || "sharp";
    box.querySelectorAll("[data-pal]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.pal === pal ? "true" : "false"); });
    box.querySelectorAll("[data-btn]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.btn === btn ? "true" : "false"); });
  }
  box.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.classList.contains("picker-toggle")) {
      var open = box.classList.toggle("open");
      t.setAttribute("aria-expanded", open ? "true" : "false");
      return;
    }
    if (t.dataset.pal) { root.setAttribute("data-palette", t.dataset.pal); set("palette", t.dataset.pal); }
    if (t.dataset.btn) { root.setAttribute("data-btn", t.dataset.btn); set("btn", t.dataset.btn); }
    mark();
  });
  root.setAttribute("data-palette", get("palette", "brass"));
  root.setAttribute("data-btn", get("btn", "sharp"));
  mark();
})();
