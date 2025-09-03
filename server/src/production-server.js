#!/usr/bin/env node

require("dotenv").config({
	path: require("path").join(__dirname, "..", ".env"),
});

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
	StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const path = require("path");
const http = require("http");
const url = require("url");

const CVParser = require("./cv-parser.js");
const EmailService = require("./email-service.js");
const MCPTools = require("./mcp-tools.js");

class MCPCVServer {
	constructor() {
		this.server = new Server(
			{
				name: "mcp-cv-server",
				version: "1.0.0",
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		this.cvParser = null;
		this.emailService = null;
		this.mcpTools = null;
		this.isInitialized = false;
		this.httpServer = null;

		this.setupHandlers();
	}

	async initialize() {
		try {
			// Initialize email service
			this.emailService = new EmailService();

			// Initialize CV parser
			const cvPath = path.join(__dirname, "..", "cv.pdf");
			this.cvParser = new CVParser(cvPath);

			const cvData = await this.cvParser.parseCV();

			// Initialize MCP tools
			this.mcpTools = new MCPTools(cvData, this.emailService);

			// Test email service connection
			const emailStatus = await this.emailService.testConnection();
			if (emailStatus.success) {
				console.log("✓ Email service connected successfully");
			} else {
				console.warn("⚠ Email service connection failed:", emailStatus.error);
			}

			this.isInitialized = true;
			console.log("✓ MCP CV Server initialized successfully");

			return true;
		} catch (error) {
			console.error("Failed to initialize MCP CV Server:", error.message);

			// Create fallback data structure
			this.mcpTools = new MCPTools(
				{
					personal: {},
					experience: [],
					education: [],
					skills: [],
					rawText: "",
				},
				this.emailService
			);

			this.isInitialized = true;
			return false;
		}
	}

	setupHandlers() {
		// Handle tool listing
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			if (!this.isInitialized || !this.mcpTools) {
				return {
					tools: [],
				};
			}

			const tools = this.mcpTools.getToolDefinitions();
			return {
				tools: tools,
			};
		});

		// Handle tool execution
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			if (!this.isInitialized || !this.mcpTools) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: "Server not properly initialized",
								timestamp: new Date().toISOString(),
							}),
						},
					],
				};
			}

			try {
				const result = await this.mcpTools.executeTool(name, args);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			} catch (error) {
				console.error("Tool execution failed:", error.message);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: error.message,
								tool: name,
								timestamp: new Date().toISOString(),
							}),
						},
					],
				};
			}
		});

		// Error handling
		this.server.onerror = (error) => {
			console.error("MCP Server error:", error);
		};

		process.on("SIGINT", async () => {
			console.log("\nShutting down MCP CV Server...");
			if (this.httpServer) {
				this.httpServer.close();
			}
			await this.server.close();
			process.exit(0);
		});
	}

	// HTTP Server for production deployment
	createHttpServer() {
		return http.createServer(async (req, res) => {
			// Enable CORS
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
			res.setHeader("Access-Control-Allow-Headers", "Content-Type");

			if (req.method === "OPTIONS") {
				res.writeHead(200);
				res.end();
				return;
			}

			const parsedUrl = url.parse(req.url, true);
			const path = parsedUrl.pathname;

			// Health check endpoint
			if (path === "/health" && req.method === "GET") {
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(
					JSON.stringify({
						status: "healthy",
						initialized: this.isInitialized,
						timestamp: new Date().toISOString(),
					})
				);
				return;
			}

			// Tools list endpoint
			if (path === "/tools" && req.method === "GET") {
				if (!this.isInitialized || !this.mcpTools) {
					res.writeHead(503, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ error: "Server not initialized" }));
					return;
				}

				const tools = this.mcpTools.getToolDefinitions();
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ tools }));
				return;
			}

			// Tool execution endpoint
			if (path === "/execute" && req.method === "POST") {
				let body = "";
				req.on("data", (chunk) => {
					body += chunk.toString();
				});

				req.on("end", async () => {
					try {
						const { tool, arguments: args } = JSON.parse(body);

						if (!tool) {
							res.writeHead(400, { "Content-Type": "application/json" });
							res.end(JSON.stringify({ error: "Tool name is required" }));
							return;
						}

						if (!this.isInitialized || !this.mcpTools) {
							res.writeHead(503, { "Content-Type": "application/json" });
							res.end(JSON.stringify({ error: "Server not initialized" }));
							return;
						}

						const result = await this.mcpTools.executeTool(tool, args || {});
						res.writeHead(200, { "Content-Type": "application/json" });
						res.end(JSON.stringify(result));
					} catch (error) {
						console.error("HTTP API error:", error);
						res.writeHead(500, { "Content-Type": "application/json" });
						res.end(
							JSON.stringify({
								error: error.message,
								timestamp: new Date().toISOString(),
							})
						);
					}
				});
				return;
			}

			// Default 404
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Endpoint not found" }));
		});
	}

	async start() {
		try {
			// Initialize the server
			const initSuccess = await this.initialize();
			if (!initSuccess) {
				console.warn("⚠ Server started with limited functionality");
			}

			// Determine if we should run as HTTP server or MCP server
			const isProduction = process.env.NODE_ENV === "production";
			const port = process.env.PORT || 3001;

			if (isProduction) {
				// Production: Run as HTTP server
				this.httpServer = this.createHttpServer();
				this.httpServer.listen(port, () => {
					console.log(`🚀 MCP CV Server running on port ${port}`);
					console.log(`📝 Health check: http://localhost:${port}/health`);
					console.log(`🔧 Tools list: http://localhost:${port}/tools`);
					console.log(`⚡ Execute tool: POST http://localhost:${port}/execute`);
				});
			} else {
				// Development: Run as MCP server
				const transport = new StdioServerTransport();
				await this.server.connect(transport);

				console.log("🔧 MCP CV Server is running in development mode");
				console.log("📡 Listening for MCP requests via stdio");
			}

			if (this.mcpTools) {
				const tools = this.mcpTools.getToolDefinitions();
				console.log("\n📋 Available tools:");
				tools.forEach((tool) => {
					console.log(`   • ${tool.name}: ${tool.description}`);
				});
			}

			console.log("\n📊 Server Status:");
			console.log(`   • CV Data: ${this.cvParser ? "✓ Loaded" : "✗ Failed"}`);
			console.log(
				`   • Email Service: ${
					this.emailService && this.emailService.isConfigured
						? "✓ Configured"
						: "✗ Not configured"
				}`
			);
			console.log(
				`   • Tools: ${this.mcpTools ? "✓ Ready" : "✗ Not available"}`
			);
		} catch (error) {
			console.error("💥 Failed to start server:", error.message);
			process.exit(1);
		}
	}

	// Method to get server status (useful for debugging)
	getStatus() {
		return {
			initialized: this.isInitialized,
			cvData: !!this.cvParser?.getCVData(),
			emailConfigured: !!this.emailService?.isConfigured,
			toolsReady: !!this.mcpTools,
		};
	}
}

// Start the server if this file is run directly
if (require.main === module) {
	const server = new MCPCVServer();
	server.start().catch((error) => {
		console.error("💥 Fatal error starting server:", error);
		process.exit(1);
	});
}

module.exports = MCPCVServer;
