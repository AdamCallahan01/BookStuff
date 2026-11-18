import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const QUESTIONS_URL = process.env.QUIZRECS_QUESTIONS_URL;
const BOOKS_URL = process.env.QUIZRECS_BOOKS_URL;

if (!QUESTIONS_URL) {
	throw new Error("Missing QUIZRECS_QUESTIONS_URL in environment variables.");
}
if (!BOOKS_URL) {
	throw new Error("Missing QUIZRECS_BOOKS_URL in environment variables.");
}
interface QuestionRow extends Record<string, string> {
	questionId: string;
	type: string;
	category: string;
	prompt: string;
	answerText: string;
}

interface BookRow extends Record<string, string> {
	title: string;
	author: string;
	slug: string;
	description: string;
}

interface SliderQuestion {
	id: string;
	type: "slider";
	category: string;
	prompt: string;
}

interface ChoiceAnswer {
	text: string;
	traits?: Record<string, number | string>;
}

interface ChoiceQuestion {
	id: string;
	type: "choice";
	prompt: string;
	answers: ChoiceAnswer[];
}

type Question = SliderQuestion | ChoiceQuestion;

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

// Reads the trait:age / trait:genre columns of a choice answer.
// A blank trait is simply left out, which is how "No preference" works
function extractTraits(row: Record<string, string>): ChoiceAnswer["traits"] {
	const traits: Record<string, number | string> = {};
	const age = row["trait:age"]?.trim();
	const genre = row["trait:genre"]?.trim();

	if (age) traits.age = Number(age);
	if (genre) traits.genre = genre;

	return Object.keys(traits).length > 0 ? traits : undefined;
}

// ---------------------------------------------------------------------------
// QUESTIONS
// ---------------------------------------------------------------------------

function getQuestionType(row: QuestionRow): Question["type"] {
	const type = row.type?.trim().toLowerCase();
	if (type === "slider" || type === "choice") return type;

	if (type) {
		console.warn(`Row "${row.questionId}": unknown type "${row.type}", guessing from the other columns.`);
	}
	// No usable type column: answer text means a choice answer, no answer text means a slider.
	return row.answerText?.trim() ? "choice" : "slider";
}

function getSliderCategory(row: QuestionRow, id: string): string {
	const explicit = row.category?.trim();
	if (explicit) return explicit;
	return id.replace(/-question(-\d+)?$/i, "");
}

function buildQuestions(rows: QuestionRow[]): Question[] {
	// A Map remembers insertion order, so questions keep the order of the sheet.
	const byId = new Map<string, Question>();

	for (const row of rows) {
		const id = row.questionId?.trim();
		if (!id) continue;
		const prompt = row.prompt?.trim() ?? "";

		// --- Slider: one row is one whole question ---
		if (getQuestionType(row) === "slider") {
			if (byId.has(id)) {
				console.warn(`Question id "${id}" is used more than once; the later row wins.`);
			}
			byId.set(id, { id, type: "slider", category: getSliderCategory(row, id), prompt });
			continue;
		}

		// --- Choice: one row per answer, rows with the same id are grouped together ---
		const answerText = row.answerText?.trim();
		if (!answerText) continue;

		let question = byId.get(id);
		if (!question) {
			question = { id, type: "choice", prompt, answers: [] };
			byId.set(id, question);
		}
		if (question.type !== "choice") {
			console.warn(`Question id "${id}" mixes slider and choice rows; skipping the choice row "${answerText}".`);
			continue;
		}

		const answer: ChoiceAnswer = { text: answerText };
		const traits = extractTraits(row);
		if (traits) answer.traits = traits;
		question.answers.push(answer);
	}

	return Array.from(byId.values());
}

// ---------------------------------------------------------------------------
// BOOKS
// ---------------------------------------------------------------------------

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

function warnAboutUnknownCategories(questions: Question[], books: Book[]): void {
	const bookCategories = new Set(books.flatMap((book) => Object.keys(book.scores)));

	for (const question of questions) {
		if (question.type === "slider" && !bookCategories.has(question.category)) {
			console.warn(
				`Slider "${question.id}" uses category "${question.category}", but no book has a "score:${question.category}" column.`,
			);
		}
	}
}

function toModule(data: unknown): string {
	return "export default " + JSON.stringify(data, null, 2) + ";\n";
}

export async function runQuizExport(): Promise<void> {
	const [questionRows, bookRows] = await Promise.all([
		fetchCsv<QuestionRow>(QUESTIONS_URL as string),
		fetchCsv<BookRow>(BOOKS_URL as string),
	]);

	const questions = buildQuestions(questionRows);
	const books = buildBooks(bookRows);

	warnAboutUnknownCategories(questions, books);

	await fs.outputFile("src/_data/recQuiz/questions.js", toModule(questions));
	await fs.outputFile("src/_data/recQuiz/bookRecs.js", toModule(books));

	console.log(`Exported ${questions.length} questions and ${books.length} books.`);
}

runQuizExport().catch((err) => {
	console.error(err);
	process.exit(1);
});
