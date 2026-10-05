from openai import OpenAI

from ..config import GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL

_client = OpenAI(api_key=GROQ_API_KEY or "missing", base_url=GROQ_BASE_URL)

SYSTEM_PROMPT = (
    "Bạn là trợ lý tìm việc của JobNet. Chỉ trả lời dựa trên danh sách việc làm được cung cấp. "
    "Trả lời ngắn gọn, thân thiện bằng tiếng Việt."
)


def generate_reply(message: str, jobs: list[dict], history: list[dict]) -> str:
    if not GROQ_API_KEY:
        return f"Tìm thấy {len(jobs)} việc làm phù hợp." if jobs else "Chưa tìm thấy việc làm phù hợp."
    messages = [{"role": "system", "content": SYSTEM_PROMPT}, *history[-6:]]
    messages.append({"role": "user", "content": f"Câu hỏi: {message}\nDữ liệu việc làm: {jobs}"})
    res = _client.chat.completions.create(model=GROQ_MODEL, messages=messages, temperature=0.3)
    return res.choices[0].message.content


def extract_with_llm(message: str) -> dict:
    """TODO (Hà): yêu cầu LLM trả JSON {keyword, skills, location, salary_min, level}."""
    return {}
