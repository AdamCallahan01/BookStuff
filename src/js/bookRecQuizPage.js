(function () {
	let debug = true;

	// ===========================================================================
	// SCORING SETTINGS
	//
	// How scoring works:
	//   1. The quiz answers are added up into one score (0-100) per category.
	//   2. For each book pick a list of categories to compare (see categoriesToCompare).
	//   3. For each of those categories we measure how far the reader's score is from the book's score. A perfect match is 0, the worst possible miss is 100.
	//   4. Those misses are combined into ONE "distance" number for the book.
	//   5. LOWER DISTANCE = BETTER MATCH. Books are sorted lowest distance first.
	// ===========================================================================
	var SCORING = {
		// WHICH categories get compared for each book.
		//
		//   "user": compare only the categories the reader gave answers about. Every book is judged on exactly the same list, so a book with only two
		//           fields can't win just because it has fewer things to get wrong.
		//   "book": compare only the categories the book defines. Books with few fields have an advantage in this mode.
		//   "both": compare every category either side mentions. Strictest option.
		categoriesToCompare: "user",

		// Score to assume when a book does NOT define a category the reader cares about.
		// 0   = "this book doesn't have that quality" (harsh on books with missing data)
		// 50  = "unknown / neutral" (softer on books with sparse data)
		missingBookScore: 0,

		// Score to assume when the reader gave NO answers about a category the book defines.
		// Only matters when categoriesToCompare is "book" or "both".
		// 0 = "reader doesn't want this", 50 = "reader is neutral about it".
		missingUserScore: 0,

		// Make some categories matter more than others. A weight of 2 means a miss in that
		// category counts twice as much. Any category not listed uses defaultWeight.
		// Example: { hardMagic: 2, dragons: 0.5 }
		categoryWeights: { fantasy: 2, scienceFiction: 2, hardMagic: 1.5 },
		defaultWeight: 1,

		// How harshly big misses are punished compared to small ones.
		//   1 = linear (a miss of 40 is exactly twice as bad as a miss of 20)
		//   2 = squared (a miss of 40 is 4x as bad as a miss of 20; many small misses are
		//       tolerated, but one big miss really hurts)
		missPenaltyPower: 1,
	};

	if (debug) console.log("Test Initial");
	var dataEl = document.getElementById("book-quiz-data");
	if (!dataEl) return;
	if (debug) console.log(dataEl);

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
		if (debug) console.log(answers);
		return answers;
	}

	// ===========================================================================
	// RANKING
	// Turns the quiz answers into a sorted list of books, best match first.
	// Each entry looks like:
	//   { book, distance, matchScore, breakdown }
	//     distance   - the real score. LOWER IS BETTER. 0 = perfect, 100 = worst possible.
	//     matchScore - the same thing flipped into a "% match" for display.
	//     breakdown  - per-category details for debugging
	// ===========================================================================
	function rankBooks(answers) {
		if (debug) console.log("Rank Books");
		var rawScores = {};
		var traits = {};

		// Add up the reader's points per category from every answer they picked.
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

		var ranked = books
			// Step 1: throw out books that break a hard rule (age, genre).
			.filter(function (book) {
				return passesHardCaps(book.hardCaps, traits);
			})
			// Step 2: give every remaining book a distance score.
			.map(function (book) {
				var result = scoreBook(userScores, book.scores || {});
				return {
					book: book,
					distance: result.distance,
					matchScore: distanceToPercent(result.distance),
					breakdown: result.breakdown,
				};
			})
			// Step 3: lowest distance (best match) first.
			.sort(function (a, b) {
				return a.distance - b.distance;
			});

		if (debug) logTopBreakdowns(ranked);
		return ranked;
	}

	function passesHardCaps(hardCaps, traits) {
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

	// ===========================================================================
	// SCORING HELPERS
	// ===========================================================================

	// Scores a single book against the reader. Returns the distance (lower = better) plus a per-category breakdown.
	function scoreBook(userScores, bookScores) {
		var categories = getCategoriesToCompare(userScores, bookScores);
		var breakdown = [];
		var weightedTotal = 0; // sum of (penalty * weight) for every compared category
		var totalWeight = 0; // sum of the weights, used for balancing at the end

		categories.forEach(function (category) {
			// If one side doesn't have the category, fall back to the "missing" settings.
			var userValue = valueOrDefault(userScores[category], SCORING.missingUserScore);
			var bookValue = valueOrDefault(bookScores[category], SCORING.missingBookScore);
			var weight = getWeight(category);
			var penalty = categoryPenalty(userValue, bookValue);

			weightedTotal += penalty * weight;
			totalWeight += weight;

			breakdown.push({
				category: category,
				user: userValue,
				book: bookValue,
				weight: weight,
				penalty: Math.round(penalty * 10) / 10,
			});
		});

		return {
			distance: balanceDistance(weightedTotal, totalWeight),
			breakdown: breakdown,
		};
	}

	// Decides which categories are compared for a book. See SCORING.categoriesToCompare.
	function getCategoriesToCompare(userScores, bookScores) {
		var userCategories = Object.keys(userScores);
		var bookCategories = Object.keys(bookScores);

		if (SCORING.categoriesToCompare === "book") {
			return bookCategories;
		}

		if (SCORING.categoriesToCompare === "both") {
			// Everything the reader mentioned, plus anything only the book mentions.
			var onlyOnBook = bookCategories.filter(function (category) {
				return userCategories.indexOf(category) === -1;
			});
			return userCategories.concat(onlyOnBook);
		}

		// Default: "user"
		return userCategories;
	}

	// How bad is the miss in one category? Always returns 0 (perfect) to 100 (worst).
	function categoryPenalty(userValue, bookValue) {
		// Gap between the two scores, as a fraction: 0 = identical, 1 = opposite ends.
		var gap = Math.abs(userValue - bookValue) / 100;
		// Power 1 keeps it linear; higher powers punish big gaps more than small ones.
		return Math.pow(gap, SCORING.missPenaltyPower) * 100;
	}

	// Combines all the category penalties into the book's final distance.
	//
	// Default: weighted AVERAGE penalty, which keeps the result on a 0-100 scale (so the "% match" display keeps working).
	//
	//   - Raw total:  return weightedTotal;
	//       Only fair when every book is compared on the same categories
	//       (categoriesToCompare = "user"). With "book" or "both", books with more
	//       categories would pile up a bigger total and be unfairly punished.
	//   - Coverage penalty: add extra distance for each category the book is missing
	//       (e.g. weightedTotal / totalWeight + missingCount * 5).
	function balanceDistance(weightedTotal, totalWeight) {
		// Nothing to compare (reader answered nothing scored): every book ties at 0.
		if (totalWeight === 0) return 0;
		return weightedTotal / totalWeight;
	}

	// Flips a distance (0 = perfect) into a "% match" (100 = perfect) for display only.
	// The sorting never uses this number, it uses the distance.
	function distanceToPercent(distance) {
		return Math.round(Math.max(0, Math.min(100, 100 - distance)));
	}

	function getWeight(category) {
		var weight = SCORING.categoryWeights[category];
		return weight !== undefined ? weight : SCORING.defaultWeight;
	}

	function valueOrDefault(value, fallback) {
		return value !== undefined ? value : fallback;
	}

	// prints the category-by-category numbers for the top books,
	function logTopBreakdowns(ranked) {
		ranked.slice(0, 5).forEach(function (entry) {
			console.log(entry.book.title + " | distance " + entry.distance.toFixed(1) + " (" + entry.matchScore + "% match)");
			console.table(entry.breakdown);
		});
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
			resultEl.innerHTML = "<p>No book cleared every requirement.</p>";
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
