const STAGES = [40, 35, 30, 25, 20, 15, 10, 5, 0];

function getState() {
	const data = localStorage.getItem('ritm_state');
	return data ? JSON.parse(data) : { history: [] };
}

function saveState(state) {
	localStorage.setItem('ritm_state', JSON.stringify(state));
	render();
}

function addWorkout() {
	const state = getState();
	const today = new Date().toISOString().split('T')[0];
	state.history.push(today);
	saveState(state);
}

function render() {
	const state = getState();
	const total = state.history.length;
	const stageIdx = Math.min(Math.floor(total / 10), STAGES.length - 1);
	const dayInStage = (total % 10) + 1;
	const currentRest = STAGES[stageIdx];

	// Обновление главного экрана
	document.getElementById('header-streak').innerText = total;
	document.getElementById('rest-sec').innerText = currentRest;
	document.getElementById('current-day').innerText = dayInStage > 10 ? 10 : dayInStage;
	document.getElementById('current-stage').innerText = stageIdx + 1;
	document.getElementById('total-count').innerText = total;
	document.getElementById('streak-count').innerText = total;

	// Шкала тиков (10 штук)
	const ticksContainer = document.getElementById('scale-ticks');
	ticksContainer.innerHTML = '';
	for (let i = 0; i < 10; i++) {
		const tick = document.createElement('div');
		tick.className = 'tick' + (i < (total % 10) ? ' active' : '');
		ticksContainer.appendChild(tick);
	}

	// Этапы
	const stagesContainer = document.getElementById('stages-list');
	stagesContainer.innerHTML = '';
	STAGES.forEach((sec, idx) => {
		const count = Math.min(Math.max(total - idx * 10, 0), 10);
		const div = document.createElement('div');
		div.className = 'stage' + (idx === stageIdx ? ' now' : '');
		div.innerHTML = `
			<div class="sec">${sec}<span class="sec-unit">с</span></div>
			<div class="body">
				<div class="name">Этап ${idx + 1}</div>
				<div class="bar"><i style="width:${count * 10}%"></i></div>
			</div>
			<div class="cnt">${count}/10</div>
		`;
		stagesContainer.appendChild(div);
	});
}

// Переключение вкладок
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

document.getElementById('btn-done').addEventListener('click', () => {
	addWorkout();
});

render();