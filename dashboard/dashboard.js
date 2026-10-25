(function () {
  "use strict";

  var STORAGE_KEY = "ping.dashboard.demo.v1";
  var ACCESS_KEY = "ping.dashboard.access";
  var defaultState = {
    apps: [
      { id: "calendar", name: "Google Calendar", description: "See what is next and turn a text into a reminder.", scope: "SCHEDULE + REMINDERS", logo: "31", logoClass: "app-logo--calendar", connected: true },
      { id: "gmail", name: "Gmail", description: "Find the thread, pull the detail, keep the reply moving.", scope: "SEARCH + DRAFTS", logo: "M", logoClass: "app-logo--gmail", connected: true },
      { id: "notion", name: "Notion", description: "Give Ping a home for the projects and notes you return to.", scope: "PAGES + PROJECTS", logo: "N", logoClass: "app-logo--notion", connected: true },
      { id: "todoist", name: "Todoist", description: "Let the little things leave your head and land on a list.", scope: "TASKS + DUE DATES", logo: "✓", logoClass: "app-logo--todoist", connected: false }
    ],
    memories: [
      { id: "m1", text: "Maya Chen is your accountant", category: "People", time: "Saved 2 days ago" },
      { id: "m2", text: "The Northstar project ships in November", category: "Projects", time: "Saved 4 days ago" },
      { id: "m3", text: "Prefer concise replies before 9 AM", category: "Preferences", time: "Saved 1 week ago" },
      { id: "m4", text: "Dentist appointment is at 4 PM today", category: "Life", time: "Saved today" },
      { id: "m5", text: "Coffee order: oat milk, no sugar", category: "Life", time: "Saved 1 week ago" },
      { id: "m6", text: "Review the brief before the Friday check-in", category: "Projects", time: "Saved yesterday" }
    ],
    tasks: [
      { id: "t1", text: "Call the dentist at 4 PM", due: "Today", done: false },
      { id: "t2", text: "Review Northstar project brief", due: "Today", done: false },
      { id: "t3", text: "Send the updated proposal to Maya", due: "Tomorrow", done: false },
      { id: "t4", text: "Book a room for the November offsite", due: "This week", done: false },
      { id: "t5", text: "Add milk to the shopping list", due: "Today", done: false },
      { id: "t6", text: "Reply to the design team", due: "Tomorrow", done: false },
      { id: "t7", text: "Ask Sam for the final numbers", due: "This week", done: false },
      { id: "t8", text: "Set up the first Ping thread", due: "Yesterday", done: true },
      { id: "t9", text: "Connect the calendar", due: "Yesterday", done: true },
      { id: "t10", text: "Choose a reply style", due: "Last week", done: true }
    ],
    preferences: { concise: true, memory: true, reminders: false, history: true, quietStart: "9:00 PM", quietEnd: "7:00 AM" }
  };

  var state = loadState();
  var activeView = "overview";
  var activeMemoryFilter = "All";
  var toastTimer;
  var accessGate = document.getElementById("access-gate");
  var dashboard = document.getElementById("dashboard-app");

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (raw) {
        var merged = clone(defaultState);
        if (Array.isArray(raw.apps)) merged.apps = raw.apps;
        if (Array.isArray(raw.memories)) merged.memories = raw.memories;
        if (Array.isArray(raw.tasks)) merged.tasks = raw.tasks;
        if (raw.preferences) merged.preferences = Object.assign(merged.preferences, raw.preferences);
        return merged;
      }
    } catch (error) { /* localStorage is optional for this demo */ }
    return clone(defaultState);
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* ignore */ }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }

  function categoryIcon(category) {
    return { People: "●", Projects: "↗", Preferences: "◌", Life: "✦" }[category] || "✦";
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    var text = document.getElementById("toast-message");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("is-on"); }, 2600);
  }

  function setView(viewName) {
    var target = document.querySelector('[data-panel="' + viewName + '"]');
    if (!target) return;
    activeView = viewName;
    document.querySelectorAll(".view").forEach(function (view) { view.classList.toggle("is-visible", view === target); });
    document.querySelectorAll(".nav-item[data-view]").forEach(function (item) { item.classList.toggle("is-active", item.getAttribute("data-view") === viewName); });
    var label = document.getElementById("current-view-label");
    if (label) label.textContent = viewName === "apps" ? "Connected apps" : viewName === "preferences" ? "Preferences" : viewName.charAt(0).toUpperCase() + viewName.slice(1);
    window.scrollTo(0, 0);
    renderCurrentView();
  }

  function renderCurrentView() {
    renderOverview();
    renderApps();
    renderMemories();
    renderTasks();
    renderPreferences();
  }

  function renderCounts() {
    var connectedApps = state.apps.filter(function (app) { return app.connected; }).length;
    var openTasks = state.tasks.filter(function (task) { return !task.done; }).length;
    var memoryCount = 18 + state.memories.length;
    ["metric-apps", "nav-app-count"].forEach(function (id) { var element = document.getElementById(id); if (element) element.textContent = String(connectedApps); });
    ["metric-memories", "nav-memory-count", "memory-total", "memory-filter-all"].forEach(function (id) { var element = document.getElementById(id); if (element) element.textContent = String(memoryCount); });
    ["metric-tasks", "nav-task-count", "task-open-count", "open-column-count"].forEach(function (id) { var element = document.getElementById(id); if (element) element.textContent = String(openTasks); });
    var doneCount = state.tasks.filter(function (task) { return task.done; }).length;
    ["task-done-count", "done-column-count"].forEach(function (id) { var element = document.getElementById(id); if (element) element.textContent = String(doneCount); });
  }

  function renderOverview() {
    var memoryList = document.getElementById("overview-memory-list");
    if (memoryList) {
      memoryList.innerHTML = state.memories.slice(0, 3).map(function (memory) {
        return '<div class="memory-row"><span class="memory-row__icon" data-category="' + escapeHTML(memory.category) + '">' + categoryIcon(memory.category) + '</span><span class="memory-row__copy"><strong>' + escapeHTML(memory.text) + '</strong><small>' + escapeHTML(memory.category) + " · " + escapeHTML(memory.time) + '</small></span><span class="memory-row__arrow">→</span></div>';
      }).join("");
    }
    var taskList = document.getElementById("overview-task-list");
    if (taskList) {
      var openTasks = state.tasks.filter(function (task) { return !task.done; }).slice(0, 3);
      taskList.innerHTML = openTasks.length ? openTasks.map(taskRowHTML).join("") : '<div class="task-empty">Nothing open — a rare and beautiful thing.</div>';
    }
    renderCounts();
  }

  function taskRowHTML(task) {
    return '<div class="task-row' + (task.done ? " is-done" : "") + '"><button class="task-check' + (task.done ? " is-done" : "") + '" type="button" data-task-toggle="' + escapeHTML(task.id) + '" aria-label="' + (task.done ? "Mark task open" : "Complete task") + '">' + (task.done ? "✓" : "") + '</button><span class="task-row__copy"><strong>' + escapeHTML(task.text) + '</strong><small>Ping task</small></span><span class="task-row__due">' + escapeHTML(task.due) + '</span></div>';
  }

  function renderApps() {
    var grid = document.getElementById("apps-grid");
    if (!grid) return;
    grid.innerHTML = state.apps.map(function (app) {
      return '<article class="app-card"><div class="app-card__top"><span class="app-logo ' + escapeHTML(app.logoClass) + '">' + escapeHTML(app.logo) + '</span><span class="app-status' + (app.connected ? " is-connected" : "") + '"><i></i>' + (app.connected ? "Connected" : "Not connected") + '</span></div><h2>' + escapeHTML(app.name) + '</h2><p>' + escapeHTML(app.description) + '</p><div class="app-card__foot"><span class="app-card__scope">' + escapeHTML(app.scope) + '</span><button class="app-connect' + (app.connected ? " is-connected" : "") + '" type="button" data-app-toggle="' + escapeHTML(app.id) + '">' + (app.connected ? "Connected ✓" : "Connect app") + '</button></div></article>';
    }).join("");
  }

  function renderMemories() {
    var list = document.getElementById("memory-list");
    if (!list) return;
    var memories = activeMemoryFilter === "All" ? state.memories : state.memories.filter(function (memory) { return memory.category === activeMemoryFilter; });
    list.innerHTML = memories.length ? memories.map(function (memory) {
      return '<div class="memory-row"><span class="memory-row__icon" data-category="' + escapeHTML(memory.category) + '">' + categoryIcon(memory.category) + '</span><span class="memory-row__copy"><strong>' + escapeHTML(memory.text) + '</strong><small>' + escapeHTML(memory.category) + " · " + escapeHTML(memory.time) + '</small></span><span class="memory-row__actions"><button class="memory-forget" type="button" data-memory-remove="' + escapeHTML(memory.id) + '" aria-label="Forget this memory">Forget</button><span class="memory-row__arrow">→</span></span></div>';
    }).join("") : '<div class="memory-empty">No memories in this category yet.<br />Add one above to give Ping more context.</div>';
    document.querySelectorAll(".filter-tab").forEach(function (tab) { tab.classList.toggle("is-active", tab.getAttribute("data-memory-filter") === activeMemoryFilter); });
    renderCounts();
  }

  function renderTasks() {
    var openList = document.getElementById("open-task-list");
    var doneList = document.getElementById("done-task-list");
    if (!openList || !doneList) return;
    var openTasks = state.tasks.filter(function (task) { return !task.done; });
    var doneTasks = state.tasks.filter(function (task) { return task.done; });
    openList.innerHTML = openTasks.length ? openTasks.map(taskRowHTML).join("") : '<div class="task-empty">Clear for now. Nice work.</div>';
    doneList.innerHTML = doneTasks.length ? doneTasks.map(taskRowHTML).join("") : '<div class="task-empty">Completed tasks will land here.</div>';
    renderCounts();
  }

  function renderPreferences() {
    document.querySelectorAll(".toggle[data-pref]").forEach(function (toggle) {
      var isOn = !!state.preferences[toggle.getAttribute("data-pref")];
      toggle.classList.toggle("is-on", isOn);
      toggle.setAttribute("aria-pressed", String(isOn));
    });
    document.querySelectorAll("select[data-pref-select]").forEach(function (select) { select.value = state.preferences[select.getAttribute("data-pref-select")] || select.value; });
  }

  function addMemory(inputId, categoryId) {
    var input = document.getElementById(inputId);
    var category = document.getElementById(categoryId);
    if (!input || !input.value.trim()) return false;
    state.memories.unshift({ id: "m" + Date.now(), text: input.value.trim(), category: category ? category.value : "Preferences", time: "Saved just now" });
    input.value = "";
    persist();
    renderCurrentView();
    showToast("Saved to Ping's memory");
    return true;
  }

  function toggleTask(id) {
    var task = state.tasks.find(function (item) { return item.id === id; });
    if (!task) return;
    task.done = !task.done;
    persist();
    renderCurrentView();
    showToast(task.done ? "Task completed" : "Task moved back to open");
  }

  function connectApp(id) {
    var app = state.apps.find(function (item) { return item.id === id; });
    if (!app) return;
    app.connected = !app.connected;
    persist();
    renderCurrentView();
    showToast(app.connected ? app.name + " connected for this demo" : app.name + " disconnected");
  }

  function isUnlocked() {
    try { return sessionStorage.getItem(ACCESS_KEY) === "true"; } catch (error) { return false; }
  }

  function openDashboard() {
    accessGate.hidden = true;
    dashboard.hidden = false;
    renderCurrentView();
  }

  function lockDashboard() {
    try { sessionStorage.removeItem(ACCESS_KEY); } catch (error) { /* ignore */ }
    dashboard.hidden = true;
    accessGate.hidden = false;
    var input = document.getElementById("access-code");
    if (input) { input.value = ""; window.setTimeout(function () { input.focus(); }, 50); }
    var status = document.getElementById("code-status");
    if (status) { status.textContent = ""; status.className = "form-status"; }
  }

  document.getElementById("code-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var input = document.getElementById("access-code");
    var status = document.getElementById("code-status");
    if (input.value === "0000") {
      try { sessionStorage.setItem(ACCESS_KEY, "true"); } catch (error) { /* continue for storage-restricted previews */ }
      status.textContent = "Access granted. Opening your workspace…";
      status.className = "form-status is-good";
      window.setTimeout(openDashboard, 180);
    } else {
      status.textContent = "That code does not match this demo. Try 0000.";
      status.className = "form-status";
      input.select();
    }
  });

  document.addEventListener("click", function (event) {
    var viewButton = event.target.closest("[data-view], [data-view-target]");
    if (viewButton) {
      var viewName = viewButton.getAttribute("data-view") || viewButton.getAttribute("data-view-target");
      if (viewName) setView(viewName);
    }
    var taskButton = event.target.closest("[data-task-toggle]");
    if (taskButton) toggleTask(taskButton.getAttribute("data-task-toggle"));
    var appButton = event.target.closest("[data-app-toggle]");
    if (appButton) connectApp(appButton.getAttribute("data-app-toggle"));
    var memoryButton = event.target.closest("[data-memory-remove]");
    if (memoryButton) {
      state.memories = state.memories.filter(function (memory) { return memory.id !== memoryButton.getAttribute("data-memory-remove"); });
      persist(); renderCurrentView(); showToast("Memory forgotten");
    }
    var filterButton = event.target.closest("[data-memory-filter]");
    if (filterButton) { activeMemoryFilter = filterButton.getAttribute("data-memory-filter"); renderMemories(); }
    var action = event.target.closest("[data-action]");
    if (action) {
      var actionName = action.getAttribute("data-action");
      if (actionName === "lock") lockDashboard();
      if (actionName === "notifications") showToast("No new notifications in this demo");
      if (actionName === "profile") showToast("Profile menu is demo-only for now");
      if (actionName === "connect-first") { setView("apps"); window.setTimeout(function () { var target = document.querySelector(".app-connect:not(.is-connected)"); if (target) target.focus(); }, 60); }
      if (actionName === "dismiss-notice") { var notice = action.closest(".notice-banner"); if (notice) notice.remove(); }
    }
  });

  document.getElementById("overview-memory-form").addEventListener("submit", function (event) { event.preventDefault(); addMemory("overview-memory-input", "overview-memory-category"); });
  document.getElementById("memory-form").addEventListener("submit", function (event) { event.preventDefault(); addMemory("memory-input", "memory-category"); });
  document.getElementById("task-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var input = document.getElementById("task-input");
    var due = document.getElementById("task-due");
    if (!input.value.trim()) return;
    state.tasks.unshift({ id: "t" + Date.now(), text: input.value.trim(), due: due.value, done: false });
    input.value = "";
    persist(); renderCurrentView(); showToast("Task added to your list");
  });
  document.querySelectorAll(".toggle[data-pref]").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var key = toggle.getAttribute("data-pref");
      state.preferences[key] = !state.preferences[key];
      persist(); renderPreferences(); showToast(state.preferences[key] ? "Preference turned on" : "Preference turned off");
    });
  });
  document.querySelectorAll("select[data-pref-select]").forEach(function (select) {
    select.addEventListener("change", function () { state.preferences[select.getAttribute("data-pref-select")] = select.value; persist(); showToast("Quiet hours updated"); });
  });
  document.getElementById("global-search").addEventListener("input", function (event) {
    var query = event.target.value.trim().toLowerCase();
    if (query.length > 1) {
      var match = state.memories.some(function (memory) { return memory.text.toLowerCase().indexOf(query) !== -1; }) || state.tasks.some(function (task) { return task.text.toLowerCase().indexOf(query) !== -1; });
      showToast(match ? "Found it in your context" : "No match in this demo yet");
    }
  });
  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); document.getElementById("global-search").focus(); }
    if (event.key === "Escape" && !dashboard.hidden) document.getElementById("global-search").blur();
  });

  if (isUnlocked()) openDashboard();
  else { accessGate.hidden = false; dashboard.hidden = true; }
})();
