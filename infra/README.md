# infra

Cấu hình hạ tầng đọc từ file `.env` ở thư mục gốc dự án (`../.env`):

```bash
docker compose --env-file ../.env up -d                       # chỉ chạy hạ tầng
docker compose --env-file ../.env --profile app up -d --build # thêm backend + chatbot
docker compose down                                           # dừng (giữ dữ liệu)
docker compose down -v                                        # dừng và XÓA dữ liệu
```

- MinIO Console: http://localhost:9001
- Kibana: http://localhost:5601
- Kiểm tra Elasticsearch: `curl http://localhost:9200`
