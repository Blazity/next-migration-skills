import fs from "node:fs";
import Handlebars from "handlebars";

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

function loadTemplate(templateName: string): HandlebarsTemplateDelegate {
  const cached = templateCache.get(templateName);
  if (cached) return cached;

  const templatePath = new URL(`./${templateName}.hbs`, import.meta.url);
  const source = fs.readFileSync(templatePath, "utf-8");
  const compiled = Handlebars.compile(source);
  templateCache.set(templateName, compiled);
  return compiled;
}

export function renderTemplate(templateName: string, data: Record<string, unknown>): string {
  const template = loadTemplate(templateName);
  return template(data);
}

export function renderLayout(data: {
  name: string;
  isRoot?: boolean;
  metadata?: { title: string; description: string };
}): string {
  return renderTemplate("layout.tsx", data);
}

export function renderPage(data: {
  name: string;
  isClient?: boolean;
  isAsync?: boolean;
  hasProps?: boolean;
  props?: { name: string; type: string; optional?: boolean }[];
  imports?: { default: string; from: string }[];
  fetchData?: boolean;
  fetchUrl?: string;
  fetchOptions?: string;
}): string {
  return renderTemplate("page.tsx", data);
}

export function renderRoute(data: {
  methods: string[];
}): string {
  return renderTemplate("route.ts", data);
}

export function renderLoading(data: { name: string }): string {
  return renderTemplate("loading.tsx", data);
}

export function renderError(data: { name: string }): string {
  return renderTemplate("error.tsx", data);
}
