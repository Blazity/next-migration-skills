import fs from "node:fs";
import path from "node:path";

export interface PhaseState {
  name: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
}

export interface MigrationState {
  version: string;
  startedAt: string;
  updatedAt: string;
  phases: PhaseState[];
}

const DEFAULT_PHASES = [
  "assessment",
  "planning",
  "dependencies",
  "routes",
  "components",
  "data-layer",
  "validation",
];

const MIGRATION_DIR = ".migration";
const PROGRESS_FILE = "progress.json";

function progressPath(projectRoot: string) {
  return path.join(projectRoot, MIGRATION_DIR, PROGRESS_FILE);
}

export function initState(projectRoot: string): MigrationState {
  const dirPath = path.join(projectRoot, MIGRATION_DIR);
  fs.mkdirSync(dirPath, { recursive: true });

  const now = new Date().toISOString();
  const state: MigrationState = {
    version: "1.0.0",
    startedAt: now,
    updatedAt: now,
    phases: DEFAULT_PHASES.map((name) => ({ name, status: "pending" })),
  };

  fs.writeFileSync(progressPath(projectRoot), JSON.stringify(state, null, 2));
  return state;
}

export function readState(projectRoot: string): MigrationState | null {
  const filePath = progressPath(projectRoot);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as MigrationState;
}

export function updatePhaseStatus(
  projectRoot: string,
  phase: string,
  status: "pending" | "in-progress" | "completed" | "failed",
): MigrationState {
  const state = readState(projectRoot);
  if (!state) throw new Error("Migration state not initialized");

  const phaseEntry = state.phases.find((p) => p.name === phase);
  if (!phaseEntry) throw new Error(`Unknown phase: ${phase}`);

  phaseEntry.status = status;
  const now = new Date().toISOString();
  state.updatedAt = now;

  if (status === "in-progress") {
    phaseEntry.startedAt = now;
  } else if (status === "completed") {
    phaseEntry.completedAt = now;
  }

  fs.writeFileSync(progressPath(projectRoot), JSON.stringify(state, null, 2));
  return state;
}

export function getResumePoint(projectRoot: string): string | null {
  const state = readState(projectRoot);
  if (!state) return null;

  const phase = state.phases.find((p) => p.status !== "completed");
  return phase?.name ?? null;
}
