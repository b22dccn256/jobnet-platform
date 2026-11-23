import json
import re
from openai import OpenAI

from ..config import GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL

_client = OpenAI(api_key=GROQ_API_KEY or "missing", base_url=GROQ_BASE_URL)

SYSTEM_PROMPT = (
    "Bạn là trợ lý tìm việc của JobNet. Chỉ trả lời dựa trên danh sách việc làm được cung cấp. "
    "Nếu danh sách trống, hãy gợi ý người dùng nới lỏng tiêu chí kỹ năng, địa điểm hoặc mức lương. "
    "Trả lời ngắn gọn, rõ ràng, thân thiện bằng tiếng Việt."
)

EXTRACT_PROMPT = (
    "Bạn là bộ phân tích câu hỏi tìm việc tiếng Việt. Hãy trích xuất thông tin và CHỈ trả về JSON hợp lệ "
    "theo đúng cấu trúc: "
    '{"keyword": string|null, "skills": string[], "location": string|null, "salary_min": number|null, "level": "intern"|"junior"|"middle"|"senior"|null}. '
    "Lưu ý salary_min phải quy đổi sang VND (ví dụ 15 triệu -> 15000000). Nếu không có thông tin nào thì để null hoặc []."
)


def _format_jobs_summary(jobs: list[dict]) -> str:
    if not jobs:
        return "Không tìm thấy việc làm phù hợp trực tiếp trong cơ sở dữ liệu."
    lines = []
    for idx, j in enumerate(jobs[:5], start=1):
        sal_min = j.get("salaryMin")
        sal_max = j.get("salaryMax")
        if sal_min and sal_max:
            sal_str = f"{round(sal_min / 1_000_000)}-{round(sal_max / 1_000_000)} triệu"
        elif sal_min:
            sal_str = f"từ {round(sal_min / 1_000_000)} triệu"
        else:
            sal_str = "thỏa thuận"
        loc = j.get("location") or "chưa rõ địa điểm"
        skills = ", ".join(j.get("skills") or [])
        company = j.get("companyName") or ""
        comp_part = f" tại {company}" if company else ""
        lines.append(f"{idx}. {j.get('title', 'Việc làm')}{comp_part} ({loc}, {sal_str}) [{skills}]")
    return "\n".join(lines)


def generate_reply(message: str, jobs: list[dict], history: list[dict]) -> str:
    if not GROQ_API_KEY:
        if not jobs:
            return "Hiện chưa tìm thấy việc làm phù hợp. Bạn thử tìm theo kỹ năng phổ biến như TypeScript, React, Python hoặc chọn địa điểm khác nhé."
        return f"Tìm thấy {len(jobs)} việc làm phù hợp:\n{_format_jobs_summary(jobs)}"

    try:
        safe_history = [
            {"role": m.get("role", "user"), "content": str(m.get("content", ""))}
            for m in (history or [])[-6:]
            if m.get("role") in ("user", "assistant")
        ]
        messages = [{"role": "system", "content": SYSTEM_PROMPT}, *safe_history]
        messages.append(
            {
                "role": "user",
                "content": f"Câu hỏi: {message}\nDanh sách việc làm thật:\n{_format_jobs_summary(jobs)}",
            }
        )
        res = _client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.3,
            timeout=12.0,
        )
        return (res.choices[0].message.content or "").strip() or _format_jobs_summary(jobs)
    except Exception:
        return (
            f"Tìm thấy {len(jobs)} việc làm phù hợp:\n{_format_jobs_summary(jobs)}"
            if jobs
            else "Chưa tìm thấy việc làm phù hợp với yêu cầu của bạn."
        )


def extract_with_llm(message: str) -> dict:
    """Yêu cầu Groq LLM trích JSON {keyword, skills, location, salary_min, level}."""
    if not GROQ_API_KEY or not message.strip():
        return {}

    try:
        res = _client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": EXTRACT_PROMPT},
                {"role": "user", "content": message},
            ],
            temperature=0.0,
            timeout=10.0,
        )
        raw = (res.choices[0].message.content or "").strip()
        fence = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        if not fence:
            return {}
        parsed = json.loads(fence.group(0))
        if not isinstance(parsed, dict):
            return {}
        return {
            "keyword": parsed.get("keyword"),
            "skills": parsed.get("skills") if isinstance(parsed.get("skills"), list) else [],
            "location": parsed.get("location"),
            "salary_min": parsed.get("salary_min"),
            "level": parsed.get("level"),
        }
    except Exception:
        return {}
