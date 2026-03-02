import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const URL = process.env.URL;

if (!URL) {
  throw new Error("Missing URL in environment variables.");
}

// CSV Row Type
interface SheetRow {
  // Book Info
  title: string;
  author: string;
  series?: string;
  seriesNumber?: string;
  pages?: number;
  words?: number;
  yearPublished?: number;
  goodreadsLink?: string;
  avgRating?: number;
  numRating?: number;
  publisher?: string;
  genre?: string;
  subgenre?: string;
  isbn?: string;
  narrator?: string;
  owned?: string;

  // Read info
  score?: number;
  yearRead?: number;
  dateStarted?: string;
  dateFinished?: string;
  days?: number;
  hasReview?: string;
  reviewContent?: string;
  format?: string;  

  // Summary Info
  hasSummary?: string;
  summaryContent?: string;
}

type Frontmatter = Record<string, unknown>;

// Make unique id
function slugify(str: string = ""): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function lastName(author: string = ""): string {
  const parts = author.trim().split(" ");
  return parts[parts.length - 1] ?? "";
}

function bookSlug(title: string, author: string): string {
  return `${slugify(title)}-${slugify(lastName(author))}`;
}

// Create book md files
function writeMarkdown(
  path: string,
  frontmatter: Frontmatter,
  body: string = ""
): void {
  const clean = Object.entries(frontmatter)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");

  //const content = `---\n${clean}\n---\n\n${body ?? ""}`;
  const content = `---\n${clean}\n---\n\n${body}`;
  fs.outputFileSync(path, content);
}

async function fetchSheet(): Promise<SheetRow[]> {
  const res = await fetch(URL as string);
  const text = await res.text();

  return parse(text, {
    columns: true,
    skip_empty_lines: true
  }) as SheetRow[];
}

// Get cover images for books
async function getCover(title: string, author: string, slug: string, isbn?: string) {
  //Extra check to avoid unnecessary calls
  const coverPath = path.join("files/covers", `${slug}.jpg`);
  if (fs.existsSync(coverPath)) {
    return;
  }

  let coverUrl: string | undefined;

  // ISBN first
  if (isbn && isbn.trim() !== "") {
    const cleanIsbn = isbn.replace(/[^0-9Xx]/g, "");

    coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;

    // Verify it exists
    const testRes = await fetch(coverUrl);

    if (!testRes.ok) {
      coverUrl = undefined;
    }
  }

  // title + author search
  if (!coverUrl) {
    console.log(`no ISBN for ${slug}`);

    const query = new URLSearchParams({
      title,
      author,
    }).toString();

    const searchUrl = `https://openlibrary.org/search.json?${query}`;
    const res = await fetch(searchUrl);

    if (!res.ok) {
      console.log(`Search failed for ${slug}`);
      return;
    }

    const data = await res.json();
    const coverId = data.docs?.[0]?.cover_i;

    if (!coverId) {
      console.log(`No cover found for ${slug}`);
      return;
    }

    coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  }

  if (!coverUrl) {
    console.log(`No usable cover for ${slug}`);
    return;
  }

  const imageRes = await fetch(coverUrl);
  if (!imageRes.ok) {
    console.log(`Cover download failed for ${slug}`);
    return;
  }

  const buffer = Buffer.from(await imageRes.arrayBuffer());
  await fs.outputFile(coverPath, buffer);

  console.log(`Saved cover for ${slug}`);
}

async function run(): Promise<void> {
  const rows = await fetchSheet();
  const bookMap = new Map<string, SheetRow[]>();

  // Group rows by book
  for (const row of rows) {
    if (!row.title || !row.author) continue;

    const slug = bookSlug(row.title, row.author);

    if (!bookMap.has(slug)) {
      bookMap.set(slug, []);
    }

    bookMap.get(slug)!.push(row);
  }

  for (const [slug, reads] of bookMap.entries()) {
    const first = reads[0];

    // Sort by date, if no date year
    reads.sort((a, b) => {
      const da = new Date(a.dateFinished || a.yearRead || 0).getTime();
      const db = new Date(b.dateFinished || b.yearRead || 0).getTime();
      return da - db;
    });

    const readSlugs = reads.map((_, index) => {
      const readNumber = index + 1;
      return `[[${slug}-${readNumber}]]`;
    });

    const scores = reads
      .map(r => Number(r.score))
      .filter(n => !isNaN(n));

    const readCount = reads.length;

    const averageScore =
      scores.length > 0
        ? Number(
            (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
          )
        : undefined;

    const latestScore =
      scores.length > 0
        ? scores[scores.length - 1]
        : undefined;

    const hasSummary = reads.some(
      r => r.hasSummary && r.hasSummary.trim() !== ""
    );

    const summarySlug = `${slug}-summary`;
    const summarySlugLink = `[[${summarySlug}]]`;

    const coverSlug = `${slug}-cover`;
    const coverSlugLink = `![[${coverSlug}.jpg]]`;

    const bookOwned = reads.some(
      r => r.owned && r.owned.trim() !== ""
    );

    // Error catching
    if (first == undefined) {
      return;
    }

    // BOOK FILE
    writeMarkdown(
      `files/books/${slug}.md`, 
      {
        title: first.title,
        author: first.author,
        series: first.series,
        seriesNumber: first.seriesNumber,
        pages: first.pages ? Number(first.pages) : undefined,
        yearPublished: first.yearPublished
          ? Number(first.yearPublished)
          : undefined,
        publisher: first.publisher,
        goodreads: first.goodreadsLink,
        avgGoodreadsRating: first.avgRating,
        numGoodreadsRatings: first.numRating,
        genre: first.genre,
        subgenre: first.subgenre,
        isbn: first.isbn,
        narrator: first.narrator,
        bookOwned,

        hasSummary,
        summarySlugLink,

        latestScore,
        readCount,
        averageScore,
        allScores: scores.length ? scores : undefined,
        readSlugs,

        coverSlug
      },
      coverSlugLink
    );

    // Check for cover
    if (!fs.existsSync(`files/covers/${coverSlug}.jpg`)) {
      await getCover(first.title, first.author, coverSlug, first.isbn)
    }

    // SUMMARY FILE
    const summaryContent = first.summaryContent ?? "";

    const createBlankSummaryFile = true;
    // Make files even if no summary stored
    if (createBlankSummaryFile) {
      writeMarkdown(
        `files/summaries/${summarySlug}.md`,
        { book: `[[${slug}]]` },
        summaryContent
      );
    }
    else {
      console.log("Bad");
      if (hasSummary) {
      writeMarkdown(
        `files/summaries/${summarySlug}.md`,
        { book: `[[${slug}]]` },
        summaryContent
      );
    }
    }

    // READ FILES
    reads.forEach((row, index) => {
      const readNumber = index + 1;
      const readSlug = `${slug}-${readNumber}`;

      const hasReview =
        row.hasReview && row.hasReview.trim() !== "";

      writeMarkdown(
        `files/reads/${readSlug}.md`,
        {
          book: `[[${slug}]]`,
          readNumber,
          score: row.score ? Number(row.score) : undefined,
          format: row.format,
          dateStarted: row.dateStarted,
          dateFinished: row.dateFinished,
          yearRead: row.yearRead
            ? Number(row.yearRead)
            : undefined,
          days: row.days ? Number(row.days) : undefined,
          hasReview
        },
        //row.ReviewContent ?? ""
        row.reviewContent
      );
    });
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});