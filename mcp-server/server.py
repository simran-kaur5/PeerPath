from mcp.server import MCPServer
import httpx

mcp = MCPServer("PeerPath")

import os

API_URL = f"{os.getenv('PEERPATH_API_URL', 'http://localhost:5000').rstrip('/')}/posts"

print("MCP API URL:", API_URL)

@mcp.tool()
async def get_posts_by_author(author_name:str)-> list:
    "Get all PeerPath posts written by a particular author"

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(API_URL)

        response.raise_for_status()

        posts = response.json()

    results = []

    for post in posts:

        author = post.get("author") or {}
        name = author.get("name", "")

        if author_name.lower() in name.lower():

            results.append({
                "content": post.get("content",""),
                "author": name,
                "createdAt":post.get("createdAt")
            })

    return results

@mcp.tool()
async def search_posts(keyword: str)-> list:
    "Search PeerPath posts using a keyword"

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(API_URL)
        response.raise_for_status()

        posts = response.json()

    results = []

    for post in posts:

        content = post.get("content","")

        if(keyword.lower() in content.lower()):
            results.append({
                "content":content,
                "author":post.get("author",{}).get("name","Unknown"),
                "createdAt": post.get("createdAt")
            })

    return results

@mcp.tool()
async def get_recent_posts(limit: int =5)->list:
    "Get the most recent PeerPath posts. Specify how many posts to retrieve."

    if(limit<1):
        return []

    limit = min(limit,50)

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(API_URL)
        response.raise_for_status()

        posts = response.json()

        results = []

        for post in posts[:limit]:
           author = post.get("author") or {}

           results.append({
                "content": post.get("content", ""),
                "author": author.get("name", "Unknown"),
                "createdAt": post.get("createdAt")
            }) 

    return results

@mcp.tool()
async def get_trending_posts(limit: int =5)->list:
    "Get most liked PeerPath posts, ranked by number of likes."

    if limit < 1:
        return []

    limit = min(limit,50)

    async with httpx.AsyncClient(timeout=120.0) as client:
        print("Fetching posts from:", API_URL, flush=True)
        response = await client.get(API_URL)
        response.raise_for_status()

        posts = response.json()

    posts.sort(key=lambda post: len(post.get("likes") or []), reverse=True)

    results = []

    for post in posts[:limit]:
        author = post.get("author") or {}
        likes = post.get("likes") or []

        results.append({
            "content": post.get("content",""),
            "author": author.get("name", "Unknown"),
            "likeCount": len(likes),
            "createdAt": post.get("createdAt")
        })

    return results
if __name__ == "__main__":
    mcp.run()