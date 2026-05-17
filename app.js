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

let view          = 'month';      // month | week | day | analytics
let anchor        = new Date();   // current navigation anchor date
let analyticsSpan = 'week';       // day | week | month  (analytics sub-range)
let editId        = null;         // id of event being edited, null = new
let pieChart      = null;         // Chart.js instance

function saveEvents()     { save('pp-events', events); }
function saveCategories() { save('pp-categories', categories); }
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
  if (view === 'analytics') {
    if (analyticsSpan === 'day')   return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    if (analyticsSpan === 'month') return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const s = weekStart(d), e = addDays(s, 6);
    return `${SHORT_MONTHS[s.getMonth()]} ${s.getDate()} – ${SHORT_MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  }
  return '';
}

// ===================================================
//  NAVIGATION
// ===================================================

function navPrev() {
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
  if (pieChart) { pieChart.destroy(); pieChart = null; }
  const body = document.getElementById('cal-body');
  if      (view === 'month')     renderMonth(body);
  else if (view === 'week')      renderWeek(body);
  else if (view === 'day')       renderDay(body);
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
    const dayEvts = events.filter(e => e.date === dateStr)
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
      html += `<div class="month-event" data-id="${evt.id}" style="background:${color};color:${tc}">
        <span class="month-event-time">${fmtTime(evt.startTime)}</span>
        <span>${evt.title}</span>
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
    const dayEvts  = events.filter(e => e.date === dateStr);
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
      html += `<div class="time-event" data-id="${evt.id}"
        style="top:${top}px;height:${height}px;left:calc(${left}% + 2px);width:calc(${width}% - 4px);background:${color};color:${tc}">
        <div class="time-event-title">${evt.title}</div>
        ${height > 30 ? `<div class="time-event-time">${fmtTime(evt.startTime)} – ${fmtTime(evt.endTime)}</div>` : ''}
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
      const evt = events.find(ev => ev.id === el.dataset.id);
      if (evt) openEventModal(evt);
    });
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
//  ANALYTICS VIEW
// ===================================================

function renderAnalytics(body) {
  // Determine date range
  let start, end;
  if (analyticsSpan === 'day') {
    start = end = new Date(anchor);
  } else if (analyticsSpan === 'week') {
    start = weekStart(anchor);
    end   = addDays(start, 6);
  } else {
    start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    end   = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  }

  const startStr = toDateStr(start);
  const endStr   = toDateStr(end);
  const inRange  = events.filter(e => e.date >= startStr && e.date <= endStr);

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

  const rangeBtns = `
    <div class="analytics-range-row">
      ${['day','week','month'].map(r => `
        <button class="range-btn ${analyticsSpan === r ? 'active' : ''}" data-range="${r}">
          ${r.charAt(0).toUpperCase() + r.slice(1)}
        </button>`).join('')}
    </div>`;

  if (!data.length) {
    body.innerHTML = `<div class="analytics-view">
      ${rangeBtns}
      <div class="analytics-empty">
        <div class="analytics-empty-icon">📊</div>
        <p>No events in this period to analyze.</p>
        <p>Create some events and assign them categories to see your time breakdown here.</p>
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
    pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const val = ctx.parsed;
                const pct = ((val / total) * 100).toFixed(1);
                return ` ${val.toFixed(1)}h  (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  body.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      analyticsSpan = btn.dataset.range;
      renderHeader();
      renderBody();
    });
  });
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

  const record = { title, date, startTime: start, endTime: end, categoryId: catId, description: desc };

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

  // Manage categories
  document.getElementById('manage-categories-btn').addEventListener('click', openCatModal);

  // Event form submit
  document.getElementById('event-form').addEventListener('submit', e => {
    e.preventDefault();
    saveEvent();
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
  if (themeToggle) {
    themeToggle.checked = curTheme === 'dark';
    themeToggle.addEventListener('change', e => {
      const t = e.target.checked ? 'dark' : 'light';
      applyTheme(t); saveTheme(t);
    });
  }

  render();
}

init();
