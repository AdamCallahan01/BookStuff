import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.URL;

if (!URL) {
  throw new Error("Missing URL in environment variables.");
}

// CSV Row Type
interface SheetRow {
  Title?: string;
  Author?: string;
  Series?: string;
  "Series Number"?: string;
  Score?: string;
  "Year Read"?: string;
  Pages?: string;
  Words?: string;
  "Date Started"?: string;
  "Date Finished"?: string;
  Days?: string;
  "Year Published"?: string;
  "Goodreads Link"?: string;
  "Avg Rating"?: string;
  "Num Rating"?: string;
  Publisher?: string;
  Genre?: string;
  Subgenre?: string;
  "Has Summary"?: string;
  SummaryContent?: string;
  ReviewContent?: string;
  Format?: string;
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

async function run(): Promise<void> {
  const rows = await fetchSheet();
  const bookMap = new Map<string, SheetRow[]>();

  // Group rows by book
  for (const row of rows) {
    if (!row.Title || !row.Author) continue;

    const slug = bookSlug(row.Title, row.Author);

    if (!bookMap.has(slug)) {
      bookMap.set(slug, []);
    }

    bookMap.get(slug)!.push(row);
  }

  for (const [slug, reads] of bookMap.entries()) {
    const first = reads[0];

    // Sort by date, if no date year
    reads.sort((a, b) => {
      const da = new Date(a["Date Finished"] || a["Year Read"] || 0).getTime();
      const db = new Date(b["Date Finished"] || b["Year Read"] || 0).getTime();
      return da - db;
    });

    const readSlugs = reads.map((_, index) => {
      const readNumber = index + 1;
      return `[[${slug}-${readNumber}]]`;
    });

    const scores = reads
      .map(r => Number(r.Score))
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
      r => r["Has Summary"] && r["Has Summary"].trim() !== ""
    );

    const summarySlug = `${slug}-summary`;
    const summarySlugLink = `[[${summarySlug}]]`;

    if (first == undefined) {
      return;
    }

    // BOOK FILE
    writeMarkdown(`files/books/${slug}.md`, {
      title: first.Title,
      author: first.Author,
      series: first.Series,
      seriesNumber: first["Series Number"],
      pages: first.Pages ? Number(first.Pages) : undefined,
      yearPublished: first["Year Published"]
        ? Number(first["Year Published"])
        : undefined,
      publisher: first.Publisher,
      goodreads: first["Goodreads Link"],
      genre: first.Genre,
      subgenre: first.Subgenre,

      hasSummary,
      summarySlugLink,

      latestScore,
      readCount,
      averageScore,
      allScores: scores.length ? scores : undefined,
      readSlugs
    });

    // SUMMARY FILE
    const summaryContent = first.SummaryContent ?? "";

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
        row.ReviewContent && row.ReviewContent.trim() !== "";

      writeMarkdown(
        `files/reads/${readSlug}.md`,
        {
          book: `[[${slug}]]`,
          readNumber,
          score: row.Score ? Number(row.Score) : undefined,
          format: row.Format,
          dateStarted: row["Date Started"],
          dateFinished: row["Date Finished"],
          yearRead: row["Year Read"]
            ? Number(row["Year Read"])
            : undefined,
          days: row.Days ? Number(row.Days) : undefined,
          hasReview
        },
        //row.ReviewContent ?? ""
        row.ReviewContent
      );
    });
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});