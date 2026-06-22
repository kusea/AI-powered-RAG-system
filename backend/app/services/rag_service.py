from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Document
from app.core.config import settings
from sentence_transformers import SentenceTransformer
from typing import List, Optional

import json
import asyncio
from openai import AsyncOpenAI

#Logic to search for similar embeddings based on cosine similarity using pgvector's built-in functions
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
openai_client = AsyncOpenAI(
    base_url=settings.AI_BASE_URL,
    api_key=settings.OPENAI_API_KEY
) #Need to add AI api key later in .env
SEARCH_LIMIT = 3
def search_similar_embeddings(db: Session, query_text: str, limit: int, document_ids: Optional[List[int]] = None) -> List[Document]:
    query_vector = embedding_model.encode(query_text).tolist()
    if len(query_vector) != settings.VECTOR_DIMENSION:
        raise HTTPException(status_code=400, detail="Vector must have exactly the number of dimensions.")
    
    query = db.query(Document)
    if document_ids:
        query = query.filter(Document.id.in_(document_ids))

    results = query.order_by(
        Document.embedding.cosine_distance(query_vector)
    ).limit(limit).all()
    return results

async def generate_chat_stream(db: Session, query_text: str, document_ids: Optional[List[int]] = None):
    relevant_docs = search_similar_embeddings(db, query_text, SEARCH_LIMIT, document_ids)
    # Prepare the content to make context for prompt and source metadata
    content_text = []
    source_metadata = []
    for doc in relevant_docs:
        content_text.append(doc.content or "")
        source_metadata.append({
            "id": doc.id,
            "title": doc.title
        })
    # Send the source list as an event called "sources"
    yield f"event: sources\ndata:{json.dumps(source_metadata)}\n\n"
    await asyncio.sleep(0.01)

    context_str = "\n---\n".join(content_text)
    system_prompt = (
        "You are a helpful AI assistant. "
        "You are given the following extracted parts of a long document and a question. "
        "Provide a conversational answer based on the context provided. "
        "If you don't know the answer, just say that you don't know. "
        "DO NOT make up an answer."
        "If the context doesn't provide enough information to answer the question,use your knowledge of the world combined with the context to generate an answer."
        f"Content: {context_str}"
    )

    # Call AI API
    try:
        response = await openai_client.chat.completions.create(
            model = "chatgpt-4o-latest",
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query_text}
            ],
            stream = True # Set words appear one by one
        )

        async for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                yield f"data: json.dumps({"text": content})\n\n"
                await asyncio.sleep(0.01)

    except Exception as e:
        yield f"data: json.dumps({'error': str(e)})\n\n"


