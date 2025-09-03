"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";

interface EmailFormData {
	recipient: string;
	subject: string;
	body: string;
}

interface EmailStatus {
	type: "success" | "error" | null;
	message: string;
}

export function EmailForm() {
	const [formData, setFormData] = useState<EmailFormData>({
		recipient: "",
		subject: "",
		body: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [status, setStatus] = useState<EmailStatus>({
		type: null,
		message: "",
	});

	const handleInputChange = (field: keyof EmailFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear status when user starts typing
		if (status.type) {
			setStatus({ type: null, message: "" });
		}
	};

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (!formData.recipient.trim()) {
			setStatus({ type: "error", message: "Recipient email is required" });
			return;
		}

		if (!validateEmail(formData.recipient)) {
			setStatus({
				type: "error",
				message: "Please enter a valid email address",
			});
			return;
		}

		if (!formData.subject.trim()) {
			setStatus({ type: "error", message: "Subject is required" });
			return;
		}

		if (!formData.body.trim()) {
			setStatus({ type: "error", message: "Message body is required" });
			return;
		}

		setIsLoading(true);
		setStatus({ type: null, message: "" });

		try {
			const response = await fetch("/api/mcp", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					tool: "send_email",
					arguments: {
						recipient: formData.recipient.trim(),
						subject: formData.subject.trim(),
						body: formData.body.trim(),
					},
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.success) {
				setStatus({
					type: "success",
					message:
						result.summary ||
						`Email sent successfully to ${formData.recipient}`,
				});
				// Reset form on success
				setFormData({ recipient: "", subject: "", body: "" });
			} else {
				setStatus({
					type: "error",
					message: result.error || "Failed to send email",
				});
			}
		} catch (error) {
			console.error("Error sending email:", error);
			setStatus({
				type: "error",
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const quickTemplates = [
		{
			name: "Job Inquiry",
			subject: "CV Inquiry - [Your Name]",
			body: "Dear Hiring Manager,\n\nI am writing to express my interest in potential opportunities at your organization. Please find my CV information below.\n\nBest regards,\n[Your Name]",
		},
		{
			name: "Follow Up",
			subject: "Following up on my application",
			body: "Dear [Name],\n\nI wanted to follow up on my recent application. I am very interested in the position and would love to discuss how my experience aligns with your needs.\n\nThank you for your consideration.\n\nBest regards,\n[Your Name]",
		},
		{
			name: "Networking",
			subject: "Introduction and networking opportunity",
			body: "Dear [Name],\n\nI hope this message finds you well. I came across your profile and would love to connect. I believe there may be opportunities for collaboration or knowledge sharing.\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]",
		},
	];

	const applyTemplate = (template: (typeof quickTemplates)[0]) => {
		setFormData((prev) => ({
			...prev,
			subject: template.subject,
			body: template.body,
		}));
	};

	return (
		<Card className="h-full flex flex-col">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Mail className="w-5 h-5" />
					Send Email
				</CardTitle>
			</CardHeader>

			<CardContent className="flex-1 flex flex-col">
				{/* Quick Templates */}
				<div className="mb-4">
					<p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
						Quick templates:
					</p>
					<div className="grid gap-2">
						{quickTemplates.map((template, index) => (
							<Button
								key={index}
								variant="outline"
								size="sm"
								onClick={() => applyTemplate(template)}
								disabled={isLoading}
								className="justify-start text-left h-auto p-2"
							>
								<div>
									<div className="font-medium">{template.name}</div>
									<div className="text-xs text-slate-500 truncate">
										{template.subject}
									</div>
								</div>
							</Button>
						))}
					</div>
				</div>

				{/* Status Alert */}
				{status.type && (
					<Alert
						className={`mb-4 ${
							status.type === "success"
								? "border-green-200 bg-green-50"
								: "border-red-200 bg-red-50"
						}`}
					>
						{status.type === "success" ? (
							<CheckCircle className="h-4 w-4 text-green-600" />
						) : (
							<AlertCircle className="h-4 w-4 text-red-600" />
						)}
						<AlertDescription
							className={
								status.type === "success" ? "text-green-800" : "text-red-800"
							}
						>
							{status.message}
						</AlertDescription>
					</Alert>
				)}

				{/* Email Form */}
				<form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
					<div>
						<label
							htmlFor="recipient"
							className="block text-sm font-medium mb-1"
						>
							Recipient Email *
						</label>
						<Input
							id="recipient"
							type="email"
							value={formData.recipient}
							onChange={(e) => handleInputChange("recipient", e.target.value)}
							placeholder="recipient@example.com"
							disabled={isLoading}
							required
						/>
					</div>

					<div>
						<label htmlFor="subject" className="block text-sm font-medium mb-1">
							Subject *
						</label>
						<Input
							id="subject"
							type="text"
							value={formData.subject}
							onChange={(e) => handleInputChange("subject", e.target.value)}
							placeholder="Email subject"
							disabled={isLoading}
							required
						/>
					</div>

					<div className="flex-1">
						<label htmlFor="body" className="block text-sm font-medium mb-1">
							Message *
						</label>
						<Textarea
							id="body"
							value={formData.body}
							onChange={(e) => handleInputChange("body", e.target.value)}
							placeholder="Type your message here..."
							disabled={isLoading}
							required
							className="min-h-[200px] resize-none"
						/>
					</div>

					<Button
						type="submit"
						disabled={
							isLoading ||
							!formData.recipient ||
							!formData.subject ||
							!formData.body
						}
						className="w-full"
					>
						{isLoading ? (
							<>
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
								Sending...
							</>
						) : (
							<>
								<Send className="w-4 h-4 mr-2" />
								Send Email
							</>
						)}
					</Button>
				</form>

				<div className="mt-4 text-xs text-slate-500">
					* Required fields. Email will be sent through the configured SMTP
					service.
				</div>
			</CardContent>
		</Card>
	);
}
