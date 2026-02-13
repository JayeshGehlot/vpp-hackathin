
// State
let appState = {
    plan: null,
    loading: false,
    difficulty: 'Intermediate'
};

// Utils
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
    });
}

// DOM Elements
const views = {
    generator: document.getElementById('generator-view'),
    dashboard: document.getElementById('dashboard-view')
};

const elements = {
    form: document.getElementById('plan-form'),
    subject: document.getElementById('subject'),
    goal: document.getElementById('goal'),
    startDate: document.getElementById('start-date'),
    endDate: document.getElementById('end-date'),
    dailyMinutes: document.getElementById('daily-minutes'),
    generateBtn: document.getElementById('generate-btn'),
    btnText: document.getElementById('btn-text'),
    errorToast: document.getElementById('error-toast'),
    errorMessage: document.getElementById('error-message'),
    difficultyBtns: document.querySelectorAll('#difficulty-selector button'),
    
    // Dashboard
    planSubject: document.getElementById('plan-subject'),
    planGoal: document.getElementById('plan-goal'),
    planDuration: document.getElementById('plan-duration'),
    progressText: document.getElementById('progress-percent-text'),
    progressBar: document.getElementById('progress-bar-fill'),
    progressCircle: document.getElementById('progress-circle-fill'),
    navSubject: document.getElementById('nav-subject'),
    scheduleContainer: document.getElementById('content-schedule'),
    resetBtn: document.getElementById('reset-plan-btn'),
    
    // Tabs
    tabSchedule: document.getElementById('tab-schedule'),
    tabAnalytics: document.getElementById('tab-analytics'),
    contentSchedule: document.getElementById('content-schedule'),
    contentAnalytics: document.getElementById('content-analytics'),
    analyticsChart: document.getElementById('analytics-chart'),
    analyticsLabels: document.getElementById('analytics-labels')
};

// Initialization
function init() {
    // Set default dates
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 14);
    
    if (elements.startDate && elements.endDate) {
        elements.startDate.valueAsDate = today;
        elements.endDate.valueAsDate = nextWeek;
    }

    // Load saved plan
    const saved = localStorage.getItem('mindArchitect_plan');
    if (saved) {
        try {
            appState.plan = JSON.parse(saved);
            renderDashboard();
        } catch (e) {
            console.error(e);
            localStorage.removeItem('mindArchitect_plan');
        }
    } else {
        showView('generator');
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

// Event Listeners
if (elements.difficultyBtns) {
    elements.difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            appState.difficulty = btn.dataset.value;
            updateDifficultyUI();
        });
    });
}

if (elements.form) {
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await generatePlan();
    });
}

if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete this study plan?")) {
            appState.plan = null;
            localStorage.removeItem('mindArchitect_plan');
            showView('generator');
        }
    });
}

if (elements.tabSchedule) elements.tabSchedule.addEventListener('click', () => switchTab('schedule'));
if (elements.tabAnalytics) elements.tabAnalytics.addEventListener('click', () => switchTab('analytics'));

// Logic
function updateDifficultyUI() {
    elements.difficultyBtns.forEach(btn => {
        if (btn.dataset.value === appState.difficulty) {
            btn.className = "flex-1 py-2 text-sm font-medium rounded-lg transition-all bg-white text-indigo-600 shadow-sm";
        } else {
            btn.className = "flex-1 py-2 text-sm font-medium rounded-lg transition-all text-slate-500 hover:text-slate-700";
        }
    });
}

function showView(viewName) {
    if (viewName === 'generator') {
        if(views.generator) views.generator.classList.remove('hidden');
        if(views.dashboard) views.dashboard.classList.add('hidden');
    } else {
        if(views.generator) views.generator.classList.add('hidden');
        if(views.dashboard) views.dashboard.classList.remove('hidden');
    }
}

function switchTab(tab) {
    if (tab === 'schedule') {
        elements.contentSchedule.classList.remove('hidden');
        elements.contentAnalytics.classList.add('hidden');
        
        elements.tabSchedule.classList.add('text-indigo-600');
        elements.tabSchedule.classList.remove('text-slate-500');
        elements.tabSchedule.innerHTML = `Daily Schedule<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>`;
        
        elements.tabAnalytics.classList.remove('text-indigo-600');
        elements.tabAnalytics.classList.add('text-slate-500');
        elements.tabAnalytics.innerHTML = `Analytics & Insights`;
    } else {
        renderAnalytics();
        elements.contentSchedule.classList.add('hidden');
        elements.contentAnalytics.classList.remove('hidden');
        
        elements.tabAnalytics.classList.add('text-indigo-600');
        elements.tabAnalytics.classList.remove('text-slate-500');
        elements.tabAnalytics.innerHTML = `Analytics & Insights<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>`;
        
        elements.tabSchedule.classList.remove('text-indigo-600');
        elements.tabSchedule.classList.add('text-slate-500');
        elements.tabSchedule.innerHTML = `Daily Schedule`;
    }
}

async function generatePlan() {
    setLoading(true);
    elements.errorToast.classList.add('hidden');

    const params = {
        subject: elements.subject.value,
        goal: elements.goal.value,
        startDate: elements.startDate.value,
        endDate: elements.endDate.value,
        dailyMinutes: parseInt(elements.dailyMinutes.value),
        difficulty: appState.difficulty
    };

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
             let errorMsg = 'Failed to generate plan';
             try {
                 const errData = await response.json();
                 if (errData.error) errorMsg = errData.error;
             } catch(e) {}
             throw new Error(errorMsg);
        }
        
        const data = await response.json();
        
        // Transform data
        const planDays = data.schedule.map(day => {
            const date = new Date(params.startDate);
            date.setDate(date.getDate() + day.dayOffset);
            return {
                dayNumber: day.dayOffset + 1,
                date: date.toISOString(),
                theme: day.theme,
                tasks: day.tasks.map(t => ({
                    id: generateId(),
                    title: t.title,
                    description: t.description,
                    estimatedMinutes: t.minutes,
                    completed: false
                }))
            };
        });

        appState.plan = {
            id: generateId(),
            subject: params.subject,
            goal: params.goal,
            dailyMinutes: params.dailyMinutes,
            days: planDays,
            totalTasks: planDays.reduce((acc, d) => acc + d.tasks.length, 0),
            completedTasks: 0
        };

        savePlan();
        renderDashboard();

    } catch (err) {
        console.error(err);
        elements.errorMessage.innerText = err.message || "Something went wrong.";
        elements.errorToast.classList.remove('hidden');
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading) {
    appState.loading = isLoading;
    if (elements.generateBtn) {
        elements.generateBtn.disabled = isLoading;
        // Lucide replaces <i> with <svg>, so we try to find the SVG first (post-init), then fallback to i (pre-init)
        const icon = elements.generateBtn.querySelector('svg') || elements.generateBtn.querySelector('i');
        
        if (isLoading) {
            if(elements.btnText) elements.btnText.innerText = "Generating...";
            if (icon) icon.classList.add('animate-spin'); 
        } else {
            if(elements.btnText) elements.btnText.innerText = "Generate Plan";
            if (icon) icon.classList.remove('animate-spin');
        }
    }
}

function savePlan() {
    if (appState.plan) {
        // Recalculate stats
        const totalCompleted = appState.plan.days.reduce((acc, day) => 
            acc + day.tasks.filter(t => t.completed).length, 0
        );
        appState.plan.completedTasks = totalCompleted;
        localStorage.setItem('mindArchitect_plan', JSON.stringify(appState.plan));
    }
}

function renderDashboard() {
    const plan = appState.plan;
    if (!plan) return;

    // Header Stats
    if(elements.planSubject) {
        elements.planSubject.innerText = plan.subject;
        elements.planSubject.title = plan.subject;
    }
    if(elements.navSubject) elements.navSubject.innerText = `Current Plan: ${plan.subject}`;
    if(elements.planGoal) elements.planGoal.innerText = plan.goal;
    if(elements.planDuration) elements.planDuration.innerText = `${plan.days.length} Day Plan`;

    updateProgress();
    renderSchedule();
    showView('dashboard');
    switchTab('schedule'); // Default tab
}

function updateProgress() {
    const plan = appState.plan;
    const progress = Math.round((plan.completedTasks / plan.totalTasks) * 100) || 0;
    
    if(elements.progressText) elements.progressText.innerText = `${progress}%`;
    if(elements.progressBar) elements.progressBar.style.width = `${progress}%`;
    if(elements.progressCircle) elements.progressCircle.style.height = `${progress}%`;
}

function renderSchedule() {
    const container = elements.scheduleContainer;
    if(!container) return;
    container.innerHTML = '';

    appState.plan.days.forEach((day, dayIndex) => {
        const completedCount = day.tasks.filter(t => t.completed).length;
        
        const dayEl = document.createElement('div');
        dayEl.className = 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow';
        
        // Header
        const header = `
            <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span class="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md">Day ${day.dayNumber}</span>
                        ${day.theme}
                    </h3>
                    <p class="text-slate-500 text-xs mt-1 flex items-center gap-1">
                        <i data-lucide="calendar" class="w-3 h-3"></i> ${formatDate(day.date)}
                    </p>
                </div>
                <div class="text-slate-400">
                    <span class="text-xs font-medium bg-white px-2 py-1 rounded-full border border-slate-200">
                        ${completedCount} / ${day.tasks.length} Done
                    </span>
                </div>
            </div>
        `;

        // Tasks
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'divide-y divide-slate-100';

        day.tasks.forEach((task, taskIndex) => {
            const taskEl = document.createElement('div');
            taskEl.className = `px-6 py-4 flex items-start gap-4 transition-colors ${task.completed ? 'bg-slate-50/50' : 'hover:bg-indigo-50/30'}`;
            
            taskEl.innerHTML = `
                <button class="mt-1 flex-shrink-0 transition-colors ${task.completed ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-500'}">
                    <i data-lucide="${task.completed ? 'check-circle-2' : 'circle'}" class="w-6 h-6"></i>
                </button>
                <div class="flex-1">
                    <h4 class="text-sm font-semibold text-slate-800 transition-all ${task.completed ? 'text-slate-400 line-through' : ''}">
                        ${task.title}
                    </h4>
                    <p class="text-sm text-slate-500 mt-1 ${task.completed ? 'text-slate-400' : ''}">
                        ${task.description}
                    </p>
                </div>
                <div class="flex-shrink-0 flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded">
                    <i data-lucide="clock" class="w-3 h-3"></i>
                    ${task.estimatedMinutes}m
                </div>
            `;

            // Interaction
            const btn = taskEl.querySelector('button');
            btn.addEventListener('click', () => {
                toggleTask(dayIndex, task.id);
            });

            tasksContainer.appendChild(taskEl);
        });

        dayEl.innerHTML = header;
        dayEl.appendChild(tasksContainer);
        container.appendChild(dayEl);
    });

    if(window.lucide) lucide.createIcons();
}

function toggleTask(dayIndex, taskId) {
    const day = appState.plan.days[dayIndex];
    const task = day.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        savePlan();
        updateProgress(); // Quick update
        renderSchedule(); // Full re-render to update classes
    }
}

function renderAnalytics() {
    const container = elements.analyticsChart;
    const labelsContainer = elements.analyticsLabels;
    if(!container || !labelsContainer) return;
    
    container.innerHTML = '';
    labelsContainer.innerHTML = '';
    
    const maxTasks = Math.max(...appState.plan.days.map(d => d.tasks.length)) || 1;

    appState.plan.days.forEach(day => {
        const total = day.tasks.length;
        const completed = day.tasks.filter(t => t.completed).length;
        const heightPercent = total > 0 ? (total / maxTasks) * 100 : 0;
        const completedHeightPercent = total > 0 ? (completed / total) * 100 : 0;

        // Bar container
        const barWrapper = document.createElement('div');
        barWrapper.className = "flex-1 flex flex-col justify-end h-full gap-1 group relative";
        
        // Tooltip
        const tooltip = `
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                Day ${day.dayNumber}: ${completed}/${total}
            </div>
        `;
        
        // The Bar
        const barBg = document.createElement('div');
        barBg.className = "w-full bg-slate-200 rounded-t-sm relative overflow-hidden transition-all duration-300";
        barBg.style.height = `${heightPercent}%`;
        
        const barFill = document.createElement('div');
        barFill.className = "absolute bottom-0 left-0 right-0 bg-indigo-600 transition-all duration-300";
        barFill.style.height = `${completedHeightPercent}%`;

        barBg.appendChild(barFill);
        barWrapper.innerHTML = tooltip;
        barWrapper.appendChild(barBg);
        container.appendChild(barWrapper);

        // Label
        const label = document.createElement('div');
        label.className = "flex-1 text-center truncate px-0.5";
        label.innerText = `D${day.dayNumber}`;
        labelsContainer.appendChild(label);
    });
}

init();
