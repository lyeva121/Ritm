const STAGES = [40, 35, 30, 25, 20, 15, 10, 5, 0];
const MONTH_NAMES = [
	'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
	'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Получение состояния из localStorage
function getState() {
	const data = localStorage.getItem('ritm_state');
	return data ? JSON.parse(data) : { history: [] };
}

// Сохранение состояния и обновление UI
function saveState(state) {
	localStorage.setItem('ritm_state', JSON.stringify(state));
	render();
}

// Получение сегодняшней даты в формате YYYY-MM-DD (в локальном часовом поясе)
function getTodayString() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// Добавление тренировки (не более одной в день)
function addWorkout() {
	const state = getState();
	const today = getTodayString();
	
	if (!state.history.includes(today)) {
		state.history.push(today);
		saveState(state);
	}
}

// Расчет количества дней подряд (стрик)
function calculateStreak(history) {
	if (!history || history.length === 0) return 0;
	
	const set = new Set(history);
	let streak = 0;
	let checkDate = new Date();
	
	// Если сегодня тренировки ещё не было, проверяем со вчерашнего дня
	let todayStr = getTodayString();
	if (!set.has(todayStr)) {
		checkDate.setDate(checkDate.getDate() - 1);
	}

	while (true) {
		const year = checkDate.getFullYear();
		const month = String(checkDate.getMonth() + 1).padStart(2, '0');
		const day = String(checkDate.getDate()).padStart(2, '0');
		const dateStr = `${year}-${month}-${day}`;

		if (set.has(dateStr)) {
			streak++;
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			break;
		}
	}

	return streak;
}

// Отрисовка всего интерфейса
function render() {
	const state = getState();
	const total = state.history.length;
	const todayStr = getTodayString();
	const isDoneToday = state.history.includes(todayStr);

	const stageIdx = Math.min(Math.floor(total / 10), STAGES.length - 1);
	const dayInStage = (total % 10) + 1;
	const currentRest = STAGES[stageIdx];
	const streak = calculateStreak(state.history);

	// --- 1. Шапка и счетчики ---
	document.getElementById('header-streak').innerText = streak;
	document.getElementById('rest-sec').innerText = currentRest;
	document.getElementById('current-day').innerText = dayInStage > 10 ? 10 : dayInStage;
	document.getElementById('current-stage').innerText = stageIdx + 1;
	document.getElementById('total-count').innerText = total;
	document.getElementById('streak-count').innerText = streak;

	// --- 2. Кнопка "Выполнено" ---
	const btnDone = document.getElementById('btn-done');
	const hintText = document.getElementById('hint-text');

	if (isDoneToday) {
		btnDone.innerText = 'Сегодня тренировка выполнена ✓';
		btnDone.disabled = true;
		btnDone.classList.add('disabled');
	} else {
		btnDone.innerText = 'Тренировка выполнена';
		btnDone.disabled = false;
		btnDone.classList.remove('disabled');
	}

	// Подсказка под кнопкой
	if (stageIdx < STAGES.length - 1) {
		const leftInStage = 10 - (total % 10);
		const nextRest = STAGES[stageIdx + 1];
		hintText.innerHTML = `Ещё <b>${leftInStage} тренировок</b> — и отдых сократится до <b>${nextRest} секунд</b>.`;
	} else {
		hintText.innerHTML = `<b>Вы достигли финального этапа!</b> Отдых равен 0 секунд.`;
	}

	// --- 3. Шкала тиков (10 штук на этапе) ---
	const ticksContainer = document.getElementById('scale-ticks');
	ticksContainer.innerHTML = '';
	const currentProgressInStage = total % 10;
	for (let i = 0; i < 10; i++) {
		const tick = document.createElement('div');
		tick.className = 'tick' + (i < currentProgressInStage ? ' active' : '');
		ticksContainer.appendChild(tick);
	}

	// --- 4. Шаги (Путь до нуля) ---
	const stepsContainer = document.getElementById('path-steps');
	stepsContainer.innerHTML = '';
	STAGES.forEach((sec, idx) => {
		const stepDiv = document.createElement('div');
		stepDiv.className = 'step' + (idx === stageIdx ? ' now' : '');
		stepDiv.innerText = sec;
		stepsContainer.appendChild(stepDiv);
	});

	// --- 5. Экран "Этапы" ---
	const stagesContainer = document.getElementById('stages-list');
	stagesContainer.innerHTML = '';
	STAGES.forEach((sec, idx) => {
		const count = Math.min(Math.max(total - idx * 10, 0), 10);
		const div = document.createElement('div');
		div.className = 'stage' + (idx === stageIdx ? ' now' : '');
		div.innerHTML = `
			<div class="sec">${sec}<span class="sec-unit">с</span></div>
			<div class="body">
				<div class="name">Этап ${idx + 1}${sec === 0 ? ' · без отдыха' : ''}${idx === stageIdx ? ' · идёт сейчас' : ''}</div>
				<div class="bar"><i style="width:${count * 10}%"></i></div>
			</div>
			<div class="cnt">${count}/10</div>
		`;
		stagesContainer.appendChild(div);
	});

	// --- 6. Календарь истории ---
	renderCalendar(state.history);
}

// Построение календаря за текущий месяц
function renderCalendar(history) {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth();
	const todayDate = now.getDate();

	const monthTitle = document.getElementById('cal-month-title');
	monthTitle.innerText = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

	const daysContainer = document.getElementById('calendar-days');
	daysContainer.innerHTML = '';

	const historySet = new Set(history);

	// Первый и последний день месяца
	const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
	const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
	const daysInMonth = lastDayOfMonth.getDate();

	// Смещение первого дня месяца (0 - Понедельник, 6 - Воскресенье)
	let firstDayIndex = firstDayOfMonth.getDay() - 1;
	if (firstDayIndex === -1) firstDayIndex = 6;

	// Пустые ячейки в начале календаря
	for (let i = 0; i < firstDayIndex; i++) {
		const emptyCell = document.createElement('div');
		emptyCell.className = 'day empty';
		daysContainer.appendChild(emptyCell);
	}

	// Ячейки дней месяца
	for (let d = 1; d <= daysInMonth; d++) {
		const dayCell = document.createElement('div');
		const monthStr = String(currentMonth + 1).padStart(2, '0');
		const dayStr = String(d).padStart(2, '0');
		const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

		let className = 'day';

		if (d === todayDate) {
			className += ' today';
		}

		if (historySet.has(dateKey)) {
			className += ' done'; // Тренировка сделана
		} else if (d < todayDate) {
			className += ' miss'; // Пропущенный день
		}

		dayCell.className = className;
		dayCell.innerText = d;
		daysContainer.appendChild(dayCell);
	}
}

// Настройка переключения вкладок
document.querySelectorAll('.tabs .tab').forEach(tab => {
	tab.addEventListener('click', (e) => {
		e.preventDefault();
		document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('on'));
		tab.classList.add('on');

		document.querySelectorAll('.view-tab').forEach(v => v.style.display = 'none');
		if (tab.id === 'tab-today') document.getElementById('view-today').style.display = 'block';
		if (tab.id === 'tab-stages') document.getElementById('view-stages').style.display = 'block';
		if (tab.id === 'tab-history') document.getElementById('view-history').style.display = 'block';
	});
});

// Обработчик нажатия на кнопку "Тренировка выполнена"
document.getElementById('btn-done').addEventListener('click', () => {
	addWorkout();
});

// Первоначальный рендер при загрузке
render();