import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.TRIVIA_URL;

if (!URL) {
  throw new Error("Missing TRIVIA_URL in environment variables.");
}

interface TriviaRow {
  Series: string;
  Author: string;
  Title: string;
  Question: string;
  Answer: string;
  Difficulty: string;
}

interface TriviaItem {
  series: string;
  author: string;
  title: string;
  question: string;
  answer: string;
  difficulty: string;
}

async function fetchSheet(): Promise<TriviaRow[]> {
  const res = await fetch(URL as string);

  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status}`);
  }

  const text = await res.text();

  return parse(text, {
    columns: true,
    skip_empty_lines: true,
  }) as TriviaRow[];
}

export async function runTriviaExport(): Promise<void> {
  const rows = await fetchSheet();

  const trivia: TriviaItem[] = rows
    .filter((row) => row.Question?.trim() !== "" && row.Answer?.trim() !== "")
    .map((row) => ({
      series: row.Series?.trim() ?? "",
      author: row.Author?.trim() ?? "",
      title: row.Title?.trim() ?? "",
      question: row.Question.trim(),
      answer: row.Answer.trim(),
      difficulty: row.Difficulty?.trim() ?? "",
    }));

  const output = "export default " + JSON.stringify(trivia, null, 2) + ";\n";

  await fs.outputFile("src/_data/trivia.js", output);

  console.log(`Exported ${trivia.length} trivia questions.`);
}

runTriviaExport().catch((err) => {
  console.error(err);
  process.exit(1);
});
