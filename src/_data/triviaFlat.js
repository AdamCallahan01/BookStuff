import trivia from "./trivia.js";

export default trivia.flatMap(series =>
  series.books.flatMap(book =>
    book.questions.map(q => ({
      ...q,
      series: series.series,
      book: book.title
    }))
  )
);