import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  initState,
  readState,
  updatePhaseStatus,
  getResumePoint,
} from "../../src/state/progress.js";

const DEFAULT_PHASES = [
  "assessment",
  "planning",
  "dependencies",
  "routes",
  "components",
  "data-layer",
  "validation",
];

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "migration-state-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("initState", () => {
  it("creates the .migration directory and progress.json with correct structure", () => {
    const state = initState(tmpDir);

    expect(fs.existsSync(path.join(tmpDir, ".migration", "progress.json"))).toBe(true);
    expect(state.version).toBe("1.0.0");
    expect(state.startedAt).toBeTruthy();
    expect(state.updatedAt).toBeTruthy();
    expect(state.phases).toHaveLength(DEFAULT_PHASES.length);
    state.phases.forEach((phase, i) => {
      expect(phase.name).toBe(DEFAULT_PHASES[i]);
      expect(phase.status).toBe("pending");
    });
  });
});

describe("readState", () => {
  it("returns null for non-existent state", () => {
    expect(readState(tmpDir)).toBeNull();
  });

  it("returns correct state after init", () => {
    initState(tmpDir);
    const state = readState(tmpDir);

    expect(state).not.toBeNull();
    expect(state!.version).toBe("1.0.0");
    expect(state!.phases).toHaveLength(DEFAULT_PHASES.length);
  });
});

describe("updatePhaseStatus", () => {
  it("changes phase status and updates timestamps", () => {
    initState(tmpDir);

    const updated = updatePhaseStatus(tmpDir, "assessment", "in-progress");
    const assessment = updated.phases.find((p) => p.name === "assessment")!;

    expect(assessment.status).toBe("in-progress");
    expect(assessment.startedAt).toBeTruthy();

    const completed = updatePhaseStatus(tmpDir, "assessment", "completed");
    const done = completed.phases.find((p) => p.name === "assessment")!;

    expect(done.status).toBe("completed");
    expect(done.completedAt).toBeTruthy();
  });

  it("throws for uninitialized state", () => {
    expect(() => updatePhaseStatus(tmpDir, "assessment", "in-progress")).toThrow(
      "Migration state not initialized",
    );
  });

  it("throws for unknown phase", () => {
    initState(tmpDir);
    expect(() => updatePhaseStatus(tmpDir, "nonexistent", "in-progress")).toThrow(
      "Unknown phase: nonexistent",
    );
  });
});

describe("getResumePoint", () => {
  it("returns first non-completed phase", () => {
    initState(tmpDir);
    updatePhaseStatus(tmpDir, "assessment", "completed");
    updatePhaseStatus(tmpDir, "planning", "completed");

    expect(getResumePoint(tmpDir)).toBe("dependencies");
  });

  it("returns null for non-existent state", () => {
    expect(getResumePoint(tmpDir)).toBeNull();
  });

  it("returns null when all phases are completed", () => {
    initState(tmpDir);
    DEFAULT_PHASES.forEach((phase) => updatePhaseStatus(tmpDir, phase, "completed"));

    expect(getResumePoint(tmpDir)).toBeNull();
  });
});
