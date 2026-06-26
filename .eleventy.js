import markdownIt from "markdown-it";
import Image from "@11ty/eleventy-img";
import fs from "fs";

export default function (eleventyConfig) {
  //For github build
  eleventyConfig.addPassthroughCopy("CNAME");

  eleventyConfig.addCollection("books", (collectionApi) =>
    collectionApi.getFilteredByGlob("files/books/*.md"),
  );

  eleventyConfig.addCollection("reads", (collectionApi) =>
    collectionApi.getFilteredByGlob("files/reads/*.md"),
  );

  eleventyConfig.addCollection("summaries", (collectionApi) =>
    collectionApi.getFilteredByGlob("files/summaries/*.md"),
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

    books.forEach((book) => {
      const seriesList = getAllSeries(book);

      seriesList.forEach((seriesName) => {
        if (!seriesName) return;

        if (!seriesMap.has(seriesName)) {
          seriesMap.set(seriesName, {
            name: seriesName,
            books: [],
            totalScore: 0,
            scoredCount: 0,
            pages: 0,
            totalCount: 0,
          });
        }

        const entry = seriesMap.get(seriesName);

        entry.books.push(book);

        // score aggregation
        if (typeof book.data.averageScore === "number") {
          entry.totalScore += book.data.averageScore;
          entry.scoredCount++;
        }

        if (typeof book.data.pages === "number") {
          entry.pages += book.data.pages;
          entry.totalCount++;
        }
      });
    });

    return Array.from(seriesMap.values()).map((series) => {
      const avg =
        series.scoredCount > 0 ? series.totalScore / series.scoredCount : null;

      const avgPages =
        series.totalCount > 0 ? series.pages / series.totalCount : null;

      return {
        name: series.name,
        books: series.books.sort(
          (a, b) => (a.data.seriesOrder || 0) - (b.data.seriesOrder || 0),
        ),
        count: series.books.length,
        averageScore: avg ? Number(avg.toFixed(2)) : null,
        pages: series.pages,
        avgPages: avgPages ? Number(avgPages.toFixed(2)) : null,
      };
    });
  });

  //Author collection
  eleventyConfig.addCollection("authors", function (collectionApi) {
    const books = collectionApi.getFilteredByGlob("files/books/*.md");

    const authorsMap = new Map();

    books.forEach((book) => {
      const authorName = book.data.author;

      if (!authorName) return;

      if (!authorsMap.has(authorName)) {
        authorsMap.set(authorName, {
          name: authorName,
          books: [],
          totalScore: 0,
          scoredCount: 0,
          pages: 0,
          totalCount: 0,
        });
      }

      const entry = authorsMap.get(authorName);

      entry.books.push(book);

      // score aggregation
      if (typeof book.data.averageScore === "number") {
        entry.totalScore += book.data.averageScore;
        entry.scoredCount++;
      }

      if (typeof book.data.pages === "number") {
        entry.pages += book.data.pages;
        entry.totalCount++;
      }
    });

    return Array.from(authorsMap.values()).map((author) => {
      const avg =
        author.scoredCount > 0 ? author.totalScore / author.scoredCount : null;

      const avgPages =
        author.totalCount > 0 ? author.pages / author.totalCount : null;

      return {
        name: author.name,
        books: author.books,
        count: author.books.length,
        averageScore: avg ? Number(avg.toFixed(2)) : null,
        pages: author.pages,
        avgPages: avgPages ? Number(avgPages.toFixed(2)) : null,
      };
    });
  });

  // Genre Collection
  function getAllGenres(book) {
    const primary = book.data.genre;
    const secondary = book.data.subgenre;

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

  eleventyConfig.addCollection("genres", function (collectionApi) {
    const books = collectionApi.getFilteredByGlob("files/books/*.md");

    const genreMap = new Map();

    books.forEach((book) => {
      const genreList = getAllGenres(book);

      genreList.forEach((genreName) => {
        if (!genreName) return;

        if (!genreMap.has(genreName)) {
          genreMap.set(genreName, {
            name: genreName,
          });
        }

        const entry = genreMap.get(genreName);
      });
    });

    return Array.from(genreMap.values()).map((genre) => {
      return {
        name: genre.name,
      };
    });
  });

  eleventyConfig.addPassthroughCopy("files/covers");

  //Favicon
  eleventyConfig.addPassthroughCopy("files/other");

  eleventyConfig.addPassthroughCopy({ "src/css": "css" });

  eleventyConfig.addPassthroughCopy({ "src/js": "js" });

  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  // Truthy filter
  eleventyConfig.addFilter("filterTruthy", function (collection, attribute) {
    if (!Array.isArray(collection)) return [];
    return collection.filter((item) => !!item?.data?.[attribute]);
  });

  // Opposite of truthy
  eleventyConfig.addFilter("filterNotTruthy", function (collection, attribute) {
    if (!Array.isArray(collection)) return [];
    return collection.filter((item) => !item?.data?.[attribute]);
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

      const timestamps = book.data.readSlugs.map((slug) => {
        const match = reads.find((r) => r.data.readSlug === slug);
        return getTimestamp(match);
      });

      return timestamps.length ? Math.max(...timestamps) : 0;
    };

    return [...books].sort((a, b) => {
      return getLatestForBook(b) - getLatestForBook(a);
    });
  });

  eleventyConfig.addFilter("bookByTitle", function (title, books) {
    return books.find((b) => b.data.title === title);
  });

  eleventyConfig.addFilter("booksBySeries", function (series, books) {
    return books
      .filter(
        (b) =>
          b.data.series &&
          (b.data.series === series || b.data.otherSeries === series),
      )
      .sort((a, b) => {
        return Number(a.data.seriesNumber) - Number(b.data.seriesNumber);
      });
  });

  eleventyConfig.addFilter("booksByAuthor", function (book, books) {
    return books.filter((b) => {
      const sameAuthor = b.data.author === book.author;
      const differentTitle = b.data.title !== book.title;
      const validSeries =
        book.series === "N/A" || b.data.series !== book.series;

      return sameAuthor && differentTitle && validSeries;
    });
  });

  eleventyConfig.addFilter("booksByGenre", function (book, books) {
    return books.filter((b) => {
      const sameGenre =
        b.data.genre &&
        (b.data.genre === book.genre || b.data.subgenre === book.genre);
      const differentTitle = b.data.title !== book.title;
      const validSeries =
        book.series === "N/A" || b.data.series !== book.series;

      return sameGenre && differentTitle && validSeries;
    });
  });

  eleventyConfig.addFilter("booksBySubgenre", function (book, books) {
    return books.filter((b) => {
      const sameGenre =
        b.data.subgenre &&
        (b.data.genre === book.subgenre || b.data.subgenre === book.subgenre);
      const differentTitle = b.data.title !== book.title;
      const validSeries =
        book.series === "N/A" || b.data.series !== book.series;

      return sameGenre && differentTitle && validSeries;
    });
  });

  eleventyConfig.addFilter("randomItem", function (items) {
    if (!items || !items.length) return null;
    return items[Math.floor(Math.random() * items.length)];
  });

  eleventyConfig.addFilter("year", function () {
    return new Date().getFullYear();
  });

  //Used by randomBook.njk
  eleventyConfig.addFilter("bookClientData", function (books) {
    return books.map((book) => ({
      title: book.data.title,
      url: book.url,
      averageScore: book.data.averageScore || null,
      coverSlug: book.data.coverSlug,
      author: book.data.author,
      hasScore: book.data.hasScore,
      readCount: book.data.readCount,
    }));
  });

  // Keeps newlines in summaries correct
  eleventyConfig.setLibrary(
    "md",
    markdownIt({
      breaks: true,
    }),
  );

  eleventyConfig.addFilter("numberFormat", (value) => {
    const num = Number(value);
    return isNaN(num) ? value : num.toLocaleString("en-US");
  });

  eleventyConfig.addFilter("groupTrivia", function (data) {
    const grouped = {};

    data.forEach((item) => {
      if (!grouped[item.series]) grouped[item.series] = {};
      if (!grouped[item.series][item.title])
        grouped[item.series][item.title] = [];
      grouped[item.series][item.title].push(item);
    });

    return grouped;
  });

  eleventyConfig.addFilter("toJson", (value) => JSON.stringify(value ?? null));

  // Better image processing
  const coverMeta = {};

  eleventyConfig.addShortcode("bookCover", function (coverSlug, title) {
    if (!coverSlug) return "";
    const src = `./files/covers/${coverSlug}.jpg`;
    if (!fs.existsSync(src)) {
      console.warn(`[bookCover] Missing cover: ${src}`);
      return "";
    }

    Image(src, {
      widths: [200, 400],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./files/covers/optimized/",
      urlPath: "/files/covers/optimized/",
      filenameFormat: (id, src, width, format) => `${coverSlug}-${width}.${format}`,
    });

    const metadata = Image.statsSync(src, {
      widths: [200, 400],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./files/covers/optimized/",
      urlPath: "/files/covers/optimized/",
      filenameFormat: (id, src, width, format) => `${coverSlug}-${width}.${format}`,
    });

    // Store the actual generated widths for this slug
    coverMeta[coverSlug] = {
      small: metadata.jpeg[0].width,
      large: metadata.jpeg[1] ? metadata.jpeg[1].width : metadata.jpeg[0].width,
    };

    return Image.generateHTML(metadata, {
      alt: `${title} cover`,
      sizes: "200px",
      loading: "lazy",
      decoding: "async",
    });
  });

  // Expose the map as global data after all shortcodes have run
  eleventyConfig.addGlobalData("coverMeta", () => coverMeta);
  // eleventyConfig.addShortcode("bookCover", function (coverSlug, title) {
  //   if (!coverSlug) return "";

  //   const src = `./files/covers/${coverSlug}.jpg`;

  //   if (!fs.existsSync(src)) {
  //     console.warn(`[bookCover] Missing cover: ${src}`);
  //     return `<img src="/files/covers/${coverSlug}.jpg" alt="${title} cover" loading="lazy" decoding="async">`;
  //   }

  //   Image(src, {
  //     widths: [200, 400],
  //     formats: ["avif", "webp", "jpeg"],
  //     outputDir: "./files/covers/optimized/",
  //     urlPath: "/files/covers/optimized/",
  //     allowUpscaling: true,
  //     filenameFormat: function (id, src, width, format) {
  //       return `${coverSlug}-${width}.${format}`;
  //     },
  //   });

  //   let metadata = Image.statsSync(src, {
  //     widths: [200, 400],
  //     formats: ["avif", "webp", "jpeg"],
  //     outputDir: "./files/covers/optimized/",
  //     urlPath: "/files/covers/optimized/",
  //     filenameFormat: function (id, src, width, format) {
  //       return `${coverSlug}-${width}.${format}`;
  //     },
  //   });

  //   return Image.generateHTML(metadata, {
  //     alt: `${title} cover`,
  //     sizes: "200px",
  //     loading: "lazy",
  //     decoding: "async",
  //   });
  // });

  return {
    dir: {
      input: ".",
      includes: "src/_includes",
      layouts: "src/_layouts",
      data: "src/_data",
      output: "_site",
    },
  };
}
