document.addEventListener("DOMContentLoaded", () => {
	const widget = document.getElementById("random-trivia-widget");
	const trivia = JSON.parse(widget.dataset.trivia);

	const randomOptions = trivia.filter((item) => item.random === true);

	if (randomOptions.length === 0) {
		return;
	}

	const randomTrivia = randomOptions[Math.floor(Math.random() * randomOptions.length)];

	const el = document.getElementById("random-trivia");

	el.innerHTML = `
    <div class="trivia-card">
      <p>
        ${randomTrivia.series} — ${randomTrivia.title}
      </p>

      <p class="question"><strong>${randomTrivia.question}</strong></p>

      <details class="answer-toggle">
        <summary>Show answer</summary>
        <p class="random-answer">${randomTrivia.answer}</p>
      </details>
    </div>
  `;
});
