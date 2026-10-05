# Phân công (theo đề cương)

## Nguyễn Mạnh Tuấn (Nhóm trưởng – `@nmt-work`)
- `infra/` – Docker Compose, CSDL MongoDB
- `auth`, `users`, `admin`
- `companies`, `jobs`, `categories`, `applications` (phía nhà tuyển dụng)
- `premium-packages`, `recruiter-premium`, `payments` (VNPay)
- `recommendation` (thuật toán chấm điểm ứng viên)
- `mail` (gửi email ứng viên)
- Giao diện: `app/(employer)`, `app/(admin)`

## Nguyễn Duy Hà (`@b22dccn256`)
- `profile/*` (educations, courses, health, languages, other-info, projects, work-experiences), CV
- `applications` (phía ứng viên), `job-likes`, `company-follows`
- `search` (Elasticsearch), `storage` (MinIO)
- `chatbot/` (Flask + Groq) và `backend/src/modules/chatbot`
- `crawler/` (Scrapy), `scraped-jobs`, `market-insights`
- Giao diện: `app/(candidate)`, `app/(auth)`, trang thống kê thị trường

## Cần thống nhất (chưa ai nhận rõ)
- `notifications` (cron gửi mail việc làm mới cho ứng viên) – đề xuất: Hà làm phần ứng viên, Tuấn cung cấp `mail`
- Xuất PDF CV bằng Puppeteer – đề xuất: Hà
