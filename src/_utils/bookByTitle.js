let titleMap;

export function bookByTitle(title, books) {
  if (!titleMap) {
    titleMap = new Map(books.map((b) => [b.data.title, b]));
  }
  return titleMap.get(title);
}
