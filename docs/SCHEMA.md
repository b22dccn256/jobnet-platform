# Thiết kế CSDL MongoDB (bản nháp – cần Tuấn duyệt)

Tên collection theo danh mục trong đề cương. Mọi collection có `createdAt`, `updatedAt` (Mongoose timestamps).

| Collection | Mô tả | Trường chính | Tham chiếu |
|---|---|---|---|
| `users` | Tài khoản | email, password(hash), role(`candidate`\|`employer`\|`admin`), fullName, phone, avatar, isActive, isVerified, resetPasswordToken, resetPasswordExpires | – |
| `companies` | Nhà tuyển dụng | name, logo, description, address, website, size, industry | user |
| `categories` | Danh mục việc làm | name, slug, description | – |
| `jobs` | Tin tuyển dụng | title, description, benefits, requirements, skills[], location, workMode, level, education, salaryMin, salaryMax, deadline, **status**(`pending`\|`approved`\|`rejected`\|`closed`), rejectReason | company, category |
| `candidates` | Đơn ứng tuyển | cvUrl, coverLetter, status, appliedAt | job, user |
| `job_likes` | Việc làm đã lưu | – | user, job |
| `company_follows` | Theo dõi công ty | – | user, company |
| `educations` | Học vấn | school, major, degree, startDate, endDate | user |
| `courses` | Khóa học | name, organization, date | user |
| `health` | Sức khỏe | height, weight, note | user |
| `language` | Ngoại ngữ | name, level | user |
| `other_info` | Thông tin khác | content | user |
| `projects` | Dự án | name, description, technologies[], url | user |
| `work_experience` | Kinh nghiệm | position, company, startDate, endDate, description | user |
| `premium_packages` | Gói đăng tin | name, price, durationDays, postLimit, features[] | – |
| `recruiter_premium` | Gói đã mua | startAt, endAt, remainingPosts, paymentRef, paymentStatus | company, package |
| `scraped_jobs` | **Mới** – tin cào được | source, sourceUrl(unique), title, company, location, salaryMin, salaryMax, skills[], category, postedAt, scrapedAt | – |
| `market_insights` | **Mới** – thống kê thị trường | type(`salary_by_category`\|`hot_skills`\|`demand_trend`), period, data(Mixed), generatedAt | – |

## Ghi chú thiết kế (cần thảo luận)
1. `jobs.status` do Admin kiểm duyệt: chỉ `approved` mới được index vào Elasticsearch và hiển thị công khai.
2. `jobs.skills[]`, `level`, `salaryMin/Max`, `location` là các trường dùng chung cho Elasticsearch, thuật toán gợi ý ứng viên và chatbot – **không đổi tên khi chưa báo nhau**.
3. Dữ liệu hồ sơ ứng viên nằm ở `users` + các collection con tham chiếu `user` (không có collection `user_profile` riêng).
4. `scraped_jobs` tách khỏi `jobs` để dữ liệu cào không lẫn với tin do nhà tuyển dụng đăng.
