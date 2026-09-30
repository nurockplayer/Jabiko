// CLI for one bridge call (design tooling only).
//
//   FIGMA_BRIDGE_DIR=<npx dir containing node_modules/@gethopp/figma-mcp-bridge>
//   FIGMA_WORK_DIR=<artifact dir; import_html_layers paths must live inside it>
//   node bridge.mjs <tool|tools> ['<json args>'] [output.json]
import fs from "node:fs";
import path from "node:path";
import { openBridge } from "./bridge-client.mjs";

const [tool = "tools", args = "{}", output] = process.argv.slice(2);
const bridge = await openBridge();
try {
  const result = tool === "tools" ? await bridge.tools() : await bridge.call(tool, JSON.parse(args));
  if (output) fs.writeFileSync(path.resolve(process.env.FIGMA_WORK_DIR ?? process.cwd(), output), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result).slice(0, 4000));
} finally {
  await bridge.close();
}
