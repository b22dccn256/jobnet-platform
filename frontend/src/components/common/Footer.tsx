import Link from 'next/link';

const CANDIDATE_LINKS = [
  { href: '/jobs', label: 'Tìm kiếm việc làm' },
  { href: '/companies', label: 'Danh sách công ty' },
  { href: '/chatbot', label: 'Trợ lý AI tìm việc' },
  { href: '/market-insights', label: 'Xu hướng thị trường' },
];

const EMPLOYER_LINKS = [
  { href: '/register?role=employer', label: 'Đăng ký nhà tuyển dụng' },
  { href: '/employer/jobs/new', label: 'Đăng tin tuyển dụng' },
  { href: '/employer/upgrade', label: 'Gói dịch vụ đăng tin' },
];

export default function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <p className="site-footer__brand">
              JobNet<span>.</span>
            </p>
            <p className="site-footer__text">
              Hệ thống kết nối việc làm thông minh, tối ưu tuyển dụng cho doanh nghiệp SME và hỗ trợ
              ứng viên tìm việc thuận tiện cùng trợ lý AI.
            </p>
          </div>

          <div>
            <p className="site-footer__title">Dành cho ứng viên</p>
            <ul className="site-footer__links">
              {CANDIDATE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="site-footer__title">Dành cho nhà tuyển dụng</p>
            <ul className="site-footer__links">
              {EMPLOYER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="site-footer__title">Đồ án tốt nghiệp</p>
            <p className="site-footer__text">
              Học viện Công nghệ Bưu chính Viễn thông
              <br />
              GVHD: Vũ Văn Thỏa
              <br />
              Nguyễn Mạnh Tuấn – B22DCCN760
              <br />
              Nguyễn Duy Hà – B22DCCN256
            </p>
          </div>
        </div>

        <div className="site-footer__bottom">
          &copy; {new Date().getFullYear()} JobNet Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
