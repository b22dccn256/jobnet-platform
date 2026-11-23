import os
import sys
import types
import unittest

CRAWLER_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if CRAWLER_ROOT not in sys.path:
    sys.path.insert(0, CRAWLER_ROOT)

# Allow pure helper tests to run without requiring Scrapy/dotenv/pymongo installed globally.
if "dotenv" not in sys.modules:
    fake_dotenv = types.ModuleType("dotenv")
    fake_dotenv.load_dotenv = lambda *args, **kwargs: None
    sys.modules["dotenv"] = fake_dotenv

if "scrapy" not in sys.modules:
    fake_scrapy = types.ModuleType("scrapy")

    class _DummySpider:
        pass

    class _DummyItem(dict):
        pass

    fake_scrapy.Spider = _DummySpider
    fake_scrapy.Item = _DummyItem
    fake_scrapy.Field = lambda *args, **kwargs: None
    sys.modules["scrapy"] = fake_scrapy

from jobcrawler.spiders.public_jobs import (  # noqa: E402
    extract_skills_from_text,
    parse_posted_at,
    parse_salary_vnd,
)


class CrawlerHelpersTest(unittest.TestCase):
    def test_parse_salary_vnd_variants(self):
        self.assertEqual(parse_salary_vnd("15 - 25 triệu"), (15_000_000, 25_000_000))
        self.assertEqual(parse_salary_vnd("Tới 30tr"), (None, 30_000_000))
        self.assertEqual(parse_salary_vnd("1000 - 1500 USD"), (25_000_000, 37_500_000))
        self.assertEqual(parse_salary_vnd("Thỏa thuận"), (None, None))

    def test_extract_skills_and_dates(self):
        skills = extract_skills_from_text("Yêu cầu Python, Flask, Docker và MongoDB")
        self.assertEqual(skills, ["Python", "MongoDB", "Docker", "Flask"])
        self.assertIsNotNone(parse_posted_at("2026-11-23T10:00:00Z"))
        self.assertIsNone(parse_posted_at("invalid-date"))


if __name__ == "__main__":
    unittest.main()
