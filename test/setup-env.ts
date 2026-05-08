import { REQUIRED_IFLOW_API_POINT_KEYS } from "../src/tools/required-keys-list.js";

function dummyUuid(i: number): string {
  const tail = i.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${tail}`;
}

process.env.IFLOW_BASE_URL = "https://test.example.com";
process.env.IFLOW_ALLOWED_HOSTS = "test.example.com";
process.env.IFLOW_API_BEARER = "test-bearer-not-for-production";
process.env.IFLOW_READ_ONLY = "0";

const points: Record<string, string> = {};
let i = 0;
for (const k of REQUIRED_IFLOW_API_POINT_KEYS) {
  points[k] = dummyUuid(i++);
}
process.env.IFLOW_API_POINTS = JSON.stringify(points);
