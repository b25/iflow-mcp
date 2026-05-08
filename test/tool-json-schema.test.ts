import { describe, it, expect } from "vitest";
import { z } from "zod";
import { toolInputToJsonSchema } from "../src/tools/tool-input-json-schema.js";

describe("toolInputToJsonSchema", () => {
  it("emits object root for z.object", () => {
    const schema = z.object({
      foo: z.string(),
      bar: z.number().optional(),
    });
    const json = toolInputToJsonSchema(schema);
    expect(json.type).toBe("object");
    expect(json.properties).toBeDefined();
    expect((json.properties as Record<string, unknown>).foo).toBeDefined();
  });

  it("falls back for non-object roots", () => {
    const json = toolInputToJsonSchema(z.string());
    expect(json.type).toBe("object");
    expect(json.additionalProperties).toBe(true);
  });
});
