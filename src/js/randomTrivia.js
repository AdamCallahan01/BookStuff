document.addEventListener("DOMContentLoaded", () => {
  const widget = document.getElementById("random-trivia-widget");
  const trivia = JSON.parse(widget.dataset.trivia);

  const randomTrivia = trivia[Math.floor(Math.random() * trivia.length)];
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
