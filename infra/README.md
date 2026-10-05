# infra

```bash
cp .env.example .env
docker compose up -d                       # chỉ hạ tầng
docker compose --profile app up -d --build # thêm backend + chatbot
docker compose down                        # dừng (giữ dữ liệu)
docker compose down -v                     # dừng và XÓA dữ liệu
```

- MinIO Console: http://localhost:9001
- Kibana: http://localhost:5601
- Kiểm tra Elasticsearch: `curl http://localhost:9200`
