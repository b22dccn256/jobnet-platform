import os
import sys
import types
import unittest

CHATBOT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if CHATBOT_ROOT not in sys.path:
    sys.path.insert(0, CHATBOT_ROOT)

# Allow running unit tests cleanly even before optional pip packages are installed into a venv.
if "flask" not in sys.modules:
    fake_flask = types.ModuleType("flask")
    fake_flask.Flask = lambda *args, **kwargs: None
    sys.modules["flask"] = fake_flask

if "flask_cors" not in sys.modules:
    fake_cors = types.ModuleType("flask_cors")
    fake_cors.CORS = lambda *args, **kwargs: None
    sys.modules["flask_cors"] = fake_cors

if "dotenv" not in sys.modules:
    fake_dotenv = types.ModuleType("dotenv")
    fake_dotenv.load_dotenv = lambda *args, **kwargs: None
    sys.modules["dotenv"] = fake_dotenv

if "openai" not in sys.modules:
    fake_openai = types.ModuleType("openai")

    class _DummyOpenAI:
        def __init__(self, *args, **kwargs):
            pass

    fake_openai.OpenAI = _DummyOpenAI
    sys.modules["openai"] = fake_openai

if "pymongo" not in sys.modules:
    fake_pymongo = types.ModuleType("pymongo")

    class _DummyClient:
        def __init__(self, *args, **kwargs):
            pass

        def get_default_database(self):
            return None

    fake_pymongo.MongoClient = _DummyClient
    sys.modules["pymongo"] = fake_pymongo

from app.services.extractor import extract_filters  # noqa: E402
from app.services.job_search import build_mongo_query  # noqa: E402
from app.services.llm import generate_reply  # noqa: E402


class ChatbotServicesTest(unittest.TestCase):
    def test_extract_filters_parses_skills_location_level_and_salary(self):
        filters = extract_filters("Tìm việc Junior NestJS và TypeScript tại Hà Nội lương từ 15 triệu")
        self.assertIn("NestJS", filters["skills"])
        self.assertIn("TypeScript", filters["skills"])
        self.assertEqual(filters["location"], "Hà Nội")
        self.assertEqual(filters["level"], "junior")
        self.assertEqual(filters["salary_min"], 15_000_000)

        hourly = extract_filters("tìm việc part-time phục vụ lương trên 25 nghìn một giờ")
        self.assertEqual(hourly["salary_min"], 25_000)

    def test_build_mongo_query_includes_approved_and_filters(self):
        query = build_mongo_query(
            {
                "keyword": "nestjs",
                "skills": ["NestJS"],
                "location": "Hà Nội",
                "level": "junior",
                "salary_min": 15_000_000,
            }
        )
        clauses = query["$and"]
        self.assertIn({"status": "approved"}, clauses)
        self.assertTrue(any("skills" in c for c in clauses))
        self.assertTrue(any("location" in c for c in clauses))
        self.assertIn({"level": "junior"}, clauses)

    def test_generate_reply_fallback_without_groq_key(self):
        reply = generate_reply(
            "Tìm việc Python",
            [
                {
                    "title": "Python Developer",
                    "companyName": "SME Việt",
                    "location": "Hà Nội",
                    "salaryMin": 15_000_000,
                    "salaryMax": 25_000_000,
                    "skills": ["Python", "Flask"],
                }
            ],
            [],
        )
        self.assertIn("Python Developer", reply)
        self.assertIn("SME Việt", reply)


if __name__ == "__main__":
    unittest.main()
