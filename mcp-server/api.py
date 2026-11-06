from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from mcp import Client, StdioServerParameters
from pathlib import Path
import sys
from services.conversation import get_conversation, save_conversation
from services.assistant import get_assistant_response
from fastapi.middleware.cors import CORSMiddleware
import os
import jwt
import httpx
from uuid import uuid4

AI_TOKEN_SECRET = os.getenv("AI_TOKEN_SECRET")

if not AI_TOKEN_SECRET:
    raise RuntimeError("AI_TOKEN_SECRET is missing from environment variables")


pending_drafts = {}
PEERPATH_API_URL = os.getenv("PEERPATH_API_URL")

if not PEERPATH_API_URL:
    raise RuntimeError("PEERPATH_API_URL is missing from environment variables")

app = FastAPI(
    title="PeerPath AI API",
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

    auth_header = request.headers.get("Authorization", "")

    user_id = None

    if auth_header:
        user_id = get_authenticated_user_id(auth_header)

    # Create a separate MCP process for this request
    server_path = Path(__file__).with_name("server.py")

    server_env = os.environ.copy()


    server_params = StdioServerParameters(
        command=sys.executable,
        args=[str(server_path)],
        env=server_env
    )

    conversation_id = chat_data.conversation_id or str(uuid4())
    messages = get_conversation(conversation_id)

    async with Client(server_params) as client:

        result = await client.list_tools()

        groq_tools = [
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

        
        final_answer, messages, pending_draft = await get_assistant_response(
            message=chat_data.message,
            messages=messages,
            mcp_client=client,
            groq_tools=groq_tools
        )
    save_conversation(conversation_id, messages)

    draft_id = None

    if pending_draft:

        # Remove older drafts from this conversation
        # belonging to the same user
        for old_id, old_draft in list(pending_drafts.items()):
            if (
            old_draft["conversation_id"] == conversation_id
            and old_draft["user_id"] == user_id
            ):
                del pending_drafts[old_id]
                print("OLD DRAFT INVALIDATED:", old_id)

        #  Create the latest draft
        draft_id = str(uuid4())

        pending_drafts[draft_id] = {
            "content": pending_draft,
            "user_id": user_id,
            "conversation_id": conversation_id
        }


    return {
        "reply": final_answer,
        "conversation_id":conversation_id,
        "draft_id": draft_id
    }

def get_authenticated_user_id (auth_header: str):
    if not auth_header:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    scheme, separator, token = auth_header.partition(" ")

    if scheme.lower() != "bearer" or not separator:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    try:
        decoded = jwt.decode(
            token,
            AI_TOKEN_SECRET,
            algorithms=["HS256"],
            issuer="peerpath-api",
            audience="peerpath-ai"
        )

        return decoded["sub"]

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired AI token"
        )


@app.post("/publish")
async def publish_post(request: Request, draft_id: str = Form(...), image: UploadFile | None= File(None)):

    auth_header = request.headers.get("Authorization", "")
    user_id = get_authenticated_user_id(auth_header)

    draft = pending_drafts.get(draft_id)

    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found or expired")

    if draft["user_id"] is not None and draft["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="You cannot publish this draft")

    files = {
        "content": (None, draft["content"])
    }

    if image:
        image_content = await image.read()

        files["image"] = (
            image.filename,
            image_content,
            image.content_type or "application/octet-stream"
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PEERPATH_API_URL}/posts/ai",
            headers={"Authorization": auth_header},
            files=files
        )

    if response.status_code != 201:
        raise HTTPException(
            status_code=response.status_code,
            detail="Failed to publish post"
        )

    draft["user_id"] = user_id
    # 6. Remove successfully published draft
    del pending_drafts[draft_id]

    return {
        "success": True,
        "message": "Post published successfully",
        "post": response.json()
    }