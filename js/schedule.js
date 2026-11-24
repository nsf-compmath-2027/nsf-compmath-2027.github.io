// Schedule page: day tabs, theme filter, and live search.
(function () {
  var root = document.getElementById('sched-root');
  if (!root) return;

  var search = document.getElementById('sched-search');
  var status = document.getElementById('sched-status');
  var empty = document.getElementById('sched-empty');
  var themeBtns = root.querySelectorAll('.theme-btn');
  var tabs = root.querySelectorAll('.sched-tab');
  var days = root.querySelectorAll('.sched-day');
  var activeTheme = 'all';

  function showDay(id) {
    days.forEach(function (d) { d.classList.toggle('is-active', d.id === id); });
    tabs.forEach(function (t) {
      var on = t.dataset.day === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
    });
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { showDay(t.dataset.day); });
  });

  // "Next day" buttons at the bottom of each day: switch, then scroll to the tabs.
  root.querySelectorAll('.sched-next-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      showDay(b.dataset.day);
      var tabBar = root.querySelector('.sched-tabs');
      if (tabBar) tabBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  themeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      activeTheme = b.dataset.theme;
      themeBtns.forEach(function (x) {
        var on = x === b;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-pressed', on);
      });
      apply();
    });
  });

  search.addEventListener('input', apply);

  // ---- Collapsing sessions ----
  var sessions = root.querySelectorAll('.sched-session');
  var collapseAll = document.getElementById('sched-collapse-all');

  function setCollapsed(s, collapsed) {
    s.classList.toggle('is-collapsed', collapsed);
    var btn = s.querySelector('.session-toggle');
    var title = s.querySelector('h3').textContent.trim();
    btn.setAttribute('aria-expanded', !collapsed);
    btn.setAttribute('aria-label', (collapsed ? 'Show' : 'Hide') + ' talks in ' + title);
  }

  function syncCollapseAll() {
    var allCollapsed = [].every.call(sessions, function (s) { return s.classList.contains('is-collapsed'); });
    collapseAll.textContent = allCollapsed ? 'Expand all' : 'Collapse all';
    collapseAll.setAttribute('aria-pressed', allCollapsed);
  }

  sessions.forEach(function (s) {
    s.querySelector('.session-toggle').addEventListener('click', function () {
      setCollapsed(s, !s.classList.contains('is-collapsed'));
      syncCollapseAll();
    });
  });

  collapseAll.addEventListener('click', function () {
    var collapse = collapseAll.getAttribute('aria-pressed') !== 'true';
    sessions.forEach(function (s) { setCollapsed(s, collapse); });
    syncCollapseAll();
  });

  function apply() {
    var terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    var filtering = terms.length > 0 || activeTheme !== 'all';
    var shown = 0, total = 0, firstDayWithMatch = null;

    root.classList.toggle('is-filtering', filtering);
    root.classList.toggle('is-searching', terms.length > 0);

    days.forEach(function (day) {
      var dayMatches = 0;
      day.querySelectorAll('.sched-parallel').forEach(function (slot) {
        var slotMatches = 0;
        slot.querySelectorAll('.sched-session').forEach(function (s) {
          total++;
          var themeOk = activeTheme === 'all' || s.dataset.theme === activeTheme;
          var textOk = terms.every(function (w) { return s.dataset.search.indexOf(w) !== -1; });
          var ok = themeOk && textOk;
          s.hidden = !ok;
          // Highlight the individual talks that match the search.
          s.querySelectorAll('.sched-talks li').forEach(function (li) {
            var hit = terms.length > 0 && terms.every(function (w) { return li.dataset.search.indexOf(w) !== -1; });
            li.classList.toggle('is-match', ok && hit);
          });
          if (ok) { slotMatches++; shown++; }
        });
        slot.hidden = filtering && slotMatches === 0;
        dayMatches += slotMatches;
      });
      if (dayMatches > 0 && firstDayWithMatch === null) firstDayWithMatch = day.id;
    });

    // If the open day has no matches, jump to the first day that does.
    if (filtering && firstDayWithMatch) {
      var open = root.querySelector('.sched-day.is-active');
      if (open && !open.querySelector('.sched-session:not([hidden])')) showDay(firstDayWithMatch);
    }

    empty.hidden = !(filtering && shown === 0);
    status.textContent = filtering ? shown + ' of ' + total + ' sessions shown' : '';
  }

  // Deep links (#session-1a) open the right day.
  if (location.hash) {
    var target = document.querySelector(location.hash);
    var day = target && target.closest('.sched-day');
    if (day) showDay(day.id);
  }
})();
