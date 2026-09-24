(function () {
	const dataEl = document.getElementById("trivia-data");
	if (!dataEl) return;

	const trivia = JSON.parse(dataEl.textContent);

	const builder = document.getElementById("quiz-builder");
	const player = document.getElementById("quiz-player");
	const form = document.getElementById("quiz-form");
	const lengthInput = document.getElementById("quiz-length");
	const availabilityEl = document.getElementById("quiz-availability");
	const startBtn = form.querySelector('button[type="submit"]');

	function escapeHtml(str) {
		return String(str ?? "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function uniqueSorted(key, rankMap) {
		const values = [...new Set(trivia.map((q) => q[key]))];
		if (rankMap) {
			return values.sort((a, b) => (rankMap[a] ?? 99) - (rankMap[b] ?? 99) || a.localeCompare(b));
		}
		return values.sort((a, b) => a.localeCompare(b));
	}

	const uniqueSeries = uniqueSorted("series");
	const uniqueAuthors = uniqueSorted("author");
	const uniqueDifficulties = uniqueSorted("difficulty", { Easy: 0, Medium: 1, Hard: 2 });

	function setupFilterGroup({
		values,
		optionsEl,
		checkboxClass,
		searchEl,
		badgeEl,
		selectAllBtn,
		selectNoneBtn,
		onChange,
	}) {
		optionsEl.innerHTML = values
			.map(
				(v) =>
					`<label><input type="checkbox" class="${checkboxClass}" value="${escapeHtml(v)}" checked> ${escapeHtml(v)}</label>`,
			)
			.join("");

		function getSelected() {
			return Array.from(optionsEl.querySelectorAll(`.${checkboxClass}:checked`)).map((cb) => cb.value);
		}

		function updateBadge() {
			if (badgeEl) badgeEl.textContent = `(${getSelected().length} of ${values.length} selected)`;
		}

		if (searchEl) {
			searchEl.addEventListener("input", () => {
				const term = searchEl.value.trim().toLowerCase();
				optionsEl.querySelectorAll("label").forEach((label) => {
					label.classList.toggle("is-hidden", !label.textContent.toLowerCase().includes(term));
				});
			});
		}

		if (selectAllBtn) {
			selectAllBtn.addEventListener("click", () => {
				optionsEl.querySelectorAll(`label:not(.is-hidden) .${checkboxClass}`).forEach((cb) => (cb.checked = true));
				updateBadge();
				onChange();
			});
		}
		if (selectNoneBtn) {
			selectNoneBtn.addEventListener("click", () => {
				optionsEl.querySelectorAll(`label:not(.is-hidden) .${checkboxClass}`).forEach((cb) => (cb.checked = false));
				updateBadge();
				onChange();
			});
		}

		optionsEl.addEventListener("change", (e) => {
			if (e.target.matches(`.${checkboxClass}`)) {
				updateBadge();
				onChange();
			}
		});

		updateBadge();
		return { getSelected, updateBadge };
	}

	let seriesFilter, authorFilter, difficultyFilter;

	function filteredQuestions() {
		const series = seriesFilter.getSelected();
		const authors = authorFilter.getSelected();
		const difficulties = difficultyFilter.getSelected();
		return trivia.filter(
			(q) => series.includes(q.series) && authors.includes(q.author) && difficulties.includes(q.difficulty),
		);
	}

	function updateAvailability() {
		const count = filteredQuestions().length;
		if (count === 0) {
			availabilityEl.textContent =
				"No questions match those filters — try selecting more series, authors, or difficulties.";
			startBtn.disabled = true;
		} else {
			availabilityEl.textContent = `${count} question${count === 1 ? "" : "s"} available with these filters.`;
			startBtn.disabled = false;
		}
		lengthInput.max = count || 1;
		if (Number(lengthInput.value) > count) lengthInput.value = count || 1;
	}

	seriesFilter = setupFilterGroup({
		values: uniqueSeries,
		optionsEl: document.getElementById("series-options"),
		checkboxClass: "series-checkbox",
		searchEl: document.getElementById("series-search"),
		badgeEl: document.getElementById("series-badge"),
		selectAllBtn: document.getElementById("series-select-all"),
		selectNoneBtn: document.getElementById("series-select-none"),
		onChange: updateAvailability,
	});

	authorFilter = setupFilterGroup({
		values: uniqueAuthors,
		optionsEl: document.getElementById("author-options"),
		checkboxClass: "author-checkbox",
		searchEl: document.getElementById("author-search"),
		badgeEl: document.getElementById("author-badge"),
		selectAllBtn: document.getElementById("author-select-all"),
		selectNoneBtn: document.getElementById("author-select-none"),
		onChange: updateAvailability,
	});

	difficultyFilter = setupFilterGroup({
		values: uniqueDifficulties,
		optionsEl: document.getElementById("difficulty-options"),
		checkboxClass: "difficulty-checkbox",
		onChange: updateAvailability,
	});

	lengthInput.value = Math.min(10, trivia.length);
	updateAvailability();

	function shuffle(arr) {
		const a = arr.slice();
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	let quizQuestions = [];
	let currentIndex = 0;
	let score = { correct: 0, incorrect: 0 };

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const pool = filteredQuestions();
		if (pool.length === 0) return;

		const requested = Math.max(1, Math.min(Number(lengthInput.value) || 1, pool.length));
		quizQuestions = shuffle(pool).slice(0, requested);
		currentIndex = 0;
		score = { correct: 0, incorrect: 0 };

		builder.hidden = true;
		player.hidden = false;
		renderQuestion();
	});

	function renderQuestion() {
		const q = quizQuestions[currentIndex];
		player.innerHTML = `
      <p class="quiz-progress">Question ${currentIndex + 1} of ${quizQuestions.length}</p>
      <p class="quiz-meta">${escapeHtml(q.series)} — <em>${escapeHtml(q.title)}</em> by ${escapeHtml(q.author)} (${escapeHtml(q.difficulty)})</p>
      <p class="quiz-question"><strong>Q:</strong> ${escapeHtml(q.question)}</p>
      <div id="quiz-answer-area">
        <button type="button" id="reveal-btn">Reveal answer</button>
      </div>
    `;
		document.getElementById("reveal-btn").addEventListener("click", revealAnswer);
	}

	function revealAnswer() {
		const q = quizQuestions[currentIndex];
		const area = document.getElementById("quiz-answer-area");
		area.innerHTML = `
      <p class="quiz-answer"><strong>A:</strong> ${escapeHtml(q.answer)}</p>
      <div class="quiz-score-buttons">
        <button type="button" id="got-it">I got it right</button>
        <button type="button" id="missed-it">I missed it</button>
      </div>
    `;
		document.getElementById("got-it").addEventListener("click", () => {
			score.correct++;
			nextQuestion();
		});
		document.getElementById("missed-it").addEventListener("click", () => {
			score.incorrect++;
			nextQuestion();
		});
	}

	function nextQuestion() {
		currentIndex++;
		if (currentIndex < quizQuestions.length) {
			renderQuestion();
		} else {
			showResults();
		}
	}

	function showResults() {
		player.innerHTML = `
      <h3>Quiz complete!</h3>
      <p>You got ${score.correct} out of ${quizQuestions.length} right.</p>
      <button type="button" id="restart-btn">New quiz</button>
    `;
		document.getElementById("restart-btn").addEventListener("click", () => {
			player.hidden = true;
			builder.hidden = false;
		});
	}
})();
