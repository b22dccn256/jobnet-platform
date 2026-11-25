import { BarChartOutlined, RobotOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from '@ant-design/icons';

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="auth-shell">
      <div className="container auth-shell__inner">
        <aside className="auth-aside">
          <span className="auth-aside__badge">
            <ThunderboltOutlined /> Nền tảng tuyển dụng SME & Niche Market
          </span>
          <h1 className="auth-aside__title">
            Kết nối đúng người, đúng việc cùng <span>JobNet</span>
          </h1>
          <p className="auth-aside__desc">
            Tối ưu quy trình tìm việc và sàng lọc hồ sơ bằng tìm kiếm Elasticsearch, trợ lý AI LLaMA
            3.3 và dữ liệu thống kê thị trường trực quan.
          </p>
          <ul className="auth-benefits">
            <li className="auth-benefit">
              <span className="auth-benefit__icon">
                <RobotOutlined />
              </span>
              <div>
                <p className="auth-benefit__title">Chatbot AI hỗ trợ ngôn ngữ tự nhiên</p>
                <p className="auth-benefit__desc">
                  Mô tả công việc mong muốn bằng câu hội thoại ngắn gọn, không cần lọc thủ công.
                </p>
              </div>
            </li>
            <li className="auth-benefit">
              <span className="auth-benefit__icon">
                <SafetyCertificateOutlined />
              </span>
              <div>
                <p className="auth-benefit__title">Tin đăng kiểm duyệt & Gợi ý 105 điểm</p>
                <p className="auth-benefit__desc">
                  Mọi tin tuyển dụng đều được Admin xét duyệt; gợi ý ứng viên minh bạch theo 9 tiêu chí.
                </p>
              </div>
            </li>
            <li className="auth-benefit">
              <span className="auth-benefit__icon">
                <BarChartOutlined />
              </span>
              <div>
                <p className="auth-benefit__title">Phân tích mức lương trung bình & trung vị</p>
                <p className="auth-benefit__desc">
                  Nắm bắt mặt bằng thu nhập và kỹ năng nổi bật trước khi ứng tuyển.
                </p>
              </div>
            </li>
          </ul>
        </aside>

        <div className="auth-card">{children}</div>
      </div>
    </section>
  );
}
