from flask import Blueprint, jsonify, request

from ..services.extractor import extract_filters
from ..services.job_search import search_jobs
from ..services.llm import generate_reply

bp = Blueprint("chat", __name__)


@bp.post("/chat")
def chat():
    body = request.get_json(silent=True) or {}
    message = (body.get("message") or "").strip()
    history = body.get("history") or []
    if not message:
        return jsonify({"error": "message is required"}), 400

    filters = extract_filters(message)          # 1) rule-based, fallback LLM
    jobs = search_jobs(filters)                  # 2) truy vấn MongoDB
    reply = generate_reply(message, jobs, history)  # 3) LLM sinh câu trả lời từ dữ liệu thật

    return jsonify({"reply": reply, "filters": filters, "jobs": jobs})
