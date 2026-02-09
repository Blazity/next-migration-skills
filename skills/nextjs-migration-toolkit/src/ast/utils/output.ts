export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function formatDiff(oldContent: string, newContent: string, filename: string): string {
  if (oldContent === newContent) return "";

  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  const lines: string[] = [`--- a/${filename}`, `+++ b/${filename}`];

  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      lines.push(` ${oldLines[i]}`);
      i++;
      j++;
    } else {
      if (i < oldLines.length) {
        lines.push(`-${oldLines[i]}`);
        i++;
      }
      if (j < newLines.length) {
        lines.push(`+${newLines[j]}`);
        j++;
      }
    }
  }

  return lines.join("\n");
}

export function printOutput(data: unknown, format: "json" | "diff" = "json"): void {
  if (format === "json") {
    process.stdout.write(formatJson(data) + "\n");
  } else {
    process.stdout.write(String(data) + "\n");
  }
}
