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

  eleventyConfig.addPassthroughCopy("files/covers");

  eleventyConfig.addPassthroughCopy({"src/css": "css"});

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


  return {
    dir: {
      input: ".",
      includes: "src/_includes",
      layouts: "src/_layouts",
      output: "_site"
    }
  };
}