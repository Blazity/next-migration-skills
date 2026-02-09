import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface MigrationError {
  id?: string;
  phase: string;
  file?: string;
  message: string;
  severity: "error" | "warning" | "info";
  timestamp?: string;
  resolved?: boolean;
}

interface ErrorLog {
  errors: MigrationError[];
}

function errorsPath(projectRoot: string) {
  return path.join(projectRoot, ".migration", "errors.json");
}

export function readErrors(projectRoot: string): MigrationError[] {
  const filePath = errorsPath(projectRoot);
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf-8");
  const log: ErrorLog = JSON.parse(raw);
  return log.errors;
}

export function logError(projectRoot: string, error: MigrationError) {
  const filePath = errorsPath(projectRoot);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const errors = readErrors(projectRoot);
  errors.push({
    ...error,
    id: error.id ?? crypto.randomUUID(),
    timestamp: error.timestamp ?? new Date().toISOString(),
    resolved: error.resolved ?? false,
  });

  fs.writeFileSync(filePath, JSON.stringify({ errors }, null, 2), "utf-8");
}

export function resolveError(projectRoot: string, errorId: string) {
  const filePath = errorsPath(projectRoot);
  if (!fs.existsSync(filePath)) return;

  const errors = readErrors(projectRoot);
  const target = errors.find((e) => e.id === errorId);
  if (!target) return;

  target.resolved = true;
  fs.writeFileSync(filePath, JSON.stringify({ errors }, null, 2), "utf-8");
}
