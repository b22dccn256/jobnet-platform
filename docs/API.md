# API (rút gọn – chi tiết xem Swagger tại `/api/docs`)

Prefix: `/api`. Xác thực: `Authorization: Bearer <accessToken>`.

| Nhóm | Endpoint tiêu biểu | Quyền |
|---|---|---|
| Health | `GET /health` | public |
| Auth & Users | `POST /auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `POST /auth/change-password`, `GET /auth/me`, `GET/PATCH /users/me` | public / authenticated |
| Categories | `GET /categories`, `GET /categories/:id` · `POST/PATCH/DELETE /categories` | public · admin |
| Companies | `GET /companies`, `GET /companies/:id` · `GET /companies/me`, `POST/PATCH/DELETE /companies` | public · employer / admin |
| Jobs | `GET /jobs`, `GET /jobs/:id` · `GET /jobs/my`, `POST /jobs`, `PATCH /jobs/:id`, `PATCH /jobs/:id/close`, `DELETE /jobs/:id` | public · employer / admin |
| Search (ES) | `GET /search/jobs?q=&skills=&location=&level=&workMode=`, `GET /search/suggest?q=`, `POST /search/reindex` | public · admin |
| Profile & CV | CRUD `/educations`, `/work-experiences`, `/projects`, `/courses`, `/languages`, `/health`, `/other-info` · `GET /cv/me`, `PATCH /cv/me/settings`, `GET /cv/me/pdf` · `GET /cv/shared/:shareToken(/pdf)` · `GET /cv/candidate/:userId(/pdf)` | candidate · public · employer / admin |
| Applications | `POST /applications`, `GET /applications/me`, `DELETE /applications/:id` · `GET /applications/employer`, `GET /applications/job/:jobId`, `PATCH /applications/:id/status` | candidate · employer / admin |
| Saved & Follow | `GET /job-likes/me`, `POST/DELETE /job-likes/:jobId` · `GET /company-follows/me`, `POST/DELETE /company-follows/:companyId` | candidate |
| Storage (MinIO) | `POST /storage/upload?folder=cv\|avatar\|company`, `GET /storage/url?key=`, `GET /storage/file?key=` | authenticated / public |
| Chatbot | `POST /chatbot/chat` | candidate / admin |
| Market Insights | `GET /market-insights?type=`, `GET /market-insights/overview` · `POST /market-insights/recalculate` | public · admin |
| Recommendation | `GET /recommendation/jobs` · `GET /recommendation/jobs/:jobId/candidates` | candidate · employer (premium) / admin |
| Packages & VNPay | `GET /premium-packages` · `GET /recruiter-premium/active`, `POST /payments/vnpay/create` · `GET /payments/vnpay/return`, `GET /payments/vnpay/ipn` | public · employer · public |
| Admin & Mail | `GET /admin/users`, `PATCH /admin/users/:id/status\|role`, `GET /admin/jobs`, `PATCH /admin/jobs/:id/moderate`, `GET /admin/reports`, `POST /notifications/digest`, `POST /mail/send` | admin / employer |

Chatbot (Flask, nội bộ): `POST http://localhost:8000/chat` body `{ "message": "...", "history": [] }`.
