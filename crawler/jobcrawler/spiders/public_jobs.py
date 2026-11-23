import json
import os
import re
from datetime import datetime, timezone

import scrapy
from dotenv import load_dotenv

from ..items import ScrapedJobItem

load_dotenv()

USD_TO_VND = 25_000

COMMON_SKILLS = [
    "Python",
    "TypeScript",
    "JavaScript",
    "NestJS",
    "Next.js",
    "NodeJS",
    "React",
    "Java",
    "Spring",
    "PHP",
    "Laravel",
    "Go",
    "C#",
    ".NET",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Elasticsearch",
    "Docker",
    "Kubernetes",
    "Redis",
    "AWS",
    "Scrapy",
    "Flask",
    "UI/UX",
    "Figma",
    "Marketing",
    "SEO",
    "Excel",
]


def parse_salary_vnd(raw: str | None) -> tuple[int | None, int | None]:
    """Chuẩn hóa chuỗi mức lương tiếng Việt/USD về khoảng (salaryMin, salaryMax) theo VND."""
    if not raw:
        return None, None

    text = raw.strip().lower()
    if any(k in text for k in ("thỏa thuận", "thoa thuan", "cạnh tranh", "canh tranh", "negotiable")):
        return None, None

    cleaned = text.replace(",", "").replace(".", "")
    numbers = [int(n) for n in re.findall(r"\d+", cleaned)]
    if not numbers:
        return None, None

    if "usd" in text or "$" in text:
        multiplier = USD_TO_VND
    elif "triệu" in text or "trieu" in text or re.search(r"\btr\b", text):
        multiplier = 1_000_000
    else:
        multiplier = 1 if numbers[0] >= 1_000_000 else 1_000_000

    vals = [n * multiplier for n in numbers[:2]]
    if len(vals) >= 2:
        low, high = min(vals[0], vals[1]), max(vals[0], vals[1])
        return low, high

    single = vals[0]
    if any(k in text for k in ("tới", "toi", "đến", "den", "up to", "max")):
        return None, single
    return single, None


def extract_skills_from_text(text: str | None) -> list[str]:
    if not text:
        return []
    lowered = text.lower()
    found = []
    for skill in COMMON_SKILLS:
        pattern = r"(?<!\w)" + re.escape(skill.lower()) + r"(?!\w)"
        if re.search(pattern, lowered):
            found.append(skill)
    return found


def parse_posted_at(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw.strip().replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


class PublicJobsSpider(scrapy.Spider):
    """Spider thu thập tin tuyển dụng công khai (hỗ trợ Schema.org JobPosting & CSS fallback)."""

    name = "public_jobs"

    def start_requests(self):
        urls = [u.strip() for u in os.getenv("START_URLS", "").split(",") if u.strip()]
        for url in urls:
            yield scrapy.Request(url, callback=self.parse_list)

    def parse_list(self, response):
        links = response.css("a.job-link::attr(href), a[href*='/job']::attr(href)").getall()
        for href in links:
            yield response.follow(href, callback=self.parse_job)

        next_page = response.css("a[rel='next']::attr(href), a.next::attr(href)").get()
        if next_page:
            yield response.follow(next_page, callback=self.parse_list)

    def _extract_json_ld_job(self, response) -> dict | None:
        for raw in response.css("script[type='application/ld+json']::text").getall():
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue
            candidates = data if isinstance(data, list) else [data]
            for obj in candidates:
                if isinstance(obj, dict) and obj.get("@type") == "JobPosting":
                    return obj
        return None

    def parse_job(self, response):
        item = ScrapedJobItem()
        item["source"] = response.url.split("/")[2]
        item["sourceUrl"] = response.url

        ld = self._extract_json_ld_job(response)
        if ld:
            item["title"] = str(ld.get("title") or "").strip()
            org = ld.get("hiringOrganization") or {}
            item["company"] = str(org.get("name") or "").strip() if isinstance(org, dict) else ""
            loc = ld.get("jobLocation") or {}
            if isinstance(loc, list) and loc:
                loc = loc[0]
            addr = loc.get("address") if isinstance(loc, dict) else {}
            item["location"] = (
                str(addr.get("addressLocality") or addr.get("addressRegion") or "").strip()
                if isinstance(addr, dict)
                else ""
            )
            base_sal = ld.get("baseSalary") or {}
            sal_val = base_sal.get("value") if isinstance(base_sal, dict) else {}
            if isinstance(sal_val, dict):
                item["salaryMin"] = sal_val.get("minValue")
                item["salaryMax"] = sal_val.get("maxValue")
            else:
                item["salaryMin"], item["salaryMax"] = parse_salary_vnd(str(sal_val or ""))
            desc = str(ld.get("description") or "")
            item["skills"] = extract_skills_from_text(f"{item['title']} {desc}")
            item["category"] = str(ld.get("occupationalCategory") or "Công nghệ thông tin").strip()
            item["postedAt"] = parse_posted_at(ld.get("datePosted"))
            yield item
            return

        title = response.css("h1::text").get(default="").strip()
        company = response.css(".company-name::text, [data-company]::text").get(default="").strip()
        location = response.css(".location::text, [data-location]::text").get(default="").strip()
        salary_raw = response.css(".salary::text, [data-salary]::text").get(default="").strip()
        tags = [t.strip() for t in response.css(".skill-tag::text, .tag::text").getall() if t.strip()]
        body_text = " ".join(response.css("body ::text").getall())

        sal_min, sal_max = parse_salary_vnd(salary_raw)
        item["title"] = title
        item["company"] = company
        item["location"] = location
        item["salaryMin"] = sal_min
        item["salaryMax"] = sal_max
        item["skills"] = tags or extract_skills_from_text(f"{title} {body_text[:2000]}")
        item["category"] = response.css(".category::text").get(default="Công nghệ thông tin").strip()
        item["postedAt"] = parse_posted_at(response.css("time::attr(datetime)").get())
        yield item
