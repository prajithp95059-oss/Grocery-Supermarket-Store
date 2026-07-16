/* ==========================================================================
   Stackly — prototype click-guard + form validation
   --------------------------------------------------------------------------
   1) Any <a> or <button> click OUTSIDE the header/footer (and outside a
      short list of in-page UI controls that have to keep working — mobile
      menu, dashboard sidebar, filter tabs, accordion, load-more, tab
      switches) is redirected to 404.html instead of doing whatever it
      used to do.
   2) Every <form> on the site is validated on submit. If any field is
      invalid the browser's native validation message is shown and the
      page does not navigate. Once every field passes, the page is sent
      to 404.html (this replaces whatever the form used to do on submit).
   3) Fields marked data-validate="text" reject digits as you type and on
      submit. Fields marked data-validate="phone" or "number" reject
      letters as you type and on submit. This is opt-in per field — add
      the attribute to any input that needs it.
   ========================================================================== */
(function () {
  "use strict";

  var REDIRECT_TARGET = "404.html";

  /* Elements/areas that must keep their real in-page behaviour instead of
     bouncing to the 404 page. Add data-no-guard="" to any future element
     that needs the same treatment. */
  var EXEMPT_SELECTOR = [
    "header", "footer",
    ".dash-sidebar", ".sidebar-backdrop",
    ".dept", ".tab", ".auth-tab",
    "[data-switch]", "[data-goto]", ".dnav",
    "#loadMoreBtn", ".add-btn", ".wish-btn",
    "[data-no-guard]"
  ].join(", ");

  function isExempt(el) {
    return !!el.closest(EXEMPT_SELECTOR);
  }

  /* ---------------- 1) Click guard ---------------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("a, button");
    if (!el) return;
    if (isExempt(el)) return;
    if (el.type === "submit") return; // handled by the submit guard below
    if (el.disabled) return;
    e.preventDefault();
    window.location.href = REDIRECT_TARGET;
  }, true);

  /* ---------------- 2) Strict field filtering ---------------- */
  document.querySelectorAll('[data-validate="text"]').forEach(function (inp) {
    inp.addEventListener("input", function () {
      var pos = this.selectionStart;
      var before = this.value;
      this.value = this.value.replace(/[0-9]/g, "");
      var diff = before.length - this.value.length;
      if (pos !== null) this.setSelectionRange(pos - diff, pos - diff);
    });
  });
  document.querySelectorAll('[data-validate="phone"], [data-validate="number"]').forEach(function (inp) {
    inp.addEventListener("input", function () {
      var pos = this.selectionStart;
      var before = this.value;
      this.value = this.value.replace(/[A-Za-z]/g, "");
      var diff = before.length - this.value.length;
      if (pos !== null) this.setSelectionRange(pos - diff, pos - diff);
    });
  });

  /* ---------------- 3) Generic form validation + redirect ---------------- */
  document.querySelectorAll("form").forEach(function (form) {
    if (form.hasAttribute("data-no-guard")) return; // handled by its own script

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Re-check every strict field, in case a value was set programmatically
      // (autofill, browser restore) rather than typed.
      var strictOk = true;
      form.querySelectorAll('[data-validate="text"]').forEach(function (inp) {
        var bad = /[0-9]/.test(inp.value);
        inp.setCustomValidity(bad ? "Letters only — no numbers here." : "");
        if (bad) strictOk = false;
      });
      form.querySelectorAll('[data-validate="phone"], [data-validate="number"]').forEach(function (inp) {
        var bad = /[A-Za-z]/.test(inp.value);
        inp.setCustomValidity(bad ? "Numbers only — no letters here." : "");
        if (bad) strictOk = false;
      });

      if (!strictOk || !form.checkValidity()) {
        form.reportValidity();
        return;
      }

      window.location.href = REDIRECT_TARGET;
    });
  });
})();
