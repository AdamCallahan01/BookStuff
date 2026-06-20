import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.LISTS_URL;

if (!URL) {
  throw new Error("Missing LISTS_URL in environment variables.");
}

interface ListData {
  title: string;
  isSeries: boolean;
  items: string[];
}

async function fetchSheet(): Promise<string[][]> {
  const res = await fetch(URL as string);
  const text = await res.text();

  return parse(text, {
    skip_empty_lines: false,
  }) as string[][];
}

export async function runListExport(): Promise<void> {
  const rows = await fetchSheet();

  if (rows.length < 2) {
    throw new Error(
      "Sheet must contain at least a title row and an isSeries row.",
    );
  }

  const headers = rows[0]!;
  const seriesRow = rows[1]!;

  const lists: ListData[] = [];

  headers.forEach((header, colIndex) => {
    if (!header || header.trim() === "") {
      return;
    }

    const isSeries = seriesRow[colIndex]?.trim().toLowerCase() === "true";

    const items = rows
      .slice(2)
      .map((row) => row[colIndex]?.trim())
      .filter((item): item is string => item !== undefined && item !== "");

    lists.push({
      title: header.trim(),
      isSeries,
      items,
    });
  });

  const output = "export default " + JSON.stringify(lists, null, 2) + ";\n";

  await fs.outputFile("src/_data/lists.js", output);

  console.log(`Exported ${lists.length} lists.`);
}

runListExport().catch((err) => {
  console.error(err);
  process.exit(1);
});
