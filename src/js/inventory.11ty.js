import { bookByTitle } from "../_utils/bookByTitle.js";

export const data = {
  permalink: "/inventory.json",
  eleventyExcludeFromCollections: true,
};

export function render(data) {
  const { inventory, collections } = data;

  const resolved = inventory.map((item) => {
    const book = bookByTitle(item.title, collections.books);
    return {
      title: item.title,
      author: item.author,
      series: item.series,
      seriesNumber: item.seriesNumber,
      format: item.format,
      type: item.type,
      pages: item.pages,
      url: book ? book.url : null,
      coverSlug: book && book.data.coverSlug ? book.data.coverSlug : null,
    };
  });

  return JSON.stringify(resolved);
}
