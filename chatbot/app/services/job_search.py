from pymongo import MongoClient

from ..config import MONGO_URI

_client = MongoClient(MONGO_URI)
_db = _client.get_default_database()


def search_jobs(filters: dict, limit: int = 5) -> list[dict]:
    """Truy vấn collection `jobs` (chỉ tin đã duyệt) theo bộ lọc đã trích xuất."""
    query: dict = {"status": "approved"}
    if filters.get("skills"):
        query["skills"] = {"$in": filters["skills"]}
    if filters.get("location"):
        query["location"] = {"$regex": filters["location"], "$options": "i"}
    # TODO (Hà): lọc theo lương, level; hoặc gọi Elasticsearch thay vì Mongo
    cursor = _db.jobs.find(query, {"title": 1, "location": 1, "salaryMin": 1, "salaryMax": 1, "skills": 1}).limit(limit)
    return [{**doc, "_id": str(doc["_id"])} for doc in cursor]
