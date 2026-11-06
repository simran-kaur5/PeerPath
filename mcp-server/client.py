import asyncio
import sys
from pathlib import Path
import os
import json
from mcp import Client, StdioServerParameters
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing from environment variables")

groq = AsyncGroq(api_key=GROQ_API_KEY)

MODEL = "openai/gpt-oss-120b"


async def main():
    server_path = Path(__file__).with_name("server.py")

    server_params = StdioServerParameters(
        command = sys.executable,
        args = [str(server_path)]
    )

    user_question = input("\nAsk PeerPath AI: ")

    async with Client(server_params) as client:
        result = await client.list_tools()

        groq_tools = []

        for tool in result.tools:
            groq_tools.append({
                "type" : "function",
                "function": {
                    "name":tool.name,
                    "description": tool.description or "",
                    "parameters": tool.input_schema
                }
            })

        messages = [
            {
                "role": "system",
                "content": """
                You are PeerPath AI.

                Help users find information from PeerPath using available tools.

                Rules:
                1. Never invent posts, authors, or search results.
                2. If a tool returns success=false, explain that a technical error occurred.
                3. Never interpret a tool error as an empty search result.
                4. If a tool successfully returns an empty list, say no matching results were found.
                5. Do not repeatedly call a tool if it has already failed.
                6. Use previous conversation context to understand follow-up questions.
                """
            }
        ]

        while True:

            user_question = input("\nAsk PeerPath AI: ")

            if user_question.lower().strip() in ["exit", "quit"]:
                print("Goodbye!")
                break

            if not user_question.strip():
                continue

            messages.append({
                "role": "user",
                "content": user_question
            })

            while True:

                response = await groq.chat.completions.create(
                    model= MODEL,
                    messages= messages,
                    tools= groq_tools,
                    tool_choice= "auto"
                )

                assistant_message = response.choices[0].message

                # if groq does not select a tool
                if not assistant_message.tool_calls:
                    
                    messages.append({
                        "role": "assistant",
                        "content": assistant_message.content or ""
                    })
                    break

                # Save Groq's tool-call message
                messages.append(
                    assistant_message.model_dump(exclude_none=True)
                )

                for tool_call in assistant_message.tool_calls:
                    tool_name = tool_call.function.name

                    arguments = json.loads(
                        tool_call.function.arguments
                    )


                    try:
                        result = await client.call_tool(
                            tool_name,
                            arguments
                        )

                        if result.is_error:
                            tool_output = {
                                "success": False,
                                "error": "MCP tool execution failed",
                                "details": [
                                    getattr(block, "text", str(block))
                                    for block in result.content
                                ]
                            }
                        elif result.structured_content is not None:
                            tool_output = {
                                "success": True,
                                "data": result.structured_content
                            }
                        else:
                            tool_output = {
                                "success": True,
                                "data": [
                                    getattr(block, "text", str(block))
                                    for block in result.content
                                ]
                            }

                    except Exception as e:
                        tool_output = {
                            "success": False,
                            "error": "Unable to communicate with the MCP server",
                            "details": str(e)
                        }

                    messages.append({
                        "role": "tool",
                        "tool_call_id":tool_call.id,
                        "content": json.dumps(tool_output)
                    })
if __name__ == "__main__":
    asyncio.run(main())