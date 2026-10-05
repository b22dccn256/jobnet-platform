# Quy ước làm việc nhóm

## Git
- `main`: luôn chạy được. **Không push trực tiếp**, chỉ merge qua Pull Request.
- Đặt tên nhánh: `feat/<module>-<mô-tả>`, `fix/...`, `infra/...`, `docs/...`
  - Ví dụ: `feat/candidate-auth`, `feat/scrapy-crawler`, `infra/docker-compose`
- Commit theo Conventional Commits: `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`
- Mỗi PR: người còn lại review. Quá 48 giờ không phản hồi thì coi như đồng ý.

## Thay đổi schema
1. Sửa file `*.schema.ts` tương ứng.
2. Cập nhật `docs/SCHEMA.md`.
3. Nhắn người còn lại trước khi merge nếu bảng đó dùng chung (`users`, `jobs`, `companies`, `categories`).

## Secret
- Không commit `.env`. Chỉ commit `.env.example`.

## Phân chia thư mục backend
Xem `.github/CODEOWNERS` và `docs/OWNERSHIP.md`.
