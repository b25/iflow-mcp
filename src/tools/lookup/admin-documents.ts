import { z } from "zod";
import { Tool, MCPToolResult } from "../shapes.js";
import { iflowClient } from "../../iflow/client.js";

function collectQuery(
  args: unknown,
  keys: readonly string[],
): Record<string, string | number | boolean> {
  const q: Record<string, string | number | boolean> = {};
  for (const k of keys) {
    const v = (args as Record<string, unknown>)[k];
    if (v !== undefined && v !== null) q[k] = v as string | number | boolean;
  }
  return q;
}

export const listAdminFoldersTool: Tool = {
  name: "list_admin_folders",
  description:
    "Administrative document folders (Documente -> Administrative, " +
    "CloudFolder) e.g. Cataloage, Certificate Conformitate, Fise " +
    "Echipamente. Each folder: nume, nivel_acces (public|privat, machine + " +
    "RO label), etichete, creator_id/creator_nume, data_crearii, " +
    "data_modificare, files_count. Filters: from/to (created date), " +
    "etichete (tag id or name), nivel_acces, creator (employee id), q " +
    "(name search).",
  inputSchema: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    etichete: z.string().optional(),
    nivel_acces: z.enum(["public", "privat"]).optional(),
    creator: z.number().int().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q = collectQuery(args, [
      "from", "to", "etichete", "nivel_acces", "creator", "q",
      "limit", "offset",
    ] as const);
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_admin_folders", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Administrative folders: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};

export const listAdminFilesTool: Tool = {
  name: "list_admin_files",
  description:
    "Administrative document files (Documente -> Administrative, " +
    "CloudFile). Lists files inside a folder, or across all folders when " +
    "folder_id is omitted. Each row: nume, tip_document (PDF, DOCX...), " +
    "dimensiune (human-readable), etichete, creator_id/creator_nume, " +
    "data_adaugarii, data_actualizarii, angajat, nivel_acces (public|" +
    "privat, machine + RO label), arhivat, download_url, folder_id/" +
    "folder_nume. Filters: folder_id (unknown -> folder_not_found), from/" +
    "to, etichete, nivel_acces, creator, tip_document, arhiva (false=Activ " +
    "default, true=Arhiva), q (name search).",
  inputSchema: z.object({
    folder_id: z.number().int().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    etichete: z.string().optional(),
    nivel_acces: z.enum(["public", "privat"]).optional(),
    creator: z.number().int().optional(),
    tip_document: z.string().optional(),
    arhiva: z.boolean().optional(),
    q: z.string().optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().min(0).optional(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q = collectQuery(args, [
      "folder_id", "from", "to", "etichete", "nivel_acces", "creator",
      "tip_document", "arhiva", "q", "limit", "offset",
    ] as const);
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "list_admin_files", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const count = typeof result.count === "number" ? result.count : 0;
    return {
      content: [{ type: "text", text: `Administrative files: ${count}.` }],
      structuredContent: result,
      isError: false,
    };
  },
};

export const downloadAdminFileTool: Tool = {
  name: "download_admin_file",
  description:
    "Download metadata for one administrative document file (Documente -> " +
    "Administrative, CloudFile) by file_id: returns file_id, nume, " +
    "tip_document, dimensiune and download_url (the storage URL). " +
    "Unknown file_id -> file_not_found.",
  inputSchema: z.object({
    file_id: z.number().int(),
  }),
  execute: async (args): Promise<MCPToolResult> => {
    const q = collectQuery(args, ["file_id"] as const);
    const result = await iflowClient.fetch<Record<string, unknown>>(
      "download_admin_file", "GET", undefined,
      { query: Object.keys(q).length ? q : undefined }
    );
    const url = typeof result.download_url === "string"
      ? result.download_url
      : "n/a";
    return {
      content: [{ type: "text", text: `Download URL: ${url}` }],
      structuredContent: result,
      isError: false,
    };
  },
};
