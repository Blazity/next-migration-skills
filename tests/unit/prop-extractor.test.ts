import { describe, it, expect } from "vitest";
import { extractProps } from "../../skills/nextjs-migration-toolkit/src/ast/analyzers/prop-extractor.js";

describe("extractProps", () => {
  it("extracts props from interface-typed component", () => {
    const code = `
      interface CardProps {
        title: string;
        description: string;
        imageUrl?: string;
      }
      export default function Card({ title, description, imageUrl }: CardProps) {
        return <div>{title}</div>;
      }
    `;
    const result = extractProps(code, "Card.tsx");
    expect(result.components).toHaveLength(1);
    expect(result.components[0].componentName).toBe("Card");
    expect(result.components[0].propsTypeName).toBe("CardProps");
    expect(result.components[0].props).toHaveLength(3);

    const titleProp = result.components[0].props.find(p => p.name === "title");
    expect(titleProp).toBeDefined();
    expect(titleProp!.type).toBe("string");
    expect(titleProp!.optional).toBe(false);

    const imageProp = result.components[0].props.find(p => p.name === "imageUrl");
    expect(imageProp).toBeDefined();
    expect(imageProp!.optional).toBe(true);
  });

  it("extracts props from inline typed component", () => {
    const code = `
      export default function Badge({ label, count }: { label: string; count?: number }) {
        return <span>{label}: {count}</span>;
      }
    `;
    const result = extractProps(code, "Badge.tsx");
    expect(result.components).toHaveLength(1);
    expect(result.components[0].componentName).toBe("Badge");
    expect(result.components[0].propsTypeName).toBeNull();
    expect(result.components[0].props).toHaveLength(2);

    const countProp = result.components[0].props.find(p => p.name === "count");
    expect(countProp!.optional).toBe(true);
  });

  it("handles components with no props", () => {
    const code = `
      export default function Logo() {
        return <img src="/logo.svg" />;
      }
    `;
    const result = extractProps(code, "Logo.tsx");
    expect(result.components).toHaveLength(1);
    expect(result.components[0].props).toHaveLength(0);
  });

  it("provides accurate summary", () => {
    const code = `
      interface Props { name: string; age?: number; }
      export default function Profile({ name, age }: Props) {
        return <div>{name}</div>;
      }
    `;
    const result = extractProps(code, "Profile.tsx");
    expect(result.summary.totalComponents).toBe(1);
    expect(result.summary.totalProps).toBe(2);
  });
});
