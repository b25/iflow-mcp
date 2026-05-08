import type { ZodType } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const permissiveObject = {
  type: "object",
  properties: {},
  additionalProperties: true,
} as const;

/**
 * MCP tools/list expects JSON Schema with root type "object".
 */
export function toolInputToJsonSchema(schema: ZodType): Record<string, unknown> {
  try {
    const json = zodToJsonSchema(schema, {
      $refStrategy: "none",
      target: "jsonSchema7",
    }) as Record<string, unknown>;
    delete json.$schema;
    if (json.type !== "object") {
      return { ...permissiveObject };
    }
    return json;
  } catch {
    return { ...permissiveObject };
  }
}
