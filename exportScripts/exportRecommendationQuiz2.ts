import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const QUESTIONS_URL = process.env.QUIZRECS_QUESTIONS_URL;
const BOOKS_URL = process.env.QUIZRECS_BOOKS_URL;

if (!QUESTIONS_URL) {
	throw new Error("Missing QUIZ_QUESTIONS_URL in environment variables.");
}
if (!BOOKS_URL) {
	throw new Error("Missing QUIZ_BOOKS_URL in environment variables.");
}

interface AnswerRow extends Record<string, string> {
	questionId: string;
	prompt: string;
	answerText: string;
}

interface BookRow extends Record<string, string> {
	title: string;
	author: string;
	slug: string;
	description: string;
}

interface Answer {
	text: string;
	scores?: Record<string, number>;
	traits?: Record<string, number | string>;
}

interface Question {
	id: string;
	prompt: string;
	answers: Answer[];
}

interface HardCaps {
	ageMin?: number;
	ageMax?: number;
	genre?: string;
}

interface Book {
	title: string;
	author: string;
	slug: string;
	description: string;
	scores: Record<string, number>;
	hardCaps: HardCaps;
}

async function fetchCsv<T extends Record<string, string>>(url: string): Promise<T[]> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch sheet: ${res.status}`);
	}
	const text = await res.text();
	return parse(text, { columns: true, skip_empty_lines: true }) as T[];
}

function extractScores(row: Record<string, string>, prefix: string): Record<string, number> {
	const scores: Record<string, number> = {};
	for (const [key, raw] of Object.entries(row)) {
		if (!key.startsWith(prefix)) continue;
		const value = raw?.trim();
		if (!value) continue;
		const category = key.slice(prefix.length).trim();
		const num = Number(value);
		if (!category || Number.isNaN(num)) continue;
		scores[category] = num;
	}
	return scores;
}

function extractHardCaps(row: Record<string, string>): HardCaps {
	const hardCaps: HardCaps = {};
	const ageMin = row["hardCap:ageMin"]?.trim();
	const ageMax = row["hardCap:ageMax"]?.trim();
	const genre = row["hardCap:genre"]?.trim();

	if (ageMin) hardCaps.ageMin = Number(ageMin);
	if (ageMax) hardCaps.ageMax = Number(ageMax);
	if (genre) hardCaps.genre = genre;

	return hardCaps;
}

function extractTraits(row: Record<string, string>): Answer["traits"] {
	const traits: Record<string, number | string> = {};
	const age = row["trait:age"]?.trim();
	const genre = row["trait:genre"]?.trim();

	if (age) traits.age = Number(age);
	if (genre) traits.genre = genre;

	return Object.keys(traits).length > 0 ? traits : undefined;
}

function buildQuestions(rows: AnswerRow[]): Question[] {
	const byId = new Map<string, Question>();

	for (const row of rows) {
		const id = row.questionId?.trim();
		const answerText = row.answerText?.trim();
		if (!id || !answerText) continue;

		if (!byId.has(id)) {
			byId.set(id, { id, prompt: row.prompt?.trim() ?? "", answers: [] });
		}

		const answer: Answer = { text: answerText };
		const scores = extractScores(row, "score:");
		const traits = extractTraits(row);
		if (Object.keys(scores).length > 0) answer.scores = scores;
		if (traits) answer.traits = traits;

		byId.get(id)!.answers.push(answer);
	}

	return Array.from(byId.values());
}

function buildBooks(rows: BookRow[]): Book[] {
	return rows
		.filter((row) => row.title?.trim())
		.map((row) => ({
			title: row.title.trim(),
			author: row.author?.trim() ?? "",
			slug: row.slug?.trim() ?? "",
			description: row.description?.trim() ?? "",
			scores: extractScores(row, "score:"),
			hardCaps: extractHardCaps(row),
		}));
}

function toModule(data: unknown): string {
	return "export default " + JSON.stringify(data, null, 2) + ";\n";
}

export async function runQuizExport(): Promise<void> {
	const [questionRows, bookRows] = await Promise.all([
		fetchCsv<AnswerRow>(QUESTIONS_URL as string),
		fetchCsv<BookRow>(BOOKS_URL as string),
	]);

	const questions = buildQuestions(questionRows);
	const books = buildBooks(bookRows);

	await fs.outputFile("src/_data/recQuiz/questions.js", toModule(questions));
	await fs.outputFile("src/_data/recQuiz/bookRecs.js", toModule(books));

	console.log(`Exported ${questions.length} questions and ${books.length} books.`);
}

runQuizExport().catch((err) => {
	console.error(err);
	process.exit(1);
});
