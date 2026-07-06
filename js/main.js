/* Great Indoors Wood Floors - interactions
   Nav, scroll reveals, gallery lightbox, filters, video facade. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----- Active nav state (header markup stays identical across pages) ----- */
  var path = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  document.querySelectorAll(".site-header a[href], .nav-mobile a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) !== "/") return;
    var clean = href.replace(/\.html$/, "").replace(/\/$/, "") || "/";
    if (clean === path) a.setAttribute("aria-current", "page");
  });

  /* ----- Desktop services dropdown ----- */
  var dd = document.querySelector(".nav-item-dropdown");
  if (dd) {
    var btn = dd.querySelector("button");
    var closeTimer;
    function setOpen(open) {
      dd.setAttribute("data-open", open ? "true" : "false");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    btn.addEventListener("click", function () {
      setOpen(dd.getAttribute("data-open") !== "true");
    });
    dd.addEventListener("mouseenter", function () { clearTimeout(closeTimer); setOpen(true); });
    dd.addEventListener("mouseleave", function () { closeTimer = setTimeout(function () { setOpen(false); }, 180); });
    dd.addEventListener("focusout", function () {
      setTimeout(function () { if (!dd.contains(document.activeElement)) setOpen(false); }, 0);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dd.getAttribute("data-open") === "true") { setOpen(false); btn.focus(); }
    });
  }

  /* ----- Mobile nav ----- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".nav-mobile");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobileNav.classList.toggle("open", !open);
      document.body.style.overflow = open ? "" : "hidden";
    });
    mobileNav.querySelectorAll(".nav-sub-toggle").forEach(function (st) {
      st.addEventListener("click", function () {
        var sub = st.nextElementSibling;
        var open = sub.classList.toggle("open");
        st.setAttribute("aria-expanded", String(open));
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        toggle.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("open");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });
  }

  /* ----- Scroll reveals (enhance visible-by-default content) ----- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -80px 0px", threshold: 0.05 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ----- Gallery filters ----- */
  var filterBar = document.querySelector(".filter-bar");
  var filterStatus = document.querySelector("[data-filter-status]");
  if (filterBar) {
    filterBar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-filter]");
      if (!b) return;
      filterBar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      var f = b.getAttribute("data-filter");
      var shown = 0;
      document.querySelectorAll(".g-item").forEach(function (item) {
        var show = f === "all" || (item.getAttribute("data-cat") || "").split(" ").indexOf(f) !== -1;
        item.classList.toggle("hidden", !show);
        if (show) shown++;
      });
      if (filterStatus) {
        filterStatus.textContent = shown + " photo" + (shown === 1 ? "" : "s") + " shown: " + b.textContent.trim();
      }
    });
  }

  /* ----- Lightbox ----- */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector("figcaption");
    var items = [];
    var idx = 0;
    var lastFocus = null;

    function collectVisible() {
      items = Array.prototype.slice.call(document.querySelectorAll(".g-item:not(.hidden)"));
    }
    function show(i) {
      idx = (i + items.length) % items.length;
      var el = items[idx];
      lbImg.src = el.getAttribute("data-full") || el.querySelector("img").src;
      lbImg.alt = el.querySelector("img").alt;
      var cap = el.getAttribute("data-caption") || el.querySelector("img").alt;
      lbCap.textContent = cap + " (image " + (idx + 1) + " of " + items.length + ")";
    }
    function openLb(el) {
      collectVisible();
      lastFocus = document.activeElement;
      show(items.indexOf(el));
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      lb.querySelector(".lb-close").focus();
    }
    function closeLb() {
      lb.classList.remove("open");
      document.body.style.overflow = "";
      lbImg.src = "";
      if (lastFocus) lastFocus.focus();
    }
    document.addEventListener("click", function (e) {
      var g = e.target.closest(".g-item");
      if (g) { e.preventDefault(); openLb(g); }
    });
    lb.querySelector(".lb-close").addEventListener("click", closeLb);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") { closeLb(); return; }
      if (e.key === "ArrowLeft") { show(idx - 1); return; }
      if (e.key === "ArrowRight") { show(idx + 1); return; }
      if (e.key === "Tab") {
        var focusable = Array.prototype.slice.call(lb.querySelectorAll("button"));
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        } else if (!lb.contains(document.activeElement)) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }

  /* ----- YouTube facade ----- */
  document.querySelectorAll(".video-facade").forEach(function (fac) {
    fac.addEventListener("click", function () {
      var id = fac.getAttribute("data-video-id");
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      iframe.title = fac.getAttribute("data-video-title") || "Video";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.setAttribute("allowfullscreen", "");
      // Swap the <button> for a plain wrapper: an iframe must not nest inside a button.
      var wrap = document.createElement("div");
      wrap.className = "video-facade video-facade-active";
      wrap.setAttribute("style", fac.getAttribute("style") || "");
      wrap.appendChild(iframe);
      fac.replaceWith(wrap);
      iframe.focus();
    }, { once: true });
  });

  /* ----- Footer year ----- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();
