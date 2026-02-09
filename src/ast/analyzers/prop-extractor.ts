import {
  SourceFile,
  SyntaxKind,
  FunctionDeclaration,
  VariableDeclaration,
  ParameterDeclaration,
  PropertySignature,
  TypeLiteralNode,
} from "ts-morph";
import { parseCode } from "../utils/parser.js";

interface PropInfo {
  name: string;
  type: string;
  optional: boolean;
}

interface ComponentProps {
  componentName: string;
  propsTypeName: string | null;
  props: PropInfo[];
}

interface PropAnalysis {
  components: ComponentProps[];
  summary: {
    totalComponents: number;
    totalProps: number;
  };
}

function isPascalCase(name: string): boolean {
  return /^[A-Z]/.test(name);
}

function extractPropFromSignature(prop: PropertySignature, sf: SourceFile): PropInfo {
  const name = prop.getName();
  const optional = prop.hasQuestionToken();
  const typeNode = prop.getTypeNode();
  const type = typeNode ? typeNode.getText() : prop.getType().getText(sf);
  return { name, type, optional };
}

function extractPropsFromTypeLiteral(typeLiteral: TypeLiteralNode, sf: SourceFile): PropInfo[] {
  return typeLiteral.getProperties().map((prop) => {
    if (prop.getKind() === SyntaxKind.PropertySignature) {
      return extractPropFromSignature(prop as PropertySignature, sf);
    }
    return { name: prop.getText(), type: "unknown", optional: false };
  });
}

function extractPropsFromParam(param: ParameterDeclaration, sf: SourceFile): { propsTypeName: string | null; props: PropInfo[] } {
  const typeNode = param.getTypeNode();
  if (!typeNode) return { propsTypeName: null, props: [] };

  if (typeNode.getKind() === SyntaxKind.TypeReference) {
    const typeName = typeNode.getText();
    const iface = sf.getInterface(typeName);
    if (iface) {
      const props = iface.getProperties().map((prop) => extractPropFromSignature(prop, sf));
      return { propsTypeName: typeName, props };
    }

    const typeAlias = sf.getTypeAlias(typeName);
    if (typeAlias) {
      const aliasTypeNode = typeAlias.getTypeNode();
      if (aliasTypeNode && aliasTypeNode.getKind() === SyntaxKind.TypeLiteral) {
        const props = extractPropsFromTypeLiteral(aliasTypeNode as TypeLiteralNode, sf);
        return { propsTypeName: typeName, props };
      }
    }

    return { propsTypeName: typeName, props: [] };
  }

  if (typeNode.getKind() === SyntaxKind.TypeLiteral) {
    const props = extractPropsFromTypeLiteral(typeNode as TypeLiteralNode, sf);
    return { propsTypeName: null, props };
  }

  return { propsTypeName: null, props: [] };
}

function isExportedFunction(func: FunctionDeclaration): boolean {
  return func.isExported() || func.isDefaultExport();
}

function analyzeFunction(func: FunctionDeclaration, sf: SourceFile): ComponentProps | null {
  const name = func.getName();
  if (!name || !isPascalCase(name)) return null;
  if (!isExportedFunction(func)) return null;

  const params = func.getParameters();
  if (params.length === 0) {
    return { componentName: name, propsTypeName: null, props: [] };
  }

  const { propsTypeName, props } = extractPropsFromParam(params[0], sf);
  return { componentName: name, propsTypeName, props };
}

function analyzeArrowFunction(decl: VariableDeclaration, sf: SourceFile): ComponentProps | null {
  const name = decl.getName();
  if (!isPascalCase(name)) return null;

  const varStatement = decl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
  if (!varStatement) return null;

  const isExported = varStatement.isExported() || varStatement.isDefaultExport();
  if (!isExported) return null;

  const initializer = decl.getInitializer();
  if (!initializer || initializer.getKind() !== SyntaxKind.ArrowFunction) return null;

  const arrowFunc = initializer.asKindOrThrow(SyntaxKind.ArrowFunction);
  const params = arrowFunc.getParameters();
  if (params.length === 0) {
    return { componentName: name, propsTypeName: null, props: [] };
  }

  const { propsTypeName, props } = extractPropsFromParam(params[0], sf);
  return { componentName: name, propsTypeName, props };
}

export function extractProps(code: string, filename: string): PropAnalysis {
  const sf = parseCode(code, filename);
  const components: ComponentProps[] = [];

  for (const func of sf.getFunctions()) {
    const result = analyzeFunction(func, sf);
    if (result) components.push(result);
  }

  for (const decl of sf.getVariableDeclarations()) {
    const result = analyzeArrowFunction(decl, sf);
    if (result) components.push(result);
  }

  const totalProps = components.reduce((sum, c) => sum + c.props.length, 0);

  return {
    components,
    summary: {
      totalComponents: components.length,
      totalProps,
    },
  };
}
