export default class {

  data() {
    return {
      permalink: "/bookData.json"
    };
  }

  render({ collections }) {

    const reads = collections.reads || [];
    const summaries = collections.summaries || [];

    const books = (collections.books || []).map(book => {

      const slug = book.data.bookSlug;

      const bookReads = reads
        .filter(r => r.data.bookSlug === slug)
        .map(r => ({
          readNumber: r.data.readNumber,
          score: r.data.score ?? null,
          format: r.data.format,
          yearRead: r.data.yearRead ?? null,
          dateStarted: r.data.dateStarted,
          dateFinished: r.data.dateFinished,
          hasReview: r.data.hasReview ?? false,
          review: r.templateContent
        }));

      const summaryEntry = summaries.find(
        s => s.data.bookSlug === slug
      );

      const summary = summaryEntry
        ? { content: summaryEntry.templateContent }
        : null;

      return {
        bookSlug: slug,
        title: book.data.title,
        author: book.data.author,
        series: book.data.series,
        seriesNumber: book.data.seriesNumber,
        pages: book.data.pages,
        yearPublished: book.data.yearPublished,
        publisher: book.data.publisher,
        goodreads: book.data.goodreads,
        avgGoodreadsRating: book.data.avgGoodreadsRating,
        numGoodreadsRatings: book.data.numGoodreadsRatings,
        genre: book.data.genre,
        subgenre: book.data.subgenre,
        isbn: book.data.isbn,
        bookOwned: book.data.bookOwned,
        hasSummary: book.data.hasSummary,
        summarySlug: book.data.summarySlug,
        hasScore: book.data.hasScore,
        latestScore: book.data.latestScore,
        readCount: book.data.readCount,
        currentRead: book.data.currentRead,
        averageScore: book.data.averageScore ?? null,
        url: book.url,
        reads: bookReads,
        summary
      };

    });

    return JSON.stringify(books, null, 2);
  }
}