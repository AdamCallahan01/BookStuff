(function () {
	let debug = false;
	if (debug) console.log("Test Initial");
	var dataEl = document.getElementById("book-quiz-data");
	if (!dataEl) return;

	var data = JSON.parse(dataEl.textContent);
	var questions = data.questions;
	var books = data.books;
	var form = document.getElementById("quiz-form");
	var resultEl = document.getElementById("quiz-result");

	var coverMeta = {};
	fetch("/filterData/bookCoverData.json")
		.then(function (res) {
			return res.json();
		})
		.then(function (json) {
			coverMeta = json;
			if (debug) console.log("Cover data loaded");
		})
		.catch(function (err) {
			console.error("Failed to load cover data:", err);
		});

	form.addEventListener("submit", function (event) {
		if (debug) console.log("Submit");
		event.preventDefault();
		var answers = collectAnswers();
		var ranked = rankBooks(answers);
		renderResult(ranked);
	});

	function collectAnswers() {
		if (debug) console.log("Collect Answers");
		var answers = {};
		questions.forEach(function (question) {
			var checked = form.querySelector('input[name="' + question.id + '"]:checked');
			if (checked) {
				answers[question.id] = Number(checked.value);
			}
		});
		return answers;
	}

	function rankBooks(answers) {
		if (debug) console.log("Rank Books");
		var rawScores = {};
		var traits = {};

		questions.forEach(function (question) {
			var index = answers[question.id];
			if (index === undefined) return;
			var answer = question.answers[index];
			if (!answer) return;

			if (answer.scores) {
				Object.keys(answer.scores).forEach(function (category) {
					rawScores[category] = (rawScores[category] || 0) + answer.scores[category];
				});
			}
			if (answer.traits) {
				Object.keys(answer.traits).forEach(function (key) {
					traits[key] = answer.traits[key];
				});
			}
		});

		// Clamp accumulated points to the same 0-100 scale the book data uses,
		// so a category is never worth more than "fully matches" or less than "not present at all".
		var userScores = {};
		Object.keys(rawScores).forEach(function (category) {
			userScores[category] = Math.max(0, Math.min(100, rawScores[category]));
		});

		return books
			.filter(function (book) {
				return passesHardCaps(book.hardCaps, traits);
			})
			.map(function (book) {
				return { book: book, matchScore: matchPercentage(userScores, book.scores) };
			})
			.sort(function (a, b) {
				return b.matchScore - a.matchScore;
			});
	}

	function passesHardCaps(hardCaps, traits) {
		if (debug) console.log("Hard Caps");
		if (!hardCaps) return true;

		if (hardCaps.ageMin !== undefined && traits.age !== undefined && traits.age < hardCaps.ageMin) {
			return false;
		}
		if (hardCaps.ageMax !== undefined && traits.age !== undefined && traits.age > hardCaps.ageMax) {
			return false;
		}
		if (
			hardCaps.genre !== undefined &&
			traits.genre !== undefined &&
			traits.genre !== "any" &&
			traits.genre !== hardCaps.genre
		) {
			return false;
		}
		return true;
	}

	// Average, across every category the BOOK defines, how close the reader's score is to it.
	// A book that doesn't mention a category is simply not judged on that.
	function matchPercentage(userScores, bookScores) {
		if (debug) console.log("Match Percentage");
		var categories = Object.keys(bookScores || {});
		if (categories.length === 0) return 0;

		var total = categories.reduce(function (sum, category) {
			var userValue = userScores[category] !== undefined ? userScores[category] : 0;
			var bookValue = bookScores[category];
			return sum + (100 - Math.abs(userValue - bookValue));
		}, 0);

		return Math.round(total / categories.length);
	}

	function coverImg(slug, title, extraClass) {
		if (!slug) return "";
		extraClass = extraClass || "";

		var meta = coverMeta[slug] || { small: 200, large: 400 };
		var s = meta.small;
		var l = meta.large;

		return (
			"<picture>" +
			'<source type="image/avif" srcset="/files/covers/optimized/' +
			slug +
			"-" +
			s +
			".avif " +
			s +
			"w, /files/covers/optimized/" +
			slug +
			"-" +
			l +
			".avif " +
			l +
			'w" sizes="200px">' +
			'<source type="image/webp" srcset="/files/covers/optimized/' +
			slug +
			"-" +
			s +
			".webp " +
			s +
			"w, /files/covers/optimized/" +
			slug +
			"-" +
			l +
			".webp " +
			l +
			'w" sizes="200px">' +
			'<img src="/files/covers/optimized/' +
			slug +
			"-" +
			s +
			'.jpeg" alt="' +
			title +
			' cover" loading="lazy" decoding="async" class="book-cover' +
			(extraClass ? " " + extraClass : "") +
			'">' +
			"</picture>"
		);
	}

	function renderResult(ranked) {
		if (debug) console.log("Render results");
		resultEl.hidden = false;

		if (ranked.length === 0) {
			resultEl.innerHTML =
				"<p>No book cleared every requirement. Try a different answer on the age or genre question, " +
				"or add more books to the catalog.</p>";
			resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
			return;
		}

		var top = ranked[0];
		var runnersUp = ranked.slice(1, 4);

		var titleHtml = top.book.slug
			? '<a href="/books/' + top.book.slug + '/">' + top.book.title + "</a>"
			: top.book.title;

		var coverHtml = top.book.slug ? coverImg(top.book.slug + "-cover", top.book.title, "book-quiz__cover") : "";

		var runnersUpHtml = runnersUp
			.map(function (entry) {
				var label = entry.book.slug
					? '<a href="/books/' + entry.book.slug + '/">' + entry.book.title + "</a>"
					: entry.book.title;
				return "<li>" + label + " — " + entry.matchScore + "% match</li>";
			})
			.join("");

		resultEl.innerHTML =
			'<div class="book-quiz__result-body">' +
			coverHtml +
			"<div>" +
			'<h2 class="book-quiz__result-title">' +
			titleHtml +
			"</h2>" +
			"<p>by " +
			top.book.author +
			" — " +
			top.matchScore +
			"% match</p>" +
			(top.book.description ? "<p>" + top.book.description + "</p>" : "") +
			"</div>" +
			"</div>" +
			(runnersUpHtml ? "<h3>Also worth a look</h3><ul>" + runnersUpHtml + "</ul>" : "");

		resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
	}
})();
