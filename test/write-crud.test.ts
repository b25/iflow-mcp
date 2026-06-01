import { describe, it, expect, beforeEach } from "vitest";
import { registerAllTools } from "../src/tools/index.js";
import { registry } from "../src/tools/registry.js";

describe("additional CRUD write tools — inputSchema", () => {
  beforeEach(() => {
    registry.clear();
    registerAllTools();
  });

  it.each(["create_client", "create_product", "update_product", "create_administration"])(
    "%s registered",
    (key) => {
      expect(registry.getTool(key), `missing tool ${key}`).toBeDefined();
    }
  );

  it("create_client validates minimal input", () => {
    const tool = registry.getTool("create_client")!;
    expect(tool.inputSchema.safeParse({ name: "ACME Corp" }).success).toBe(true);
    expect(tool.inputSchema.safeParse({}).success).toBe(false);
  });

  it("create_product validates pricing additions", () => {
    const tool = registry.getTool("create_product")!;
    expect(
      tool.inputSchema.safeParse({
        name: "Acme Product",
        category: "cat",
        subcategory: "sub",
        provider: "prov",
        product_currency: "RON",
        um: "buc",
        price_acquisition: 10,
        acquisition_cost_source: "PRODUCT",
        large_business_addition: 2,
        medium_business_addition: 3,
        small_business_addition: 4,
        dimension_um: "mm",
      }).success
    ).toBe(true);
    expect(tool.inputSchema.safeParse({ name: "Acme Product" }).success).toBe(false);
  });

  it("create_administration validates name", () => {
    const tool = registry.getTool("create_administration")!;
    expect(tool.inputSchema.safeParse({ name: "Main Gestiune" }).success).toBe(true);
    expect(tool.inputSchema.safeParse({}).success).toBe(false);
  });
});
