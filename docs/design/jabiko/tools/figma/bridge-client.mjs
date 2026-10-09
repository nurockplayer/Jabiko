// Shared MCP client for the official gethopp/figma-mcp-bridge v0.0.22 server
// (design tooling only). Spawns the published server over stdio — it joins
// the running leader on :1994 as a follower — and exposes call(tool, args).
// No bridge code is patched or re-implemented here.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const BRIDGE_VERSION = "0.0.22";

export async function openBridge({ bridgeDir = process.env.FIGMA_BRIDGE_DIR, workDir = process.env.FIGMA_WORK_DIR ?? process.cwd() } = {}) {
  if (!bridgeDir) throw new Error("Set FIGMA_BRIDGE_DIR to the npx directory of @gethopp/figma-mcp-bridge@0.0.22");
  const modules = path.join(bridgeDir, "node_modules");
  const serverPkg = JSON.parse(fs.readFileSync(path.join(modules, "@gethopp/figma-mcp-bridge/package.json"), "utf8"));
  if (serverPkg.version !== BRIDGE_VERSION) throw new Error(`Expected bridge ${BRIDGE_VERSION}, found ${serverPkg.version}`);
  const { Client } = await import(pathToFileURL(path.join(modules, "@modelcontextprotocol/sdk/dist/esm/client/index.js")).href);
  const { StdioClientTransport } = await import(pathToFileURL(path.join(modules, "@modelcontextprotocol/sdk/dist/esm/client/stdio.js")).href);
  const client = new Client({ name: "jabiko-jt1-design-client", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(modules, "@gethopp/figma-mcp-bridge/dist/index.js")],
    cwd: workDir,
    stderr: "pipe"
  });
  transport.stderr?.on("data", () => {});
  await client.connect(transport);
  return {
    version: serverPkg.version,
    async tools() {
      return client.listTools();
    },
    // Returns parsed JSON text content when possible; throws on tool errors.
    async call(name, args = {}) {
      const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 300000 });
      const text = result.content?.map((c) => c.text ?? "").join("") ?? "";
      if (result.isError) throw new Error(`${name} failed: ${text.slice(0, 500)}`);
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    },
    close: () => client.close()
  };
}
