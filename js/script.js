/* ==========================================================================
   PORTÓN DEL VALLE — Landing page interactions
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  /* ---------- CONFIG ---------- */
  var WHATSAPP_NUMBER = "593939087030";

  /* ---------- Apertura robusta de WhatsApp ----------
     Abre WhatsApp en una pestaña nueva mediante un <a target="_blank"> real con
     clic simulado (más fiable ante bloqueadores de pop-ups que window.open()).
     Si por algún motivo el navegador no permite abrir la pestaña nueva, como
     último recurso se usa window.open() directo. */
  function openWhatsApp(url) {
    try {
      var a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      try { window.open(url, "_blank", "noopener"); } catch (err2) { /* sin más opciones */ }
    }
  }

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("header");
  function onScroll() {
    if (window.scrollY > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");
  navToggle.addEventListener("click", function () {
    nav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open");
  });
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
    });
  });

  /* ---------- Reveal on scroll ---------- */
  function observeReveal() {
    var revealEls = document.querySelectorAll(".reveal:not(.is-visible)");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }
  observeReveal();

  /* =========================================================================
     MAPA INTERACTIVO — construye un polígono SVG por lote a partir de
     LOTS_DATA (generado con visión por computadora sobre el mapa oficial del
     brochure) y muestra un tooltip al pasar el mouse, sin necesidad de clic.
     ========================================================================= */
  var mapWrap = document.getElementById("interactiveMap");
  if (mapWrap && window.LOTS_DATA) {
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.getElementById("lotsSvg");
    var tooltip = document.getElementById("mapTooltip");
    var fmtNum = function (n) { return n.toLocaleString("es-EC", { maximumFractionDigits: 0 }); };
    var fmtArea = function (n) { return n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

    var codes = Object.keys(window.LOTS_DATA).sort();
    codes.forEach(function (code) {
      var lot = window.LOTS_DATA[code];
      if (!lot.points || lot.points.length < 3) return;
      var poly = document.createElementNS(svgNS, "polygon");
      var pointsStr = lot.points.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
      poly.setAttribute("points", pointsStr);
      poly.setAttribute("class", "lot-shape status-" + lot.status);
      poly.setAttribute("data-code", code);
      svg.appendChild(poly);
    });

    function showTooltip(code, evt) {
      var lot = window.LOTS_DATA[code];
      if (!lot) return;
      var statusLabel = lot.status === "disponible" ? "Disponible" : (lot.status === "consultar" ? "Disponible" : "No disponible");
      var html = '<p class="map-tooltip__code">' + code + "</p>" +
        '<span class="map-tooltip__status ' + lot.status + '">' + statusLabel + "</span>";
      if (lot.status === "disponible" && lot.area && lot.price) {
        html += '<div class="map-tooltip__row"><span>Área</span><strong>' + fmtArea(lot.area) + " m²</strong></div>";
        html += '<div class="map-tooltip__row"><span>Precio</span><strong>$' + fmtNum(lot.price) + "</strong></div>";
      } else if (lot.status === "consultar") {
        html += '<div class="map-tooltip__row"><span colspan="2">Consultar precio</span></div>';
      }
      tooltip.innerHTML = html;
      tooltip.classList.add("is-visible");
      positionTooltip(evt);
    }

    function positionTooltip(evt) {
      var rect = mapWrap.getBoundingClientRect();
      var x = evt.clientX - rect.left;
      var y = evt.clientY - rect.top;
      x = Math.max(90, Math.min(rect.width - 90, x));
      y = Math.max(70, y);
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";
    }

    function hideTooltip() {
      tooltip.classList.remove("is-visible");
    }

    svg.addEventListener("mousemove", function (evt) {
      var target = evt.target;
      if (target && target.classList && target.classList.contains("lot-shape")) {
        var code = target.getAttribute("data-code");
        if (tooltip.getAttribute("data-current") !== code) {
          document.querySelectorAll(".lot-shape.is-hover").forEach(function (el) { el.classList.remove("is-hover"); });
          target.classList.add("is-hover");
          tooltip.setAttribute("data-current", code);
          showTooltip(code, evt);
        } else {
          positionTooltip(evt);
        }
      } else {
        if (tooltip.getAttribute("data-current")) {
          tooltip.removeAttribute("data-current");
          document.querySelectorAll(".lot-shape.is-hover").forEach(function (el) { el.classList.remove("is-hover"); });
          hideTooltip();
        }
      }
    });
    svg.addEventListener("mouseleave", function () {
      tooltip.removeAttribute("data-current");
      document.querySelectorAll(".lot-shape.is-hover").forEach(function (el) { el.classList.remove("is-hover"); });
      hideTooltip();
    });

    // Touch support: tap toggles the tooltip for that lot
    svg.addEventListener("click", function (evt) {
      var target = evt.target;
      if (target && target.classList && target.classList.contains("lot-shape")) {
        var code = target.getAttribute("data-code");
        var isSame = tooltip.getAttribute("data-current") === code && tooltip.classList.contains("is-visible");
        document.querySelectorAll(".lot-shape.is-hover").forEach(function (el) { el.classList.remove("is-hover"); });
        if (isSame) {
          hideTooltip();
          tooltip.removeAttribute("data-current");
        } else {
          target.classList.add("is-hover");
          tooltip.setAttribute("data-current", code);
          showTooltip(code, evt.changedTouches ? evt.changedTouches[0] : evt);
        }
      }
    });
  }

  /* ---------- Filtro de lotes (tabla) ---------- */
  var lotSearch = document.getElementById("lotSearch");
  if (lotSearch) {
    lotSearch.addEventListener("input", function () {
      var q = lotSearch.value.trim().toLowerCase();
      document.querySelectorAll("#lotesTable tbody tr").forEach(function (row) {
        var txt = row.getAttribute("data-lote") || "";
        row.style.display = txt.indexOf(q) !== -1 ? "" : "none";
      });
    });
  }

  /* =========================================================================
     LIGHTBOX — modo galería (con navegación) y modo ficha (imagen única)
     ========================================================================= */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lbPrev = document.getElementById("lightboxPrev");
  var lbNext = document.getElementById("lightboxNext");
  var lbClose = document.getElementById("lightboxClose");

  var galleryImgs = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var currentIndex = 0;
  var navMode = "gallery"; // "gallery" | "single"

  /* ---------- Bloqueo de scroll de fondo sin "saltos" ----------
     Fijamos el body en su posición de scroll actual para que la tarjeta/ficha
     aparezca centrada y estable, y el scroll de fondo quede congelado en su
     lugar; al cerrar, se restaura exactamente esa posición. */
  var scrollLockY = 0;
  function lockScroll() {
    scrollLockY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = "fixed";
    document.body.style.top = "-" + scrollLockY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }
  function unlockScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollLockY);
  }

  function openGalleryAt(index) {
    navMode = "gallery";
    currentIndex = index;
    lightboxImg.src = galleryImgs[index].getAttribute("data-full") || galleryImgs[index].src;
    lightboxCaption.textContent = galleryImgs[index].getAttribute("alt") || "";
    lbPrev.classList.remove("is-hidden");
    lbNext.classList.remove("is-hidden");
    lightbox.classList.remove("is-ficha");
    lightbox.classList.add("is-open");
    lockScroll();
  }

  /* "Ficha" = mapa de lotes: se abre en una ventana fija (1500x800 máx.) en vez
     de a pantalla completa, con la X en la esquina superior izquierda de esa
     ventana. El fondo queda fijo mientras está abierta. */
  function openSingle(src, caption) {
    navMode = "single";
    lightboxImg.src = src;
    lightboxCaption.textContent = caption || "";
    lbPrev.classList.add("is-hidden");
    lbNext.classList.add("is-hidden");
    lightbox.classList.add("is-ficha");
    lightbox.classList.add("is-open");
    lockScroll();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.classList.remove("is-ficha");
    unlockScroll();
  }

  function showRelative(delta) {
    if (navMode !== "gallery") return;
    currentIndex = (currentIndex + delta + galleryImgs.length) % galleryImgs.length;
    lightboxImg.src = galleryImgs[currentIndex].getAttribute("data-full") || galleryImgs[currentIndex].src;
    lightboxCaption.textContent = galleryImgs[currentIndex].getAttribute("alt") || "";
  }

  galleryImgs.forEach(function (img, index) {
    img.addEventListener("click", function () { openGalleryAt(index); });
  });

  // Delegated click for elements marked data-ficha (ej. mapa de lotes)
  document.addEventListener("click", function (e) {
    var card = e.target.closest("[data-ficha]");
    if (card) {
      openSingle(card.getAttribute("data-ficha"), card.getAttribute("data-title") || "");
    }
  });

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbPrev) lbPrev.addEventListener("click", function () { showRelative(-1); });
  if (lbNext) lbNext.addEventListener("click", function () { showRelative(1); });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showRelative(1);
    if (e.key === "ArrowLeft") showRelative(-1);
  });

  /* ---------- Contact form -> WhatsApp ---------- */
  var form = document.getElementById("contactForm");
  var formStatus = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name").value.trim();
      var phone = form.querySelector("#phone").value.trim();
      var email = form.querySelector("#email").value.trim();
      var lote = form.querySelector("#lote").value;
      var message = form.querySelector("#message").value.trim();

      if (!name || !phone) {
        formStatus.textContent = "Por favor completa al menos tu nombre y teléfono.";
        formStatus.classList.add("is-visible");
        return;
      }

      var text = "Hola, soy " + name + ". Me interesa el proyecto Portón del Valle";
      if (lote) text += " (interés: " + lote + ")";
      text += ". Teléfono: " + phone;
      if (email) text += ". Correo: " + email;
      if (message) text += ". Mensaje: " + message;

      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
      openWhatsApp(url);

      formStatus.textContent = "¡Listo! Te llevamos a WhatsApp para enviar tu consulta.";
      formStatus.classList.add("is-visible");
    });
  }

  /* Nota: los enlaces fijos de WhatsApp (hero, teléfono de contacto, botón
     flotante) ya llevan su href="https://wa.me/..." y target="_blank" escritos
     directamente en el HTML — son links normales, sin JS de por medio. Solo el
     formulario de contacto necesita JS porque su mensaje se arma con los datos
     que escribe la persona. */
});
