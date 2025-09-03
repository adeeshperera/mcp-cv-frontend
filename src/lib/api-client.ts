// API client for connecting to the backend MCP server
const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export async function callMCPTool(
	tool: string,
	args?: Record<string, unknown>
) {
	try {
		const response = await fetch(`${API_BASE_URL}/api/tools/call`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tool, arguments: args }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Error calling MCP tool:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

export async function getAvailableTools() {
	try {
		const response = await fetch(`${API_BASE_URL}/api/tools`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.error("Error fetching available tools:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

export async function checkAPIHealth() {
	try {
		const response = await fetch(`${API_BASE_URL}/api/health`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.error("API health check failed:", error);
		return {
			status: "error",
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
