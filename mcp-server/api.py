from fastapi import FastAPI, Request
from pydantic import BaseModel
from mcp import Client, StdioServerParameters
from contextlib import asynccontextmanager
from pathlib import Path
import sys
from services.conversation import get_conversation, save_conversation
from services.assistant import get_assistant_response
from fastapi.middleware.cors import CORSMiddleware
import os

from uuid import uuid4

@asynccontextmanager # Manages asynchronous startup and shutdown.
async def lifespan(app: FastAPI):
    server_path = Path(__file__).with_name("server.py")
    print("FastAPI PEERPATH_API_URL:", os.getenv("PEERPATH_API_URL"), flush=True)
    server_params = StdioServerParameters(
        command=sys.executable,
        args=[str(server_path)],
        env=os.environ.copy()
    )

    async with Client(server_params) as client:

        result = await client.list_tools()
        app.state.mcp_client = client

        app.state.groq_tools = [
            {
                "type": "function",
                "function": {
                    "name": tool.name,
                    "description": tool.description or "",
                    "parameters": tool.input_schema
                }
            }
            for tool in result.tools
        ]

        print("Available MCP tools:", [
            tool.name for tool in result.tools
        ])
        yield

app = FastAPI(
    title="PeerPath AI API",
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://peerpath-1.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatReq(BaseModel):
    message:str
    conversation_id: str | None = None

@app.get("/")
def home():
    return {
        "message": "PeerPath AI API is running"
    }

@app.post("/chat")
async def chat(request: Request, chat_data: ChatReq):

    conversation_id = chat_data.conversation_id or str(uuid4())
    messages = get_conversation(conversation_id)

    final_answer, messages = await get_assistant_response(
        message=chat_data.message,
        messages=messages,
        mcp_client=request.app.state.mcp_client,
        groq_tools=request.app.state.groq_tools
    )
    save_conversation(conversation_id, messages)

    return {
        "reply": final_answer,
        "conversation_id":conversation_id
    }