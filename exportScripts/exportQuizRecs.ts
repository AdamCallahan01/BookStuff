#!/usr/bin/env node
/**
 * Builds _data/quizTree.json from a Google Sheet with two tabs: "Nodes"
 * and "Answers". Run this whenever you've edited the sheet, then commit
 * the regenerated quizTree.json.
 *
 *   npm install csv-parse --save-dev
 *   node build-quiz-data.cjs
 *
 * ---- One-time setup ----
 * 1. In the Sheet: File > Share > "Anyone with the link" > Viewer.
 *    (Only needed for the simple public-CSV approach below. If you'd
 *    rather not make it link-shareable, swap loadCsv() for the Google
 *    Sheets API with a service account instead.)
 * 2. Copy the sheet id from its URL:
 *      https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
 * 3. Click into the "Nodes" tab, copy the `gid=...` value from the URL.
 *    Do the same for the "Answers" tab. Paste both below.
 *
 * ---- Sheet columns ----
 * Nodes tab:   id | type | prompt | title | author | slug | blurb | message | if_not_read | if_liked | if_disliked
 *   - question rows use: id, type, prompt
 *   - recommendation rows use: id, type, title, author, slug, blurb, if_not_read, if_liked, if_disliked
 *   - end rows use: id, type, title, message
 *   - leave any column blank that a row's type doesn't use
 *   - exactly one row must have id = "root" (the quiz's entry point)
 *
 * Answers tab: node_id | order | answer_text | next_id
 *   - one row per answer button on a question node
 *   - `order` controls left-to-right/top-to-bottom order (1, 2, 3, ...)
 *   - `next_id` and `if_not_read`/`if_liked`/`if_disliked` above must all
 *     match an `id` that exists in the Nodes tab
 */

import { parse } from "csv-parse/sync";
import fs from "fs-extra";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const NODES_SOURCE = process.env.QUIZRECS_NODES_URL;
const ANSWERS_SOURCE = process.env.QUIZRECS_ANSWERS_URL;

if (!NODES_SOURCE) {
  throw new Error("QUIZRECS_NODES_URL is not defined.");
}

if (!ANSWERS_SOURCE) {
  throw new Error("QUIZRECS_ANSWERS_URL is not defined.");
}

// const OUTPUT_PATH = path.join(import.meta.dirname, "_data", "quizTree.json");
const OUTPUT_PATH = path.join("./src/", "_data", "quizTree.json");
const START_NODE_ID = 'root';

type CsvRow = Record<string, string>;

type NodeType = 'question' | 'recommendation' | 'end';

interface Answer {
  order: number;
  text: string;
  next: string;
}

interface QuestionNode {
  type: 'question';
  prompt: string;
  answers: Answer[];
}

interface RecommendationNode {
  type: 'recommendation';
  title: string;
  blurb: string;
  ifNotRead: string;
  ifLiked: string;
  ifDisliked: string;
  author?: string;
  slug?: string;
}

interface EndNode {
  type: 'end';
  title: string;
  message: string;
}

type Node = QuestionNode | RecommendationNode | EndNode;
type Nodes = Record<string, Node>;

interface BuildResult {
  nodes: Nodes;
  errors: string[];
  warnings: string[];
}

async function loadCsv(source: string): Promise<string> {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch ${source}: ${res.status} ${res.statusText}`,
      );
    }

    return res.text();
  }

  return fs.readFileSync(source, 'utf8');
}

function parseRows(csvText: string): CsvRow[] {
  return parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
}

function buildNodes(nodeRows: CsvRow[], answerRows: CsvRow[]): BuildResult {
  const nodes: Nodes = {};
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  for (const row of nodeRows) {
    const id = (row.id || '').trim();

    if (!id) {
      warnings.push(
        `Skipping a Nodes row with a blank id (type: "${row.type}").`,
      );
      continue;
    }

    if (seenIds.has(id)) {
      errors.push(`Duplicate node id "${id}" in the Nodes sheet.`);
      continue;
    }

    seenIds.add(id);

    const type = (row.type || '').trim() as NodeType;

    if (!['question', 'recommendation', 'end'].includes(type)) {
      errors.push(
        `Node "${id}" has an unrecognized type "${row.type}" (expected question, recommendation, or end).`,
      );
      continue;
    }

    if (type === 'question') {
      nodes[id] = {
        type,
        prompt: row.prompt || '',
        answers: [],
      };
    } else if (type === 'recommendation') {
      const node: RecommendationNode = {
        type,
        title: row.title || '',
        blurb: row.blurb || '',
        ifNotRead: row.if_not_read || 'end_default',
        ifLiked: row.if_liked || 'end_default',
        ifDisliked: row.if_disliked || 'end_default',
      };

      if (row.author) node.author = row.author;
      if (row.slug) node.slug = row.slug;

      nodes[id] = node;
    } else {
      nodes[id] = {
        type,
        title: row.title || '',
        message: row.message || '',
      };
    }
  }

  const answersByNode: Record<string, Answer[]> = {};

  for (const row of answerRows) {
    const nodeId = (row.node_id || '').trim();

    if (!nodeId) {
      warnings.push('Skipping an Answers row with a blank node_id.');
      continue;
    }

    (answersByNode[nodeId] ||= []).push({
      order: Number(row.order) || 0,
      text: row.answer_text || '',
      next: row.next_id || '',
    });
  }

  for (const [nodeId, answers] of Object.entries(answersByNode)) {
    const node = nodes[nodeId];

    if (!node) {
      errors.push(
        `Answers sheet references node id "${nodeId}", which doesn't exist in the Nodes sheet.`,
      );
      continue;
    }

    if (node.type !== 'question') {
      errors.push(
        `Answers sheet has rows for "${nodeId}", but that node's type is "${node.type}", not "question".`,
      );
      continue;
    }

    answers.sort((a, b) => a.order - b.order);
    node.answers = answers.map(({ text, next, order }) => ({ text, next, order }));
  }

  for (const [id, node] of Object.entries(nodes)) {
    if (node.type === 'question' && node.answers.length === 0) {
      warnings.push(
        `Question "${id}" has no answers in the Answers sheet — it will be a dead end.`,
      );
    }
  }

  const referencesOf = {
    question: (node: QuestionNode): string[] =>
      node.answers.map((answer) => answer.next),

    recommendation: (node: RecommendationNode): string[] => [
      node.ifNotRead,
      node.ifLiked,
      node.ifDisliked,
    ],

    end: (_node: EndNode): string[] => [],
  };

  for (const [id, node] of Object.entries(nodes)) {
    for (const targetId of referencesOf[node.type](node as never)) {
      if (targetId && !nodes[targetId]) {
        errors.push(`Node "${id}" points at "${targetId}", which doesn't exist.`);
      }
    }
  }

  if (!nodes[START_NODE_ID]) {
    errors.push(
      `No node with id "${START_NODE_ID}" — that's required as the quiz's starting node.`,
    );
  }

  return { nodes, errors, warnings };
}

async function main(): Promise<void> {
  if (!NODES_SOURCE || !ANSWERS_SOURCE) {
    return;
  }

  const [nodesCsv, answersCsv] = await Promise.all([
    loadCsv(NODES_SOURCE),
    loadCsv(ANSWERS_SOURCE),
  ]);
  

  const { nodes, errors, warnings } = buildNodes(
    parseRows(nodesCsv),
    parseRows(answersCsv),
  );

  warnings.forEach((warning) => console.warn('Warning:', warning));

  if (errors.length) {
    errors.forEach((error) => console.error('Error:', error));
    console.error(
      `\n${errors.length} error(s) found — quizTree.json was NOT written.`,
    );
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ start: START_NODE_ID, nodes }, null, 2) + '\n',
  );

  console.log(
    `Wrote ${Object.keys(nodes).length} nodes to ${OUTPUT_PATH}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
