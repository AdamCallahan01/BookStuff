document.addEventListener("DOMContentLoaded", () => {
  const widget = document.getElementById("random-word-widget");
  const words = JSON.parse(widget.dataset.words);

  const randomWord = words[Math.floor(Math.random() * words.length)];
  const el = document.getElementById("random-word");

  el.innerHTML = `
    <div class="word-card">
      <h2>${randomWord.word}</h2>
      <p>${randomWord.definition}</p>
    </div>
  `;
});
