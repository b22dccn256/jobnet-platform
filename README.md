# JobNet – Hệ thống hỗ trợ tìm kiếm việc làm trực tuyến

Đồ án tốt nghiệp – Học viện Công nghệ Bưu chính Viễn thông (PTIT), Khoa CNTT1.  
**Nhóm thực hiện:** Nguyễn Mạnh Tuấn (B22DCCN760) · Nguyễn Duy Hà (B22DCCN256) — **GVHD:** Vũ Văn Thỏa.

---

## 1. Tổng quan & Kiến trúc

**JobNet** là nền tảng kết nối việc làm hướng tới doanh nghiệp SME và ứng viên, tích hợp tìm kiếm với Elasticsearch, gợi ý chấm điểm độ phù hợp (105 điểm), xuất CV PDF, thanh toán gói đăng tin qua VNPay, trợ lý tìm việc AI (Groq LLM) và phân tích dữ liệu thị trường từ Web Crawler.

```text
Next.js (3000) ──HTTP──► NestJS API (4000) ──► MongoDB (27017)
                                │────────────► Elasticsearch (9200)
                                │────────────► MinIO (9000 / 9001)
                                └──HTTP──────► Flask Chatbot (8000) ──► Groq LLM
Scrapy Crawler ────────► MongoDB (scraped_jobs) ──► aggregate ──► market_insights
```

| Thư mục | Công nghệ chính | Vai trò | Cổng mặc định |
|---|---|---|---|
| `frontend/` | Next.js 14 (App Router, SSR), TypeScript, Ant Design 5, Recharts, Redux Toolkit, TanStack Query | Giao diện Ứng viên, Nhà tuyển dụng, Admin (29 routes) | `3000` |
| `backend/` | NestJS 10, TypeScript, Mongoose, Passport JWT, Swagger, Puppeteer, Nodemailer | REST API trung tâm, xác thực, nghiệp vụ, xuất CV PDF | `4000` |
| `chatbot/` | Python 3, Flask, OpenAI SDK (Groq `llama-3.3-70b-versatile`), PyMongo | Trợ lý AI tìm việc bằng ngôn ngữ tự nhiên | `8000` |
| `crawler/` | Python 3, Scrapy, PyMongo | Thu thập tin công khai & tổng hợp lương TB/trung vị, kỹ năng hot | – |
| `infra/` | Docker Compose | Đóng gói MongoDB 7, Elasticsearch 8.13 (`asciifolding`), Kibana (`5601`), MinIO (`9000`/`9001`) | – |
| `docs/` | Markdown | Tài liệu CSDL (`SCHEMA.md`), API (`API.md`), phân công & quy ước Git | – |

---

## 2. Yêu cầu môi trường

- **Node.js** `>= 20.x` và `npm`
- **Python** `>= 3.10` và `pip` *(dành cho `chatbot/` và `crawler/`)*
- **Docker Desktop** *(khuyên dùng để bật nhanh hạ tầng; nếu không dùng Docker thì chỉ cần cài sẵn **MongoDB** trên máy)*

---

## 3. Hướng dẫn cài đặt & Chạy dự án (Local Development)

### Bước 1: Tạo file biến môi trường (`.env`)

Dự án chỉ dùng **2 file cấu hình**: `.env` ở thư mục gốc (dùng chung cho `infra`, `backend`, `chatbot`, `crawler`) và `frontend/.env.local` (dành riêng cho trình duyệt):

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

### Bước 2: Khởi động hạ tầng CSDL & Lưu trữ

- **Cách A – Dùng Docker Compose (Khuyên dùng):**
  Bật Docker Desktop lên trước, sau đó chạy:
  ```bash
  cd infra
  docker compose --env-file ../.env up -d
  ```
  *(Khởi chạy MongoDB `27017`, Elasticsearch `9200`, Kibana `5601`, MinIO `9000`/`9001`.)*

- **Cách B – Không dùng Docker (Chạy trực tiếp với MongoDB trên máy):**
  1. Bật dịch vụ MongoDB cục bộ tại cổng `27017`.
  2. Sửa `MONGO_URI` trong file `.env` ở thư mục gốc thành:
     ```ini
     MONGO_URI=mongodb://localhost:27017/jobnet
     ```
  *(Khi không bật Elasticsearch/MinIO, Backend tự động chuyển sang chế độ fallback tìm kiếm trên MongoDB và lưu file vào `backend/uploads/`.)*

### Bước 3: Chạy Backend (NestJS – Cổng `4000`)

```bash
cd backend
npm install

# Khởi tạo dữ liệu mẫu (tài khoản, danh mục, công ty, việc làm, gói dịch vụ)
npm run seed

# Chạy chế độ phát triển (watch mode)
npm run start:dev
```

- **Swagger UI:** `http://localhost:4000/api/docs`
- **Health Check:** `http://localhost:4000/api/health`
- **Chạy unit test & build:** `npm test` · `npm run build`

### Bước 4: Chạy Frontend (Next.js – Cổng `3000`)

Mở một terminal mới:

```bash
cd frontend
npm install
npm run dev
```

- **Giao diện Web:** `http://localhost:3000`
- **Build production:** `npm run build && npm start`

### Bước 5: Chạy Chatbot AI (Flask – Cổng `8000`, tùy chọn)

```bash
cd chatbot
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

- Kiểm tra: `http://localhost:8000/health` *(Nếu chưa chạy service Flask này, endpoint `/api/chatbot/chat` của Backend vẫn tự fallback về bộ tìm kiếm nội bộ).*

### Bước 6: Chạy Crawler & Tổng hợp thị trường (Khi cần cập nhật dữ liệu)

```bash
cd crawler
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Điền START_URLS trong .env gốc trước khi cào (tuân thủ robots.txt)
scrapy crawl public_jobs
python -m analytics.aggregate
```

---

## 4. Triển khai trọn gói bằng Docker Compose

Để đóng gói và chạy đồng thời cả hạ tầng + `backend` + `chatbot` bằng Docker:

```bash
cp -n .env.example .env
cd infra
docker compose --env-file ../.env --profile app up -d --build
```

- Xem trạng thái & log: `docker compose ps` · `docker compose logs -f backend`
- Dừng dịch vụ (giữ dữ liệu): `docker compose down`
- Dừng và xóa toàn bộ volume dữ liệu: `docker compose down -v`

---

## 5. Tài khoản mẫu & Đường dẫn trải nghiệm nhanh

Sau khi chạy `npm run seed`, mật khẩu chung cho cả 3 tài khoản mẫu là **`123456`**:

| Vai trò | Email | Các màn hình chính trên Web (`http://localhost:3000`) |
|---|---|---|
| **Candidate** | `candidate@jobnet.local` | `/jobs` (SSR), `/companies`, `/cv` (tạo/chia sẻ/xuất PDF), `/recommended`, `/applied`, `/saved`, `/chatbot`, `/market-insights` |
| **Employer** | `employer@jobnet.local` | `/employer/dashboard`, `/employer/jobs`, `/employer/jobs/new`, `/employer/candidates`, `/employer/suggestions` (chấm 105đ), `/employer/upgrade` (VNPay) |
| **Admin** | `admin@jobnet.local` | `/admin/reports`, `/admin/jobs-moderation` (duyệt/từ chối tin), `/admin/users`, `/admin/packages` |

### Chạy kiểm thử tự động (Tests)

```bash
cd backend && npm test                                # 22 unit tests (NestJS services & guards)
python3 -m unittest discover -s chatbot/tests -v      # Kiểm thử trích xuất & truy vấn Chatbot
python3 -m unittest discover -s crawler/tests -v      # Kiểm thử chuẩn hóa lương & kỹ năng Crawler
```

---

## 6. Biến môi trường & Cơ chế Fallback khi Dev

Dự án được thiết kế để chạy được ngay cả khi chưa có API key của bên thứ ba:

| Nhóm cấu hình | Biến chính (trong `.env`) | Hành vi khi để trống / dịch vụ tắt |
|---|---|---|
| **Elasticsearch** | `ELASTICSEARCH_NODE` | Tự động chuyển sang tìm kiếm & gợi ý trực tiếp trên MongoDB |
| **MinIO** | `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | Tự động lưu và đọc file cục bộ tại `backend/uploads/` |
| **Email SMTP** | `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` | Không lỗi, ghi log nội dung email ra console (`DEV MAIL MOCK`) |
| **VNPay** | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | Sinh URL thanh toán giả lập nội bộ (`mode: mock`) để test trọn luồng mua gói |
| **Groq LLM** | `GROQ_API_KEY` | Bóc tách điều kiện bằng rule-based và trả danh sách việc làm khớp từ MongoDB |

---

## 7. Tài liệu nội bộ

- Thiết kế CSDL MongoDB (18 collections): [`docs/SCHEMA.md`](docs/SCHEMA.md)
- Danh mục Endpoint chính: [`docs/API.md`](docs/API.md) *(chi tiết đầy đủ trên Swagger `/api/docs`)*
- Phân công thành viên: [`docs/OWNERSHIP.md`](docs/OWNERSHIP.md)
- Quy ước nhánh Git & Pull Request: [`docs/WORKFLOW.md`](docs/WORKFLOW.md)
