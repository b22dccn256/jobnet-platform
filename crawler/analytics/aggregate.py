"""Tổng hợp scraped_jobs (hoặc fallback jobs đã duyệt) -> market_insights.

Chạy: python -m analytics.aggregate
"""
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()


def aggregate_market_insights(db) -> dict:
    now = datetime.now(timezone.utc)
    period = now.strftime("%Y-%m")

    has_scraped = db.scraped_jobs.count_documents({}) > 0
    if has_scraped:
        source_col = db.scraped_jobs
        salary_pipeline = [
            {"$match": {"salaryMin": {"$ne": None}, "salaryMax": {"$ne": None}}},
            {
                "$group": {
                    "_id": {"$ifNull": ["$category", "Khác"]},
                    "avgMin": {"$avg": "$salaryMin"},
                    "avgMax": {"$avg": "$salaryMax"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"count": -1}},
        ]
        skills_pipeline = [
            {"$unwind": "$skills"},
            {"$group": {"_id": "$skills", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 20},
        ]
        demand_pipeline = [
            {"$match": {"postedAt": {"$ne": None}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$postedAt"}},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        source_name = "scraped_jobs"
    else:
        source_col = db.jobs
        salary_pipeline = [
            {"$match": {"status": "approved", "salaryMin": {"$ne": None}, "salaryMax": {"$ne": None}}},
            {
                "$lookup": {
                    "from": "categories",
                    "localField": "category",
                    "foreignField": "_id",
                    "as": "catInfo",
                }
            },
            {"$unwind": {"path": "$catInfo", "preserveNullAndEmptyArrays": True}},
            {
                "$group": {
                    "_id": {"$ifNull": ["$catInfo.name", "Khác"]},
                    "avgMin": {"$avg": "$salaryMin"},
                    "avgMax": {"$avg": "$salaryMax"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"count": -1}},
        ]
        skills_pipeline = [
            {"$match": {"status": "approved"}},
            {"$unwind": "$skills"},
            {"$group": {"_id": "$skills", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 20},
        ]
        demand_pipeline = [
            {"$match": {"status": "approved", "createdAt": {"$ne": None}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        source_name = "jobs"

    salary = list(source_col.aggregate(salary_pipeline))
    skills = list(source_col.aggregate(skills_pipeline))
    demand = list(source_col.aggregate(demand_pipeline))

    for insight_type, data in (
        ("salary_by_category", salary),
        ("hot_skills", skills),
        ("demand_trend", demand),
    ):
        db.market_insights.update_one(
            {"type": insight_type, "period": period},
            {"$set": {"data": data, "generatedAt": now}},
            upsert=True,
        )

    return {
        "source": source_name,
        "period": period,
        "categories": len(salary),
        "skills": len(skills),
        "days": len(demand),
    }


def main():
    client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/jobnet"))
    try:
        db = client.get_default_database()
        summary = aggregate_market_insights(db)
        print(
            f"Done ({summary['source']}, {summary['period']}): "
            f"{summary['categories']} categories, {summary['skills']} skills, {summary['days']} days"
        )
    finally:
        client.close()


if __name__ == "__main__":
    main()
