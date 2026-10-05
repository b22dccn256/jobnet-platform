import os

import scrapy
from dotenv import load_dotenv

from ..items import ScrapedJobItem

load_dotenv()


class PublicJobsSpider(scrapy.Spider):
    """Spider mẫu. TODO (Hà): chọn trang nguồn, viết CSS/XPath selector tương ứng."""

    name = "public_jobs"

    def start_requests(self):
        urls = [u.strip() for u in os.getenv("START_URLS", "").split(",") if u.strip()]
        for url in urls:
            yield scrapy.Request(url, callback=self.parse_list)

    def parse_list(self, response):
        # TODO: lấy link từng tin trong trang danh sách + phân trang
        for href in response.css("a.job-link::attr(href)").getall():
            yield response.follow(href, callback=self.parse_job)

    def parse_job(self, response):
        item = ScrapedJobItem()
        item["source"] = response.url.split("/")[2]
        item["sourceUrl"] = response.url
        item["title"] = response.css("h1::text").get(default="").strip()
        # TODO: company, location, salaryMin/Max (chuẩn hóa về VND), skills, category, postedAt
        yield item
