import os
from datetime import datetime, timezone

from pymongo import MongoClient


class MongoPipeline:
    def open_spider(self, spider):
        self.client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/jobnet"))
        self.col = self.client.get_default_database().scraped_jobs
        self.col.create_index("sourceUrl", unique=True)

    def close_spider(self, spider):
        self.client.close()

    def process_item(self, item, spider):
        data = dict(item)
        data["scrapedAt"] = datetime.now(timezone.utc)
        # upsert theo sourceUrl để không bị trùng khi cào lại
        self.col.update_one({"sourceUrl": data["sourceUrl"]}, {"$set": data}, upsert=True)
        return item
