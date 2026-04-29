// ══ STORAGE ══
const S = {
    get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ══ AUTH ══
// normalize stored users to { user: { pass, name } }
const _rawUsers = S.get('mf_u');
function normalizeUsers(raw) {
    const out = {};
    if (!raw) return out;
    for (const k of Object.keys(raw)) {
        if (!raw[k]) continue;
        if (typeof raw[k] === 'string') out[k] = { pass: raw[k], name: k };
        else if (raw[k].pass) out[k] = raw[k];
        else out[k] = { pass: raw[k].pass || '', name: raw[k].name || k };
    }
    return out;
}

const _norm = normalizeUsers(_rawUsers);
let users = Object.keys(_norm).length ? _norm : { 'user': { pass: '1234', name: 'User' } };
let currentUser = S.get('mf_user') || null;
let signup = false;

function launch() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').classList.add('visible');
    init();
}

// toggle signup fields
document.getElementById('aswbtn').addEventListener('click', () => {
    signup = !signup;
    document.getElementById('atitle').textContent = signup ? 'Create account' : 'Welcome back';
    document.getElementById('asubmit').textContent = signup ? 'Create Account' : 'Sign In';
    document.getElementById('aswtxt').textContent = signup ? 'Already have an account?' : "Don't have an account?";
    document.getElementById('aswbtn').textContent = signup ? ' Sign in' : ' Sign up';
    document.getElementById('anamef').style.display = signup ? '' : 'none';
    document.getElementById('ap2f').style.display = signup ? '' : 'none';
    const err = document.getElementById('aerr'); if (err) { err.style.display = 'none'; err.textContent = ' '; }
});

document.getElementById('asubmit').addEventListener('click', () => {
    const u = document.getElementById('auser').value.trim();
    const p = document.getElementById('apass').value;
    const e = document.getElementById('aerr'); e.style.display = 'none';
    if (!u || !p) { e.textContent = 'Please fill all fields.'; e.style.display = 'block'; return; }
    if (signup) {
        const nm = document.getElementById('aname').value.trim();
        const p2 = document.getElementById('apass2').value;
        if (!nm) { e.textContent = 'Please enter your name.'; e.style.display = 'block'; return; }
        if (p !== p2) { e.textContent = 'Passwords do not match.'; e.style.display = 'block'; return; }
        if (users[u]) { e.textContent = 'Username already taken.'; e.style.display = 'block'; return; }
        users[u] = { pass: p, name: nm }; S.set('mf_u', users);
        currentUser = u; S.set('mf_user', u); launch();
    } else {
        if (!users[u] || users[u].pass !== p) { e.textContent = 'Invalid username or password.'; e.style.display = 'block'; return; }
        currentUser = u; S.set('mf_user', u); launch();
    }
});

// enter key behavior
['auser', 'apass', 'apass2'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('asubmit').click(); }); });

// logout
document.getElementById('logout-btn').addEventListener('click', () => {
    S.set('mf_user', null); currentUser = null; const appShell = document.getElementById('app-shell'); if (appShell) appShell.classList.remove('visible'); document.getElementById('login-screen').style.display = 'flex'; document.getElementById('auser').value = ''; document.getElementById('apass').value = ''; signup = false;
});

// initialize
if (currentUser && users[currentUser]) { document.getElementById('login-screen').style.display = 'none'; const appShell = document.getElementById('app-shell'); if (appShell) appShell.classList.add('visible'); }

// ══ DATA ══
let tasks = [], notes = [], foodData = {}, motive = '';

function loadData() {
    tasks = S.get('ht_tasks') || [];
    notes = S.get('ht_notes') || [];
    foodData = S.get('ht_food') || {};
    motive = S.get('ht_motive') || '';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const COLS = ['Early Morning', 'Breakfast', 'Mid Morning', 'Lunch', 'Evening', 'Dinner'];
async function fetchDailyQuote() {
    const el = document.getElementById('daily-quote');
    const quotes = [
        'Success is the sum of small efforts repeated day in and day out. — Robert Collier',
        'The secret of getting ahead is getting started. — Mark Twain',
        'Don\'t watch the clock; do what it does. Keep going. — Sam Levenson',
        'Your time is limited, don\'t waste it living someone else\'s life. — Steve Jobs',
        'The harder you work for something, the greater you\'ll feel when you achieve it.',
        'Dream it. Wish it. Do it.',
        'Great things never come from comfort zones.',
        'Push yourself, because no one else is going to do it for you.',
        'Sometimes later becomes never. Do it now.',
        'Little things make big days.',
        'It\'s going to be hard, but hard does not mean impossible.',
        'Don\'t stop when you\'re tired. Stop when you\'re done.',
        'Wake up with determination. Go to bed with satisfaction.',
        'Do something today that your future self will thank you for.',
        'The key to success is to focus on goals, not obstacles.',
        'Believe you can and you\'re halfway there. — Theodore Roosevelt',
        'Act as if what you do makes a difference. It does. — William James',
        'Success usually comes to those who are too busy to be looking for it. — Henry David Thoreau',
        'Opportunities don\'t happen. You create them. — Chris Grosser',
        'Don\'t be afraid to give up the good to go for the great. — John D. Rockefeller',
        'Money is a tool. Used properly it makes something beautiful. — Brad Sugars',
        'Financial freedom is available to those who learn about it and work for it.',
        'Your first job is not your last job. It\'s just the beginning.',
        'Every expert was once a beginner. Every pro started as an amateur.',
        'Invest in yourself. It pays the best interest. — Benjamin Franklin',
    ];
    el.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

// async function fetchDailyQuote() {
//   const el = document.getElementById('daily-quote');

//   // We add '?tags=success' to ensure we get motivation, not random facts
//   const url = 'https://api.api-ninjas.com/v2/randomquotes?tags=success';

//   try {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error('Network response was not ok');

//     const data = await res.json();

//     // Quotable uses "content" for the text and "author" for the name
//     el.textContent = `"${data.content}" — ${data.author}`;

//   } catch (err) {
//     console.error("Quote fetch failed:", err);
//     el.textContent = 'Success is not final, failure is not fatal: it is the courage to continue that counts.';
//   }
// }

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

function todayKey() { return new Date().toISOString().split('T')[0]; }

// ══ NAV ══
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('page-' + btn.dataset.page).classList.add('active');
        if (btn.dataset.page === 'home') renderHome();
        if (btn.dataset.page === 'tasks') renderTasks();
        if (btn.dataset.page === 'food') renderFood();
        if (btn.dataset.page === 'notes') renderNotes();
    });
});

// ══ HOME ══
function renderHome() {
    const d = new Date();
    const h = d.getHours();
    const greeting = h < 12 ? 'Good Morning 🌤' : h < 17 ? 'Good Afternoon ☀️' : 'Good Evening 🌙';
    document.getElementById('home-greeting').textContent = greeting + (currentUser ? ', ' + currentUser : '');
    document.getElementById('today-date').textContent = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    // document.getElementById('daily-quote').textContent = QUOTES[d.getDate() % QUOTES.length];
    fetchDailyQuote();

    document.getElementById('stat-total').textContent = tasks.length;
    document.getElementById('stat-done').textContent = tasks.filter(t => t.status === 'done').length;
    const today = todayKey();
    document.getElementById('stat-streak').textContent = tasks.filter(t => t.checkedDays && t.checkedDays.includes(today)).length;

    const strip = document.getElementById('today-strip');
    if (tasks.length === 0) {
        strip.innerHTML = '<div style="color:var(--text2);font-size:13px;padding:10px 0">No habits yet. Add from Tasks →</div>';
    } else {
        strip.innerHTML = tasks.map(t => {
            const checked = t.checkedDays && t.checkedDays.includes(today);
            return `<div class="today-pill" style="border-color:${t.color}40;background:${checked ? t.color + '18' : 'var(--surface)'}">
        <div style="width:8px;height:8px;border-radius:50%;background:${t.color};flex-shrink:0"></div>
        <span>${t.name}</span>
        ${checked ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${t.color}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
      </div>`;
        }).join('');
    }

    if (motive) {
        document.getElementById('motive-img').src = motive;
        document.getElementById('motive-img').style.display = '';
        document.getElementById('motive-placeholder').style.display = 'none';
    }
}

document.getElementById('motive-card').addEventListener('click', () => { if (!motive) document.getElementById('motivate-file').click(); });
document.getElementById('motive-edit-btn').addEventListener('click', e => { e.stopPropagation(); document.getElementById('motivate-file').click(); });
document.getElementById('motivate-file').addEventListener('change', function () {
    const file = this.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        motive = e.target.result; S.set('ht_motive', motive);
        document.getElementById('motive-img').src = motive;
        document.getElementById('motive-img').style.display = '';
        document.getElementById('motive-placeholder').style.display = 'none';
        toast('Motivation image updated!');
    };
    reader.readAsDataURL(file);
});

// ══ TASKS ══
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
// detail calendar state (per-task month/year shown in the right-side panel)
let detailCalMonth = new Date().getMonth();
let detailCalYear = new Date().getFullYear();
let gtColor = '#c8956c';
let gtPrio = 'medium';
let gtDurType = 'inf';
let gtDurDays = null;
let gtStartDate = null;

// Quick add form
document.getElementById('add-task-btn').addEventListener('click', () => {
    const f = document.getElementById('gtask-form');
    f.classList.toggle('open');
    if (f.classList.contains('open')) {
        document.getElementById('gt-name').focus();
        // default start date = today
        const td = todayKey();
        document.getElementById('gt-date').value = td;
        gtStartDate = td;
        document.getElementById('gt-date-label').textContent = formatDateShort(td);
        document.getElementById('gt-pill-date').classList.add('active');
    }
});

document.getElementById('gt-cancel').addEventListener('click', () => {
    document.getElementById('gtask-form').classList.remove('open');
    resetGtForm();
});

document.getElementById('gt-date').addEventListener('change', function () {
    gtStartDate = this.value;
    document.getElementById('gt-date-label').textContent = gtStartDate ? formatDateShort(gtStartDate) : 'Start date';
    document.getElementById('gt-pill-date').classList.toggle('active', !!gtStartDate);
});

document.getElementById('gt-pill-date').addEventListener('click', () => {
    document.getElementById('gt-date').click();
});

document.getElementById('gt-pill-duration').addEventListener('click', () => {
    const sub = document.getElementById('gt-dur-sub');
    sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('gt-dur-type').addEventListener('change', function () {
    gtDurType = this.value;
    const inp = document.getElementById('gt-dur-days');
    inp.style.display = gtDurType === 'custom' ? '' : 'none';
    updateDurLabel();
});

document.getElementById('gt-dur-days').addEventListener('input', function () {
    gtDurDays = parseInt(this.value) || null;
    updateDurLabel();
});

function updateDurLabel() {
    const lbl = document.getElementById('gt-dur-label');
    if (gtDurType === 'inf') { lbl.textContent = '∞ Infinite'; }
    else { lbl.textContent = gtDurDays ? gtDurDays + ' days' : 'Duration'; }
    document.getElementById('gt-pill-duration').classList.toggle('active', gtDurType !== 'inf' || true);
}

// Priority cycling
const PRIOS = ['low', 'medium', 'high'];
const PRIO_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
document.getElementById('gt-pill-prio').addEventListener('click', () => {
    const idx = PRIOS.indexOf(gtPrio);
    gtPrio = PRIOS[(idx + 1) % PRIOS.length];
    document.getElementById('gt-prio-label').textContent = PRIO_LABELS[gtPrio];
    const icons = { low: '🟢', medium: '🟡', high: '🔴' };
    document.getElementById('gt-pill-prio').classList.toggle('active', gtPrio !== 'medium');
});

document.getElementById('gt-colors').addEventListener('click', e => {
    const chip = e.target.closest('.gtask-mini-chip'); if (!chip) return;
    document.querySelectorAll('.gtask-mini-chip').forEach(c => c.classList.remove('sel'));
    chip.classList.add('sel');
    gtColor = chip.dataset.c;
});

document.getElementById('gt-save').addEventListener('click', () => {
    const name = document.getElementById('gt-name').value.trim();
    if (!name) { toast('Please enter a task name'); return; }
    const dur = gtDurType === 'inf' ? null : (gtDurDays || 30);
    const startDate = gtStartDate || todayKey();
    const task = {
        id: Date.now().toString(),
        name,
        notes: document.getElementById('gt-desc').value.trim(),
        category: 'Health & Fitness',
        duration: dur,
        priority: gtPrio,
        reminder: '',
        color: gtColor,
        status: 'todo',
        checkedDays: [],
        createdAt: new Date(startDate + 'T00:00:00').toISOString(),
        startDate,
    };
    tasks.push(task);
    S.set('ht_tasks', tasks);
    document.getElementById('gtask-form').classList.remove('open');
    resetGtForm();
    renderTasks();
    toast('Task created! 🎯');
});

function resetGtForm() {
    document.getElementById('gt-name').value = '';
    document.getElementById('gt-desc').value = '';
    gtPrio = 'medium'; gtColor = '#c8956c'; gtDurType = 'inf'; gtDurDays = null;
    document.getElementById('gt-prio-label').textContent = 'Medium';
    document.getElementById('gt-date-label').textContent = 'Start date';
    document.getElementById('gt-pill-date').classList.remove('active');
    document.getElementById('gt-pill-prio').classList.remove('active');
    document.getElementById('gt-dur-label').textContent = 'Duration';
    document.getElementById('gt-dur-sub').style.display = 'none';
    document.getElementById('gt-dur-days').style.display = 'none';
    document.getElementById('gt-dur-type').value = 'inf';
    document.getElementById('gt-dur-days').value = '';
    document.querySelectorAll('.gtask-mini-chip').forEach((c, i) => c.classList.toggle('sel', i === 0));
}

// Leetcode calendar
document.getElementById('leet-prev').addEventListener('click', () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
});
document.getElementById('leet-next').addEventListener('click', () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
});

function renderCalendar() {
    document.getElementById('leet-month-label').textContent = `${MONTHS[calMonth]} ${calYear}`;
    const grid = document.getElementById('leet-cal-grid');
    grid.innerHTML = '';
    const dows = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    dows.forEach(d => {
        const el = document.createElement('div');
        el.className = 'cal-dow'; el.textContent = d;
        grid.appendChild(el);
    });

    const firstDay = new Date(calYear, calMonth, 1);
    // Monday-based offset
    let offset = firstDay.getDay() - 1; if (offset < 0) offset = 6;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const todayStr = todayKey();

    for (let i = 0; i < offset; i++) {
        const el = document.createElement('div');
        el.className = 'cal-day empty'; grid.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const isPast = dateStr < todayStr;
        const isFuture = dateStr > todayStr;

        // Find tasks active on this date
        const activeTasks = tasks.filter(t => isTaskActiveOnDate(t, dateStr));
        const checkedCount = activeTasks.filter(t => t.checkedDays && t.checkedDays.includes(dateStr)).length;
        const totalActive = activeTasks.length;
        const allDone = totalActive > 0 && checkedCount === totalActive;

        const el = document.createElement('div');
        let cls = 'cal-day';
        if (isToday) cls += ' today-day';
        else if (allDone && totalActive > 0) cls += ' done-day';
        else if (isPast) cls += ' past-day';
        else if (isFuture) cls += ' future-day';
        if (totalActive > 0) cls += ' active-task-day has-task';

        el.className = cls;
        el.textContent = d;

        // Color the done days per task color(s)
        if (allDone && !isToday) {
            el.style.background = activeTasks[0].color;
        } else if (checkedCount > 0 && !isToday) {
            el.style.background = activeTasks[0].color + '60';
            el.style.color = activeTasks[0].color;
        }

        // Dots for multiple tasks
        if (totalActive > 1 && !isToday) {
            const dots = document.createElement('div');
            dots.className = 'cal-dots';
            activeTasks.slice(0, 3).forEach(t => {
                const dot = document.createElement('div');
                dot.className = 'cal-dot';
                dot.style.background = t.checkedDays && t.checkedDays.includes(dateStr) ? t.color : t.color + '60';
                dots.appendChild(dot);
            });
            el.appendChild(dots);
        }

        grid.appendChild(el);
    }
}

// Render a read-only month calendar for the opened task in the right-side panel
function renderDetailCalendar(task) {
    const label = document.getElementById('td-month-label');
    const grid = document.getElementById('td-month-grid');
    const picker = document.getElementById('td-cal-picker');
    if (!label || !grid) return;
    const month = typeof detailCalMonth === 'number' ? detailCalMonth : new Date().getMonth();
    const year = typeof detailCalYear === 'number' ? detailCalYear : new Date().getFullYear();
    label.textContent = `${MONTHS[month]} ${year}`;
    if (picker) picker.value = `${year}-${String(month + 1).padStart(2, '0')}`;
    grid.innerHTML = '';
    const dows = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    dows.forEach(d => { const el = document.createElement('div'); el.className = 'cal-dow'; el.textContent = d; grid.appendChild(el); });

    const firstDay = new Date(year, month, 1);
    let offset = firstDay.getDay() - 1; if (offset < 0) offset = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = todayKey();

    for (let i = 0; i < offset; i++) {
        const el = document.createElement('div'); el.className = 'cal-day empty'; grid.appendChild(el);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const el = document.createElement('div');
        el.className = 'cal-day';
        el.textContent = d;

        const checked = task.checkedDays && task.checkedDays.includes(dateStr);
        if (checked) {
            el.classList.add('done-day');
            el.style.background = task.color;
            el.style.color = '#fff';
        } else if (isToday) {
            el.style.background = task.color + '22';
            el.style.borderColor = task.color;
            el.style.color = task.color;
        } else {
            el.style.opacity = '0.35';
            el.style.cursor = 'default';
        }

        grid.appendChild(el);
    }
}

function isTaskActiveOnDate(task, dateStr) {
    const start = task.startDate || task.createdAt.split('T')[0];
    if (dateStr < start) return false;
    if (task.duration === null) return true;
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + task.duration - 1);
    const endStr = endDate.toISOString().split('T')[0];
    return dateStr <= endStr;
}

// Task sections (google-task style list)
function renderTasks() {
    // Hide the shared month grid on the Tasks page; calendar is shown per-task in the right-side panel
    const leetWrap = document.getElementById('leet-cal-wrap'); if (leetWrap) leetWrap.style.display = 'none';
    const container = document.getElementById('task-sections');
    const today = todayKey();

    const grouped = { todo: [], doing: [], done: [] };
    tasks.forEach(t => (grouped[t.status] || grouped.todo).push(t));

    const labels = { todo: 'To Do', doing: 'In Progress', done: 'Completed' };
    const labelClass = { todo: 'lbl-todo', doing: 'lbl-doing', done: 'lbl-done' };

    container.innerHTML = '';

    ['todo', 'doing', 'done'].forEach(col => {
        const section = document.createElement('div');
        section.className = 'task-section';

        const hdr = document.createElement('div');
        hdr.className = 'task-section-hdr';
        hdr.innerHTML = `
      <div class="section-toggle" id="toggle-${col}">
        <span class="kanban-label ${labelClass[col]}">${labels[col]}</span>
        <span style="font-size:12px;color:var(--text2);margin-left:6px">${grouped[col].length}</span>
        <span class="arrow">▾</span>
      </div>`;
        section.appendChild(hdr);

        const list = document.createElement('div');
        list.id = `task-list-${col}`;

        if (grouped[col].length === 0) {
            list.innerHTML = `<div class="empty-state" style="padding:20px"><p>Nothing here yet</p></div>`;
        } else {
            grouped[col].forEach(task => {
                const checkedToday = task.checkedDays && task.checkedDays.includes(today);
                const totalDone = task.checkedDays ? task.checkedDays.length : 0;
                const durText = task.duration === null ? '∞ days' : task.duration + ' days';
                const pct = task.duration ? Math.round(totalDone / task.duration * 100) : 0;

                const prioMap = { high: 'prio-high', medium: 'prio-medium', low: 'prio-low' };
                const prioIco = { high: '🔴', medium: '🟡', low: '🟢' };

                const item = document.createElement('div');
                item.className = 'task-list-item';
                item.innerHTML = `
          <div class="task-check-circle ${checkedToday ? 'checked' : ''}" id="chk-${task.id}"
               style="${checkedToday ? 'background:' + task.color + ';border-color:' + task.color : ''}"
               onclick="toggleTodayCheck(event,'${task.id}')">
            ${checkedToday ? `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
          </div>
          <div class="task-color-dot" style="background:${task.color}"></div>
          <div class="task-item-info">
            <div class="task-item-name" style="${checkedToday ? 'text-decoration:line-through;opacity:.6' : ''}">${task.name}</div>
            <div class="task-item-meta">
              <span class="prio-badge ${prioMap[task.priority]}">${prioIco[task.priority]} ${task.priority}</span>
              <span>${durText}</span>
              ${task.reminder ? `<span>⏰ ${task.reminder}</span>` : ''}
            </div>
            ${task.duration ? `<div style="margin-top:6px">
              <div style="height:4px;background:var(--surface2);border-radius:2px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:${task.color};border-radius:2px;transition:width .4s"></div>
              </div>
              <div style="font-size:10px;color:var(--text2);margin-top:2px">${totalDone}/${task.duration} days · ${pct}%</div>
            </div>`: `<div style="font-size:10px;color:var(--text2);margin-top:2px">${totalDone} days completed</div>`}
          </div>`;
                item.addEventListener('click', e => {
                    if (e.target.closest('.task-check-circle')) return;
                    openTaskDetail(task.id);
                });
                list.appendChild(item);
            });
        }

        section.appendChild(list);
        container.appendChild(section);
    });
}

function toggleTodayCheck(e, id) {
    e.stopPropagation();
    const task = tasks.find(t => t.id === id); if (!task) return;
    if (!task.checkedDays) task.checkedDays = [];
    const today = todayKey();
    if (task.checkedDays.includes(today)) {
        task.checkedDays = task.checkedDays.filter(x => x !== today);
        toast('Unchecked today');
    } else {
        task.checkedDays.push(today);
        toast('✓ Completed today!');
    }
    S.set('ht_tasks', tasks);
    renderTasks();
    renderHome();
}

// ══ TASK DETAIL ══
let detailTaskId = null;

function openTaskDetail(id) {
    const task = tasks.find(t => t.id === id); if (!task) return;
    detailTaskId = id;
    document.getElementById('td-name').textContent = task.name;
    const durText = task.duration === null ? '∞ ongoing' : task.duration + ' days';
    document.getElementById('td-meta').innerHTML = `
    <span style="margin-right:8px">📂 ${task.category}</span>
    <span style="margin-right:8px">📅 ${durText}</span>
    ${task.reminder ? `<span>⏰ ${task.reminder}</span>` : ''}
    ${task.notes ? `<div style="margin-top:6px;font-size:13px">${task.notes}</div>` : ''}
  `;

    // Initialize detail calendar to current month/year and render it
    detailCalMonth = new Date().getMonth();
    detailCalYear = new Date().getFullYear();
    renderDetailCalendar(task);

    // Completed button
    const today = todayKey();
    const alreadyDone = task.checkedDays && task.checkedDays.includes(today);
    const btn = document.getElementById('td-complete-btn');
    btn.className = 'completed-btn' + (alreadyDone ? ' already-done' : '');
    btn.innerHTML = alreadyDone
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg> Today Completed ✓`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg> Mark Today as Completed`;

    // No status or per-day grid in this panel — calendar-only UI

    document.getElementById('task-detail-modal').classList.add('open');
}

// Completed button handler
document.getElementById('td-complete-btn').addEventListener('click', () => {
    const task = tasks.find(t => t.id === detailTaskId); if (!task) return;
    const today = todayKey();
    if (!task.checkedDays) task.checkedDays = [];
    if (task.checkedDays.includes(today)) {
        toast('Already completed today!');
        return;
    }
    task.checkedDays.push(today);
    // Auto-move to doing if still todo
    if (task.status === 'todo') { task.status = 'doing'; }
    S.set('ht_tasks', tasks);
    openTaskDetail(detailTaskId);
    renderTasks(); renderHome();
    toast('🎉 Day completed!');
});

document.getElementById('td-close').addEventListener('click', () => {
    document.getElementById('task-detail-modal').classList.remove('open');
});
document.getElementById('task-detail-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) document.getElementById('task-detail-modal').classList.remove('open');
});

// status buttons removed; no handlers needed

// Calendar navigation in task detail panel
document.getElementById('td-cal-prev').addEventListener('click', () => {
    detailCalMonth--; if (detailCalMonth < 0) { detailCalMonth = 11; detailCalYear--; }
    const task = tasks.find(t => t.id === detailTaskId); if (task) renderDetailCalendar(task);
});
document.getElementById('td-cal-next').addEventListener('click', () => {
    detailCalMonth++; if (detailCalMonth > 11) { detailCalMonth = 0; detailCalYear++; }
    const task = tasks.find(t => t.id === detailTaskId); if (task) renderDetailCalendar(task);
});
document.getElementById('td-cal-picker').addEventListener('change', function () {
    if (!this.value) return;
    const parts = this.value.split('-'); if (parts.length < 2) return;
    detailCalYear = parseInt(parts[0], 10); detailCalMonth = parseInt(parts[1], 10) - 1;
    const task = tasks.find(t => t.id === detailTaskId); if (task) renderDetailCalendar(task);
});

document.getElementById('td-edit').addEventListener('click', () => {
    document.getElementById('task-detail-modal').classList.remove('open');
    openEditModal(tasks.find(t => t.id === detailTaskId));
});

document.getElementById('td-delete').addEventListener('click', () => {
    if (!confirm('Delete this task?')) return;
    tasks = tasks.filter(t => t.id !== detailTaskId);
    S.set('ht_tasks', tasks);
    document.getElementById('task-detail-modal').classList.remove('open');
    renderTasks(); toast('Task deleted');
});

// ══ EDIT MODAL ══
let editingTaskId = null;
let editColor = '#c8956c';

function openEditModal(task) {
    if (!task) return;
    editingTaskId = task.id;
    document.getElementById('t-name').value = task.name;
    document.getElementById('t-category').value = task.category;
    document.getElementById('t-duration').value = task.duration === null ? '' : task.duration;
    document.getElementById('t-priority').value = task.priority;
    document.getElementById('t-reminder').value = task.reminder || '';
    editColor = task.color;
    document.querySelectorAll('#t-color-chips .chip').forEach(c => c.classList.toggle('sel', c.dataset.c === editColor));
    document.getElementById('task-edit-modal').classList.add('open');
}

document.getElementById('t-color-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    document.querySelectorAll('#t-color-chips .chip').forEach(c => c.classList.remove('sel'));
    chip.classList.add('sel'); editColor = chip.dataset.c;
});

document.getElementById('task-cancel').addEventListener('click', () => {
    document.getElementById('task-edit-modal').classList.remove('open');
});

document.getElementById('task-edit-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) document.getElementById('task-edit-modal').classList.remove('open');
});

document.getElementById('task-save').addEventListener('click', () => {
    const name = document.getElementById('t-name').value.trim();
    if (!name) { toast('Please enter a task name'); return; }
    const dur = document.getElementById('t-duration').value.trim();
    const task = tasks.find(t => t.id === editingTaskId); if (!task) return;
    task.name = name;
    task.category = document.getElementById('t-category').value;
    task.duration = dur === '' ? null : (parseInt(dur) || 30);
    task.priority = document.getElementById('t-priority').value;
    task.reminder = document.getElementById('t-reminder').value.trim();
    task.color = editColor;
    S.set('ht_tasks', tasks);
    document.getElementById('task-edit-modal').classList.remove('open');
    renderTasks(); toast('Task updated!');
});

// ══ FOOD ══
let foodYear = new Date().getFullYear();
let foodMonth = new Date().getMonth();

document.getElementById('food-prev').addEventListener('click', () => { foodMonth--; if (foodMonth < 0) { foodMonth = 11; foodYear--; } renderFood(); });
document.getElementById('food-next').addEventListener('click', () => { foodMonth++; if (foodMonth > 11) { foodMonth = 0; foodYear++; } renderFood(); });

function foodKey(r, c) { return `${foodYear}-${foodMonth}-${r}-${c}`; }

function renderFood() {
    document.getElementById('food-month-label').textContent = `${MONTHS[foodMonth]} ${foodYear}`;
    const days = new Date(foodYear, foodMonth + 1, 0).getDate();
    const tbody = document.getElementById('food-tbody');
    tbody.innerHTML = '';
    for (let r = 1; r <= days; r++) {
        const tr = document.createElement('tr');
        const dayTd = document.createElement('td');
        dayTd.textContent = r;
        const today = new Date();
        if (today.getFullYear() === foodYear && today.getMonth() === foodMonth && today.getDate() === r) {
            dayTd.style.color = 'var(--accent)'; dayTd.style.fontWeight = '700';
        }
        tr.appendChild(dayTd);
        for (let c = 0; c < 6; c++) {
            const td = document.createElement('td');
            const key = foodKey(r, c);
            const ta = document.createElement('textarea');
            ta.className = 'food-cell';
            ta.value = foodData[key] || '';
            ta.rows = 1; ta.placeholder = '…';
            ta.addEventListener('input', function () {
                this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';
                foodData[foodKey(r, c)] = this.value;
                S.set('ht_food', foodData);
            });
            ta.addEventListener('focus', function () { this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px'; });
            if (ta.value) { setTimeout(() => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }, 0); }
            td.appendChild(ta); tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

// ══ NOTES ══
let editingNoteId = null;
document.getElementById('add-note-btn').addEventListener('click', () => openNoteEditor());
document.getElementById('ne-back').addEventListener('click', () => { document.getElementById('note-editor').classList.remove('open'); renderNotes(); });
document.getElementById('ne-save').addEventListener('click', saveNote);
document.getElementById('notes-search').addEventListener('input', renderNotes);

function openNoteEditor(note = null) {
    editingNoteId = note ? note.id : null;
    document.getElementById('ne-title').value = note ? note.title : '';
    document.getElementById('ne-body').value = note ? note.body : '';
    document.getElementById('ne-tags').value = note ? (note.tags || []).join(', ') : '';
    document.getElementById('ne-saved-date').textContent = note ? formatDate(note.updatedAt) : '';
    document.getElementById('note-editor').classList.add('open');
    setTimeout(() => document.getElementById('ne-body').focus(), 100);
}

function saveNote() {
    const title = document.getElementById('ne-title').value.trim() || 'Untitled';
    const body = document.getElementById('ne-body').value.trim();
    const tagsRaw = document.getElementById('ne-tags').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const now = new Date().toISOString();
    const note = {
        id: editingNoteId || Date.now().toString(),
        title, body, tags,
        createdAt: editingNoteId ? notes.find(n => n.id === editingNoteId)?.createdAt : now,
        updatedAt: now,
    };
    if (editingNoteId) notes = notes.map(n => n.id === editingNoteId ? note : n);
    else notes.unshift(note);
    S.set('ht_notes', notes);
    document.getElementById('note-editor').classList.remove('open');
    renderNotes(); toast('Note saved!');
}

const TAG_COLORS = ['#fef0e4', '#eaf3ea', '#e8eff8', '#fce8ed', '#f3f0e4', '#ede8f3'];
const TAG_TEXT = ['#c8956c', '#5a8c56', '#4a7aaa', '#c4879b', '#8a7a3a', '#7a5ac8'];

function renderNotes() {
    const q = document.getElementById('notes-search').value.toLowerCase();
    const filtered = notes.filter(n =>
        n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
    );
    const el = document.getElementById('notes-list');
    if (filtered.length === 0) {
        el.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>No notes yet. Tap + to create one.</p></div>';
        return;
    }
    el.innerHTML = filtered.map(note => {
        const tagsHtml = (note.tags || []).slice(0, 3).map((t, i) => {
            const ci = t.charCodeAt(0) % TAG_COLORS.length;
            return `<span class="tag" style="background:${TAG_COLORS[ci]};color:${TAG_TEXT[ci]}">${t}</span>`;
        }).join('');
        return `<div class="note-card" onclick="openNoteEditor(notes.find(n=>n.id==='${note.id}'))">
      <div class="note-top">
        <div class="note-title">${note.title}</div>
        <div class="note-date">${formatDate(note.updatedAt)}</div>
      </div>
      <div class="note-preview">${note.body || '<em style="opacity:.5">No content</em>'}</div>
      ${tagsHtml ? `<div class="note-tags">${tagsHtml}</div>` : ''}
    </div>`;
    }).join('');
}

// ══ HELPERS ══
function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ══ INIT ══
function init() {
    loadData();
    renderHome();
    renderTasks();
    renderFood();
    renderNotes();
}

if (currentUser && users[currentUser]) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').classList.add('visible');
    init();
}