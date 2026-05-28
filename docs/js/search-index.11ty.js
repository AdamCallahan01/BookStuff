export default class {

  data() {
    return {
      permalink: "/search-index.json"
    };
  }

  render({ collections }) {

    const books = collections.books || [];
    const summaries = collections.summaries || [];

    const summaryMap = new Map(
      summaries.map(s => [s.data.bookSlug, s.content])
    );

    const index = books.map(book => ({
      id: book.data.bookSlug,
      title: book.data.title,
      author: book.data.author,
      series: book.data.series,
      summary: summaryMap.get(book.data.bookSlug) || "",
      coverSlug: book.data.coverSlug,
      url: book.url
    }));

    return JSON.stringify(index);
  }
}