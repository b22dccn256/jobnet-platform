# JobNet – Hệ thống hỗ trợ tìm kiếm việc làm trực tuyến

Đồ án tốt nghiệp – PTIT, Khoa CNTT1. Nhóm: Nguyễn Mạnh Tuấn (B22DCCN760), Nguyễn Duy Hà (B22DCCN256). GVHD: Vũ Văn Thỏa.

## Kiến trúc

```
Next.js (3000) ──HTTP──► NestJS (4000) ──► MongoDB (27017)
                              │──────────► Elasticsearch (9200)
                              │──────────► MinIO (9000)
                              │──HTTP────► Flask chatbot (8000) ──► Groq LLM
Scrapy crawler ──► MongoDB (scraped_jobs) ──► aggregate ──► market_insights
```

## Cấu trúc thư mục

| Thư mục | Nội dung | Phụ trách chính |
|---|---|---|
| `backend/` | NestJS + TypeScript, Mongoose, JWT, Swagger | Tuấn + Hà (xem CODEOWNERS) |
| `frontend/` | Next.js (App Router), Ant Design, Redux Toolkit, TanStack Query | Tuấn + Hà |
| `chatbot/` | FlaskAPI + Groq (LLaMA 3.3 70B) | Hà |
| `crawler/` | Scrapy + job tổng hợp thị trường | Hà |
| `infra/` | Docker Compose, biến môi trường mẫu | Tuấn |
| `docs/` | Schema, API, quy ước làm việc | cả hai |

## Cổng dịch vụ

| Dịch vụ | Cổng |
|---|---|
| Next.js | 3000 |
| NestJS (Swagger: `/api/docs`) | 4000 |
| FlaskAPI | 8000 |
| MongoDB | 27017 |
| Elasticsearch | 9200 |
| Kibana | 5601 |
| MinIO (API / Console) | 9000 / 9001 |

## Chạy nhanh

```bash
# 1. Hạ tầng (MongoDB, Elasticsearch, Kibana, MinIO)
cd infra
cp .env.example .env
docker compose up -d

# 2. Backend
cd ../backend
cp .env.example .env
npm install
npm run start:dev          # http://localhost:4000/api/docs

# 3. Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000

# 4. Chatbot
cd ../chatbot
cp .env.example .env
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py              # http://localhost:8000

# 5. Crawler (chạy khi cần)
cd ../crawler
cp .env.example .env
pip install -r requirements.txt
scrapy crawl public_jobs
python -m analytics.aggregate
```

Tài liệu chi tiết: [`docs/`](docs/) – đọc `WORKFLOW.md` trước khi code.
