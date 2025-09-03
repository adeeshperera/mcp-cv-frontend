import { ChatInterface } from "@/components/ChatInterface";
import { EmailForm } from "@/components/EmailForm";

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
			<div className="container mx-auto p-4 h-screen flex flex-col">
				{/* Header */}
				<header className="text-center py-6">
					<h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
						MCP CV Assistant
					</h1>
					<p className="text-slate-600 dark:text-slate-400">
						Chat about CV information and send email notifications
					</p>
				</header>

				{/* Main Content */}
				<div className="flex-1 grid lg:grid-cols-3 gap-6 min-h-0">
					{/* Chat Interface - Takes 2/3 on large screens */}
					<div className="lg:col-span-2">
						<ChatInterface />
					</div>

					{/* Email Form - Takes 1/3 on large screens */}
					<div className="lg:col-span-1">
						<EmailForm />
					</div>
				</div>
			</div>
		</div>
	);
}
