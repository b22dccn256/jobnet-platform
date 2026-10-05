# API (rút gọn – chi tiết xem Swagger tại `/api/docs`)

Prefix: `/api`. Xác thực: `Authorization: Bearer <accessToken>`.

| Nhóm | Endpoint | Quyền |
|---|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` | public |
| Jobs | `GET /jobs`, `GET /jobs/:id` | public |
| Jobs (NTD) | `POST/PATCH/DELETE /jobs` | employer |
| Search | `GET /search/jobs?q=&skills=&location=` , `GET /search/suggest?q=` | public |
| Applications | `POST /applications`, `GET /applications/me` | candidate |
| Saved jobs | `POST/DELETE /job-likes/:jobId`, `GET /job-likes/me` | candidate |
| Follow | `POST/DELETE /company-follows/:companyId` | candidate |
| Chatbot | `POST /chatbot/chat` | candidate |
| Market | `GET /market-insights?type=` | public |
| Recommendation | `GET /recommendation/jobs/:jobId/candidates` | employer (premium) |
| Payments | `POST /payments/vnpay/create`, `GET /payments/vnpay/return` | employer |
| Admin | `GET /admin/users`, `PATCH /admin/jobs/:id/moderate`, `GET /admin/reports` | admin |

Chatbot (Flask, nội bộ): `POST http://localhost:8000/chat` body `{ "message": "...", "history": [] }`.
