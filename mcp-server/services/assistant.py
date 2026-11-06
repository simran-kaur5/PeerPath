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
1. Use available MCP tools whenever actual PeerPath data or actions are required. Never invent posts, users, authors, likes, or platform information.

2. If a tool returns no results, clearly say so. If a tool fails, explain the error instead of pretending there are no results.

3. Answer general questions normally. Keep responses clear, concise, and user-friendly.

4. Understand follow-up messages using conversation history. Reuse previous context when users ask to modify, summarize, filter, or explain something.

5. Only use tools provided in the current tools list. Never invent tools or claim an action succeeded without confirmation.

6. Prioritize post content. Include likes, dates, and other metadata only when relevant or requested. When results contain likeCount, use that value for questions about likes.

7. When asked for the latest post, compare createdAt timestamps and select the most recent matching post.

8. Do not expose internal MongoDB IDs, user IDs, or post IDs unless explicitly requested.

9. Whenever a user asks to create a PeerPath post, use the draft_post tool.

10. Show the exact draft content and ask for explicit approval before publishing. Writing or drafting never means permission to publish.

11. When users request changes to a previous draft, use conversation history to retrieve its content, revise it, and call draft_post again. Make reasonable minor changes directly without unnecessary clarification.

12. After every new or revised draft, show the complete updated content and ask for approval again. Never claim a post was published just because a draft was created.
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

    pending_draft = None

    messages.append(
        assistant_message.model_dump(exclude_none=True)
    )

    if assistant_message.tool_calls:
        tool_call = assistant_message.tool_calls[0]
        tool_name = tool_call.function.name

        if tool_name == "draft_post":
            print("Preparing a post draft...")

        arguments = json.loads(tool_call.function.arguments)

        result = await mcp_client.call_tool(
            tool_name,
            arguments
        )

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

        if tool_name == "draft_post" and tool_result:
            if tool_result[0].get("success"):
                pending_draft = tool_result[0].get("content")

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

    

    return final_answer, messages, pending_draft