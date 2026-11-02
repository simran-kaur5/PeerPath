from groq import AsyncGroq
import json
import os

from dotenv import load_dotenv

load_dotenv()

groq_client = AsyncGroq(
    api_key=os.getenv("GROQ_API_KEY")
)

MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """
You are PeerPath AI, an assistant for the PeerPath professional networking platform.

Rules:
1. Use MCP tools whenever actual PeerPath data is needed.
2. Never invent posts, authors, users, likes, or other platform information.
3. If a tool returns an empty result, clearly say no matching data was found.
4. If a tool fails, explain the error. Never pretend no results were found.
5. Never claim an action was completed unless a tool confirms success.
6. Keep answers clear and concise.
7. Answer general questions normally.
8. Understand follow-up instructions using conversation history.
   If the user asks to change the format, summarize, filter,
   or explain previously retrieved data, use the existing context
   instead of asking them to repeat the request.
9. If the user requests a specific format, such as a table,
   format the relevant results accordingly.
10. Only call tools that are explicitly provided in the current tools list.
    Never invent or assume the existence of another tool.

11. When post results contain a likeCount field, use that field
    to answer questions about likes. Do not call another tool
    to retrieve likes.

12. When asked for the latest post, compare createdAt timestamps
    and select the most recent matching post.
13. Only include information explicitly requested by the user.
    Do not automatically include like counts, dates, or other metadata
    unless they are relevant to the question.

14. If the user asks for a post, prioritize showing its content.
    Include like counts only when the user asks about likes.
"""

async def get_assistant_response(message, messages, mcp_client, groq_tools):

    if not messages:
        messages.append({
            "role":"system",
            "content":SYSTEM_PROMPT
        })

    messages.append({
        "role": "user",
        "content": message
    })

    response = await groq_client.chat.completions.create(
        model=MODEL,
        messages=messages,
        tools=groq_tools,
        tool_choice="auto"
    )

    assistant_message = response.choices[0].message

    messages.append(
        assistant_message.model_dump(exclude_none=True)
    )

    if assistant_message.tool_calls:
        tool_call = assistant_message.tool_calls[0]
        tool_name = tool_call.function.name

        arguments = json.loads(tool_call.function.arguments)
        print("Selected tool:", tool_name)
        print("Arguments:", arguments)

        result = await mcp_client.call_tool(
            tool_name,
            arguments
        )

        print("MCP error:", result.is_error)
        print("MCP content:", result.content)

        if result.is_error:
            tool_result = {
                "success": False,
                "error": [
                    getattr(block, "text", str(block))
                    for block in result.content
                ]
            }
        else:
            tool_result = [
                json.loads(block.text)
                for block in result.content
            ]

        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(tool_result)
        })

        final_response = await groq_client.chat.completions.create(
            model=MODEL,
            messages=messages
        )
        final_message = final_response.choices[0].message

        messages.append(
            final_message.model_dump(exclude_none=True)
        )
        
        final_answer = final_message.content
    else:
        final_answer = assistant_message.content

    

    return final_answer, messages