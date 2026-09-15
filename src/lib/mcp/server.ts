/**
 * The Dealbeam MCP server. One instance is built per HTTP request (stateless
 * Streamable HTTP) with the caller's principal bound in, so every tool acts
 * as that user and goes through the same ACLs as the REST API.
 *
 * Transport-agnostic on purpose: /api/mcp wraps it in the web-standard
 * Streamable HTTP transport; tests drive it over an in-memory transport.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { APP_NAME } from "@/lib/constants";
import { registerWorkspaceTools } from "./workspace-tools";
import { registerPageTools } from "./page-tools";
import { registerDealTools } from "./deal-tools";
import type { McpPrincipal } from "./util";

export const MCP_SERVER_VERSION = "1.0.0";

export const MCP_INSTRUCTIONS =
  `${APP_NAME} lets sales reps build branded deal pages (proposals, mutual ` +
  `action plans, onboarding hubs), share them by link, and see exactly how ` +
  `buyers engage. You are acting as one rep inside their team. Start with ` +
  `get_workspace to learn the team, plan limits and pipeline stages. Pages are ` +
  `written in markdown via create_page / set_tab_content; publish with ` +
  `update_page and share tracked links with share_page. Deals live in a ` +
  `simple pipeline (list_deals / update_deal). Engagement questions: ` +
  `get_recent_activity for the whole workspace, get_page_analytics for one page.`;

export function createDealbeamMcpServer(principal: McpPrincipal): McpServer {
  const server = new McpServer(
    { name: `${APP_NAME.toLowerCase()}-mcp`, version: MCP_SERVER_VERSION },
    { instructions: MCP_INSTRUCTIONS }
  );
  registerWorkspaceTools(server, principal);
  registerPageTools(server, principal);
  registerDealTools(server, principal);
  return server;
}
