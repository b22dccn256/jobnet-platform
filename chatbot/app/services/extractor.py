import re
import unicodedata

from .llm import extract_with_llm


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn").replace("đ", "d")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s+#.]", " ", text)).strip()


KNOWN_SKILLS = [
    ("typescript", "TypeScript"),
    ("javascript", "JavaScript"),
    ("nestjs", "NestJS"),
    ("nextjs", "Next.js"),
    ("next.js", "Next.js"),
    ("nodejs", "NodeJS"),
    ("node.js", "NodeJS"),
    ("react", "React"),
    ("python", "Python"),
    ("flask", "Flask"),
    ("django", "Django"),
    ("scrapy", "Scrapy"),
    ("java", "Java"),
    ("spring", "Spring"),
    ("php", "PHP"),
    ("laravel", "Laravel"),
    ("golang", "Go"),
    ("mongodb", "MongoDB"),
    ("postgresql", "PostgreSQL"),
    ("mysql", "MySQL"),
    ("elasticsearch", "Elasticsearch"),
    ("docker", "Docker"),
    ("redis", "Redis"),
    ("aws", "AWS"),
    ("sql", "SQL"),
    ("excel", "Excel"),
    ("marketing", "Marketing"),
    ("seo", "SEO"),
    ("figma", "Figma"),
    ("ui/ux", "UI/UX"),
]

LOCATION_ALIASES = [
    ("ha noi", "Hà Nội"),
    ("hanoi", "Hà Nội"),
    ("ho chi minh", "Hồ Chí Minh"),
    ("tp hcm", "Hồ Chí Minh"),
    ("tphcm", "Hồ Chí Minh"),
    ("sai gon", "Hồ Chí Minh"),
    ("hcm", "Hồ Chí Minh"),
    ("da nang", "Đà Nẵng"),
    ("hai phong", "Hải Phòng"),
    ("can tho", "Cần Thơ"),
    ("remote", "Remote"),
    ("tu xa", "Remote"),
]

LEVEL_ALIASES = [
    ("thuc tap", "intern"),
    ("intern", "intern"),
    ("moi ra truong", "junior"),
    ("fresher", "junior"),
    ("junior", "junior"),
    ("middle", "middle"),
    ("mid", "middle"),
    ("senior", "senior"),
    ("truong nhom", "senior"),
]


def _extract_salary_min(norm_text: str) -> int | None:
    # Bắt các mẫu: "15 trieu", "15tr", "15m", "luong 20 cu"
    m = re.search(r"(\d{1,3})\s*(?:trieu|tr|m|cu)\b", norm_text)
    if m:
        amount = int(m.group(1))
        if 1 <= amount <= 300:
            return amount * 1_000_000
    return None


def extract_filters(message: str) -> dict:
    """Trích vị trí, kỹ năng, địa điểm, lương, cấp độ bằng rule-based và fallback Groq LLM."""
    norm_text = normalize(message)
    padded = f" {norm_text} "

    skills: list[str] = []
    for key, canonical in KNOWN_SKILLS:
        if f" {key} " in padded or (len(key) >= 4 and key in norm_text):
            if canonical not in skills:
                skills.append(canonical)

    location = None
    for alias, canonical in LOCATION_ALIASES:
        if f" {alias} " in padded:
            location = canonical
            break

    level = None
    for alias, canonical in LEVEL_ALIASES:
        if f" {alias} " in padded:
            level = canonical
            break

    salary_min = _extract_salary_min(norm_text)

    result = {
        "keyword": norm_text,
        "skills": skills,
        "location": location,
        "salary_min": salary_min,
        "level": level,
    }

    # Nếu rule-based không trích được tiêu chí cụ thể nào thì nhờ LLM phân tích thêm
    if not skills and not location and not salary_min and not level:
        llm_data = extract_with_llm(message)
        if llm_data:
            if llm_data.get("skills"):
                result["skills"] = llm_data["skills"]
            if llm_data.get("location"):
                result["location"] = llm_data["location"]
            if llm_data.get("salary_min"):
                result["salary_min"] = llm_data["salary_min"]
            if llm_data.get("level") in ("intern", "junior", "middle", "senior"):
                result["level"] = llm_data["level"]
            if llm_data.get("keyword"):
                result["keyword"] = llm_data["keyword"]

    return result
