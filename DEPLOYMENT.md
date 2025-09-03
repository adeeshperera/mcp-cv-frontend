# 🚀 MCP CV Server - Deployment Guide

## Quick Deploy Links

### Backend (Server)

- **Railway**: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)
- **Render**: [Deploy to Render](https://render.com)

### Frontend

- **Vercel**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Environment Variables Required

### Server (.env)

```bash
NODE_ENV=production
PORT=3001
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_TO=recipient@example.com
EMAIL_SERVICE=gmail
```

### Frontend (.env.local)

```bash
MCP_SERVER_URL=https://your-server-url.railway.app
NODE_ENV=production
```

## Health Check Endpoints

- `GET /health` - Server status
- `GET /tools` - Available tools
- `POST /execute` - Execute tools

## Local Development

```bash
# Server
cd server
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```
