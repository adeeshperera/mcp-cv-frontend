import { NextRequest, NextResponse } from "next/server";

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

		// Use environment variable for server URL
		const serverUrl = process.env.MCP_SERVER_URL || "http://localhost:3001";

		// Call the deployed MCP server
		const result = await callMCPServer(serverUrl, tool, args || {});

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

async function callMCPServer(
	serverUrl: string,
	toolName: string,
	args: Record<string, unknown>
): Promise<MCPResponse> {
	try {
		const response = await fetch(`${serverUrl}/execute`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				tool: toolName,
				arguments: args,
			}),
		});

		if (!response.ok) {
			throw new Error(`Server responded with status: ${response.status}`);
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("Error calling MCP server:", error);
		throw new Error(
			error instanceof Error ? error.message : "Failed to call MCP server"
		);
	}
}

// Also handle GET for testing
export async function GET() {
	const serverUrl = process.env.MCP_SERVER_URL || "http://localhost:3001";

	try {
		// Test connection to MCP server
		const response = await fetch(`${serverUrl}/health`);
		const health = await response.json();

		return NextResponse.json({
			message: "MCP API endpoint is running",
			server: serverUrl,
			serverStatus: health,
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
	} catch (error) {
		return NextResponse.json({
			message: "MCP API endpoint is running",
			server: serverUrl,
			serverStatus: "Could not connect",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
