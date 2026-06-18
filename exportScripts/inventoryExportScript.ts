import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.INVENTORY_URL;

if (!URL) {
  throw new Error("Missing INVENTORY_URL in environment variables.");
}

interface InventoryRow {
  title: string;
  author: string;
  series?: string;
  number?: string;
  format?: string;
  type?: string;
  pages?: string;
  yearReleased?: string;
}

interface InventoryItem {
  slug: string;

  title: string;
  author: string;

  series: string | undefined;
  seriesNumber: string | undefined;

  format: string | undefined;
  type: string | undefined;

  pages: number | undefined;
  yearReleased: number | undefined;
}

// Make unique id to match book
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

async function fetchSheet(): Promise<InventoryRow[]> {
  const res = await fetch(URL as string);
  const text = await res.text();

  return parse(text, {
    columns: true,
    skip_empty_lines: true,
  }) as InventoryRow[];
}

async function run(): Promise<void> {
  const rows = await fetchSheet();

  const inventory: InventoryItem[] = rows
    .filter((row) => row.title && row.author)
    .map((row) => {
      const slug = bookSlug(row.title, row.author);

      return {
        slug,

        title: row.title.trim(),
        author: row.author.trim(),

        series: row.series?.trim() || undefined,

        // string to support "1-3"
        seriesNumber: row.number?.trim() || undefined,

        format: row.format?.trim() || undefined,

        // may be blank for ebooks/audiobooks
        type: row.type?.trim() || undefined,

        pages:
          row.pages && row.pages.trim() !== "" ? Number(row.pages) : undefined,

        yearReleased:
          row.yearReleased && row.yearReleased.trim() !== ""
            ? Number(row.yearReleased)
            : undefined,
      };
    });

  const output = "export default " + JSON.stringify(inventory, null, 2) + ";\n";

  await fs.outputFile("src/_data/inventory.js", output);

  console.log(`Exported ${inventory.length} inventory items.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
