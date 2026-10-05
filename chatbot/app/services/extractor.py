import re
import unicodedata


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn").replace("đ", "d")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s]", " ", text)).strip()


KNOWN_SKILLS = ["python", "java", "javascript", "react", "nodejs", "sql", "excel", "marketing"]


def extract_filters(message: str) -> dict:
    """Trích vị trí, kỹ năng, địa điểm, lương, kinh nghiệm từ câu hỏi.

    TODO (Hà): bổ sung rule cho địa điểm / mức lương / kinh nghiệm;
    nếu rule không đủ thì gọi LLM (llm.extract_with_llm) làm fallback.
    """
    text = normalize(message)
    skills = [s for s in KNOWN_SKILLS if s in text]
    return {"keyword": text, "skills": skills, "location": None, "salary_min": None, "level": None}
