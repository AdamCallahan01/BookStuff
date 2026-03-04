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

  return {
    dir: {
      input: ".",
      includes: "src/_includes",
      layouts: "src/_layouts",
      output: "_site"
    }
  };
}