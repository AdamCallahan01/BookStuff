export default function (eleventyConfig) {

  eleventyConfig.addCollection("books", (collectionApi) =>
    collectionApi.getFilteredByGlob("files/books/*.md")
  );

  eleventyConfig.addCollection("reads", (collectionApi) =>
    collectionApi.getFilteredByGlob("files/reads/*.md")
  );

  eleventyConfig.addCollection("summaries", (collectionApi) =>
    collectionApi.getFilteredByGlob("files/summaries/*.md")
  );

  // Series collection for sorting
  function getAllSeries(book) {
    const primary = book.data.series;
    const secondary = book.data.otherSeries;

    const result = [];

    if (primary) result.push(primary);

    if (secondary) {
      if (Array.isArray(secondary)) {
        result.push(...secondary);
      } else {
        result.push(secondary);
      }
    }

    return result;
  }

  eleventyConfig.addCollection("series", function (collectionApi) {
    const books = collectionApi.getFilteredByGlob("files/books/*.md");

    const seriesMap = new Map();

    books.forEach(book => {
      const seriesList = getAllSeries(book);

      seriesList.forEach(seriesName => {
        if (!seriesName) return;

        if (!seriesMap.has(seriesName)) {
          seriesMap.set(seriesName, {
            name: seriesName,
            books: [],
            totalScore: 0,
            scoredCount: 0
          });
        }

        const entry = seriesMap.get(seriesName);

        entry.books.push(book);

        // score aggregation 
        if (typeof book.data.averageScore === "number") {
          entry.totalScore += book.data.averageScore;
          entry.scoredCount++;
        }
      });
    });

    return Array.from(seriesMap.values()).map(series => {
      const avg =
        series.scoredCount > 0
          ? series.totalScore / series.scoredCount
          : null;

      return {
        name: series.name,
        books: series.books.sort((a, b) =>
          (a.data.seriesOrder || 0) - (b.data.seriesOrder || 0)
        ),
        count: series.books.length,
        averageScore: avg ? Number(avg.toFixed(2)) : null,
      };
    });

  });

  //Author collection
  eleventyConfig.addCollection("authors", function (collectionApi) {
    const books = collectionApi.getFilteredByGlob("files/books/*.md");

    const authorsMap = new Map();

    books.forEach(book => {
      const authorName = book.data.author;

      if (!authorName) return;

      if (!authorsMap.has(authorName)) {
        authorsMap.set(authorName, {
          name: authorName,
          books: [],
          totalScore: 0,
          scoredCount: 0
        });
      }

      const entry = authorsMap.get(authorName);

      entry.books.push(book);

      // score aggregation 
      if (typeof book.data.averageScore === "number") {
        entry.totalScore += book.data.averageScore;
        entry.scoredCount++;
      }
    });

    return Array.from(authorsMap.values()).map(author => {
      const avg =
        author.scoredCount > 0
          ? author.totalScore / author.scoredCount
          : null;

      return {
        name: author.name,
        books: author.books,
        count: author.books.length,
        averageScore: avg ? Number(avg.toFixed(2)) : null,
      };
    });

  });

  eleventyConfig.addPassthroughCopy("files/covers");

  eleventyConfig.addPassthroughCopy("files/other");

  eleventyConfig.addPassthroughCopy({"src/css": "css"});

  eleventyConfig.addPassthroughCopy({"src/js": "js"});

  // Truthy filter
  eleventyConfig.addFilter("filterTruthy", function (collection, attribute) {
    if (!Array.isArray(collection)) return [];
    return collection.filter(item => !!item?.data?.[attribute]);
  });

  // Opposite of truthy
  eleventyConfig.addFilter("filterNotTruthy", function (collection, attribute) {
    if (!Array.isArray(collection)) return [];
    return collection.filter(item => !item?.data?.[attribute]);
  });

  // Sort descending by numeric attribute
  eleventyConfig.addFilter("sortByNumberDesc", function (collection, attribute) {
    if (!Array.isArray(collection)) return [];
    return [...collection].sort((a, b) => {
      const aVal = Number(a?.data?.[attribute] ?? 0);
      const bVal = Number(b?.data?.[attribute] ?? 0);
      return bVal - aVal;
    });
  });

  // Sort descending by yearRead (computed from reads)
  eleventyConfig.addFilter("sortByLatestYearReadDesc", function (books, reads) {
    if (!Array.isArray(books)) return [];

    return [...books].sort((a, b) => {
      const getLatestYear = (book) => {
        if (!Array.isArray(book?.data?.readSlugs)) return 0;

        const years = book.data.readSlugs.map(slug => {
          const match = reads.find(r => r.data.readSlug === slug);
          return match?.data?.yearRead ?? 0;
        });

        return years.length ? Math.max(...years) : 0;
      };

      return getLatestYear(b) - getLatestYear(a);
    });
  });

  eleventyConfig.addFilter("sortByLatestReadDesc", function (books, reads) {
  if (!Array.isArray(books)) return [];

  const parseDateFinished = (dateStr) => {
    if (!dateStr) return null;

    // Expecting MM/DD/YYYY
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;

    const [month, day, year] = parts.map(Number);
    return new Date(year, month - 1, day).getTime();
  };

  const getTimestamp = (read) => {
    if (!read?.data) return 0;

    // Priority 1: dateFinished
    const finished = parseDateFinished(read.data.dateFinished);
    if (finished) return finished;

    // Priority 2: yearRead
    if (read.data.yearRead) {
      return new Date(Number(read.data.yearRead), 0, 1).getTime();
    }

    return 0;
  };

  const getLatestForBook = (book) => {
    if (!Array.isArray(book?.data?.readSlugs)) return 0;

    const timestamps = book.data.readSlugs.map(slug => {
      const match = reads.find(r => r.data.readSlug === slug);
      return getTimestamp(match);
    });

    return timestamps.length ? Math.max(...timestamps) : 0;
  };

  return [...books].sort((a, b) => {
    return getLatestForBook(b) - getLatestForBook(a);
  });
});

eleventyConfig.addFilter("bookByTitle", function(title, books) {
  return books.find(b => b.data.title === title);
});

eleventyConfig.addFilter("booksBySeries", function(series, books) {
  return books.filter(b => b.data.series && ( b.data.series === series || b.data.otherSeries === series ) );
});

eleventyConfig.addFilter("year", function() {
  return new Date().getFullYear();
});

  return {
    dir: {
      input: ".",
      includes: "src/_includes",
      layouts: "src/_layouts",
      output: "_site"
    }
  };
}