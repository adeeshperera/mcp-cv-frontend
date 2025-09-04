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

		// Call the deployed backend instead of local MCP server
		const backendUrl =
			process.env.BACKEND_URL ||
			process.env.NEXT_PUBLIC_BACKEND_URL ||
			"https://mcp-cv-backend-production.up.railway.app";

		console.log("Using backend URL:", backendUrl);
		const result = await callBackendAPI(backendUrl, tool, args || {});

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

async function callBackendAPI(
	backendUrl: string,
	toolName: string,
	args: Record<string, unknown>
): Promise<MCPResponse> {
	try {
		const response = await fetch(`${backendUrl}/api/mcp`, {
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
			throw new Error(
				`Backend API error: ${response.status} ${response.statusText}`
			);
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error("Error calling backend API:", error);
		throw new Error(
			`Failed to call backend: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
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
