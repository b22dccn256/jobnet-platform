# crawler

Thu thập tin tuyển dụng **công khai** → `scraped_jobs`, sau đó tổng hợp → `market_insights`.

**Quy tắc bắt buộc:** tuân thủ `robots.txt` (`ROBOTSTXT_OBEY = True`), giới hạn tốc độ, không thu thập dữ liệu cá nhân, đọc điều khoản của trang nguồn trước khi cào.

```bash
pip install -r requirements.txt
cp .env.example .env            # điền START_URLS và MONGO_URI
scrapy crawl public_jobs        # cào dữ liệu
python -m analytics.aggregate   # tổng hợp lương trung bình, kỹ năng hot, xu hướng
```
