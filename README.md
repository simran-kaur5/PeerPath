# PeerPath — Professional Networking Platform

PeerPath is a full-stack professional networking platform that helps users build their professional identity, share updates, discover like-minded people, and expand their network.

Users can create personalized profiles, publish posts, interact through likes and comments, connect with other professionals, and stay updated with notifications.

PeerPath also features an **AI-powered assistant built with Groq and Model Context Protocol (MCP)** that can understand natural-language queries, retrieve platform data, search posts, identify trending content, and answer questions using real application data.

Built using React, Node.js, Express.js, MongoDB, FastAPI, Groq, and MCP, PeerPath aims to make professional networking simple, engaging, and intelligent.

## Live Demo

**Visit PeerPath:** https://peerpath-1.onrender.com

Explore the live application and try its features.

## Features

### Core Networking Features

- **User Authentication** — Register, log in, and log out securely.
- **Profile Management** — Create and update professional profiles with personal information, skills, education, and website details.
- **Posts and Feed** — Create posts and browse content shared by other users.
- **Likes** — Like and unlike posts.
- **Comments** — Add comments to posts and delete your own comments.
- **People Discovery** — Explore users and discover professionals.
- **Connection Management** — Send connection requests and check connection status.
- **Connection Status** — Identify pending sent requests, incoming requests, existing connections, and users who are not connected.
- **Notifications** — Stay informed about relevant activity.
- **Profile Pictures and Image Uploads** — Personalize profiles and share images.

### AI-Powered Assistant

PeerPath includes an AI assistant powered by **Groq LLM and MCP (Model Context Protocol)**.

- **Natural Language Interaction** — Ask questions about posts using conversational language.
- **Author-Based Post Retrieval** — Retrieve posts written by a particular user.
- **Keyword-Based Search** — Find posts containing specific keywords.
- **Recent Posts** — Retrieve the latest posts from the platform.
- **Trending Posts** — Identify popular posts based on like counts.
- **Context-Aware Conversations** — Handle follow-up questions using conversation history.
- **MCP Tool Calling** — The LLM selects and invokes appropriate MCP tools based on user requests.
- **Real-Time Application Data** — Retrieve actual post information through the PeerPath backend rather than relying on predefined responses.

## AI Architecture

PeerPath uses MCP to connect its AI assistant with the platform's backend services.

```text
             User
               |
               v
         React Frontend
               |
               v
          FastAPI Server
               |
               v
           Groq LLM
               |
        Tool Selection
               |
               v
           MCP Server
               |
               v
         Express REST API
               |
               v
           MongoDB
               |
        Tool Response
               |
               v
          Groq LLM
               |
               v
       Natural Language Reply
               |
               v
             User
```

**How it works:**

1. The user sends a natural-language query through the AI chat interface.
2. FastAPI forwards the request to the AI assistant.
3. Groq interprets the request and selects an appropriate MCP tool.
4. The MCP server executes the selected tool.
5. The tool communicates with the Express backend to retrieve platform data.
6. The retrieved results are sent back to the LLM.
7. Groq generates a contextual response for the user.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, Vite, React Router, Axios, Material UI |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | Passport.js, Express Session, Connect-Mongo |
| Image Storage | Cloudinary |
| AI / LLM | Groq API, GPT-OSS-120B |
| AI Backend | Python, FastAPI |
| AI Integration | Model Context Protocol (MCP) |
| HTTP Client | HTTPX |
| Deployment | Render |

## Project Structure

```text
PeerPath/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── package.json
│
└── mcp-server/
    ├── api.py
    ├── server.py
    ├── requirements.txt
    └── services/
        ├── assistant.py
        └── conversation.py
```

## Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/simran-kaur5/PeerPath.git
cd PeerPath
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGODB_URL=your_mongodb_connection_string
SECRET=your_session_secret
NODE_ENV=development
```

Start the backend:

```bash
npm start
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Configure the frontend API endpoints to use your local backend:

```text
http://localhost:5000
```

Configure the AI API endpoint in `frontend/src/components/AIChat/AIChat.jsx`:

```javascript
const AI_API = "http://localhost:8000";
```

Start the frontend:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. AI / MCP Server Setup

Open another terminal:

```bash
cd mcp-server
pip install -r requirements.txt
```

Create a `.env` file inside `mcp-server`:

```env
GROQ_API_KEY=your_groq_api_key
PEERPATH_API_URL=http://localhost:5000
```

Start the FastAPI server:

```bash
uvicorn api:app --reload --port 8000
```

The AI API will be available at:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

**Note:** Keep API keys and database credentials in environment variables. Never commit `.env` files to GitHub.

## Deployment

PeerPath is deployed on Render as three separate services.

| Service | Deployment URL |
|---|---|
| Frontend | https://peerpath-1.onrender.com |
| Express Backend | https://peerpath-26mg.onrender.com |
| FastAPI / MCP AI Service | https://peerpath-ai.onrender.com |

### AI Service Environment Variables

Configure the following environment variables for the deployed AI service:

```env
GROQ_API_KEY=your_groq_api_key
PEERPATH_API_URL=https://peerpath-26mg.onrender.com
```

The frontend AI API endpoint should point to:

```text
https://peerpath-ai.onrender.com
```

## Author

**Simranjit Kaur**

- GitHub: https://github.com/simran-kaur5
- LinkedIn: https://www.linkedin.com/in/simranjit-kaur-15488331b/

---

*PeerPath — Explore. Connect. Grow.*
