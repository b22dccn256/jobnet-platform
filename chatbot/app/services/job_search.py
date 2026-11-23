import re
from pymongo import MongoClient

from ..config import MONGO_URI

_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
_db = _client.get_default_database()


def build_mongo_query(filters: dict) -> dict:
    """Xây dựng bộ lọc MongoDB cho collection `jobs` đã duyệt."""
    and_clauses: list[dict] = [{"status": "approved"}]

    skills = filters.get("skills") or []
    if skills:
        skill_patterns = [re.compile(f"^{re.escape(str(s))}$", re.IGNORECASE) for s in skills if s]
        if skill_patterns:
            and_clauses.append({"skills": {"$in": skill_patterns}})

    location = filters.get("location")
    if location:
        if str(location).lower() == "remote":
            and_clauses.append(
                {"$or": [{"workMode": "remote"}, {"location": {"$regex": "remote", "$options": "i"}}]}
            )
        else:
            and_clauses.append({"location": {"$regex": re.escape(str(location)), "$options": "i"}})

    level = filters.get("level")
    if level in ("intern", "junior", "middle", "senior"):
        and_clauses.append({"level": level})

    salary_min = filters.get("salary_min")
    if isinstance(salary_min, (int, float)) and salary_min > 0:
        and_clauses.append(
            {
                "$or": [
                    {"salaryMax": {"$gte": salary_min}},
                    {"salaryMin": {"$gte": salary_min}},
                ]
            }
        )

    # Nếu chưa có tiêu chí có cấu trúc thì tìm kiếm từ khóa trên title / skills
    keyword = (filters.get("keyword") or "").strip()
    if keyword and not skills and not location and not level and not salary_min:
        tokens = [t for t in keyword.split() if len(t) >= 2][:4]
        if tokens:
            regex_pattern = "|".join(re.escape(t) for t in tokens)
            and_clauses.append(
                {
                    "$or": [
                        {"title": {"$regex": regex_pattern, "$options": "i"}},
                        {"skills": {"$regex": regex_pattern, "$options": "i"}},
                    ]
                }
            )

    return {"$and": and_clauses}


def search_jobs(filters: dict, limit: int = 5, db=None) -> list[dict]:
    """Truy vấn collection `jobs` (chỉ tin đã duyệt) kèm tên công ty."""
    target_db = db if db is not None else _db
    query = build_mongo_query(filters)
    projection = {
        "title": 1,
        "company": 1,
        "location": 1,
        "workMode": 1,
        "level": 1,
        "salaryMin": 1,
        "salaryMax": 1,
        "skills": 1,
    }

    try:
        docs = list(target_db.jobs.find(query, projection).limit(limit))
        company_ids = list({doc["company"] for doc in docs if doc.get("company")})
        company_map: dict[str, str] = {}
        if company_ids:
            for comp in target_db.companies.find({"_id": {"$in": company_ids}}, {"name": 1}):
                company_map[str(comp["_id"])] = comp.get("name", "")

        results = []
        for doc in docs:
            comp_id = str(doc["company"]) if doc.get("company") else None
            results.append(
                {
                    "_id": str(doc["_id"]),
                    "title": doc.get("title", ""),
                    "companyId": comp_id,
                    "companyName": company_map.get(comp_id or "", ""),
                    "location": doc.get("location"),
                    "workMode": doc.get("workMode"),
                    "level": doc.get("level"),
                    "salaryMin": doc.get("salaryMin"),
                    "salaryMax": doc.get("salaryMax"),
                    "skills": doc.get("skills") or [],
                }
            )
        return results
    except Exception:
        return []
