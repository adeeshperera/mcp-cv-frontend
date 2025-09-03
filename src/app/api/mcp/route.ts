import { NextRequest, NextResponse } from "next/server";
import { callMCPTool as callExternalMCPTool } from "@/lib/api-client";

interface MCPToolCall {
	tool: string;
	arguments?: Record<string, unknown>;
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

		// Call the external MCP API
		const result = await callExternalMCPTool(tool, args || {});
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

// Also handle GET for testing
export async function GET() {
	return NextResponse.json({
		message: "MCP API endpoint is running",
		note: "This endpoint now forwards requests to the dedicated backend API",
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
