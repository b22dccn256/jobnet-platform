"""Tổng hợp scraped_jobs -> market_insights.  Chạy: python -m analytics.aggregate"""
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()


def main():
    db = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/jobnet")).get_default_database()
    now = datetime.now(timezone.utc)
    period = now.strftime("%Y-%m")

    # 1) Lương trung bình theo ngành
    salary = list(db.scraped_jobs.aggregate([
        {"$match": {"salaryMin": {"$ne": None}, "salaryMax": {"$ne": None}}},
        {"$group": {
            "_id": "$category",
            "avgMin": {"$avg": "$salaryMin"},
            "avgMax": {"$avg": "$salaryMax"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"count": -1}},
    ]))
    # 2) Kỹ năng "hot"
    skills = list(db.scraped_jobs.aggregate([
        {"$unwind": "$skills"},
        {"$group": {"_id": "$skills", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20},
    ]))
    # 3) Xu hướng nhu cầu tuyển dụng theo ngày đăng
    demand = list(db.scraped_jobs.aggregate([
        {"$match": {"postedAt": {"$ne": None}}},
        {"$group": {"_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$postedAt"}}, "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]))

    for t, data in (("salary_by_category", salary), ("hot_skills", skills), ("demand_trend", demand)):
        db.market_insights.update_one(
            {"type": t, "period": period},
            {"$set": {"data": data, "generatedAt": now}},
            upsert=True,
        )
    print(f"Done: {len(salary)} categories, {len(skills)} skills, {len(demand)} days")


if __name__ == "__main__":
    main()
