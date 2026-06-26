document.addEventListener("DOMContentLoaded", () => {
  const widget = document.getElementById("random-book-widget");
  const books = JSON.parse(widget.dataset.books);

  const random = books[Math.floor(Math.random() * books.length)];
  const el = document.getElementById("random-book");

  el.innerHTML = `
    <a href="${random.url}" class="book-card">
      ${
        random.coverSlug
          ? `
        <img src="/files/covers/${random.coverSlug}.jpg" alt="${random.title} cover">
      `
          : ""
      }

      <div class="overlay">
        ⭐ ${random.hasScore ? random.averageScore : "N/A"}
        | 📖 ${random.readCount}
      </div>

      <h2>${random.title}</h2>
      <p>${random.author}</p>
    </a>
  `;
});