# MCP CV Server

A Model Context Protocol (MCP) server that provides CV chat functionality and email notifications.

## Features

- **CV Chat**: Parse PDF resume and answer questions about work experience, education, skills
- **Email Notifications**: Send emails with recipient, subject, and body
- **Smart Queries**: Handle natural language questions about CV content

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:

   ```bash
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=your-app-password
   MCP_SERVER_PORT=3001
   DEBUG=true
   ```

3. Place your CV file as `cv.pdf` in the server root directory

4. Start the server:
   ```bash
   npm start
   ```

## Available Tools

- `get_personal_info()` - Get personal information from CV
- `get_work_experience()` - Get work experience from CV
- `get_education()` - Get education information from CV
- `get_skills()` - Get skills from CV
- `search_cv(query)` - Search CV content for specific information
- `query_cv(category, query)` - Query CV information by category
- `send_email(recipient, subject, body)` - Send email notification

## Usage Examples

### CV Queries

- "What was my last role?"
- "Where did I study?"
- "What are my skills?"

### Email

- Send notifications to contacts
- Automated email responses

## Gmail Setup

To use email functionality:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use your Gmail address and the generated app password in `.env`

## Development

Run in development mode with auto-restart:

```bash
npm run dev
```

## Testing

The server will automatically test the email connection on startup and provide status information.

## File Structure

```
server/
├── src/
│   ├── index.js          # MCP server entry point
│   ├── cv-parser.js      # PDF parsing logic
│   ├── cv-data.json      # Parsed CV data (auto-generated)
│   ├── email-service.js  # Email functionality
│   └── mcp-tools.js      # MCP tool definitions
├── package.json
├── .env                  # Environment configuration
└── cv.pdf               # Your CV file
```
