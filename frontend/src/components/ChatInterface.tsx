"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Bot, MessageSquare } from "lucide-react";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

interface MCPResponse {
	success: boolean;
	data?: unknown;
	summary?: string;
	error?: string;
}

const predefinedQuestions = [
	{ text: "What's my personal information?", tool: "get_personal_info" },
	{ text: "Show my work experience", tool: "get_work_experience" },
	{ text: "What's my education background?", tool: "get_education" },
	{ text: "List my skills", tool: "get_skills" },
];

export function ChatInterface() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [isClient, setIsClient] = useState(false);

	// Initialize messages after hydration to avoid SSR mismatch
	useEffect(() => {
		setIsClient(true);
		setMessages([
			{
				id: "1",
				role: "assistant",
				content:
					"Hello! I'm your CV assistant. I can help you find information about your CV or ask me anything about your background. You can use the quick questions below or type your own query.",
				timestamp: new Date(),
			},
		]);
	}, []);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	// Helper function to format time consistently
	const formatTime = (date: Date): string => {
		if (!isClient) return "";
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	// Auto-scroll to bottom when new messages are added
	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
		}
	}, [messages]);

	const callMCPTool = async (tool: string, args?: Record<string, unknown>) => {
		try {
			const response = await fetch("/api/mcp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tool, arguments: args }),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: MCPResponse = await response.json();
			return result;
		} catch (error) {
			console.error("Error calling MCP tool:", error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	};

	const handleSendMessage = async (
		messageText: string,
		tool?: string,
		args?: Record<string, unknown>
	) => {
		if (!messageText.trim() && !tool) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: messageText,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);

		try {
			let result: MCPResponse;

			if (tool) {
				// Use predefined tool
				result = await callMCPTool(tool, args);
			} else {
				// For free-form questions, try to determine the best tool to use
				const lowerMessage = messageText.toLowerCase();

				if (
					lowerMessage.includes("personal") ||
					lowerMessage.includes("contact") ||
					lowerMessage.includes("name")
				) {
					result = await callMCPTool("get_personal_info");
				} else if (
					lowerMessage.includes("work") ||
					lowerMessage.includes("job") ||
					lowerMessage.includes("experience") ||
					lowerMessage.includes("role")
				) {
					result = await callMCPTool("get_work_experience");
				} else if (
					lowerMessage.includes("education") ||
					lowerMessage.includes("study") ||
					lowerMessage.includes("school") ||
					lowerMessage.includes("university")
				) {
					result = await callMCPTool("get_education");
				} else if (
					lowerMessage.includes("skill") ||
					lowerMessage.includes("ability") ||
					lowerMessage.includes("competency")
				) {
					result = await callMCPTool("get_skills");
				} else {
					// Use search for general queries
					result = await callMCPTool("search_cv", { query: messageText });
				}
			}

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: result.success
					? result.summary || "Query completed successfully"
					: `Error: ${result.error || "Unknown error occurred"}`,
				timestamp: new Date(),
			};

			// If we have detailed data, format it nicely
			if (result.success && result.data) {
				let formattedContent = result.summary || "";

				// Add formatted data for better readability
				if (typeof result.data === "object") {
					formattedContent += "\n\n" + formatData(result.data);
				}

				assistantMessage.content = formattedContent || "No data available";
			}

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (error) {
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: `Sorry, I encountered an error: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const formatData = (data: unknown): string => {
		if (!data) return "";

		if (Array.isArray(data)) {
			return data
				.map((item, index) => `${index + 1}. ${formatSingleItem(item)}`)
				.join("\n");
		}

		return formatSingleItem(data);
	};

	const formatSingleItem = (item: unknown): string => {
		if (typeof item === "string") return item;
		if (typeof item !== "object" || item === null) return String(item);

		const obj = item as Record<string, unknown>;
		const lines: string[] = [];

		Object.entries(obj).forEach(([key, value]) => {
			if (Array.isArray(value)) {
				lines.push(`${key}: ${value.join(", ")}`);
			} else if (typeof value === "object" && value !== null) {
				lines.push(`${key}: ${JSON.stringify(value)}`);
			} else {
				lines.push(`${key}: ${value}`);
			}
		});

		return lines.join("\n");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSendMessage(input);
	};

	return (
		<Card className="h-full flex flex-col">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MessageSquare className="w-5 h-5" />
					CV Chat Assistant
				</CardTitle>
			</CardHeader>

			<CardContent className="flex-1 flex flex-col min-h-0">
				{/* Messages Area */}
				<ScrollArea className="flex-1 mb-4" ref={scrollAreaRef}>
					<div className="space-y-4 pr-4">
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex gap-3 ${
									message.role === "user" ? "justify-end" : "justify-start"
								}`}
							>
								<div
									className={`flex gap-2 max-w-[80%] ${
										message.role === "user" ? "flex-row-reverse" : "flex-row"
									}`}
								>
									<div className="flex-shrink-0">
										{message.role === "user" ? (
											<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
												<User className="w-4 h-4 text-white" />
											</div>
										) : (
											<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
												<Bot className="w-4 h-4 text-white" />
											</div>
										)}
									</div>

									<div
										className={`rounded-lg p-3 ${
											message.role === "user"
												? "bg-blue-500 text-white"
												: "bg-slate-100 dark:bg-slate-800"
										}`}
									>
										<p className="whitespace-pre-wrap">{message.content}</p>
										<div className="flex items-center gap-2 mt-2">
											<span className="text-xs opacity-70">
												{formatTime(message.timestamp)}
											</span>
										</div>
									</div>
								</div>
							</div>
						))}

						{isLoading && (
							<div className="flex gap-3 justify-start">
								<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
									<Bot className="w-4 h-4 text-white" />
								</div>
								<div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
									<div className="flex gap-1">
										<div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
										<div
											className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
											style={{ animationDelay: "0.1s" }}
										/>
										<div
											className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
											style={{ animationDelay: "0.2s" }}
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				</ScrollArea>

				{/* Quick Questions */}
				<div className="mb-4">
					<p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
						Quick questions:
					</p>
					<div className="flex flex-wrap gap-2">
						{predefinedQuestions.map((question, index) => (
							<Button
								key={index}
								variant="outline"
								size="sm"
								onClick={() => handleSendMessage(question.text, question.tool)}
								disabled={isLoading}
							>
								{question.text}
							</Button>
						))}
					</div>
				</div>

				{/* Input Form */}
				<form onSubmit={handleSubmit} className="flex gap-2">
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask about your CV..."
						disabled={isLoading}
						className="flex-1"
					/>
					<Button type="submit" disabled={isLoading || !input.trim()}>
						<Send className="w-4 h-4" />
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
