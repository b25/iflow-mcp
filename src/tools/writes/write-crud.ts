import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";
import { config } from "../../iflow/config.js";

function readOnlyError(action: string): MCPToolResult {
  return {
    content: [
      {
        type: "text",
        text: `Refused: ${action} is a write operation but IFLOW_READ_ONLY=1.`,
      },
    ],
    isError: true,
  };
}

export const createClientTool: Tool = {
  name: "create_client",
  description:
    "Create a new client in iflow (POST). Disabled when IFLOW_READ_ONLY=1. Requires confirmation.",
  inputSchema: z.object({
    name: z.string().min(1),
    alias: z.string().optional(),
    tax_code: z.string().optional(),
    vat_payer: z.number().int().min(0).max(1).optional(),
    reg_no: z.string().optional(),
    country: z.string().optional(),
    district_new: z.string().optional(),
    locality: z.string().optional(),
    street: z.string().optional(),
    street_no: z.string().optional(),
    zip_code: z.string().optional(),
    bank: z.string().optional(),
    bank_account: z.string().optional(),
    website: z.string().optional(),
    payment_deadline: z.number().int().nonnegative().optional(),
    mobile_new: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().optional(),
    contacts: z
      .array(
        z.object({
          name: z.string().min(1),
          surname: z.string().optional(),
          role: z.string().optional(),
          phone: z.string().optional(),
          mobile: z.string().optional(),
          email: z.string().optional(),
        })
      )
      .optional(),
    delivery_addresses: z
      .array(
        z.object({
          address_name: z.string().optional(),
          contact: z.string().optional(),
          contact_email: z.string().optional(),
          contact_phone: z.string().optional(),
          district_new: z.string().optional(),
          locality: z.string().optional(),
          street: z.string().optional(),
          street_no: z.string().optional(),
          zip_code: z.string().optional(),
          country: z.string().optional(),
        })
      )
      .optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("create_client");
    const { confirm, ...clientData } = args;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "create_client",
      "POST",
      clientData,
      {
        confirmToken: confirm ? "mcp_confirm=1" : undefined,
      }
    );

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `Client created successfully: ${String(result.message ?? "ok")}.`
            : `Failed: ${String(result.message ?? "unknown error")}.`,
        },
      ],
      structuredContent: result,
      isError: !result.success,
    };
  },
};

export const createProductTool: Tool = {
  name: "create_product",
  description:
    "Create a new product in iflow (POST). Disabled when IFLOW_READ_ONLY=1. Requires confirmation.",
  inputSchema: z.object({
    name: z.string().min(1),
    alias: z.string().optional(),
    category: z.string().min(1),
    subcategory: z.string().min(1),
    temp_tags: z.string().optional(),
    provider: z.string().min(1),
    code: z.string().optional(),
    code_cpv: z.string().optional(),
    administration: z.string().optional(),
    show_to_customer: z.string().optional(),
    recommended_product: z.string().optional(),
    product_currency: z.string().min(3),
    um: z.string().min(1),
    price_acquisition: z.number().nonnegative(),
    acquisition_cost_source: z.string().min(1),
    large_business_addition: z.number().nonnegative(),
    medium_business_addition: z.number().nonnegative(),
    small_business_addition: z.number().nonnegative(),
    price_fixed: z.number().optional(),
    dynamic_price: z.string().optional(),
    vat_rate: z.number().int().nonnegative().optional(),
    stock_unlimited: z.string().optional(),
    dimension_um: z.string().min(1),
    stock: z.number().optional(),
    entry_average_unit_price: z.number().optional(),
    stock_minim: z.number().optional(),
    stock_maxim: z.number().optional(),
    code_nc: z.string().optional(),
    accounting_account: z.number().int().optional(),
    dimension_height: z.number().optional(),
    dimension_width: z.number().optional(),
    display_um: z.string().optional(),
    temp_equipments: z.string().optional(),
    exclude_from_workflow: z.string().optional(),
    description: z.string().optional(),
    product_weight: z.number().optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("create_product");
    const { confirm, ...productData } = args;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "create_product",
      "POST",
      productData,
      {
        confirmToken: confirm ? "mcp_confirm=1" : undefined,
      }
    );

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `Product created successfully (ID: ${result.id}).`
            : `Failed: ${String(result.message ?? "unknown error")}.`,
        },
      ],
      structuredContent: result,
      isError: !result.success,
    };
  },
};

export const updateProductTool: Tool = {
  name: "update_product",
  description:
    "Update an existing product in iflow (PUT). Disabled when IFLOW_READ_ONLY=1. Requires confirmation.",
  inputSchema: z.object({
    name: z.string().min(1),
    alias: z.string().optional(),
    category: z.string().min(1),
    subcategory: z.string().min(1),
    temp_tags: z.string().optional(),
    provider: z.string().min(1),
    code: z.string().optional(),
    code_cpv: z.string().optional(),
    administration: z.string().optional(),
    show_to_customer: z.string().optional(),
    recommended_product: z.string().optional(),
    product_currency: z.string().min(3),
    um: z.string().min(1),
    price_acquisition: z.number().nonnegative(),
    acquisition_cost_source: z.string().min(1),
    large_business_addition: z.number().nonnegative(),
    medium_business_addition: z.number().nonnegative(),
    small_business_addition: z.number().nonnegative(),
    price_fixed: z.number().optional(),
    dynamic_price: z.string().optional(),
    vat_rate: z.number().int().nonnegative().optional(),
    stock_unlimited: z.string().optional(),
    dimension_um: z.string().min(1),
    stock: z.number().optional(),
    entry_average_unit_price: z.number().optional(),
    stock_minim: z.number().optional(),
    stock_maxim: z.number().optional(),
    code_nc: z.string().optional(),
    accounting_account: z.number().int().optional(),
    dimension_height: z.number().optional(),
    dimension_width: z.number().optional(),
    display_um: z.string().optional(),
    temp_equipments: z.string().optional(),
    exclude_from_workflow: z.string().optional(),
    description: z.string().optional(),
    product_weight: z.number().optional(),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("update_product");
    const { confirm, ...productData } = args;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "update_product",
      "PUT",
      productData,
      {
        confirmToken: confirm ? "mcp_confirm=1" : undefined,
      }
    );

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `Product updated successfully (ID: ${result.id}).`
            : `Failed: ${String(result.message ?? "unknown error")}.`,
        },
      ],
      structuredContent: result,
      isError: !result.success,
    };
  },
};

export const createAdministrationTool: Tool = {
  name: "create_administration",
  description:
    "Create a new administration in iflow (POST). Disabled when IFLOW_READ_ONLY=1. Requires confirmation.",
  inputSchema: z.object({
    name: z.string().min(1),
    confirm: z.boolean().optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    if (config.IFLOW_READ_ONLY) return readOnlyError("create_administration");
    const { confirm, ...adminData } = args;
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "create_administration",
      "POST",
      adminData,
      {
        confirmToken: confirm ? "mcp_confirm=1" : undefined,
      }
    );

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `Administration created successfully: ${String(result.message ?? "ok")}.`
            : `Failed: ${String(result.message ?? "unknown error")}.`,
        },
      ],
      structuredContent: result,
      isError: !result.success,
    };
  },
};
