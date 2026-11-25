import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { ApplicationStatus } from './common/enums/application-status.enum';
import { JobStatus } from './common/enums/job-status.enum';
import { Role } from './common/enums/role.enum';
import { Application, ApplicationSchema } from './modules/applications/schemas/applications.schema';
import { Category, CategorySchema } from './modules/categories/schemas/categories.schema';
import { CompanyFollow, CompanyFollowSchema } from './modules/company-follows/schemas/company-follows.schema';
import { Company, CompanySchema } from './modules/companies/schemas/companies.schema';
import { JobLike, JobLikeSchema } from './modules/job-likes/schemas/job-likes.schema';
import { Job, JobSchema } from './modules/jobs/schemas/jobs.schema';
import {
  PremiumPackage,
  PremiumPackageSchema,
} from './modules/premium-packages/schemas/premium-packages.schema';
import { Course, CourseSchema } from './modules/profile/courses/schemas/courses.schema';
import { Education, EducationSchema } from './modules/profile/educations/schemas/educations.schema';
import { Language, LanguageSchema } from './modules/profile/languages/schemas/languages.schema';
import { Project, ProjectSchema } from './modules/profile/projects/schemas/projects.schema';
import {
  WorkExperience,
  WorkExperienceSchema,
} from './modules/profile/work-experiences/schemas/work-experiences.schema';
import {
  RecruiterPremium,
  RecruiterPremiumSchema,
} from './modules/recruiter-premium/schemas/recruiter-premium.schema';
import { User, UserSchema } from './modules/users/schemas/users.schema';

function loadEnvFile() {
  const candidates = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ];
  const envPath = candidates.find((p) => fs.existsSync(p));
  if (!envPath) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const rawVal = trimmed.slice(eqIndex + 1).trim();
    const val = rawVal.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

interface SeedEmployerSpec {
  email: string;
  fullName: string;
  phone: string;
  company: {
    name: string;
    description: string;
    address: string;
    website: string;
    size: string;
    industry: string;
  };
  hasPremium?: boolean;
  jobs: Array<{
    categorySlug: string;
    title: string;
    description: string;
    requirements: string;
    benefits: string;
    skills: string[];
    location: string;
    workMode: 'onsite' | 'remote' | 'hybrid';
    level: 'intern' | 'junior' | 'middle' | 'senior';
    education: string;
    salaryMin: number;
    salaryMax: number;
    status: JobStatus;
  }>;
}

interface SeedCandidateSpec {
  email: string;
  fullName: string;
  phone: string;
  avatar?: string;
  isVerified: boolean;
  bio: string;
  skills: string[];
  desiredTitle: string;
  desiredLevel: 'intern' | 'junior' | 'middle' | 'senior';
  desiredSalaryMin: number;
  desiredLocation: string;
  education: { school: string; major: string; degree: string; startYear: number; endYear: number };
  experience?: {
    position: string;
    company: string;
    monthsAgoStart: number;
    monthsAgoEnd?: number;
    description: string;
  };
  project?: { name: string; description: string; technologies: string[] };
  language?: { name: string; level: string };
  course?: { name: string; organization: string };
}

const EXTRA_EMPLOYERS: SeedEmployerSpec[] = [
  {
    email: 'employer1@jobnet.local',
    fullName: 'Trần Minh Quang',
    phone: '0902111222',
    hasPremium: true,
    company: {
      name: 'Công ty Cổ phần Công nghệ FinTech Á Châu',
      description: 'Phát triển nền tảng ví điện tử, cổng thanh toán và giải pháp tài chính số cho SME.',
      address: 'Hà Nội',
      website: 'https://fintech-achau.example.com',
      size: '50-150 nhân viên',
      industry: 'Công nghệ thông tin',
    },
    jobs: [
      {
        categorySlug: 'cong-nghe-thong-tin',
        title: 'Senior Backend Engineer (Node.js / NestJS)',
        description: 'Thiết kế hệ thống xử lý giao dịch chịu tải cao bằng NestJS, MongoDB và Redis.',
        requirements: 'Từ 3 năm kinh nghiệm Backend Node.js/NestJS, hiểu biết bảo mật thanh toán.',
        benefits: 'Lương tháng 13, thưởng hiệu suất quý, bảo hiểm sức khỏe cao cấp.',
        skills: ['TypeScript', 'NestJS', 'MongoDB', 'Redis', 'Docker'],
        location: 'Hà Nội',
        workMode: 'hybrid',
        level: 'senior',
        education: 'Đại học',
        salaryMin: 28000000,
        salaryMax: 42000000,
        status: JobStatus.Approved,
      },
      {
        categorySlug: 'cong-nghe-thong-tin',
        title: 'Java Spring Boot Developer',
        description: 'Xây dựng các microservice kết nối đối tác ngân hàng và đối soát tự động.',
        requirements: 'Thành thạo Java, Spring Boot, PostgreSQL và RESTful API.',
        benefits: 'Làm việc hybrid 2 ngày/tuần, phụ cấp ăn trưa & gửi xe.',
        skills: ['Java', 'Spring', 'PostgreSQL', 'Docker'],
        location: 'Hà Nội',
        workMode: 'onsite',
        level: 'middle',
        education: 'Đại học',
        salaryMin: 22000000,
        salaryMax: 35000000,
        status: JobStatus.Approved,
      },
    ],
  },
  {
    email: 'employer2@jobnet.local',
    fullName: 'Lê Thu Trang',
    phone: '0903222333',
    hasPremium: true,
    company: {
      name: 'Saigon Digital Studio',
      description: 'Agency thiết kế sản phẩm số, thương mại điện tử và giải pháp Marketing tăng trưởng.',
      address: 'Hồ Chí Minh',
      website: 'https://saigondigital.example.com',
      size: '20-50 nhân viên',
      industry: 'Marketing & Truyền thông',
    },
    jobs: [
      {
        categorySlug: 'thiet-ke-ui-ux',
        title: 'UI/UX Designer (Web & Mobile App)',
        description: 'Thiết kế wireframe, prototype và Design System trên Figma cho các sản phẩm SaaS.',
        requirements: 'Có portfolio sản phẩm thực tế, sử dụng thành thạo Figma.',
        benefits: 'Môi trường sáng tạo, trang bị MacBook làm việc.',
        skills: ['Figma', 'UI/UX', 'Design System', 'Prototype'],
        location: 'Hồ Chí Minh',
        workMode: 'hybrid',
        level: 'junior',
        education: 'Cao đẳng / Đại học',
        salaryMin: 14000000,
        salaryMax: 22000000,
        status: JobStatus.Approved,
      },
      {
        categorySlug: 'marketing-truyen-thong',
        title: 'Chuyên viên Digital Marketing & SEO',
        description: 'Lập kế hoạch SEO, chạy quảng cáo Google/Facebook Ads và tối ưu chuyển đổi.',
        requirements: 'Từ 1 năm kinh nghiệm Digital Marketing, biết phân tích Google Analytics.',
        benefits: 'Thưởng KPI hàng tháng theo doanh số chiến dịch.',
        skills: ['Marketing', 'SEO', 'Google Analytics', 'Content'],
        location: 'Hồ Chí Minh',
        workMode: 'onsite',
        level: 'junior',
        education: 'Đại học',
        salaryMin: 12000000,
        salaryMax: 18000000,
        status: JobStatus.Approved,
      },
    ],
  },
  {
    email: 'employer3@jobnet.local',
    fullName: 'Phạm Hoàng Nam',
    phone: '0904333444',
    company: {
      name: 'CloudViet Data & AI Labs',
      description: 'Công ty phát triển nền tảng dữ liệu lớn, tìm kiếm thông minh và trợ lý ảo doanh nghiệp.',
      address: 'Đà Nẵng',
      website: 'https://cloudviet-ai.example.com',
      size: '10-50 nhân viên',
      industry: 'Công nghệ thông tin',
    },
    jobs: [
      {
        categorySlug: 'cong-nghe-thong-tin',
        title: 'AI / Python Backend Developer',
        description: 'Xây dựng pipeline RAG, trích xuất dữ liệu và tích hợp LLM bằng Python Flask/FastAPI.',
        requirements: 'Nắm vững Python, Flask, MongoDB, có kinh nghiệm làm việc với LLM API.',
        benefits: 'Làm việc từ xa hoàn toàn, thưởng dự án AI.',
        skills: ['Python', 'Flask', 'MongoDB', 'Elasticsearch', 'Docker'],
        location: 'Đà Nẵng',
        workMode: 'remote',
        level: 'middle',
        education: 'Đại học',
        salaryMin: 20000000,
        salaryMax: 32000000,
        status: JobStatus.Approved,
      },
      {
        categorySlug: 'cong-nghe-thong-tin',
        title: 'Thực tập sinh Fullstack TypeScript',
        description: 'Tham gia phát triển module quản trị với Next.js, Ant Design và NestJS.',
        requirements: 'Sinh viên năm 3-4 CNTT, biết cơ bản React/TypeScript.',
        benefits: 'Trợ cấp thực tập 5 triệu/tháng, cơ hội lên nhân viên chính thức.',
        skills: ['TypeScript', 'React', 'Next.js', 'NestJS'],
        location: 'Đà Nẵng',
        workMode: 'onsite',
        level: 'intern',
        education: 'Đại học',
        salaryMin: 4000000,
        salaryMax: 7000000,
        status: JobStatus.Approved,
      },
    ],
  },
  {
    email: 'employer4@jobnet.local',
    fullName: 'Vũ Thị Mai Anh',
    phone: '0905444555',
    company: {
      name: 'Mekong Commerce Logistics',
      description: 'Giải pháp quản lý vận hành kho bãi và bán hàng đa kênh cho hộ kinh doanh và SME.',
      address: 'Hồ Chí Minh',
      website: 'https://mekongcommerce.example.com',
      size: '50-100 nhân viên',
      industry: 'Kinh doanh / Thương mại điện tử',
    },
    jobs: [
      {
        categorySlug: 'kinh-doanh-ban-hang',
        title: 'Chuyên viên Phát triển Kinh doanh B2B (Sales SME)',
        description: 'Tư vấn giải pháp phần mềm quản lý bán hàng cho khách hàng doanh nghiệp vừa và nhỏ.',
        requirements: 'Kỹ năng giao tiếp tốt, có kinh nghiệm B2B Sales hoặc Telesales là lợi thế.',
        benefits: 'Lương cứng + hoa hồng không giới hạn 10-20%.',
        skills: ['Sales B2B', 'CRM', 'Đàm phán', 'Excel'],
        location: 'Hồ Chí Minh',
        workMode: 'onsite',
        level: 'junior',
        education: 'Cao đẳng / Đại học',
        salaryMin: 11000000,
        salaryMax: 25000000,
        status: JobStatus.Approved,
      },
      {
        categorySlug: 'cong-nghe-thong-tin',
        title: 'Mobile Developer (Flutter / React Native)',
        description: 'Phát triển ứng dụng giao vận và kiểm kho trên iOS/Android.',
        requirements: 'Tối thiểu 1.5 năm kinh nghiệm Flutter hoặc React Native.',
        benefits: 'Thưởng quý, team building hàng năm.',
        skills: ['Flutter', 'React Native', 'TypeScript', 'REST API'],
        location: 'Hồ Chí Minh',
        workMode: 'hybrid',
        level: 'middle',
        education: 'Đại học',
        salaryMin: 18000000,
        salaryMax: 28000000,
        status: JobStatus.Pending,
      },
    ],
  },
  {
    email: 'employer5@jobnet.local',
    fullName: 'Đặng Quốc Bảo',
    phone: '0906555666',
    company: {
      name: 'Hanoi Cyber & DevOps Solutions',
      description: 'Tư vấn hạ tầng Cloud, Kubernetes, giám sát hệ thống và an toàn thông tin.',
      address: 'Hà Nội',
      website: 'https://hanoicyber.example.com',
      size: '20-50 nhân viên',
      industry: 'Công nghệ thông tin',
    },
    jobs: [
      {
        categorySlug: 'cong-nghe-thong-tin',
        title: 'DevOps / Cloud Engineer (Docker / AWS)',
        description: 'Vận hành hệ thống CI/CD, Docker Swarm/Kubernetes và giám sát ELK Stack.',
        requirements: 'Thành thạo Linux, Docker, AWS, có kinh nghiệm CI/CD GitHub Actions.',
        benefits: 'Hỗ trợ chi phí thi chứng chỉ AWS, làm việc linh hoạt.',
        skills: ['Docker', 'AWS', 'Linux', 'Kubernetes', 'Elasticsearch'],
        location: 'Hà Nội',
        workMode: 'hybrid',
        level: 'middle',
        education: 'Đại học',
        salaryMin: 22000000,
        salaryMax: 35000000,
        status: JobStatus.Approved,
      },
      {
        categorySlug: 'cong-nghe-thong-tin',
        title: 'QA / Automation Tester',
        description: 'Viết kịch bản kiểm thử tự động API & Web với Playwright/Jest.',
        requirements: 'Nắm vững quy trình kiểm thử phần mềm, biết TypeScript hoặc Python.',
        benefits: 'Môi trường trẻ trung, đóng BHXH full lương.',
        skills: ['QA', 'Playwright', 'TypeScript', 'API Testing'],
        location: 'Hà Nội',
        workMode: 'onsite',
        level: 'junior',
        education: 'Đại học',
        salaryMin: 12000000,
        salaryMax: 19000000,
        status: JobStatus.Pending,
      },
    ],
  },
];

const EXTRA_CANDIDATES: SeedCandidateSpec[] = [
  {
    email: 'candidate1@jobnet.local',
    fullName: 'Lê Minh Khôi',
    phone: '0913000001',
    avatar: 'avatar/candidate-1.png',
    isVerified: true,
    bio: 'Kỹ sư Backend chuyên sâu Node.js, NestJS và MongoDB với 3 năm kinh nghiệm hệ thống thanh toán.',
    skills: ['TypeScript', 'NestJS', 'MongoDB', 'Redis', 'Docker', 'PostgreSQL'],
    desiredTitle: 'Senior Backend NestJS Developer',
    desiredLevel: 'senior',
    desiredSalaryMin: 28000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Đại học Bách Khoa Hà Nội', major: 'Khoa học máy tính', degree: 'Kỹ sư Đại học', startYear: 2018, endYear: 2022 },
    experience: { position: 'Backend NestJS Developer', company: 'VNPAY Partner Tech', monthsAgoStart: 36, description: 'Xây dựng API thanh toán, tối ưu MongoDB và tích hợp Redis queue.' },
    project: { name: 'Cổng thanh toán SME Gateway', description: 'Xử lý 50k giao dịch/ngày bằng NestJS & MongoDB.', technologies: ['TypeScript', 'NestJS', 'MongoDB', 'Redis'] },
    language: { name: 'Tiếng Anh', level: 'TOEIC 820' },
  },
  {
    email: 'candidate2@jobnet.local',
    fullName: 'Phạm Thảo Vy',
    phone: '0913000002',
    avatar: 'avatar/candidate-2.png',
    isVerified: true,
    bio: 'Frontend Developer tập trung vào React, Next.js, Ant Design và tối ưu trải nghiệm người dùng.',
    skills: ['React', 'Next.js', 'TypeScript', 'Ant Design', 'Redux Toolkit'],
    desiredTitle: 'Frontend Developer (Next.js / React)',
    desiredLevel: 'junior',
    desiredSalaryMin: 15000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Học viện Công nghệ Bưu chính Viễn thông', major: 'Công nghệ thông tin', degree: 'Kỹ sư Đại học', startYear: 2021, endYear: 2025 },
    experience: { position: 'Frontend React Developer', company: 'Sun* Asterisk', monthsAgoStart: 14, monthsAgoEnd: 1, description: 'Phát triển giao diện quản trị Next.js và tích hợp REST API.' },
    project: { name: 'Dashboard Quản lý Nhân sự', description: 'Ứng dụng SPA với Next.js 14 và Ant Design.', technologies: ['React', 'Next.js', 'TypeScript', 'Ant Design'] },
    language: { name: 'Tiếng Anh', level: 'IELTS 6.5' },
  },
  {
    email: 'candidate3@jobnet.local',
    fullName: 'Nguyễn Hoàng Long',
    phone: '0913000003',
    avatar: 'avatar/candidate-3.png',
    isVerified: true,
    bio: 'Lập trình viên Python & AI đam mê xây dựng chatbot LLM, tìm kiếm Elasticsearch và thu thập dữ liệu.',
    skills: ['Python', 'Flask', 'Scrapy', 'MongoDB', 'Elasticsearch', 'Docker'],
    desiredTitle: 'Python AI / Data Engineer',
    desiredLevel: 'middle',
    desiredSalaryMin: 22000000,
    desiredLocation: 'Hồ Chí Minh',
    education: { school: 'Đại học Công nghệ Thông tin – ĐHQG TP.HCM', major: 'Khoa học dữ liệu', degree: 'Cử nhân Đại học', startYear: 2020, endYear: 2024 },
    experience: { position: 'Python AI Engineer', company: 'Tiki AI Lab', monthsAgoStart: 24, description: 'Phát triển chatbot tìm kiếm sản phẩm với Flask, Elasticsearch và LLM.' },
    project: { name: 'Trợ lý tìm việc JobNet Bot', description: 'Chatbot trích xuất filter bằng rule + LLaMA 3.3.', technologies: ['Python', 'Flask', 'MongoDB', 'Elasticsearch'] },
    language: { name: 'Tiếng Anh', level: 'IELTS 7.0' },
  },
  {
    email: 'candidate4@jobnet.local',
    fullName: 'Trần Ngọc Hân',
    phone: '0913000004',
    avatar: 'avatar/candidate-4.png',
    isVerified: true,
    bio: 'UI/UX Designer có tư duy sản phẩm tốt, am hiểu Design System và nghiên cứu hành vi người dùng.',
    skills: ['Figma', 'UI/UX', 'Design System', 'Prototype', 'Adobe XD'],
    desiredTitle: 'UI/UX Designer',
    desiredLevel: 'junior',
    desiredSalaryMin: 15000000,
    desiredLocation: 'Hồ Chí Minh',
    education: { school: 'Đại học Kiến trúc TP.HCM', major: 'Thiết kế đồ họa', degree: 'Cử nhân', startYear: 2020, endYear: 2024 },
    experience: { position: 'UI/UX Designer', company: 'Haravan Studio', monthsAgoStart: 15, description: 'Thiết kế giao diện Web/Mobile cho hệ thống bán hàng SME.' },
    project: { name: 'App Đặt Lịch Khám Bệnh', description: 'Design system 80+ components trên Figma.', technologies: ['Figma', 'UI/UX', 'Prototype'] },
    language: { name: 'Tiếng Anh', level: 'Giao tiếp tốt' },
  },
  {
    email: 'candidate5@jobnet.local',
    fullName: 'Đỗ Đức Thịnh',
    phone: '0913000005',
    avatar: 'avatar/candidate-5.png',
    isVerified: true,
    bio: 'Backend Java Developer có 2.5 năm kinh nghiệm với Spring Boot, microservices và PostgreSQL.',
    skills: ['Java', 'Spring', 'PostgreSQL', 'Docker', 'Redis'],
    desiredTitle: 'Java Spring Boot Developer',
    desiredLevel: 'middle',
    desiredSalaryMin: 24000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Đại học Công nghệ – ĐHQGHN', major: 'Kỹ thuật phần mềm', degree: 'Kỹ sư Đại học', startYear: 2019, endYear: 2023 },
    experience: { position: 'Java Backend Developer', company: 'FPT Software', monthsAgoStart: 30, description: 'Phát triển hệ thống ngân hàng lõi bằng Spring Boot & PostgreSQL.' },
    project: { name: 'Hệ thống Đối soát Giao dịch', description: 'Microservice Java Spring + Docker.', technologies: ['Java', 'Spring', 'PostgreSQL', 'Docker'] },
    language: { name: 'Tiếng Nhật', level: 'N3' },
  },
  {
    email: 'candidate6@jobnet.local',
    fullName: 'Bùi Phương Linh',
    phone: '0913000006',
    avatar: 'avatar/candidate-6.png',
    isVerified: true,
    bio: 'Chuyên viên Digital Marketing & SEO có kinh nghiệm quản trị nội dung và tối ưu quảng cáo.',
    skills: ['Marketing', 'SEO', 'Google Analytics', 'Content', 'Facebook Ads'],
    desiredTitle: 'Chuyên viên Digital Marketing & SEO',
    desiredLevel: 'junior',
    desiredSalaryMin: 13000000,
    desiredLocation: 'Hồ Chí Minh',
    education: { school: 'Đại học Kinh tế TP.HCM', major: 'Marketing', degree: 'Cử nhân Đại học', startYear: 2020, endYear: 2024 },
    experience: { position: 'Marketing Executive', company: 'Momo Digital Agency', monthsAgoStart: 16, description: 'Triển khai chiến dịch SEO tăng 180% organic traffic.' },
    project: { name: 'Chiến dịch SEO SME 2025', description: 'Top 3 Google hơn 40 từ khóa ngành phần mềm.', technologies: ['SEO', 'Google Analytics', 'Marketing'] },
    language: { name: 'Tiếng Anh', level: 'TOEIC 780' },
  },
  {
    email: 'candidate7@jobnet.local',
    fullName: 'Hoàng Gia Huy',
    phone: '0913000007',
    avatar: 'avatar/candidate-7.png',
    isVerified: true,
    bio: 'DevOps Engineer chuyên tự động hóa CI/CD, Docker, AWS và giám sát hệ thống ELK Stack.',
    skills: ['Docker', 'AWS', 'Linux', 'Kubernetes', 'Elasticsearch'],
    desiredTitle: 'DevOps / Cloud Engineer',
    desiredLevel: 'middle',
    desiredSalaryMin: 25000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Học viện Kỹ thuật Mật mã', major: 'An toàn thông tin', degree: 'Kỹ sư Đại học', startYear: 2019, endYear: 2024 },
    experience: { position: 'DevOps Engineer', company: 'Viettel Cloud', monthsAgoStart: 22, description: 'Quản trị cluster Kubernetes, Elasticsearch và GitHub Actions.' },
    project: { name: 'Tự động hóa Deploy Microservices', description: 'Zero-downtime deployment trên AWS EKS.', technologies: ['Docker', 'AWS', 'Kubernetes', 'Elasticsearch'] },
    course: { name: 'AWS Certified Solutions Architect', organization: 'Amazon Web Services' },
  },
  {
    email: 'candidate8@jobnet.local',
    fullName: 'Ngô Minh Tuấn',
    phone: '0913000008',
    isVerified: true,
    bio: 'Sinh viên năm cuối PTIT định hướng Fullstack TypeScript (Next.js + NestJS), học hỏi nhanh.',
    skills: ['TypeScript', 'React', 'Next.js', 'NestJS', 'MongoDB'],
    desiredTitle: 'Thực tập sinh Fullstack TypeScript',
    desiredLevel: 'intern',
    desiredSalaryMin: 5000000,
    desiredLocation: 'Đà Nẵng',
    education: { school: 'Đại học Bách Khoa Đà Nẵng', major: 'Công nghệ thông tin', degree: 'Kỹ sư', startYear: 2022, endYear: 2026 },
    project: { name: 'Website Quản lý Thư viện', description: 'Fullstack TypeScript với NestJS và Next.js.', technologies: ['TypeScript', 'React', 'NestJS', 'MongoDB'] },
    language: { name: 'Tiếng Anh', level: 'TOEIC 650' },
  },
  {
    email: 'candidate9@jobnet.local',
    fullName: 'Võ Thanh Tùng',
    phone: '0913000009',
    avatar: 'avatar/candidate-9.png',
    isVerified: true,
    bio: 'Mobile Developer với 2 năm phát triển ứng dụng Flutter & React Native cho mảng logistics.',
    skills: ['Flutter', 'React Native', 'TypeScript', 'REST API', 'Firebase'],
    desiredTitle: 'Mobile Developer (Flutter / React Native)',
    desiredLevel: 'middle',
    desiredSalaryMin: 20000000,
    desiredLocation: 'Hồ Chí Minh',
    education: { school: 'Đại học Khoa học Tự nhiên TP.HCM', major: 'Kỹ thuật phần mềm', degree: 'Cử nhân Đại học', startYear: 2019, endYear: 2023 },
    experience: { position: 'Flutter Developer', company: 'Giao Hàng Nhanh Tech', monthsAgoStart: 24, description: 'Phát triển app tài xế và đồng bộ vị trí thời gian thực.' },
    project: { name: 'App Quản lý Đơn Hàng SME', description: 'Cross-platform Flutter kết nối REST API.', technologies: ['Flutter', 'REST API', 'Firebase'] },
  },
  {
    email: 'candidate10@jobnet.local',
    fullName: 'Đinh Thị Hồng Nhung',
    phone: '0913000010',
    avatar: 'avatar/candidate-10.png',
    isVerified: true,
    bio: 'Chuyên viên Sales B2B có kỹ năng đàm phán và phát triển khách hàng doanh nghiệp SME.',
    skills: ['Sales B2B', 'CRM', 'Đàm phán', 'Excel', 'Telesales'],
    desiredTitle: 'Chuyên viên Phát triển Kinh doanh B2B',
    desiredLevel: 'junior',
    desiredSalaryMin: 12000000,
    desiredLocation: 'Hồ Chí Minh',
    education: { school: 'Đại học Ngoại thương Cơ sở II', major: 'Kinh tế đối ngoại', degree: 'Cử nhân', startYear: 2020, endYear: 2024 },
    experience: { position: 'B2B Sales Executive', company: 'KiotViet', monthsAgoStart: 14, description: 'Tư vấn phần mềm bán hàng cho hơn 120 cửa hàng & doanh nghiệp SME.' },
    language: { name: 'Tiếng Anh', level: 'TOEIC 720' },
  },
  {
    email: 'candidate11@jobnet.local',
    fullName: 'Nguyễn Bảo Khánh',
    phone: '0913000011',
    isVerified: true,
    bio: 'QA Automation Tester thành thạo Playwright, API Testing và kiểm thử hiệu năng.',
    skills: ['QA', 'Playwright', 'TypeScript', 'API Testing', 'Postman'],
    desiredTitle: 'QA / Automation Tester',
    desiredLevel: 'junior',
    desiredSalaryMin: 14000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Đại học Kinh tế Quốc dân', major: 'Hệ thống thông tin quản lý', degree: 'Cử nhân Đại học', startYear: 2020, endYear: 2024 },
    experience: { position: 'QA Tester', company: 'MISA JSC', monthsAgoStart: 12, description: 'Viết test case và script Playwright cho sản phẩm kế toán web.' },
    project: { name: 'Bộ test E2E Thương mại điện tử', description: '80+ kịch bản tự động trên Playwright.', technologies: ['Playwright', 'TypeScript', 'QA'] },
  },
  {
    email: 'candidate12@jobnet.local',
    fullName: 'Trương Quang Vinh',
    phone: '0913000012',
    avatar: 'avatar/candidate-12.png',
    isVerified: false,
    bio: 'Backend Developer yêu thích NestJS, TypeScript và xây dựng API chuẩn Swagger.',
    skills: ['TypeScript', 'NestJS', 'MongoDB', 'NodeJS'],
    desiredTitle: 'Backend Developer (NestJS)',
    desiredLevel: 'junior',
    desiredSalaryMin: 16000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Đại học Giao thông Vận tải', major: 'Công nghệ thông tin', degree: 'Kỹ sư Đại học', startYear: 2020, endYear: 2024 },
    experience: { position: 'Node.js Developer', company: 'Rikkeisoft', monthsAgoStart: 13, description: 'Phát triển backend NestJS cho dự án tuyển dụng và thương mại điện tử.' },
    project: { name: 'API Quản lý Kho hàng', description: 'NestJS + Mongoose + JWT Auth.', technologies: ['TypeScript', 'NestJS', 'MongoDB'] },
  },
  {
    email: 'candidate13@jobnet.local',
    fullName: 'Phan Thị Thu Hà',
    phone: '0913000013',
    isVerified: true,
    bio: 'Data Analyst thành thạo Python, SQL, PowerBI và phân tích xu hướng thị trường lao động.',
    skills: ['Python', 'SQL', 'Excel', 'PowerBI', 'MongoDB'],
    desiredTitle: 'Data Analyst / Business Intelligence',
    desiredLevel: 'junior',
    desiredSalaryMin: 14000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Học viện Tài chính', major: 'Tin học tài chính', degree: 'Cử nhân', startYear: 2020, endYear: 2024 },
    experience: { position: 'Junior Data Analyst', company: 'Base.vn', monthsAgoStart: 11, description: 'Xây dựng dashboard phân tích hành vi khách hàng và doanh thu.' },
    project: { name: 'Phân tích Lương Thị trường IT', description: 'Tổng hợp trung bình, trung vị từ dữ liệu Scrapy.', technologies: ['Python', 'MongoDB', 'PowerBI'] },
  },
  {
    email: 'candidate14@jobnet.local',
    fullName: 'Lý Quốc Đạt',
    phone: '0913000014',
    avatar: 'avatar/candidate-14.png',
    isVerified: true,
    bio: 'Fullstack Developer làm việc tốt cả Next.js frontend lẫn NestJS backend, sẵn sàng làm remote.',
    skills: ['TypeScript', 'Next.js', 'React', 'NestJS', 'MongoDB', 'Docker'],
    desiredTitle: 'Fullstack TypeScript Developer',
    desiredLevel: 'middle',
    desiredSalaryMin: 22000000,
    desiredLocation: 'Đà Nẵng',
    education: { school: 'Đại học Sư phạm Kỹ thuật TP.HCM', major: 'Công nghệ thông tin', degree: 'Kỹ sư Đại học', startYear: 2019, endYear: 2023 },
    experience: { position: 'Fullstack Developer', company: 'Enouvo IT Solutions', monthsAgoStart: 26, description: 'Xây dựng nền tảng SaaS với Next.js, Ant Design và NestJS.' },
    project: { name: 'Hệ thống Quản lý Phòng khám', description: 'Đặt lịch, xuất hóa đơn PDF và báo cáo.', technologies: ['Next.js', 'NestJS', 'TypeScript', 'Docker'] },
  },
  {
    email: 'candidate15@jobnet.local',
    fullName: 'Nguyễn Minh Châu',
    phone: '0913000015',
    isVerified: true,
    bio: 'Content Creator & SEO Copywriter có kinh nghiệm viết bài chuẩn SEO cho website công nghệ.',
    skills: ['Content', 'SEO', 'Marketing', 'Canva'],
    desiredTitle: 'Content Marketing / SEO Specialist',
    desiredLevel: 'junior',
    desiredSalaryMin: 10000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Học viện Báo chí và Tuyên truyền', major: 'Truyền thông đại chúng', degree: 'Cử nhân', startYear: 2020, endYear: 2024 },
    experience: { position: 'Content Executive', company: 'Sapoweb', monthsAgoStart: 10, description: 'Viết bài blog SEO và quản lý fanpage B2B.' },
  },
  {
    email: 'candidate16@jobnet.local',
    fullName: 'Cao Đức Mạnh',
    phone: '0913000016',
    isVerified: false,
    bio: 'PHP / Laravel Developer với 2 năm kinh nghiệm xây dựng website doanh nghiệp và API.',
    skills: ['PHP', 'Laravel', 'MySQL', 'Docker', 'JavaScript'],
    desiredTitle: 'PHP Laravel Developer',
    desiredLevel: 'middle',
    desiredSalaryMin: 18000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Đại học Mỏ – Địa chất', major: 'Công nghệ thông tin', degree: 'Kỹ sư', startYear: 2019, endYear: 2023 },
    experience: { position: 'PHP Developer', company: 'Bizfly Tech', monthsAgoStart: 22, description: 'Bảo trì hệ thống CRM trên Laravel và MySQL.' },
  },
  {
    email: 'candidate17@jobnet.local',
    fullName: 'Tạ Ngọc Bích',
    phone: '0913000017',
    avatar: 'avatar/candidate-17.png',
    isVerified: true,
    bio: 'Product Owner / Business Analyst kết nối đội kỹ thuật và nhu cầu doanh nghiệp SME.',
    skills: ['Business Analysis', 'Figma', 'SQL', 'Agile', 'Scrum'],
    desiredTitle: 'IT Business Analyst',
    desiredLevel: 'middle',
    desiredSalaryMin: 20000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Đại học Ngoại thương', major: 'Thương mại điện tử', degree: 'Cử nhân Đại học', startYear: 2019, endYear: 2023 },
    experience: { position: 'Business Analyst', company: 'CMC Global', monthsAgoStart: 24, description: 'Viết SRS, thiết kế wireframe Figma và phối hợp dev/QA.' },
  },
  {
    email: 'candidate18@jobnet.local',
    fullName: 'Huỳnh Tấn Phát',
    phone: '0913000018',
    isVerified: true,
    bio: 'Sinh viên năm 3 CNTT mong muốn tìm vị trí thực tập Backend hoặc Python AI.',
    skills: ['Python', 'Flask', 'MongoDB', 'Git'],
    desiredTitle: 'Thực tập sinh Python / Backend',
    desiredLevel: 'intern',
    desiredSalaryMin: 4500000,
    desiredLocation: 'Hồ Chí Minh',
    education: { school: 'Đại học Tôn Đức Thắng', major: 'Khoa học máy tính', degree: 'Cử nhân', startYear: 2023, endYear: 2027 },
    project: { name: 'Scraper Tin Tuyển Dụng', description: 'Thu thập dữ liệu công khai bằng Python Scrapy.', technologies: ['Python', 'Scrapy', 'MongoDB'] },
  },
  {
    email: 'candidate19@jobnet.local',
    fullName: 'Dương Hải Yến',
    phone: '0913000019',
    isVerified: true,
    bio: 'Nhân viên Chăm sóc khách hàng & Telesales B2B giàu kinh nghiệm hỗ trợ khách hàng SME.',
    skills: ['Sales B2B', 'Telesales', 'CRM', 'Giao tiếp'],
    desiredTitle: 'Chuyên viên Tư vấn Khách hàng B2B',
    desiredLevel: 'junior',
    desiredSalaryMin: 11000000,
    desiredLocation: 'Hà Nội',
    education: { school: 'Đại học Thương mại', major: 'Quản trị kinh doanh', degree: 'Cử nhân', startYear: 2020, endYear: 2024 },
    experience: { position: 'Customer Success', company: 'Nhanh.vn', monthsAgoStart: 15, description: 'Onboarding và hỗ trợ hơn 200 shop sử dụng phần mềm.' },
  },
  {
    email: 'candidate20@jobnet.local',
    fullName: 'Nguyễn Trọng Nghĩa',
    phone: '0913000020',
    avatar: 'avatar/candidate-20.png',
    isVerified: true,
    bio: 'Senior Frontend Architect chuyên React, Next.js SSR, tối ưu Core Web Vitals và TypeScript.',
    skills: ['TypeScript', 'React', 'Next.js', 'Ant Design', 'Elasticsearch'],
    desiredTitle: 'Senior Frontend Developer (Next.js)',
    desiredLevel: 'senior',
    desiredSalaryMin: 30000000,
    desiredLocation: 'Hồ Chí Minh',
    education: { school: 'Đại học Bách Khoa TP.HCM', major: 'Khoa học máy tính', degree: 'Kỹ sư Đại học', startYear: 2017, endYear: 2021 },
    experience: { position: 'Senior Frontend Engineer', company: 'VNG Corporation', monthsAgoStart: 42, description: 'Xây dựng hệ thống Next.js SSR tối ưu SEO cho trang tuyển dụng.' },
    project: { name: 'Job Portal Design System', description: 'Thư viện UI React + TypeScript.', technologies: ['React', 'Next.js', 'TypeScript', 'Ant Design'] },
    language: { name: 'Tiếng Anh', level: 'IELTS 7.0' },
  },
];

async function seed() {
  loadEnvFile();
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://admin:change_me@localhost:27017/jobnet?authSource=admin';

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for seeding...');

  const UserModel = mongoose.model(User.name, UserSchema);
  const CategoryModel = mongoose.model(Category.name, CategorySchema);
  const CompanyModel = mongoose.model(Company.name, CompanySchema);
  const JobModel = mongoose.model(Job.name, JobSchema);
  const PackageModel = mongoose.model(PremiumPackage.name, PremiumPackageSchema);
  const RecruiterPremiumModel = mongoose.model(RecruiterPremium.name, RecruiterPremiumSchema);
  const EducationModel = mongoose.model(Education.name, EducationSchema);
  const WorkExperienceModel = mongoose.model(WorkExperience.name, WorkExperienceSchema);
  const ProjectModel = mongoose.model(Project.name, ProjectSchema);
  const LanguageModel = mongoose.model(Language.name, LanguageSchema);
  const CourseModel = mongoose.model(Course.name, CourseSchema);
  const ApplicationModel = mongoose.model(Application.name, ApplicationSchema);
  const JobLikeModel = mongoose.model(JobLike.name, JobLikeSchema);
  const CompanyFollowModel = mongoose.model(CompanyFollow.name, CompanyFollowSchema);

  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // 1. Tài khoản gốc (Admin, Employer chính, Candidate chính)
  const adminUser = await UserModel.findOneAndUpdate(
    { email: 'admin@jobnet.local' },
    {
      $setOnInsert: {
        email: 'admin@jobnet.local',
        password: defaultPasswordHash,
        role: Role.Admin,
        fullName: 'Quản trị viên JobNet',
        isActive: true,
        isVerified: true,
      },
    },
    { upsert: true, new: true },
  );

  const employerUser = await UserModel.findOneAndUpdate(
    { email: 'employer@jobnet.local' },
    {
      $setOnInsert: {
        email: 'employer@jobnet.local',
        password: defaultPasswordHash,
        role: Role.Employer,
        fullName: 'Nguyễn Mạnh Tuấn (NTD)',
        phone: '0901234567',
        isActive: true,
        isVerified: true,
      },
    },
    { upsert: true, new: true },
  );

  const candidateUser = await UserModel.findOneAndUpdate(
    { email: 'candidate@jobnet.local' },
    {
      $setOnInsert: {
        email: 'candidate@jobnet.local',
        password: defaultPasswordHash,
        role: Role.Candidate,
        fullName: 'Nguyễn Duy Hà (Ứng viên)',
        phone: '0912345678',
        bio: 'Sinh viên năm cuối CNTT đam mê xây dựng hệ thống Web, Backend NestJS và ứng dụng AI.',
        skills: ['TypeScript', 'NestJS', 'React', 'Next.js', 'MongoDB', 'Python'],
        desiredTitle: 'Backend / Fullstack Developer',
        desiredLevel: 'junior',
        desiredSalaryMin: 15000000,
        desiredLocation: 'Hà Nội',
        cvTemplate: 'modern',
        isActive: true,
        isVerified: true,
      },
    },
    { upsert: true, new: true },
  );

  // 2. Danh mục việc làm
  const categoriesData = [
    {
      name: 'Công nghệ thông tin',
      slug: 'cong-nghe-thong-tin',
      description: 'Lập trình phần mềm, AI, dữ liệu và hạ tầng mạng',
    },
    {
      name: 'Marketing & Truyền thông',
      slug: 'marketing-truyen-thong',
      description: 'Digital Marketing, Content, SEO và truyền thông thương hiệu',
    },
    {
      name: 'Kinh doanh / Bán hàng',
      slug: 'kinh-doanh-ban-hang',
      description: 'Phát triển thị trường, tư vấn giải pháp và chăm sóc khách hàng',
    },
    {
      name: 'Thiết kế UI/UX',
      slug: 'thiet-ke-ui-ux',
      description: 'Thiết kế giao diện sản phẩm số, trải nghiệm người dùng',
    },
  ];

  const categoryMap = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of categoriesData) {
    const doc = await CategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true, new: true },
    );
    categoryMap.set(doc.slug, doc._id);
  }
  const itCategoryId = categoryMap.get('cong-nghe-thong-tin')!;

  // 3. Gói dịch vụ Premium
  const packagesData = [
    {
      name: 'Gói Cơ Bản SME',
      price: 299000,
      durationDays: 30,
      postLimit: 5,
      features: ['Đăng tối đa 5 tin/tháng', 'Hiển thị nhãn Xác thực SME'],
    },
    {
      name: 'Gói Tăng Tốc Tuyển Dụng',
      price: 699000,
      durationDays: 30,
      postLimit: 15,
      features: ['Đăng tối đa 15 tin/tháng', 'Mở khóa Gợi ý ứng viên thông minh'],
    },
    {
      name: 'Gói Doanh Nghiệp Pro',
      price: 1499000,
      durationDays: 90,
      postLimit: 50,
      features: ['Đăng tối đa 50 tin trong 90 ngày', 'Ưu tiên hiển thị & Gợi ý ứng viên AI'],
    },
  ];

  const seededPackages: Array<{ _id: mongoose.Types.ObjectId; durationDays: number; postLimit: number }> = [];
  for (const pkg of packagesData) {
    const doc = await PackageModel.findOneAndUpdate(
      { name: pkg.name },
      { $setOnInsert: pkg },
      { upsert: true, new: true },
    );
    seededPackages.push({
      _id: doc._id,
      durationDays: doc.durationDays || 30,
      postLimit: doc.postLimit || 15,
    });
  }
  const growthPackage = seededPackages[1] || seededPackages[0];

  // 4. Công ty & tin tuyển dụng của employer mặc định
  const mainCompany = await CompanyModel.findOneAndUpdate(
    { user: employerUser._id },
    {
      $setOnInsert: {
        user: employerUser._id,
        name: 'Công ty TNHH Giải pháp Số SME Việt',
        description: 'Doanh nghiệp SME xây dựng các nền tảng web, thương mại điện tử và AI.',
        address: 'Hà Nội',
        website: 'https://smeviet.example.com',
        size: '20-50 nhân viên',
        industry: 'Công nghệ thông tin',
      },
    },
    { upsert: true, new: true },
  );

  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const mainJobs = [
    {
      company: mainCompany._id,
      category: itCategoryId,
      title: 'Backend Developer (NestJS / TypeScript)',
      description: 'Phát triển REST API cho nền tảng tuyển dụng JobNet với NestJS và MongoDB.',
      benefits: 'Thưởng dự án, làm việc linh hoạt hybrid, hỗ trợ ăn trưa.',
      requirements: 'Thành thạo TypeScript, NestJS, MongoDB, nắm vững RESTful API.',
      skills: ['TypeScript', 'NestJS', 'MongoDB', 'Docker'],
      location: 'Hà Nội',
      workMode: 'hybrid',
      level: 'junior',
      education: 'Đại học',
      salaryMin: 15000000,
      salaryMax: 25000000,
      deadline,
      status: JobStatus.Approved,
    },
    {
      company: mainCompany._id,
      category: itCategoryId,
      title: 'Frontend Developer (Next.js / React)',
      description: 'Xây dựng giao diện web tương tác với Next.js, Ant Design và TanStack Query.',
      benefits: 'Review lương 2 lần/năm, bảo hiểm đầy đủ.',
      requirements: 'Kinh nghiệm React/Next.js từ 1 năm, biết TypeScript và Redux Toolkit.',
      skills: ['React', 'Next.js', 'TypeScript', 'Ant Design'],
      location: 'Hà Nội',
      workMode: 'onsite',
      level: 'junior',
      education: 'Cao đẳng / Đại học',
      salaryMin: 14000000,
      salaryMax: 22000000,
      deadline,
      status: JobStatus.Approved,
    },
    {
      company: mainCompany._id,
      category: itCategoryId,
      title: 'Python AI / Data Engineer (Chờ duyệt)',
      description: 'Phát triển chatbot tìm việc với Groq LLM và hệ thống crawler Scrapy.',
      benefits: 'Môi trường R&D cởi mở, tài trợ khóa học.',
      requirements: 'Thành thạo Python, Flask/Scrapy, làm việc được với MongoDB.',
      skills: ['Python', 'Flask', 'Scrapy', 'MongoDB'],
      location: 'Hồ Chí Minh',
      workMode: 'remote',
      level: 'middle',
      education: 'Đại học',
      salaryMin: 20000000,
      salaryMax: 32000000,
      deadline,
      status: JobStatus.Pending,
    },
  ];

  const allSeededJobs: Array<{ _id: mongoose.Types.ObjectId; status: string; company: mongoose.Types.ObjectId }> = [];
  for (const job of mainJobs) {
    const doc = await JobModel.findOneAndUpdate(
      { company: job.company, title: job.title },
      { $setOnInsert: job },
      { upsert: true, new: true },
    );
    allSeededJobs.push({ _id: doc._id, status: doc.status, company: doc.company });
  }

  // Kích hoạt gói Premium cho employer chính để test gợi ý ứng viên ngay
  await RecruiterPremiumModel.findOneAndUpdate(
    { paymentRef: 'SEED-PREMIUM-MAIN' },
    {
      $setOnInsert: {
        company: mainCompany._id,
        package: growthPackage._id,
        startAt: new Date(),
        endAt: new Date(Date.now() + growthPackage.durationDays * 86400000),
        remainingPosts: growthPackage.postLimit,
        paymentRef: 'SEED-PREMIUM-MAIN',
        paymentStatus: 'success',
      },
    },
    { upsert: true, new: true },
  );

  // 5. Thêm 5 Nhà tuyển dụng mẫu (employer1 -> employer5) + Công ty + Tin tuyển dụng
  const allCompanies: mongoose.Types.ObjectId[] = [mainCompany._id];
  for (let idx = 0; idx < EXTRA_EMPLOYERS.length; idx += 1) {
    const spec = EXTRA_EMPLOYERS[idx];
    const empUser = await UserModel.findOneAndUpdate(
      { email: spec.email },
      {
        $setOnInsert: {
          email: spec.email,
          password: defaultPasswordHash,
          role: Role.Employer,
          fullName: spec.fullName,
          phone: spec.phone,
          isActive: true,
          isVerified: true,
        },
      },
      { upsert: true, new: true },
    );

    const compDoc = await CompanyModel.findOneAndUpdate(
      { user: empUser._id },
      { $setOnInsert: { user: empUser._id, ...spec.company } },
      { upsert: true, new: true },
    );
    allCompanies.push(compDoc._id);

    if (spec.hasPremium) {
      const ref = `SEED-PREMIUM-EMP-${idx + 1}`;
      await RecruiterPremiumModel.findOneAndUpdate(
        { paymentRef: ref },
        {
          $setOnInsert: {
            company: compDoc._id,
            package: growthPackage._id,
            startAt: new Date(),
            endAt: new Date(Date.now() + growthPackage.durationDays * 86400000),
            remainingPosts: growthPackage.postLimit,
            paymentRef: ref,
            paymentStatus: 'success',
          },
        },
        { upsert: true, new: true },
      );
    }

    for (const j of spec.jobs) {
      const jobDoc = await JobModel.findOneAndUpdate(
        { company: compDoc._id, title: j.title },
        {
          $setOnInsert: {
            company: compDoc._id,
            category: categoryMap.get(j.categorySlug) || itCategoryId,
            title: j.title,
            description: j.description,
            requirements: j.requirements,
            benefits: j.benefits,
            skills: j.skills,
            location: j.location,
            workMode: j.workMode,
            level: j.level,
            education: j.education,
            salaryMin: j.salaryMin,
            salaryMax: j.salaryMax,
            deadline,
            status: j.status,
          },
        },
        { upsert: true, new: true },
      );
      allSeededJobs.push({ _id: jobDoc._id, status: jobDoc.status, company: jobDoc.company });
    }
  }

  // 6. Hồ sơ CV mẫu cho candidate chính
  await EducationModel.findOneAndUpdate(
    { user: candidateUser._id, school: 'Học viện Công nghệ Bưu chính Viễn thông' },
    {
      $setOnInsert: {
        user: candidateUser._id,
        school: 'Học viện Công nghệ Bưu chính Viễn thông',
        major: 'Công nghệ thông tin',
        degree: 'Kỹ sư',
        startDate: new Date('2022-09-01'),
        endDate: new Date('2026-06-30'),
      },
    },
    { upsert: true, new: true },
  );
  await WorkExperienceModel.findOneAndUpdate(
    { user: candidateUser._id, position: 'Backend Developer Intern' },
    {
      $setOnInsert: {
        user: candidateUser._id,
        position: 'Backend Developer Intern',
        company: 'Công ty Công nghệ PTIT Tech',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-09-30'),
        description: 'Phát triển REST API bằng NestJS, TypeScript và MongoDB.',
      },
    },
    { upsert: true, new: true },
  );
  await ProjectModel.findOneAndUpdate(
    { user: candidateUser._id, name: 'JobNet – Hệ thống hỗ trợ tìm kiếm việc làm' },
    {
      $setOnInsert: {
        user: candidateUser._id,
        name: 'JobNet – Hệ thống hỗ trợ tìm kiếm việc làm',
        description: 'Nền tảng tuyển dụng SME tích hợp Elasticsearch, Chatbot Groq và Scrapy.',
        technologies: ['NestJS', 'Next.js', 'MongoDB', 'Elasticsearch', 'Flask'],
      },
    },
    { upsert: true, new: true },
  );

  // Dọn các giá trị avatar giả chưa có file thật từ các lần seed trước
  await UserModel.updateMany(
    { avatar: { $regex: '^avatar/candidate-' } },
    { $unset: { avatar: 1 } },
  );

  // 7. Thêm 20 Ứng viên mẫu (candidate1 -> candidate20) kèm Education, Experience, Project, Language
  const approvedJobs = allSeededJobs.filter((j) => j.status === JobStatus.Approved);
  const seededCandidates: mongoose.Types.ObjectId[] = [candidateUser._id];

  for (let i = 0; i < EXTRA_CANDIDATES.length; i += 1) {
    const spec = EXTRA_CANDIDATES[i];
    const candDoc = await UserModel.findOneAndUpdate(
      { email: spec.email },
      {
        $setOnInsert: {
          email: spec.email,
          password: defaultPasswordHash,
          role: Role.Candidate,
          fullName: spec.fullName,
          phone: spec.phone,
          bio: spec.bio,
          skills: spec.skills,
          desiredTitle: spec.desiredTitle,
          desiredLevel: spec.desiredLevel,
          desiredSalaryMin: spec.desiredSalaryMin,
          desiredLocation: spec.desiredLocation,
          cvTemplate: i % 3 === 0 ? 'modern' : i % 3 === 1 ? 'classic' : 'minimal',
          isActive: true,
          isVerified: spec.isVerified,
        },
      },
      { upsert: true, new: true },
    );
    seededCandidates.push(candDoc._id);

    await EducationModel.findOneAndUpdate(
      { user: candDoc._id, school: spec.education.school },
      {
        $setOnInsert: {
          user: candDoc._id,
          school: spec.education.school,
          major: spec.education.major,
          degree: spec.education.degree,
          startDate: new Date(`${spec.education.startYear}-09-01`),
          endDate: new Date(`${spec.education.endYear}-06-30`),
        },
      },
      { upsert: true, new: true },
    );

    if (spec.experience) {
      const start = new Date(Date.now() - spec.experience.monthsAgoStart * 30 * 86400000);
      const end = spec.experience.monthsAgoEnd
        ? new Date(Date.now() - spec.experience.monthsAgoEnd * 30 * 86400000)
        : undefined;
      await WorkExperienceModel.findOneAndUpdate(
        { user: candDoc._id, position: spec.experience.position },
        {
          $setOnInsert: {
            user: candDoc._id,
            position: spec.experience.position,
            company: spec.experience.company,
            startDate: start,
            ...(end ? { endDate: end } : {}),
            description: spec.experience.description,
          },
        },
        { upsert: true, new: true },
      );
    }

    if (spec.project) {
      await ProjectModel.findOneAndUpdate(
        { user: candDoc._id, name: spec.project.name },
        {
          $setOnInsert: {
            user: candDoc._id,
            name: spec.project.name,
            description: spec.project.description,
            technologies: spec.project.technologies,
          },
        },
        { upsert: true, new: true },
      );
    }

    if (spec.language) {
      await LanguageModel.findOneAndUpdate(
        { user: candDoc._id, name: spec.language.name },
        { $setOnInsert: { user: candDoc._id, ...spec.language } },
        { upsert: true, new: true },
      );
    }

    if (spec.course) {
      await CourseModel.findOneAndUpdate(
        { user: candDoc._id, name: spec.course.name },
        {
          $setOnInsert: {
            user: candDoc._id,
            name: spec.course.name,
            organization: spec.course.organization,
            date: new Date('2025-03-15'),
          },
        },
        { upsert: true, new: true },
      );
    }

    // Tạo tương tác mẫu: ứng tuyển, lưu tin, theo dõi công ty
    if (approvedJobs.length > 0) {
      const targetJob = approvedJobs[i % approvedJobs.length];
      const statuses = [
        ApplicationStatus.Applied,
        ApplicationStatus.Contacted,
        ApplicationStatus.Interview,
        ApplicationStatus.Hired,
      ];
      await ApplicationModel.findOneAndUpdate(
        { job: targetJob._id, user: candDoc._id },
        {
          $setOnInsert: {
            job: targetJob._id,
            user: candDoc._id,
            coverLetter: `Xin chào quý công ty, tôi rất quan tâm tới vị trí này và mong muốn được đóng góp.`,
            status: statuses[i % statuses.length],
            appliedAt: new Date(Date.now() - (i + 1) * 86400000),
          },
        },
        { upsert: true, new: true },
      );

      const savedJob = approvedJobs[(i + 2) % approvedJobs.length];
      await JobLikeModel.findOneAndUpdate(
        { user: candDoc._id, job: savedJob._id },
        { $setOnInsert: { user: candDoc._id, job: savedJob._id } },
        { upsert: true, new: true },
      );
    }

    if (allCompanies.length > 0) {
      const targetCompany = allCompanies[i % allCompanies.length];
      await CompanyFollowModel.findOneAndUpdate(
        { user: candDoc._id, company: targetCompany },
        { $setOnInsert: { user: candDoc._id, company: targetCompany } },
        { upsert: true, new: true },
      );
    }
  }

  console.log('Seed completed:', {
    admin: adminUser.email,
    employers: 1 + EXTRA_EMPLOYERS.length,
    companies: allCompanies.length,
    jobs: allSeededJobs.length,
    candidates: seededCandidates.length,
    categories: categoryMap.size,
    packages: seededPackages.length,
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
