import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.GENRERECS_URL;

if (!URL) {
	console.log("test");
	throw new Error("Missing RECOMMENDATIONS_URL in environment variables.");
}

interface RecommendationRow {
	Genre: string;
	"Genre Description": string;
	Title: string;
	Slug: string;
	Description: string;
}

interface Series {
	title: string;
	slug: string;
	description: string;
}

interface Genre {
	name: string;
	description: string;
	series: Series[];
}

async function fetchSheet(): Promise<RecommendationRow[]> {
	console.log("Fetching sheet");
	const res = await fetch(URL as string);

	if (!res.ok) {
		throw new Error(`Failed to fetch sheet: ${res.status}`);
	}

	const text = await res.text();

	return parse(text, {
		columns: true,
		skip_empty_lines: true,
	}) as RecommendationRow[];
}

export async function runRecommendationsExport(): Promise<void> {
	const rows = await fetchSheet();
	const genres: Genre[] = [];

	for (const row of rows) {
		const genreName = row.Genre?.trim() ?? "";
		const title = row.Title?.trim() ?? "";

		// A non-empty Genre cell that differs from the last genre starts a new one
		if (genreName !== "" && genreName !== genres.at(-1)?.name) {
			genres.push({
				name: genreName,
				description: row["Genre Description"]?.trim() ?? "",
				series: [],
			});
		}

		const current = genres.at(-1);

		// Skip rows with no series title, or rows before any genre has started
		if (title === "" || !current) continue;

		current.series.push({
			title,
			slug: row.Slug?.trim() ?? "",
			description: row.Description?.trim() ?? "",
		});
	}

	const output = "export default " + JSON.stringify(genres, null, "\t") + ";\n";

	await fs.outputFile("src/_data/genres.js", output);

	const seriesCount = genres.reduce((n, g) => n + g.series.length, 0);
	console.log(`Exported ${genres.length} genres and ${seriesCount} series.`);
}

runRecommendationsExport().catch((err) => {
	console.error(err);
	process.exit(1);
});
