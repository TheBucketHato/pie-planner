// ===================================================
//  PIE PLANNER  —  app.js
// ===================================================

const HOUR_HEIGHT = 64; // px per hour in week/day grid
const PX_PER_MIN  = HOUR_HEIGHT / 60;
const TOTAL_H     = HOUR_HEIGHT * 24; // full 24-hour grid height

// ===================================================
//  PERSISTENCE
// ===================================================

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// THEME
function loadTheme() { return localStorage.getItem('pp-theme') || 'light'; }
function saveTheme(t) { localStorage.setItem('pp-theme', t); }
function applyTheme(t) {
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  applyCustomColors(loadCustomColors());
}

// CUSTOM COLORS
const COLOR_VARS = [
  { label: 'Background',       prop: '--bg' },
  { label: 'Sidebar',          prop: '--panel-bg' },
  { label: 'Today & accent',   prop: '--accent' },
  { label: 'Other-month days', prop: '--other-month-bg' },
  { label: 'Text',             prop: '--text' },
];

const ALL_CUSTOM_PROPS = [
  '--bg', '--panel-bg', '--modal-bg', '--input-bg',
  '--accent', '--other-month-bg',
  '--text', '--text-dim', '--muted',
  '--border', '--card-hover', '--muted-hover', '--faint',
];

const PRESETS = [
  {
    name: 'Clean',
    colors: {
      '--bg':             '#ffffff',
      '--panel-bg':       '#f8f9fa',
      '--modal-bg':       '#ffffff',
      '--input-bg':       '#f1f3f4',
      '--accent':         '#1a73e8',
      '--other-month-bg': '#f1f3f4',
      '--text':           '#202124',
      '--text-dim':       '#5f6368',
      '--muted':          '#80868b',
      '--border':         '#dadce0',
      '--card-hover':     '#f1f3f4',
      '--muted-hover':    '#e8eaed',
      '--faint':          '#f1f3f4',
    },
    categoryColors: {
      'Work':     '#1a73e8',
      'Social':   '#33b679',
      'Meals':    '#f6bf26',
      'Personal': '#a4bdfc',
      'Health':   '#ff887c',
    },
  },
  {
    name: 'Bakery',
    colors: {
      '--bg':             '#fdf6ee',
      '--panel-bg':       '#f5e8d6',
      '--modal-bg':       '#fdf6ee',
      '--input-bg':       '#f5e8d6',
      '--accent':         '#8b5e3c',
      '--other-month-bg': '#ece0ce',
      '--text':           '#3b2316',
      '--text-dim':       '#6b4428',
      '--muted':          '#a07050',
      '--border':         '#d9c4a8',
      '--card-hover':     '#f0e4d4',
      '--muted-hover':    '#ece0ce',
      '--faint':          '#ece0ce',
    },
    categoryColors: {
      'Work':     '#9e6e4a',
      'Social':   '#b88c64',
      'Meals':    '#c87858',
      'Personal': '#d8b48a',
      'Health':   '#b06458',
    },
  },
  {
    name: 'Blueberry',
    colors: {
      '--bg':             '#eef2ff',
      '--panel-bg':       '#e0e8ff',
      '--modal-bg':       '#eef2ff',
      '--input-bg':       '#e0e8ff',
      '--accent':         '#4f72d4',
      '--other-month-bg': '#d8e2ff',
      '--text':           '#1a2560',
      '--text-dim':       '#3d56a8',
      '--muted':          '#6880c0',
      '--border':         '#b8c8f0',
      '--card-hover':     '#d8e2ff',
      '--muted-hover':    '#ccd8f8',
      '--faint':          '#ccd8f8',
    },
    categoryColors: {
      'Work':     '#6080d8',
      'Social':   '#7ab0e8',
      'Meals':    '#a0b8f0',
      'Personal': '#8898e0',
      'Health':   '#9878d0',
    },
  },
  {
    name: 'Key Lime',
    colors: {
      '--bg':             '#f0faf0',
      '--panel-bg':       '#e0f4e4',
      '--modal-bg':       '#f0faf0',
      '--input-bg':       '#e0f4e4',
      '--accent':         '#3a9e58',
      '--other-month-bg': '#d4eeda',
      '--text':           '#0f3020',
      '--text-dim':       '#2e6e42',
      '--muted':          '#5a9868',
      '--border':         '#a8d8b0',
      '--card-hover':     '#d4eeda',
      '--muted-hover':    '#c8e8d0',
      '--faint':          '#c8e8d0',
    },
    categoryColors: {
      'Work':     '#4aaa68',
      'Social':   '#78c870',
      'Meals':    '#a0cc58',
      'Personal': '#60b898',
      'Health':   '#88c840',
    },
  },
  {
    name: 'Sunflower',
    colors: {
      '--bg':             '#fffce8',
      '--panel-bg':       '#fff8d0',
      '--modal-bg':       '#fffce8',
      '--input-bg':       '#fff8d0',
      '--accent':         '#d48800',
      '--other-month-bg': '#fef3b8',
      '--text':           '#3d2e00',
      '--text-dim':       '#6b5000',
      '--muted':          '#9a7800',
      '--border':         '#e0c84e',
      '--card-hover':     '#fff8c0',
      '--muted-hover':    '#fff3a8',
      '--faint':          '#fff3a8',
    },
    categoryColors: {
      'Work':     '#d08828',
      'Social':   '#c0b838',
      'Meals':    '#e8a020',
      'Personal': '#d0a850',
      'Health':   '#c07028',
    },
  },
  {
    name: 'Apple',
    colors: {
      '--bg':             '#fff0f4',
      '--panel-bg':       '#ffe4ec',
      '--modal-bg':       '#fff0f4',
      '--input-bg':       '#ffe4ec',
      '--accent':         '#d44070',
      '--other-month-bg': '#ffd8e4',
      '--text':           '#5a0e28',
      '--text-dim':       '#a03058',
      '--muted':          '#c06080',
      '--border':         '#f0b0c8',
      '--card-hover':     '#ffd8e4',
      '--muted-hover':    '#ffccd8',
      '--faint':          '#ffccd8',
    },
    categoryColors: {
      'Work':     '#d85888',
      'Social':   '#e87898',
      'Meals':    '#f0a0b8',
      'Personal': '#e068a0',
      'Health':   '#cc78b0',
    },
  },
];

function loadCustomColors() { return load('pp-custom-colors', {}); }
function saveCustomColors(c) { save('pp-custom-colors', c); }

function applyCustomColors(colors) {
  for (const prop of ALL_CUSTOM_PROPS) {
    if (colors[prop]) document.documentElement.style.setProperty(prop, colors[prop]);
    else document.documentElement.style.removeProperty(prop);
  }
}

function cssVarValue(prop, colors) {
  if (colors[prop]) return colors[prop];
  const val = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  return /^#[0-9a-f]{3,8}$/i.test(val) ? val : '#ffffff';
}

function presetSwatchGradient(preset) {
  const bg   = preset.colors['--bg'];
  const cats = Object.values(preset.categoryColors);
  const step = 50 / cats.length;
  const stops = [`${bg} 0%`, `${bg} 45%`];
  cats.forEach((c, i) => {
    stops.push(`${c} ${(45 + i * step).toFixed(1)}%`);
    stops.push(`${c} ${(45 + (i + 1) * step).toFixed(1)}%`);
  });
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

function buildCustomizerHTML(colors) {
  const presetBtns = PRESETS.map(p =>
    `<button class="color-preset-btn" data-preset="${p.name}" title="${p.name}">
      <span class="color-preset-swatch" style="background:${presetSwatchGradient(p)}"></span>
      ${p.name}
    </button>`
  ).join('');

  const pickerRows = COLOR_VARS.map(({ label, prop }) =>
    `<div class="color-customizer-row">
      <span>${label}</span>
      <input type="color" data-prop="${prop}" value="${cssVarValue(prop, colors)}">
    </div>`
  ).join('');

  return `
    <div class="color-customizer-title">Presets</div>
    <div class="color-preset-row">${presetBtns}</div>
    <div class="color-customizer-divider"></div>
    <div class="color-customizer-title">Custom</div>
    ${pickerRows}
    <button class="color-customizer-reset">Reset to defaults</button>`;
}

function applyPresetCategoryColors(preset) {
  if (!preset.categoryColors) return;
  let changed = false;
  categories.forEach(cat => {
    if (preset.categoryColors[cat.name]) {
      cat.color = preset.categoryColors[cat.name];
      changed = true;
    }
  });
  if (changed) saveCategories();
}

function wireCustomizerEvents(popup) {
  popup.querySelectorAll('.color-preset-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const preset = PRESETS.find(p => p.name === btn.dataset.preset);
      if (!preset) return;
      saveCustomColors(preset.colors);
      applyCustomColors(preset.colors);
      applyPresetCategoryColors(preset);
      popup.innerHTML = buildCustomizerHTML(preset.colors);
      wireCustomizerEvents(popup);
      render();
    });
  });

  popup.querySelectorAll('input[type="color"]').forEach(inp => {
    inp.addEventListener('input', () => {
      const colors = loadCustomColors();
      colors[inp.dataset.prop] = inp.value;
      saveCustomColors(colors);
      applyCustomColors(colors);
    });
  });

  popup.querySelector('.color-customizer-reset').addEventListener('click', e => {
    e.stopPropagation();
    saveCustomColors({});
    applyCustomColors({});
    popup.innerHTML = buildCustomizerHTML({});
    wireCustomizerEvents(popup);
  });
}

function showColorCustomizer(anchorEl) {
  const existing = document.getElementById('color-customizer-popup');
  if (existing) {
    existing.remove();
    document.removeEventListener('click', onOutsideCustomizerClick);
    return;
  }

  const colors = loadCustomColors();
  const popup = document.createElement('div');
  popup.className = 'color-customizer-popup';
  popup.id = 'color-customizer-popup';
  popup.innerHTML = buildCustomizerHTML(colors);

  const rect = anchorEl.getBoundingClientRect();
  popup.style.top   = (rect.bottom + 6) + 'px';
  popup.style.right = (window.innerWidth - rect.right) + 'px';
  document.body.appendChild(popup);

  wireCustomizerEvents(popup);
  setTimeout(() => document.addEventListener('click', onOutsideCustomizerClick), 0);
}

function onOutsideCustomizerClick(e) {
  const popup = document.getElementById('color-customizer-popup');
  if (popup && !popup.contains(e.target) && e.target.id !== 'color-customize-btn') {
    popup.remove();
    document.removeEventListener('click', onOutsideCustomizerClick);
  }
}

// ===================================================
//  STATE
// ===================================================

let events     = load('pp-events', []);
let categories = load('pp-categories', [
  { id: 'c1', name: 'Work',     color: '#1a73e8' },
  { id: 'c2', name: 'Social',   color: '#33b679' },
  { id: 'c3', name: 'Meals',    color: '#f6bf26' },
  { id: 'c4', name: 'Personal', color: '#a4bdfc' },
  { id: 'c5', name: 'Health',   color: '#ff887c' },
]);
let savedColors = load('pp-colors', [
  '#1a73e8','#33b679','#f6bf26','#a4bdfc','#ff887c',
  '#46d6db','#7986cb','#e67c73','#f09300','#0b8043',
  '#d50000','#8e24aa',
]);

let view                 = 'month';
let anchor               = new Date();
let analyticsSpan        = 'week';   // day | week | month | custom
let analyticsCustomStart = localStorage.getItem('pp-analytics-start') || '';
let analyticsCustomEnd   = localStorage.getItem('pp-analytics-end')   || '';
let editId               = null;
let pieCharts            = [];
let analyticsTab         = 'events'; // 'events' | 'tasks'

let tasks = load('pp-tasks', []).map(t => {
  if (!t.status) t.status = t.done ? 'done' : 'todo';
  return t;
});

function saveEvents()     { save('pp-events', events); }
function saveCategories() { save('pp-categories', categories); }
function saveTasks()      { save('pp-tasks', tasks); }
function saveSavedColors() { save('pp-colors', savedColors); }

// ===================================================
//  DATE UTILITIES
// ===================================================

function toDateStr(d) { return d.toLocaleDateString('sv'); } // "YYYY-MM-DD"

function fromDateStr(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toMins(t) {          // "HH:MM" → minutes
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function fmtTime(t) {         // "HH:MM" → "12:30 PM"
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h < 12 ? 'AM' : 'PM'}`;
}

function fmtHour(h) {         // 0 → "12 AM", 13 → "1 PM"
  if (h === 0)  return '12 AM';
  if (h < 12)   return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function minsToTime(m) {      // 570 → "09:30"
  return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
}

function weekStart(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

// ===================================================
//  RECURRENCE HELPERS
// ===================================================

function dateDiffDays(aStr, bStr) {
  return Math.round((fromDateStr(bStr) - fromDateStr(aStr)) / 86400000);
}

function isRecurrenceInstance(evt, dateStr) {
  if (dateStr < evt.date) return false;
  const rec = evt.recurrence;
  if (!rec || rec.type === 'none') return evt.date === dateStr;
  if (rec.endDate && dateStr > rec.endDate) return false;
  const interval = Math.max(1, rec.interval || 1);
  if (rec.type === 'daily') return dateDiffDays(evt.date, dateStr) % interval === 0;
  if (rec.type === 'weekly') return dateDiffDays(evt.date, dateStr) % (7 * interval) === 0;
  if (rec.type === 'monthly') {
    const base = fromDateStr(evt.date), target = fromDateStr(dateStr);
    if (target.getDate() !== base.getDate()) return false;
    const md = (target.getFullYear() - base.getFullYear()) * 12 + (target.getMonth() - base.getMonth());
    return md >= 0 && md % interval === 0;
  }
  if (rec.type === 'yearly') {
    const base = fromDateStr(evt.date), target = fromDateStr(dateStr);
    if (target.getMonth() !== base.getMonth() || target.getDate() !== base.getDate()) return false;
    const yd = target.getFullYear() - base.getFullYear();
    return yd >= 0 && yd % interval === 0;
  }
  return false;
}

function getEventsForDate(dateStr) {
  return events.flatMap(evt => {
    const rec = evt.recurrence;
    if (!rec || rec.type === 'none') return evt.date === dateStr ? [evt] : [];
    return isRecurrenceInstance(evt, dateStr) ? [{ ...evt, date: dateStr }] : [];
  });
}

function getEventsInRange(startStr, endStr) {
  const result = [];
  const cur = fromDateStr(startStr);
  const end = fromDateStr(endStr);
  while (cur <= end) {
    const dateStr = toDateStr(new Date(cur));
    for (const evt of events) {
      const rec = evt.recurrence;
      if (!rec || rec.type === 'none') {
        if (evt.date === dateStr) result.push(evt);
      } else if (isRecurrenceInstance(evt, dateStr)) {
        result.push({ ...evt, date: dateStr });
      }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function headerTitle() {
  const d = anchor;
  if (view === 'month') return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (view === 'day') return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  if (view === 'week') {
    const s = weekStart(d), e = addDays(s, 6);
    const sameMonth = s.getMonth() === e.getMonth();
    const label = sameMonth
      ? `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
      : `${SHORT_MONTHS[s.getMonth()]} ${s.getDate()} – ${SHORT_MONTHS[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
    return label;
  }
  if (view === 'tasks') return 'Tasks';
  if (view === 'analytics') {
    if (analyticsSpan === 'day')   return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    if (analyticsSpan === 'month') return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (analyticsSpan === 'custom') {
      if (!analyticsCustomStart || !analyticsCustomEnd) return 'Custom Range';
      const s = fromDateStr(analyticsCustomStart), e = fromDateStr(analyticsCustomEnd);
      if (s.getFullYear() === e.getFullYear()) {
        if (s.getMonth() === e.getMonth())
          return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
        return `${SHORT_MONTHS[s.getMonth()]} ${s.getDate()} – ${SHORT_MONTHS[e.getMonth()]} ${e.getDate()}, ${s.getFullYear()}`;
      }
      return `${SHORT_MONTHS[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} – ${SHORT_MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
    }
    const s = weekStart(d), e = addDays(s, 6);
    return `${SHORT_MONTHS[s.getMonth()]} ${s.getDate()} – ${SHORT_MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  }
  return '';
}

// ===================================================
//  NAVIGATION
// ===================================================

function navPrev() {
  if (view === 'tasks') return;
  if (view === 'analytics' && analyticsSpan === 'custom') return;
  const d = new Date(anchor);
  if (view === 'month')     d.setMonth(d.getMonth() - 1);
  else if (view === 'week') d.setDate(d.getDate() - 7);
  else if (view === 'day')  d.setDate(d.getDate() - 1);
  else if (analyticsSpan === 'month') d.setMonth(d.getMonth() - 1);
  else if (analyticsSpan === 'week')  d.setDate(d.getDate() - 7);
  else                                d.setDate(d.getDate() - 1);
  anchor = d;
  render();
}

function navNext() {
  if (view === 'tasks') return;
  if (view === 'analytics' && analyticsSpan === 'custom') return;
  const d = new Date(anchor);
  if (view === 'month')     d.setMonth(d.getMonth() + 1);
  else if (view === 'week') d.setDate(d.getDate() + 7);
  else if (view === 'day')  d.setDate(d.getDate() + 1);
  else if (analyticsSpan === 'month') d.setMonth(d.getMonth() + 1);
  else if (analyticsSpan === 'week')  d.setDate(d.getDate() + 7);
  else                                d.setDate(d.getDate() + 1);
  anchor = d;
  render();
}

function navToday() { anchor = new Date(); render(); }

// ===================================================
//  MAIN RENDER
// ===================================================

function render() {
  renderHeader();
  renderSidebar();
  renderBody();
}

function renderHeader() {
  document.getElementById('header-title').textContent = headerTitle();
  document.querySelectorAll('.view-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view === view)
  );
}

// ===================================================
//  SIDEBAR
// ===================================================

function renderSidebar() {
  renderMiniCal();
  renderTaskList();
  renderCatList();
}

function renderMiniCal() {
  const d     = anchor;
  const year  = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days  = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let html = `
    <div class="mini-cal-header">
      <button class="mini-nav" id="m-prev">&#8249;</button>
      <span>${SHORT_MONTHS[month]} ${year}</span>
      <button class="mini-nav" id="m-next">&#8250;</button>
    </div>
    <div class="mini-cal-grid">
      ${DAYS.map(n => `<div class="mini-day-header">${n[0]}</div>`).join('')}`;

  for (let i = 0; i < first; i++) html += '<div class="mini-day empty"></div>';

  for (let day = 1; day <= days; day++) {
    const date    = new Date(year, month, day);
    const classes = ['mini-day'];
    if (sameDay(date, today))  classes.push('today');
    if (sameDay(date, anchor)) classes.push('selected');
    html += `<div class="${classes.join(' ')}" data-date="${toDateStr(date)}">${day}</div>`;
  }

  html += '</div>';
  document.getElementById('mini-cal').innerHTML = html;

  document.querySelectorAll('.mini-day:not(.empty)').forEach(el => {
    el.addEventListener('click', () => {
      anchor = fromDateStr(el.dataset.date);
      if (view !== 'analytics') view = 'day';
      render();
    });
  });

  document.getElementById('m-prev').addEventListener('click', e => {
    e.stopPropagation();
    const nd = new Date(anchor); nd.setMonth(nd.getMonth() - 1); anchor = nd;
    renderMiniCal();
  });
  document.getElementById('m-next').addEventListener('click', e => {
    e.stopPropagation();
    const nd = new Date(anchor); nd.setMonth(nd.getMonth() + 1); anchor = nd;
    renderMiniCal();
  });
}

function taskCountdown(task) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = fromDateStr(task.due);
  const diff  = Math.round((due - today) / 86400000);
  if (task.status === 'done') return { text: 'Done', cls: 'task-badge-done' };
  if (diff < 0)   return { text: `${Math.abs(diff)}d overdue`, cls: 'task-badge-overdue' };
  if (diff === 0) return { text: 'Today',              cls: 'task-badge-today' };
  if (diff === 1) return { text: '1 day',              cls: 'task-badge-soon' };
  if (diff <= 3)  return { text: `${diff} days`,       cls: 'task-badge-soon' };
  if (diff <= 7)  return { text: `${diff} days`,       cls: 'task-badge-week' };
  return              { text: `${diff} days`,           cls: 'task-badge-far' };
}

function renderTaskList() {
  const ul = document.getElementById('task-list');
  if (!tasks.length) {
    ul.innerHTML = '<li class="task-empty">No tasks yet</li>';
  } else {
    ul.innerHTML = tasks.map(t => {
      const { text, cls } = taskCountdown(t);
      const icon = t.status === 'done' ? '✓' : t.status === 'in-progress' ? '–' : '';
      return `<li class="task-item task-status-${t.status}" data-id="${t.id}">
        <button class="task-check-btn task-check-${t.status}" data-id="${t.id}" title="Cycle status">${icon}</button>
        <span class="task-title">${t.title}</span>
        <span class="task-badge ${cls}">${text}</span>
        <button class="task-delete-btn" data-id="${t.id}" title="Delete">×</button>
      </li>`;
    }).join('');

    ul.querySelectorAll('.task-check-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const task = tasks.find(t => t.id === btn.dataset.id);
        if (task) {
          task.status = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo';
          saveTasks(); renderTaskList();
          if (view === 'tasks') renderBody();
        }
      });
    });

    ul.querySelectorAll('.task-delete-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        tasks = tasks.filter(t => t.id !== btn.dataset.id);
        saveTasks(); renderTaskList();
      });
    });
  }
}

function showAddTaskForm() {
  const existing = document.getElementById('task-add-row');
  if (existing) { existing.remove(); return; }

  const ul = document.getElementById('task-list');
  const emptyMsg = ul.querySelector('.task-empty');
  if (emptyMsg) emptyMsg.remove();

  const li = document.createElement('li');
  li.id = 'task-add-row';
  li.className = 'task-add-row';
  li.innerHTML = `
    <input type="text" id="task-add-title" placeholder="Task name" autocomplete="off" maxlength="80">
    <input type="date" id="task-add-due">
    <button class="task-add-save" id="task-add-save-btn">Add</button>
  `;
  ul.appendChild(li);
  document.getElementById('task-add-title').focus();

  function commitTask() {
    const title = document.getElementById('task-add-title').value.trim();
    const due   = document.getElementById('task-add-due').value;
    if (!title || !due) return;
    tasks.push({ id: 'tk' + Date.now(), title, due, status: 'todo' });
    saveTasks();
    li.remove();
    renderTaskList();
  }

  document.getElementById('task-add-save-btn').addEventListener('click', commitTask);
  document.getElementById('task-add-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') { document.getElementById('task-add-due').focus(); }
    if (e.key === 'Escape') { li.remove(); renderTaskList(); }
  });
  document.getElementById('task-add-due').addEventListener('keydown', e => {
    if (e.key === 'Enter') commitTask();
    if (e.key === 'Escape') { li.remove(); renderTaskList(); }
  });
}

function renderCatList() {
  const ul = document.getElementById('category-list');
  if (!categories.length) {
    ul.innerHTML = '<li class="cat-empty">No categories yet</li>';
    return;
  }
  ul.innerHTML = categories.map(c =>
    `<li class="cat-item">
       <span class="cat-dot" style="background:${c.color}"></span>
       <span class="cat-name">${c.name}</span>
     </li>`
  ).join('');
}

// ===================================================
//  BODY DISPATCH
// ===================================================

function renderBody() {
  pieCharts.forEach(c => c.destroy()); pieCharts = [];
  const body = document.getElementById('cal-body');
  if      (view === 'month')     renderMonth(body);
  else if (view === 'week')      renderWeek(body);
  else if (view === 'day')       renderDay(body);
  else if (view === 'tasks')     renderTasksView(body);
  else if (view === 'analytics') renderAnalytics(body);
}

// ===================================================
//  MONTH VIEW
// ===================================================

function renderMonth(body) {
  const year  = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let html = `<div class="month-view">
    <div class="month-dow-row">
      ${DAYS.map(d => `<div class="month-dow">${d}</div>`).join('')}
    </div>
    <div class="month-grid">`;

  // Leading cells from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = 0; i < first; i++) {
    const day  = prevMonthDays - first + 1 + i;
    const date = new Date(year, month - 1, day);
    html += `<div class="month-cell other-month" data-date="${toDateStr(date)}">
      <div class="month-cell-top"><span class="month-day-num">${day}</span></div>
      <div class="month-cell-events"></div>
    </div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date    = new Date(year, month, day);
    const dateStr = toDateStr(date);
    const dayEvts = getEventsForDate(dateStr)
                          .sort((a, b) => toMins(a.startTime) - toMins(b.startTime));
    const isToday = sameDay(date, today);

    html += `<div class="month-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
      <div class="month-cell-top"><span class="month-day-num">${day}</span></div>
      <div class="month-cell-events">`;

    const visible = dayEvts.slice(0, 3);
    const extra   = dayEvts.length - visible.length;

    for (const evt of visible) {
      const cat   = categories.find(c => c.id === evt.categoryId);
      const color = cat ? cat.color : '#9e9e9e';
      const tc    = contrastColor(color);
      const recBadge = (evt.recurrence?.type && evt.recurrence.type !== 'none') ? '<span class="rec-icon">↻</span>' : '';
      html += `<div class="month-event" data-id="${evt.id}" style="background:${color};color:${tc}">
        <span class="month-event-time">${fmtTime(evt.startTime)}</span>
        <span>${evt.title}${recBadge}</span>
      </div>`;
    }
    if (extra > 0) html += `<div class="month-more">+${extra} more</div>`;

    html += `</div></div>`;
  }

  // Trailing cells
  const total    = first + daysInMonth;
  const trailing = (7 - (total % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    const date = new Date(year, month + 1, i);
    html += `<div class="month-cell other-month" data-date="${toDateStr(date)}">
      <div class="month-cell-top"><span class="month-day-num">${i}</span></div>
      <div class="month-cell-events"></div>
    </div>`;
  }

  html += '</div></div>';
  body.innerHTML = html;

  body.querySelectorAll('.month-cell').forEach(cell => {
    cell.addEventListener('click', e => {
      if (e.target.closest('.month-event') || e.target.closest('.month-more')) return;
      openEventModal(null, { date: cell.dataset.date });
    });
  });

  body.querySelectorAll('.month-event').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const evt = events.find(ev => ev.id === el.dataset.id);
      if (evt) openEventModal(evt);
    });
  });
}

// ===================================================
//  WEEK VIEW
// ===================================================

function renderWeek(body) {
  const ws   = weekStart(anchor);
  const cols = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  buildTimeGrid(body, cols);
}

// ===================================================
//  DAY VIEW
// ===================================================

function renderDay(body) {
  buildTimeGrid(body, [anchor]);
}

// ===================================================
//  EVENT RESIZE
// ===================================================

let resizeState = null;

function startResize(e) {
  e.stopPropagation();
  e.preventDefault();

  const evtEl     = e.currentTarget.closest('.time-event');
  const col       = evtEl.closest('.tg-day-col');
  const evtId     = evtEl.dataset.id;
  const sourceEvt = events.find(ev => ev.id === evtId);
  if (!sourceEvt) return;

  evtEl.classList.add('resizing');
  document.body.style.cursor    = 'ns-resize';
  document.body.style.userSelect = 'none';

  resizeState = { evtEl, col, sourceEvt, newEndMins: toMins(sourceEvt.endTime), moved: false };

  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup',   endResize);
}

function doResize(e) {
  if (!resizeState) return;
  const { evtEl, col, sourceEvt } = resizeState;

  const colRect  = col.getBoundingClientRect();
  const y        = e.clientY - colRect.top;
  const rawMins  = Math.round(y / PX_PER_MIN / 15) * 15;
  const startMins = toMins(sourceEvt.startTime);
  const endMins   = Math.max(startMins + 15, Math.min(24 * 60, rawMins));

  resizeState.newEndMins = endMins;
  resizeState.moved = true;

  const heightPx = Math.max(22, (endMins - startMins) * PX_PER_MIN);
  evtEl.style.height = heightPx + 'px';

  const endStr   = minsToTime(endMins);
  const timeEl   = evtEl.querySelector('.time-event-time');
  if (timeEl) {
    timeEl.textContent = `${fmtTime(sourceEvt.startTime)} – ${fmtTime(endStr)}`;
  } else if (heightPx > 30) {
    const titleEl = evtEl.querySelector('.time-event-title');
    if (titleEl) {
      const newTime = document.createElement('div');
      newTime.className = 'time-event-time';
      newTime.textContent = `${fmtTime(sourceEvt.startTime)} – ${fmtTime(endStr)}`;
      evtEl.insertBefore(newTime, titleEl.nextSibling);
    }
  }
}

function endResize() {
  if (!resizeState) return;
  const { evtEl, sourceEvt, newEndMins, moved } = resizeState;

  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup',   endResize);
  document.body.style.cursor    = '';
  document.body.style.userSelect = '';

  if (moved) {
    const newEnd = minsToTime(newEndMins);
    if (newEnd !== sourceEvt.endTime) {
      const idx = events.findIndex(e => e.id === sourceEvt.id);
      if (idx !== -1) { events[idx] = { ...events[idx], endTime: newEnd }; saveEvents(); }
    }
    resizeState = null;
    render();
  } else {
    evtEl.classList.remove('resizing');
    resizeState = null;
  }
}

// ===================================================
//  EVENT DRAG-TO-MOVE
// ===================================================

let dragMoveState = null;

function startDragMove(e) {
  if (e.target.closest('.resize-handle')) return;
  e.preventDefault();

  const evtEl     = e.currentTarget;
  const col       = evtEl.closest('.tg-day-col');
  const sourceEvt = events.find(ev => ev.id === evtEl.dataset.id);
  if (!sourceEvt) return;

  const evtRect  = evtEl.getBoundingClientRect();
  const duration = toMins(sourceEvt.endTime) - toMins(sourceEvt.startTime);

  dragMoveState = {
    evtEl, col, sourceEvt, duration,
    offsetY:      e.clientY - evtRect.top,
    startX:       e.clientX,
    startY:       e.clientY,
    newStartMins: toMins(sourceEvt.startTime),
    newEndMins:   toMins(sourceEvt.endTime),
    newDate:      col.dataset.date,
    moved:        false,
  };

  document.addEventListener('mousemove', doDragMove);
  document.addEventListener('mouseup',   endDragMove);
}

function doDragMove(e) {
  if (!dragMoveState) return;
  const { evtEl, sourceEvt, offsetY, duration } = dragMoveState;

  if (!dragMoveState.moved) {
    const dx = e.clientX - dragMoveState.startX;
    const dy = e.clientY - dragMoveState.startY;
    if (Math.hypot(dx, dy) < 4) return;
    dragMoveState.moved = true;
    evtEl.classList.add('dragging');
    // Expand to full column width so it looks clean when crossing columns
    evtEl.style.left  = '2px';
    evtEl.style.width = 'calc(100% - 4px)';
    document.body.style.cursor     = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  // Find which day column is under the cursor
  let targetCol = null;
  document.querySelectorAll('.tg-day-col').forEach(col => {
    const r = col.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX < r.right) targetCol = col;
  });
  if (!targetCol) return;

  // Move element to the target column when crossing a day boundary
  if (targetCol !== evtEl.parentElement) {
    targetCol.appendChild(evtEl);
    dragMoveState.col     = targetCol;
    dragMoveState.newDate = targetCol.dataset.date;
  }

  const colRect   = targetCol.getBoundingClientRect();
  const y         = e.clientY - colRect.top - offsetY;
  const rawStart  = Math.round(y / PX_PER_MIN / 15) * 15;
  const startMins = Math.max(0, Math.min(24 * 60 - duration, rawStart));
  const endMins   = startMins + duration;

  dragMoveState.newStartMins = startMins;
  dragMoveState.newEndMins   = endMins;

  evtEl.style.top = (startMins * PX_PER_MIN) + 'px';

  const timeEl = evtEl.querySelector('.time-event-time');
  if (timeEl) {
    timeEl.textContent = `${fmtTime(minsToTime(startMins))} – ${fmtTime(minsToTime(endMins))}`;
  }
}

function endDragMove() {
  if (!dragMoveState) return;
  const { evtEl, sourceEvt, newStartMins, newEndMins, moved } = dragMoveState;

  document.removeEventListener('mousemove', doDragMove);
  document.removeEventListener('mouseup',   endDragMove);
  document.body.style.cursor     = '';
  document.body.style.userSelect = '';

  if (moved) {
    const newStart   = minsToTime(newStartMins);
    const newEnd     = minsToTime(newEndMins);
    const targetDate = dragMoveState.newDate || sourceEvt.date;
    const idx = events.findIndex(e => e.id === sourceEvt.id);
    if (idx !== -1) {
      const changed = newStart !== sourceEvt.startTime ||
                      newEnd   !== sourceEvt.endTime   ||
                      targetDate !== sourceEvt.date;
      if (changed) {
        events[idx] = { ...events[idx], startTime: newStart, endTime: newEnd, date: targetDate };
        saveEvents();
      }
    }
    dragMoveState = null;
    render();
  } else {
    evtEl.classList.remove('dragging');
    dragMoveState = null;
  }
}

// ===================================================
//  TIME GRID (shared week + day)
// ===================================================

function buildTimeGrid(body, cols) {
  const today = new Date();

  // --- Header ---
  let html = `<div class="time-grid">
    <div class="tg-head">
      <div class="tg-gutter"></div>`;

  for (const d of cols) {
    const isToday = sameDay(d, today);
    html += `<div class="tg-day-head ${isToday ? 'today' : ''}" data-date="${toDateStr(d)}">
      <span class="tg-weekday">${DAYS[d.getDay()]}</span>
      <span class="tg-date-num">${d.getDate()}</span>
    </div>`;
  }

  html += `</div>
    <div class="tg-scroll" id="tg-scroll">
      <div class="tg-labels" style="height:${TOTAL_H}px">`;

  // Hour labels (skip 0)
  for (let h = 1; h < 24; h++) {
    html += `<div class="tg-label" style="top:${h * HOUR_HEIGHT}px">${fmtHour(h)}</div>`;
  }

  html += `</div><div class="tg-cols">`;

  for (const d of cols) {
    const dateStr  = toDateStr(d);
    const dayEvts  = getEventsForDate(dateStr);
    const placed   = placeEvents(dayEvts);
    const isToday  = sameDay(d, today);

    html += `<div class="tg-day-col" data-date="${dateStr}" style="height:${TOTAL_H}px">`;

    // Hour / half-hour lines
    for (let h = 0; h < 24; h++) {
      html += `<div class="hour-line" style="top:${h * HOUR_HEIGHT}px"></div>`;
      if (h < 23) html += `<div class="half-hour-line" style="top:${h * HOUR_HEIGHT + HOUR_HEIGHT / 2}px"></div>`;
    }

    // Current-time indicator
    if (isToday) {
      const now = new Date();
      const nowTop = (now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN;
      html += `<div class="now-line" style="top:${nowTop}px"></div>`;
    }

    // Events
    for (const { evt, top, height, left, width } of placed) {
      const cat   = categories.find(c => c.id === evt.categoryId);
      const color = cat ? cat.color : '#9e9e9e';
      const tc    = contrastColor(color);
      const recBadge2 = (evt.recurrence?.type && evt.recurrence.type !== 'none') ? ' <span class="rec-icon">↻</span>' : '';
      html += `<div class="time-event" data-id="${evt.id}"
        style="top:${top}px;height:${height}px;left:calc(${left}% + 2px);width:calc(${width}% - 4px);background:${color};color:${tc}">
        <div class="time-event-title">${evt.title}${recBadge2}</div>
        ${height > 30 ? `<div class="time-event-time">${fmtTime(evt.startTime)} – ${fmtTime(evt.endTime)}</div>` : ''}
        <div class="resize-handle"></div>
      </div>`;
    }

    html += `</div>`;
  }

  html += `</div></div></div>`;
  body.innerHTML = html;

  // Scroll to 7 AM
  const scroller = document.getElementById('tg-scroll');
  if (scroller) scroller.scrollTop = 7 * HOUR_HEIGHT;

  // Click day column → create event
  body.querySelectorAll('.tg-day-col').forEach(col => {
    col.addEventListener('click', e => {
      if (e.target.closest('.time-event') || e.target.closest('.now-line')) return;
      const rect = col.getBoundingClientRect();
      const y    = e.clientY - rect.top;
      const h    = Math.min(23, Math.max(0, Math.floor(y / HOUR_HEIGHT)));
      const m    = Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;
      const pad  = n => String(n).padStart(2, '0');
      const sh   = h + (m >= 60 ? 1 : 0);
      const sm   = m >= 60 ? 0 : m;
      const eh   = Math.min(23, sh + 1);
      openEventModal(null, {
        date:      col.dataset.date,
        startTime: `${pad(sh)}:${pad(sm)}`,
        endTime:   `${pad(eh)}:${pad(sm)}`,
      });
    });
  });

  // Click event → edit
  body.querySelectorAll('.time-event').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (resizeState) return;
      const evt = events.find(ev => ev.id === el.dataset.id);
      if (evt) openEventModal(evt);
    });
  });

  // Resize handles
  body.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', startResize);
    handle.addEventListener('click', e => e.stopPropagation());
  });

  // Drag to move
  body.querySelectorAll('.time-event').forEach(el => {
    el.addEventListener('mousedown', startDragMove);
  });

  // Click day header → switch to day view
  body.querySelectorAll('.tg-day-head').forEach(el => {
    el.addEventListener('click', () => {
      anchor = fromDateStr(el.dataset.date);
      view   = 'day';
      render();
    });
  });

  // Refresh current-time indicator every minute
  setTimeout(() => { if (view === 'week' || view === 'day') renderBody(); }, 60000);
}

// ===================================================
//  EVENT OVERLAP PLACEMENT
// ===================================================

function placeEvents(dayEvts) {
  if (!dayEvts.length) return [];

  const sorted = [...dayEvts].sort((a, b) => toMins(a.startTime) - toMins(b.startTime));

  // Greedy column assignment
  const colEnds = []; // end-minute of last event in each column
  const evtCol  = new Map();

  for (const evt of sorted) {
    const start = toMins(evt.startTime);
    const end   = toMins(evt.endTime);
    let col = colEnds.findIndex(e => e <= start);
    if (col === -1) { col = colEnds.length; colEnds.push(end); }
    else colEnds[col] = end;
    evtCol.set(evt.id, col);
  }

  return sorted.map(evt => {
    const start = toMins(evt.startTime);
    const end   = toMins(evt.endTime);
    const col   = evtCol.get(evt.id);

    // Find highest column index among events overlapping this one
    let maxCol = col;
    for (const other of sorted) {
      if (other.id === evt.id) continue;
      const os = toMins(other.startTime), oe = toMins(other.endTime);
      if (start < oe && end > os) maxCol = Math.max(maxCol, evtCol.get(other.id));
    }

    const numCols = maxCol + 1;
    return {
      evt,
      top:    start * PX_PER_MIN,
      height: Math.max((end - start) * PX_PER_MIN, 22),
      left:   (col / numCols) * 100,
      width:  (1   / numCols) * 100,
    };
  });
}

// ===================================================
//  TASKS VIEW
// ===================================================

function renderTasksView(body) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

  const todayTasks  = [];
  const weekTasks   = [];
  const laterTasks  = [];
  const doneTasks   = [];

  for (const t of tasks) {
    if (t.status === 'done') { doneTasks.push(t); continue; }
    const due  = fromDateStr(t.due);
    const diff = Math.round((due - today) / 86400000);
    if (diff < 0 || diff === 0)                  todayTasks.push(t);
    else if (due <= endOfWeek)                   weekTasks.push(t);
    else                                         laterTasks.push(t);
  }

  function taskRowsHTML(list) {
    if (!list.length) return '<div class="tv-empty">Nothing here yet</div>';
    return list.map(t => {
      const { text, cls } = taskCountdown(t);
      const icon = t.status === 'done' ? '✓' : t.status === 'in-progress' ? '–' : '';
      return `<div class="tv-task-item task-status-${t.status}" data-id="${t.id}">
        <button class="task-check-btn task-check-${t.status} tv-check" data-id="${t.id}" title="Cycle status">${icon}</button>
        <div class="tv-task-body">
          <span class="tv-task-title">${t.title}</span>
          <span class="tv-task-due">Due ${formatDueDate(t.due)}</span>
        </div>
        <span class="task-badge ${cls}">${text}</span>
        <button class="task-delete-btn tv-del" data-id="${t.id}" title="Delete">×</button>
      </div>`;
    }).join('');
  }

  const doneHTML = doneTasks.length
    ? `<details class="tv-done-details">
        <summary class="tv-done-summary">${doneTasks.length} completed</summary>
        <div class="tv-section-body">${taskRowsHTML(doneTasks)}</div>
      </details>`
    : '';

  body.innerHTML = `
    <div class="tasks-view">
      <div class="tv-columns">
        <div class="tv-col">
          <div class="tv-col-header tv-header-today">
            <span class="tv-col-title">Today</span>
            <span class="tv-col-count">${todayTasks.length}</span>
          </div>
          <div class="tv-section-body">${taskRowsHTML(todayTasks)}</div>
        </div>
        <div class="tv-col">
          <div class="tv-col-header tv-header-week">
            <span class="tv-col-title">This Week</span>
            <span class="tv-col-count">${weekTasks.length}</span>
          </div>
          <div class="tv-section-body">${taskRowsHTML(weekTasks)}</div>
        </div>
        <div class="tv-col">
          <div class="tv-col-header tv-header-later">
            <span class="tv-col-title">Down the Road</span>
            <span class="tv-col-count">${laterTasks.length}</span>
          </div>
          <div class="tv-section-body">${taskRowsHTML(laterTasks)}</div>
        </div>
      </div>
      ${doneHTML}
      <button class="tv-add-btn" id="tv-add-task-btn">+ Add Task</button>
    </div>`;

  body.querySelectorAll('.tv-check').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const task = tasks.find(t => t.id === btn.dataset.id);
      if (task) {
        task.status = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo';
        saveTasks(); renderTaskList(); renderBody();
      }
    });
  });

  body.querySelectorAll('.tv-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      tasks = tasks.filter(t => t.id !== btn.dataset.id);
      saveTasks(); renderTaskList(); renderBody();
    });
  });

  document.getElementById('tv-add-task-btn').addEventListener('click', () => {
    const btn = document.getElementById('tv-add-task-btn');
    btn.replaceWith(buildTvAddForm(() => renderBody()));
    document.getElementById('tv-new-title').focus();
  });
}

function buildTvAddForm(onDone) {
  const today = new Date();
  const form = document.createElement('div');
  form.className = 'tv-inline-form';
  form.innerHTML = `
    <input type="text" id="tv-new-title" class="tv-new-title" placeholder="Task name" maxlength="80" autocomplete="off">
    <div class="tv-form-row">
      <label class="tv-form-label">Due date</label>
      <input type="date" id="tv-new-due" class="tv-new-due" min="${today.toLocaleDateString('sv')}">
      <div class="tv-form-actions">
        <button class="tv-form-cancel">Cancel</button>
        <button class="tv-form-save">Add Task</button>
      </div>
    </div>`;

  function commit() {
    const title = form.querySelector('#tv-new-title').value.trim();
    const due   = form.querySelector('#tv-new-due').value;
    if (!title || !due) {
      if (!title) form.querySelector('#tv-new-title').focus();
      else        form.querySelector('#tv-new-due').focus();
      return;
    }
    tasks.push({ id: 'tk' + Date.now(), title, due, status: 'todo' });
    saveTasks();
    renderTaskList();
    onDone();
  }

  form.querySelector('.tv-form-save').addEventListener('click', commit);
  form.querySelector('.tv-form-cancel').addEventListener('click', onDone);
  form.querySelector('#tv-new-title').addEventListener('keydown', e => {
    if (e.key === 'Enter')  form.querySelector('#tv-new-due').focus();
    if (e.key === 'Escape') onDone();
  });
  form.querySelector('#tv-new-due').addEventListener('keydown', e => {
    if (e.key === 'Enter')  commit();
    if (e.key === 'Escape') onDone();
  });

  return form;
}

function formatDueDate(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = fromDateStr(dateStr);
  const diff  = Math.round((due - today) / 86400000);
  if (diff === 0)  return 'today';
  if (diff === 1)  return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff < 0)   return `${Math.abs(diff)} days ago`;
  return `${SHORT_MONTHS[due.getMonth()]} ${due.getDate()}${due.getFullYear() !== today.getFullYear() ? ', ' + due.getFullYear() : ''}`;
}

// ===================================================
//  ANALYTICS VIEW
// ===================================================

function makeTaskPieData(taskList) {
  let done = 0, inProgress = 0, todo = 0;
  for (const t of taskList) {
    if      (t.status === 'done')        done++;
    else if (t.status === 'in-progress') inProgress++;
    else                                 todo++;
  }
  return { done, inProgress, todo, total: taskList.length };
}

function renderAnalyticsTasks(body) {
  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const sunStart = weekStart(today);
  const sunEnd   = addDays(sunStart, 6);

  const todayTasks = tasks.filter(t => {
    const due  = fromDateStr(t.due);
    const diff = Math.round((due - today) / 86400000);
    return diff <= 0;
  });

  const weekTasks = tasks.filter(t => {
    const due = fromDateStr(t.due);
    return due >= sunStart && due <= sunEnd;
  });

  function buildChart(canvasId, { done, inProgress, todo, total }) {
    if (total === 0) return;
    const ctx = document.getElementById(canvasId).getContext('2d');
    pieCharts.push(new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Complete', 'In Progress', 'Not Started'],
        datasets: [{
          data: [done, inProgress, todo],
          backgroundColor: ['#4caf92', '#f6a821', '#c0c8d4'],
          borderColor: 'transparent',
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} task${ctx.parsed !== 1 ? 's' : ''} (${total ? ((ctx.parsed/total)*100).toFixed(0) : 0}%)`,
            },
          },
        },
      },
    }));
  }

  function legendHTML({ done, inProgress, todo, total }) {
    const items = [
      { label: 'Complete',    count: done,       color: '#4caf92' },
      { label: 'In Progress', count: inProgress, color: '#f6a821' },
      { label: 'Not Started', count: todo,        color: '#c0c8d4' },
    ];
    return items.filter(i => i.count > 0).map(i => `
      <div class="legend-item">
        <span class="legend-swatch" style="background:${i.color}"></span>
        <span class="legend-name">${i.label}</span>
        <span class="legend-h">${i.count}</span>
        <span class="legend-pct">${total ? ((i.count/total)*100).toFixed(0) : 0}%</span>
      </div>`).join('');
  }

  function panelHTML(title, d, canvasId) {
    if (d.total === 0) return `
      <div class="at-panel">
        <div class="at-panel-title">${title}</div>
        <div class="analytics-empty" style="padding:24px 0">
          <div class="analytics-empty-icon" style="font-size:40px">✓</div>
          <p>No tasks due</p>
        </div>
      </div>`;
    return `
      <div class="at-panel">
        <div class="at-panel-title">${title}</div>
        <div class="at-panel-body">
          <div class="at-chart-wrap"><canvas id="${canvasId}"></canvas></div>
          <div class="analytics-legend">
            <div class="legend-total">${d.total} task${d.total !== 1 ? 's' : ''}</div>
            ${legendHTML(d)}
          </div>
        </div>
      </div>`;
  }

  const todayData = makeTaskPieData(todayTasks);
  const weekData  = makeTaskPieData(weekTasks);

  body.innerHTML = `<div class="analytics-view">
    ${analyticsTabBar()}
    <div class="at-panels">
      ${panelHTML('Today', todayData, 'at-canvas-today')}
      ${panelHTML('This Week', weekData, 'at-canvas-week')}
    </div>
  </div>`;

  wireAnalyticsTabs(body);
  if (todayData.total > 0) buildChart('at-canvas-today', todayData);
  if (weekData.total  > 0) buildChart('at-canvas-week',  weekData);
}

function analyticsTabBar() {
  return `<div class="analytics-tab-row">
    <button class="analytics-tab-btn${analyticsTab === 'events' ? ' active' : ''}" data-tab="events">Events</button>
    <button class="analytics-tab-btn${analyticsTab === 'tasks'  ? ' active' : ''}" data-tab="tasks">Tasks</button>
  </div>`;
}

function wireAnalyticsTabs(body) {
  body.querySelectorAll('.analytics-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => { analyticsTab = btn.dataset.tab; renderBody(); });
  });
}

function renderAnalytics(body) {
  if (analyticsTab === 'tasks') { renderAnalyticsTasks(body); return; }

  // Determine date range
  let startStr, endStr;
  if (analyticsSpan === 'day') {
    startStr = endStr = toDateStr(anchor);
  } else if (analyticsSpan === 'week') {
    const ws = weekStart(anchor);
    startStr = toDateStr(ws);
    endStr   = toDateStr(addDays(ws, 6));
  } else if (analyticsSpan === 'month') {
    startStr = toDateStr(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    endStr   = toDateStr(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));
  } else {
    startStr = analyticsCustomStart;
    endStr   = analyticsCustomEnd;
  }

  const validRange = startStr && endStr && startStr <= endStr;
  const inRange    = validRange ? getEventsInRange(startStr, endStr) : [];

  // Aggregate hours per category
  const catHours = {};
  let uncatHours = 0;
  for (const evt of inRange) {
    const dur = (toMins(evt.endTime) - toMins(evt.startTime)) / 60;
    if (dur <= 0) continue;
    if (evt.categoryId) catHours[evt.categoryId] = (catHours[evt.categoryId] || 0) + dur;
    else uncatHours += dur;
  }

  const labels = [], data = [], colors = [];
  for (const cat of categories) {
    if (catHours[cat.id] > 0) {
      labels.push(cat.name);
      data.push(+catHours[cat.id].toFixed(2));
      colors.push(cat.color);
    }
  }
  if (uncatHours > 0) {
    labels.push('Uncategorized');
    data.push(+uncatHours.toFixed(2));
    colors.push('#9e9e9e');
  }
  const total = data.reduce((s, v) => s + v, 0);

  const customRow = analyticsSpan === 'custom' ? `
    <div class="analytics-custom-row">
      <span class="analytics-custom-label">From</span>
      <input type="date" id="analytics-start" class="analytics-date-input"
             value="${analyticsCustomStart}" ${endStr ? `max="${endStr}"` : ''}>
      <span class="analytics-custom-label">to</span>
      <input type="date" id="analytics-end" class="analytics-date-input"
             value="${analyticsCustomEnd}" ${startStr ? `min="${startStr}"` : ''}>
    </div>` : '';

  const rangeBtns = `
    <div class="analytics-range-row">
      ${['day','week','month','custom'].map(r => `
        <button class="range-btn ${analyticsSpan === r ? 'active' : ''}" data-range="${r}">
          ${r === 'custom' ? 'Custom' : r.charAt(0).toUpperCase() + r.slice(1)}
        </button>`).join('')}
    </div>
    ${customRow}`;

  const showEmpty = !data.length;
  let emptyMsg = 'No events in this period to analyze.';
  if (analyticsSpan === 'custom' && !validRange) {
    emptyMsg = startStr && endStr && startStr > endStr
      ? 'End date must be after start date.'
      : 'Choose a start and end date above.';
  }

  if (showEmpty) {
    body.innerHTML = `<div class="analytics-view">
      ${analyticsTabBar()}
      ${rangeBtns}
      <div class="analytics-empty">
        <div class="analytics-empty-icon">📊</div>
        <p>${emptyMsg}</p>
        ${validRange || analyticsSpan !== 'custom'
          ? '<p>Create some events and assign them categories to see your time breakdown here.</p>'
          : ''}
      </div>
    </div>`;
  } else {
    const legendRows = labels.map((lbl, i) => `
      <div class="legend-item">
        <span class="legend-swatch" style="background:${colors[i]}"></span>
        <span class="legend-name">${lbl}</span>
        <span class="legend-h">${data[i].toFixed(1)}h</span>
        <span class="legend-pct">${((data[i]/total)*100).toFixed(1)}%</span>
      </div>`).join('');

    body.innerHTML = `<div class="analytics-view">
      ${analyticsTabBar()}
      ${rangeBtns}
      <div class="analytics-content">
        <div class="chart-wrap"><canvas id="pie-canvas"></canvas></div>
        <div class="analytics-legend">
          <div class="legend-total">Total: ${total.toFixed(1)} hours</div>
          ${legendRows}
        </div>
      </div>
    </div>`;

    const ctx = document.getElementById('pie-canvas').getContext('2d');
    pieCharts.push(new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#fff', borderWidth: 2 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const val = ctx.parsed;
                return ` ${val.toFixed(1)}h  (${((val/total)*100).toFixed(1)}%)`;
              },
            },
          },
        },
      },
    }));
  }

  wireAnalyticsTabs(body);

  // Range buttons
  body.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = btn.dataset.range;
      if (r === 'custom' && !analyticsCustomStart) {
        analyticsCustomStart = toDateStr(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
        analyticsCustomEnd   = toDateStr(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));
        localStorage.setItem('pp-analytics-start', analyticsCustomStart);
        localStorage.setItem('pp-analytics-end',   analyticsCustomEnd);
      }
      analyticsSpan = r;
      renderHeader();
      renderBody();
    });
  });

  // Custom date pickers
  const startInput = body.querySelector('#analytics-start');
  const endInput   = body.querySelector('#analytics-end');
  if (startInput) {
    startInput.addEventListener('change', () => {
      analyticsCustomStart = startInput.value;
      localStorage.setItem('pp-analytics-start', analyticsCustomStart);
      renderHeader();
      renderBody();
    });
  }
  if (endInput) {
    endInput.addEventListener('change', () => {
      analyticsCustomEnd = endInput.value;
      localStorage.setItem('pp-analytics-end', analyticsCustomEnd);
      renderHeader();
      renderBody();
    });
  }
}

// ===================================================
//  EVENT MODAL
// ===================================================

function openEventModal(evt, defaults = {}) {
  editId = evt ? evt.id : null;

  document.getElementById('modal-title').textContent = evt ? 'Edit Event' : 'New Event';
  document.getElementById('delete-event-btn').classList.toggle('hidden', !evt);

  // Fill fields
  document.getElementById('event-title').value = evt?.title       ?? '';
  document.getElementById('event-date').value  = evt?.date        ?? (defaults.date || toDateStr(new Date()));
  document.getElementById('event-start').value = evt?.startTime   ?? (defaults.startTime || '09:00');
  document.getElementById('event-end').value   = evt?.endTime     ?? (defaults.endTime   || '10:00');
  document.getElementById('event-desc').value  = evt?.description ?? '';

  // Category dropdown
  const sel = document.getElementById('event-category');
  sel.innerHTML = '<option value="">No category</option>' +
    categories.map(c =>
      `<option value="${c.id}" ${evt?.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

  // Recurrence fields
  const rec = evt?.recurrence || { type: 'none', interval: 1, endDate: '' };
  document.getElementById('event-recurrence-type').value = rec.type || 'none';
  document.getElementById('event-recurrence-interval').value = rec.interval || 1;
  document.getElementById('event-recurrence-end').value = rec.endDate || '';
  updateRecurrenceUI(rec.type || 'none');

  document.getElementById('event-modal').classList.remove('hidden');
  document.getElementById('event-title').focus();
}

function closeEventModal() {
  document.getElementById('event-modal').classList.add('hidden');
  editId = null;
}

function saveEvent() {
  const title    = document.getElementById('event-title').value.trim();
  const date     = document.getElementById('event-date').value;
  const start    = document.getElementById('event-start').value;
  const end      = document.getElementById('event-end').value;
  const catId    = document.getElementById('event-category').value;
  const desc     = document.getElementById('event-desc').value.trim();

  if (!title || !date || !start || !end) return;

  if (end <= start) {
    alert('End time must be after start time.');
    return;
  }

  const recType     = document.getElementById('event-recurrence-type').value;
  const recInterval = Math.max(1, parseInt(document.getElementById('event-recurrence-interval').value) || 1);
  const recEnd      = document.getElementById('event-recurrence-end').value;
  const recurrence  = { type: recType, interval: recInterval, endDate: recEnd };

  const record = { title, date, startTime: start, endTime: end, categoryId: catId, description: desc, recurrence };

  if (editId) {
    const idx = events.findIndex(e => e.id === editId);
    if (idx !== -1) events[idx] = { ...events[idx], ...record };
  } else {
    events.push({ id: uid(), ...record });
  }

  saveEvents();
  closeEventModal();
  render();
}

function deleteEvent() {
  if (!editId || !confirm('Delete this event?')) return;
  events = events.filter(e => e.id !== editId);
  saveEvents();
  closeEventModal();
  render();
}

// ===================================================
//  CATEGORY MODAL
// ===================================================

function openCatModal() {
  document.getElementById('category-modal').classList.remove('hidden');
  renderCatModalList();
}

function closeCatModal() {
  closeColorPalette();
  document.getElementById('category-modal').classList.add('hidden');
}

function renderCatModalList() {
  closeColorPalette();
  const el = document.getElementById('cat-modal-list');
  if (!categories.length) {
    el.innerHTML = '<p class="cat-modal-empty">No categories yet. Add one below.</p>';
    return;
  }

  el.innerHTML = categories.map(c => `
    <div class="cat-modal-item" data-id="${c.id}">
      <button class="cat-color-btn" data-id="${c.id}" style="background:${c.color}" title="Change color"></button>
      <input type="text" class="cat-modal-name-input" data-id="${c.id}" value="${c.name}" spellcheck="false">
      <button class="cat-del-btn" data-id="${c.id}" title="Delete">&#10005;</button>
    </div>`).join('');

  el.querySelectorAll('.cat-color-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const popup = document.getElementById('color-palette-popup');
      if (popup && popup.dataset.for === btn.dataset.id) { closeColorPalette(); return; }
      showColorPalette(btn.dataset.id, btn);
    });
  });

  el.querySelectorAll('.cat-modal-name-input').forEach(inp => {
    const commit = () => {
      const name = inp.value.trim();
      if (!name) { inp.value = categories.find(c => c.id === inp.dataset.id)?.name || ''; return; }
      const cat = categories.find(c => c.id === inp.dataset.id);
      if (cat && cat.name !== name) { cat.name = name; saveCategories(); renderCatList(); }
    };
    inp.addEventListener('blur', commit);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
  });

  el.querySelectorAll('.cat-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = categories.find(c => c.id === btn.dataset.id)?.name;
      if (!confirm(`Delete category "${name}"? Events in this category will become uncategorized.`)) return;
      categories = categories.filter(c => c.id !== btn.dataset.id);
      events     = events.map(e => e.categoryId === btn.dataset.id ? { ...e, categoryId: '' } : e);
      saveCategories(); saveEvents();
      renderCatModalList();
      render();
    });
  });
}

// ===================================================
//  COLOR PALETTE POPUP
// ===================================================

function showColorPalette(catId, anchorEl) {
  closeColorPalette();

  const popup = document.createElement('div');
  popup.className = 'color-palette-popup';
  popup.id = 'color-palette-popup';
  popup.dataset.for = catId;

  popup.innerHTML = `
    <div class="palette-swatches">
      ${savedColors.map(color => `
        <div class="palette-swatch-wrap">
          <button class="palette-swatch" data-color="${color}" style="background:${color}" title="${color}"></button>
          <button class="palette-swatch-del" data-color="${color}" title="Remove color">&#10005;</button>
        </div>`).join('')}
      <label class="palette-add-btn" title="Add custom color">+
        <input type="color" class="palette-color-input" value="#1a73e8">
      </label>
    </div>`;

  const rect = anchorEl.getBoundingClientRect();
  popup.style.top  = (rect.bottom + 6) + 'px';
  popup.style.left = rect.left + 'px';
  document.body.appendChild(popup);

  popup.querySelectorAll('.palette-swatch').forEach(sw => {
    sw.addEventListener('click', e => { e.stopPropagation(); applyCatColor(catId, sw.dataset.color); });
  });

  popup.querySelectorAll('.palette-swatch-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      savedColors = savedColors.filter(c => c !== btn.dataset.color);
      saveSavedColors();
      showColorPalette(catId, anchorEl);
    });
  });

  popup.querySelector('.palette-color-input').addEventListener('change', e => {
    e.stopPropagation();
    const color = e.target.value;
    if (!savedColors.includes(color)) { savedColors.push(color); saveSavedColors(); }
    applyCatColor(catId, color);
  });

  setTimeout(() => document.addEventListener('click', onOutsideColorClick), 0);
}

function applyCatColor(catId, color) {
  const cat = categories.find(c => c.id === catId);
  if (cat) {
    cat.color = color;
    saveCategories();
    render();
    const btn = document.querySelector(`.cat-color-btn[data-id="${catId}"]`);
    if (btn) btn.style.background = color;
  }
  closeColorPalette();
}

function closeColorPalette() {
  const popup = document.getElementById('color-palette-popup');
  if (popup) popup.remove();
  document.removeEventListener('click', onOutsideColorClick);
}

function onOutsideColorClick(e) {
  const popup = document.getElementById('color-palette-popup');
  if (popup && !popup.contains(e.target) && !e.target.classList.contains('cat-color-btn')) {
    closeColorPalette();
  }
}

function addCategory() {
  const nameInp  = document.getElementById('new-cat-name');
  const colorInp = document.getElementById('new-cat-color');
  const name     = nameInp.value.trim();
  if (!name) return;
  categories.push({ id: uid(), name, color: colorInp.value });
  saveCategories();
  nameInp.value = '';
  renderCatModalList();
  renderCatList();
}

// ===================================================
//  RECURRENCE UI
// ===================================================

function updateRecurrenceUI(type) {
  const opts      = document.getElementById('recurrence-options');
  const unitLabel = document.getElementById('recurrence-unit-label');
  opts.classList.toggle('hidden', type === 'none');
  const units = { daily: 'days', weekly: 'weeks', monthly: 'months', yearly: 'years' };
  unitLabel.textContent = units[type] || 'days';
}

// ===================================================
//  UTILITIES
// ===================================================

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function contrastColor(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.58 ? '#333' : '#fff';
}

// ===================================================
//  WELCOME SCREEN
// ===================================================

function applyUserName(name) {
  const logoText = document.querySelector('.logo-text');
  if (logoText) logoText.textContent = `${name}'s Planner`;
}

function initWelcome() {
  const savedName = localStorage.getItem('pp-user-name');
  if (savedName) {
    applyUserName(savedName);
    return;
  }

  const screen      = document.getElementById('welcome-screen');
  const input       = document.getElementById('welcome-input');
  const nameDisplay = document.getElementById('welcome-name-display');
  const hint        = document.getElementById('welcome-hint');

  nameDisplay.innerHTML = ', <span class="welcome-blank">______</span>';
  input.focus();

  input.addEventListener('input', () => {
    const val = input.value;
    nameDisplay.innerHTML = val
      ? ', ' + val
      : ', <span class="welcome-blank">______</span>';
    hint.textContent = val.trim() ? 'press Enter to continue' : "what's your name?";
  });

  const submit = () => {
    const name = input.value.trim();
    if (!name) return;
    localStorage.setItem('pp-user-name', name);
    screen.classList.add('exiting');
    screen.addEventListener('animationend', () => {
      screen.remove();
      applyUserName(name);
    }, { once: true });
  };

  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
}

// ===================================================
//  WIRE UP EVENT LISTENERS
// ===================================================

function init() {
  // Navigation
  document.getElementById('prev-btn').addEventListener('click', navPrev);
  document.getElementById('next-btn').addEventListener('click', navNext);
  document.getElementById('today-btn').addEventListener('click', navToday);

  // View switcher
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => { view = btn.dataset.view; render(); });
  });

  // Create button
  document.getElementById('create-btn').addEventListener('click', () => openEventModal(null));

  // Tasks
  document.getElementById('add-task-btn').addEventListener('click', showAddTaskForm);

  // Manage categories
  document.getElementById('manage-categories-btn').addEventListener('click', openCatModal);

  // Event form submit
  document.getElementById('event-form').addEventListener('submit', e => {
    e.preventDefault();
    saveEvent();
  });

  // Recurrence type change
  document.getElementById('event-recurrence-type').addEventListener('change', e => {
    updateRecurrenceUI(e.target.value);
  });

  // Auto-advance end time when start changes
  document.getElementById('event-start').addEventListener('change', e => {
    const endEl = document.getElementById('event-end');
    if (!endEl.value || endEl.value <= e.target.value) {
      const [h, m] = e.target.value.split(':').map(Number);
      const eh = Math.min(23, h + 1);
      endEl.value = `${String(eh).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
  });

  // Delete event
  document.getElementById('delete-event-btn').addEventListener('click', deleteEvent);

  // Close buttons — event modal
  document.getElementById('event-modal').querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', closeEventModal);
  });
  document.querySelector('#event-modal .modal-overlay').addEventListener('click', closeEventModal);

  // Close buttons — category modal
  document.getElementById('category-modal').querySelector('.modal-close-btn').addEventListener('click', closeCatModal);
  document.querySelector('#category-modal .modal-overlay').addEventListener('click', closeCatModal);

  // Add category form
  document.getElementById('add-cat-form').addEventListener('submit', e => {
    e.preventDefault();
    addCategory();
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeEventModal(); closeCatModal(); }
  });

  // Theme toggle
  const themeToggle = document.getElementById('dark-mode-toggle');
  const curTheme = loadTheme();
  applyTheme(curTheme);
  applyCustomColors(loadCustomColors());
  if (themeToggle) {
    themeToggle.checked = curTheme === 'dark';
    themeToggle.addEventListener('change', e => {
      const t = e.target.checked ? 'dark' : 'light';
      applyTheme(t); saveTheme(t);
    });
  }

  // Color customizer
  document.getElementById('color-customize-btn').addEventListener('click', e => {
    e.stopPropagation();
    showColorCustomizer(e.currentTarget);
  });

  render();
  initWelcome();
}

init();
