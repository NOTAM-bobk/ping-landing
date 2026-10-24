(function () {
"use strict";

/* ---------------- Would you use this? ---------------- */
var STORE = "ping.want.v3";
var BASE_YES = 1342;

var el = {
  yes: document.getElementById("want-yes"),
  count: document.getElementById("want-count"),
  note: document.getElementById("want-note")
};

function readState() {
  try {
    var raw = JSON.parse(localStorage.getItem(STORE));
    if (raw && typeof raw.yes === "number") {
      return { yes: raw.yes, vote: raw.vote === true };
    }
  } catch (e) { /* storage blocked or malformed */ }
  return { yes: BASE_YES, vote: false };
}

function writeState() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

var state = readState();

function render() {
  el.count.textContent = state.yes.toLocaleString();

  /* one tap per visitor: the button counts once, then locks */
  el.yes.disabled = state.vote;
  el.yes.setAttribute("aria-pressed", String(state.vote));

  if (state.vote) {
    el.yes.textContent = "You're counted";
    el.note.textContent = "Answer counted \u2014 thank you.";
  } else {
    el.yes.textContent = "Yes, I'd use it";
    el.note.textContent = "";
  }
}

function vote() {
  if (state.vote) return;
  state.vote = true;
  state.yes += 1;
  writeState();
  render();
}

el.yes.addEventListener("click", vote);
render();

/* ---------------- Email signup ---------------- */
var form = document.getElementById("signup-form");
var email = document.getElementById("email");
var msg = document.getElementById("email-msg");
var btn = document.getElementById("signup-btn");
var done = document.getElementById("signup-done");
var echo = document.getElementById("signup-echo");
var again = document.getElementById("signup-again");
var reply = document.getElementById("signup-reply");
var replyText = document.getElementById("signup-reply-text");
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function setError(text) {
  msg.textContent = text;
  msg.className = "form-msg is-error";
  email.setAttribute("aria-invalid", "true");
  email.focus();
}

function clearError() {
  msg.textContent = "";
  msg.className = "form-msg";
  email.removeAttribute("aria-invalid");
}

email.addEventListener("input", clearError);

form.addEventListener("submit", function (event) {
  event.preventDefault();
  var value = email.value.trim();

  if (!value) { setError("Enter an email so we know where to send your number."); return; }
  if (!EMAIL_RE.test(value)) { setError("That address is missing something. Check it and try again."); return; }

  clearError();
  btn.disabled = true;
  btn.textContent = "Saving\u2026";

  /* Demo only: nothing leaves this browser. */
  setTimeout(function () {
    try {
      var list = JSON.parse(localStorage.getItem("ping.signups.v2") || "[]");
      if (list.indexOf(value.toLowerCase()) === -1) list.push(value.toLowerCase());
      localStorage.setItem("ping.signups.v2", JSON.stringify(list));
    } catch (e) { /* ignore */ }

    form.hidden = true;
    echo.textContent = value;
    done.classList.add("is-on");
    replyText.textContent = value;
    reply.hidden = false;
    reply.classList.add("is-just-sent");
    msg.textContent = "You're on the list.";
    msg.className = "form-msg is-ok";
    btn.disabled = false;
    btn.textContent = "Get early access";
    form.reset();
    again.focus();
  }, 450);
});

again.addEventListener("click", function () {
  done.classList.remove("is-on");
  reply.hidden = true;
  reply.classList.remove("is-just-sent");
  form.hidden = false;
  clearError();
  email.focus();
});

/* ---------------- Copy the demo number ---------------- */
var copyBtn = document.getElementById("copy-number");
var copyStatus = document.getElementById("copy-status");
var numberEl = document.getElementById("demo-number");

copyBtn.addEventListener("click", function () {
  var value = numberEl.textContent.trim();
  function ok() {
    copyStatus.textContent = "Copied " + value + " to your clipboard.";
    copyBtn.textContent = "Copied";
    setTimeout(function () { copyBtn.textContent = "Copy number"; }, 2200);
  }
  function fail() {
    copyStatus.textContent = "Select the number above and copy it manually.";
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value).then(ok, fail);
  } else {
    fail();
  }
});

/* ---------------- Motion: scroll-played conversation ---------------- */
var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
var canAnimate = !reduceMotion && "IntersectionObserver" in window;

if (canAnimate) document.documentElement.classList.add("js-anim");

var screen = document.querySelector(".demo__log");
var steps = screen ? Array.prototype.slice.call(screen.querySelectorAll("[data-step]")) : [];
var composer = document.getElementById("composer");
var composerText = document.getElementById("composer-text");
var dock = document.getElementById("composer-dock");
var demo = document.getElementById("demo");
var threadDone = false;

function isOutgoing(node) {
  return node.classList.contains("msg--out") || node.classList.contains("line--out");
}

/* The composer leaves with the last message. */
function finishThread() {
  threadDone = true;
  if (demo) demo.classList.add("is-done");
  if (!dock) return;
  dock.classList.remove("is-live");
  dock.classList.add("is-done");
}

function setComposer(text, typing) {
  if (!composer) return;
  composerText.textContent = text;
  composer.classList.toggle("is-on", !!text);
  composer.classList.toggle("is-empty", !text);
  composer.classList.toggle("is-typing", !!typing);
}

/* Each outgoing message is typed into the composer, then lands as a sent bubble. */
function playThread() {
  if (!screen || !steps.length) return;
  screen.classList.add("is-armed");
  var i = 0;

  /* the greeting is already on screen once the panel arrives */
  if (steps[0] && !isOutgoing(steps[0])) {
    steps[0].classList.add("is-in");
    i = 1;
  }

  function next() {
    if (i >= steps.length) { setComposer("", false); finishThread(); return; }
    var step = steps[i++];

    if (!isOutgoing(step)) {
      setTimeout(function () {
        step.classList.add("is-in");
        setTimeout(next, 560);
      }, 360);
      return;
    }

    var line = step.querySelector(".msg__line");
    var receipt = step.querySelector(".msg__meta");
    var text = line ? line.textContent.trim() : "";
    var chars = 0;

    setComposer("", true);
    setTimeout(function type() {
      chars += 1;
      setComposer(text.slice(0, chars), true);
      if (chars < text.length) {
        setTimeout(type, 14 + (chars % 5) * 8);
        return;
      }
      setTimeout(function () {
        setComposer("", false);
        step.classList.add("is-in", "is-just-sent");
        /* the bar flashes as the message leaves it */
        if (composer) {
          composer.classList.add("is-firing");
          setTimeout(function () { composer.classList.remove("is-firing"); }, 500);
        }
        if (receipt) {
          receipt.classList.add("is-sending");
          setTimeout(function () {
            receipt.classList.remove("is-sending");
            receipt.classList.add("is-delivered");
          }, 540);
        }
        setTimeout(next, 620);
      }, 360);
    }, 420);
  }

  next();
}

if (canAnimate && screen && steps.length) {
  var threadSeen = false;
  var threadIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || threadSeen) return;
      threadSeen = true;
      threadIO.disconnect();
      playThread();
    });
  }, { threshold: 0, rootMargin: "-12% 0px -18% 0px" });
  threadIO.observe(screen);
}

/* The input bar is fixed at the bottom of the viewport only while the demo
   section is in front of you, so it never floats over the rest of the page. */
if (canAnimate && dock && demo) {
  var dockIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (threadDone) return;
      dock.classList.toggle("is-live", entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: "-16% 0px -20% 0px" });
  dockIO.observe(demo);
}

/* Spec sheet and FAQ reveal in order as they enter the viewport. */
function staggerRows(selector) {
  var rows = Array.prototype.slice.call(document.querySelectorAll(selector));
  rows.forEach(function (row, index) { row.style.setProperty("--i", String(index % 6)); });
  if (!canAnimate) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: "0px 0px -40px 0px" });
  rows.forEach(function (row) { io.observe(row); });
}
staggerRows(".specs__row");
staggerRows(".plan");
staggerRows(".faq__item");

/* Sticky header gains a shadow once the thread scrolls under it. */
var topbar = document.querySelector(".top");
function onScroll() {
  if (topbar) topbar.classList.toggle("is-scrolled", window.scrollY > 8);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

var year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());
})();
