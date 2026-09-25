(function () {
	var container = document.getElementById("fantasy-quiz");
	if (!container) return;

	var dataEl = document.getElementById("quiz-tree-data");
	if (!dataEl) return;

	var tree;
	try {
		tree = JSON.parse(dataEl.textContent);
	} catch (err) {
		container.innerHTML = "<p>The quiz data could not be read.</p>";
		return;
	}

	let coverMeta = {};
	var coverMetaEl = document.getElementById("cover-meta-data");
	if (coverMetaEl) {
		try {
			coverMeta = JSON.parse(coverMetaEl.textContent) || {};
		} catch (err) {
			// Nothing
		}
	}

	var STORAGE_KEY = "fantasyQuizState:v1";
	var history = [];
	var currentId = tree.start;

	try {
		var saved = sessionStorage.getItem(STORAGE_KEY);
		if (saved) {
			var state = JSON.parse(saved);
			if (state && state.currentId && tree.nodes[state.currentId]) {
				currentId = state.currentId;
				history = Array.isArray(state.history) ? state.history : [];
			}
		}
	} catch (err) {}

	function saveState() {
		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ currentId: currentId, history: history }));
		} catch (err) {
			// Nothing
		}
	}

	function goTo(nodeId) {
		if (!tree.nodes[nodeId]) nodeId = "end_default";
		history.push(currentId);
		currentId = nodeId;
		saveState();
		render();
	}

	function goBack() {
		if (!history.length) return;
		currentId = history.pop();
		saveState();
		render();
	}

	function restart() {
		history = [];
		currentId = tree.start;
		saveState();
		render();
	}

	function el(tag, className, text) {
		var node = document.createElement(tag);
		if (className) node.className = className;
		if (text != null) node.textContent = text;
		return node;
	}

	function answerButton(text, onClick) {
		var btn = el("button", "quiz-answer-btn", text);
		btn.type = "button";
		btn.addEventListener("click", onClick);
		return btn;
	}

	function escapeAttr(value) {
		return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	function coverImgHtml(slug, title, extraClass) {
		if (!slug) return "";
		let coverSlug = slug + "-cover";
		//console.log(coverSlug);
		var meta = coverMeta[coverSlug] || { small: 200, large: 400 };
		//console.log(meta);
		var s = meta.small;
		var l = meta.large;
		var safeSlug = escapeAttr(slug);
		var safeTitle = escapeAttr(title);
		var cls = "book-cover" + (extraClass ? " " + extraClass : "");

		return (
			"<picture>" +
			'<source type="image/avif" srcset="/files/covers/optimized/' +
			safeSlug +
			"-cover-" +
			s +
			".avif " +
			s +
			"w, /files/covers/optimized/" +
			safeSlug +
			"-cover-" +
			l +
			".avif " +
			l +
			'w" sizes="200px">' +
			'<source type="image/webp" srcset="/files/covers/optimized/' +
			safeSlug +
			"-cover-" +
			s +
			".webp " +
			s +
			"w, /files/covers/optimized/" +
			safeSlug +
			"-cover-" +
			l +
			".webp " +
			l +
			'w" sizes="200px">' +
			'<img src="/files/covers/optimized/' +
			safeSlug +
			"-cover-" +
			s +
			'.jpeg" alt="' +
			safeTitle +
			' cover" loading="lazy" decoding="async" class="' +
			cls +
			'">' +
			"</picture>"
		);
	}

	function render() {
		var node = tree.nodes[currentId];
		container.innerHTML = "";

		if (!node) {
			container.appendChild(el("p", null, "Something went wrong loading the quiz."));
			return;
		}

		var panel = el("div", "quiz-panel");
		panel.setAttribute("role", "group");
		panel.setAttribute("aria-live", "polite");
		panel.tabIndex = -1;

		if (node.type === "question") {
			renderQuestion(node, panel);
		} else if (node.type === "recommendation") {
			renderRecommendation(node, panel);
		} else if (node.type === "end") {
			renderEnd(node, panel);
		}

		container.appendChild(panel);

		if (history.length) {
			var backBtn = el("button", "quiz-back-btn", "\u2190 Back");
			backBtn.type = "button";
			backBtn.addEventListener("click", goBack);
			container.appendChild(backBtn);
		}

		panel.focus();
	}

	function renderQuestion(node, panel) {
		panel.appendChild(el("h2", "quiz-prompt", node.prompt));
		var answers = el("div", "quiz-answers");
		node.answers.forEach(function (answer) {
			answers.appendChild(
				answerButton(answer.text, function () {
					goTo(answer.next);
				}),
			);
		});
		panel.appendChild(answers);
	}

	function renderRecommendation(node, panel) {
		var header = el("div", "quiz-rec-header");

		if (node.slug) {
			var coverWrap = el("div", "quiz-rec-cover");
			coverWrap.innerHTML = coverImgHtml(node.slug, node.title, "quiz-cover");
			header.appendChild(coverWrap);
		}

		var textWrap = el("div", "quiz-rec-text");
		textWrap.appendChild(el("h2", "quiz-rec-title", node.title));
		if (node.author) {
			textWrap.appendChild(el("p", "quiz-rec-author", "by " + node.author));
		}
		header.appendChild(textWrap);

		panel.appendChild(header);

		panel.appendChild(el("p", "quiz-rec-blurb", node.blurb));

		if (node.slug) {
			var link = el("a", "quiz-rec-link", "View my review");
			link.href = "/books/" + encodeURIComponent(String(node.slug).toLowerCase());
			panel.appendChild(link);
		}

		var readCheck = el("div", "quiz-read-check");
		readCheck.appendChild(el("p", "quiz-read-prompt", "Have you already read this one?"));

		var readAnswers = el("div", "quiz-answers");
		readAnswers.appendChild(
			answerButton("No, this is new to me", function () {
				goTo(node.ifNotRead || "end_default");
			}),
		);
		readAnswers.appendChild(
			answerButton("Yes, I\u2019ve read it", function () {
				renderLikedCheck(node, readCheck, readAnswers);
			}),
		);
		readCheck.appendChild(readAnswers);
		panel.appendChild(readCheck);
	}

	function renderLikedCheck(node, readCheck, oldAnswers) {
		readCheck.removeChild(oldAnswers);
		var prompt = readCheck.querySelector(".quiz-read-prompt");
		prompt.textContent = "Did you enjoy it?";

		var answers = el("div", "quiz-answers");
		answers.appendChild(
			answerButton("Loved it", function () {
				goTo(node.ifLiked || "end_default");
			}),
		);
		answers.appendChild(
			answerButton("Wasn\u2019t for me", function () {
				goTo(node.ifDisliked || "end_default");
			}),
		);
		readCheck.appendChild(answers);
	}

	function renderEnd(node, panel) {
		panel.appendChild(el("h2", "quiz-prompt", node.title || "That\u2019s your match"));
		panel.appendChild(el("p", "quiz-rec-blurb", node.message));

		var restartBtn = el("button", "quiz-restart-btn", "Start over");
		restartBtn.type = "button";
		restartBtn.addEventListener("click", restart);
		panel.appendChild(restartBtn);
	}

	render();
})();
