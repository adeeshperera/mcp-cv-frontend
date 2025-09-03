import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

interface MCPToolCall {
	tool: string;
	arguments?: Record<string, unknown>;
}

interface MCPResponse {
	success: boolean;
	data?: unknown;
	summary?: string;
	error?: string;
}

export async function POST(request: NextRequest) {
	try {
		const { tool, arguments: args }: MCPToolCall = await request.json();

		if (!tool) {
			return NextResponse.json(
				{ error: "Tool name is required" },
				{ status: 400 }
			);
		}

		// Get the server path
		const serverPath = path.join(
			process.cwd(),
			"..",
			"server",
			"src",
			"index.js"
		);

		// Create MCP client to communicate with server
		const result = await callMCPTool(serverPath, tool, args || {});

		return NextResponse.json(result);
	} catch (error) {
		console.error("API: Error calling MCP tool:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
				success: false,
			},
			{ status: 500 }
		);
	}
}

async function callMCPTool(
	serverPath: string,
	toolName: string,
	args: Record<string, unknown>
): Promise<MCPResponse> {
	return new Promise((resolve, reject) => {
		// Spawn the MCP server process
		const serverProcess = spawn("node", [serverPath], {
			stdio: ["pipe", "pipe", "pipe"],
			cwd: path.dirname(serverPath),
			env: { ...process.env }, // Inherit environment variables
		});

		let requestSent = false;

		// Handle stdout (MCP responses)
		serverProcess.stdout.on("data", (data) => {
			const chunk = data.toString();

			// Look for JSON RPC responses
			const lines = chunk.split("\n");
			for (const line of lines) {
				if (line.trim() && line.includes('"result"')) {
					try {
						const response = JSON.parse(line.trim());
						if (response.result && response.result.content) {
							const content = response.result.content[0]?.text;
							if (content) {
								const result = JSON.parse(content);
								resolve(result);
								return;
							}
						}
					} catch {
						// Not a JSON response, continue
					}
				}
			}
		});

		// Handle process events
		serverProcess.on("spawn", () => {
			// Send the tool call request after a short delay
			setTimeout(() => {
				if (!requestSent) {
					sendToolRequest();
				}
			}, 1000);
		});

		serverProcess.on("error", (error) => {
			console.error("Server process error:", error);
			reject(new Error(`Server process error: ${error.message}`));
		});

		serverProcess.on("close", (code) => {
			if (!requestSent) {
				reject(
					new Error(`Server process closed unexpectedly with code ${code}`)
				);
			}
		});

		function sendToolRequest() {
			if (requestSent) return;
			requestSent = true;

			// First, send an initialize request
			const initRequest = {
				jsonrpc: "2.0",
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: {
						name: "mcp-cv-frontend",
						version: "1.0.0",
					},
				},
			};

			serverProcess.stdin.write(JSON.stringify(initRequest) + "\n");

			// Then send the tool call request
			setTimeout(() => {
				const toolRequest = {
					jsonrpc: "2.0",
					id: 2,
					method: "tools/call",
					params: {
						name: toolName,
						arguments: args,
					},
				};

				serverProcess.stdin.write(JSON.stringify(toolRequest) + "\n");

				// Close stdin to signal we're done
				serverProcess.stdin.end();

				// Set a timeout for the response
				setTimeout(() => {
					if (!serverProcess.killed) {
						serverProcess.kill();
						reject(new Error("Request timeout"));
					}
				}, 10000);
			}, 500);
		}
	});
}

// Also handle GET for testing
export async function GET() {
	return NextResponse.json({
		message: "MCP API endpoint is running",
		availableTools: [
			"get_personal_info",
			"get_work_experience",
			"get_education",
			"get_skills",
			"search_cv",
			"query_cv",
			"send_email",
		],
	});
}
