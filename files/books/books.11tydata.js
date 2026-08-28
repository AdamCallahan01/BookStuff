export default {
  eleventyComputed: {
    bookPageTitle: (data) => {
      const title = data.title;
      const hasSummary = data.hasSummary;
      //ScreamingFrog recommended values
      const MIN = 30;
      const MAX = 60;

      let pageTitle = hasSummary ? `${title} Summary & Review` : `${title} - Book Review`;

      if (pageTitle.length < MIN || pageTitle.length < MAX - 25) {
        pageTitle += " | Fantasy Book Summaries";
      }

      if (pageTitle.length > MAX) {
        pageTitle = pageTitle.slice(0, MAX);
        pageTitle = pageTitle.slice(0, pageTitle.lastIndexOf(" "));
      }

      if (pageTitle.length < MIN || pageTitle.length > MAX) {
        console.warn(
          `[bookPageTitle] "${pageTitle}" is ${pageTitle.length} chars (target ${MIN}-${MAX}) for "${title}"`,
        );
      }

      return pageTitle;
    },
    bookPageDescription: (data) => {
        const title = data.title;
        const author = data.author;
        const hasSummary = data.hasSummary;
        const series = data.series;
        const seriesNumber = data.seriesNumber;

        let pageDescription = hasSummary
          ? `Review, Summary, and Book Information for ${title} by ${author}`
          : `Review, and Book Information for ${title} by ${author}`;

        if (series != "N/A") {
            pageDescription += ` | ${series}`;
            if (seriesNumber) {
                pageDescription += `, book number ${seriesNumber}`;
            }
        }

        pageDescription += " | Fantasy Book Summaries"

        return pageDescription;
    },
  },
};