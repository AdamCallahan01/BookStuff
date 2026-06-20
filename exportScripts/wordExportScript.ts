import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.WORDS_URL;

if (!URL) {
  throw new Error("Missing WORDS_URL in environment variables.");
}

interface WordRow {
  word: string;
  definition: string;
}

interface WordItem {
  word: string;
  definition: string;
}

async function fetchSheet(): Promise<WordRow[]> {
  const res = await fetch(URL as string);
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status}`);
  }
  const text = await res.text();
  return parse(text, { columns: true, skip_empty_lines: true }) as WordRow[];
}

export async function runWordExport(): Promise<void> {
  const rows = await fetchSheet();
  const words: WordItem[] = rows
    .filter((row) => row.word?.trim() !== "" && row.definition?.trim() !== "")
    .map((row) => ({
      word: row.word.trim(),
      definition: row.definition.trim(),
    }));
  const output = "export default " + JSON.stringify(words, null, 2) + ";\n";
  await fs.outputFile("src/_data/words.js", output);
  console.log(`Exported ${words.length} words.`);
}

runWordExport().catch((err) => {
  console.error(err);
  process.exit(1);
});
