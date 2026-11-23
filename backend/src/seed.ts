import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { JobStatus } from './common/enums/job-status.enum';
import { Role } from './common/enums/role.enum';
import { Category, CategorySchema } from './modules/categories/schemas/categories.schema';
import { Company, CompanySchema } from './modules/companies/schemas/companies.schema';
import { Job, JobSchema } from './modules/jobs/schemas/jobs.schema';
import {
  PremiumPackage,
  PremiumPackageSchema,
} from './modules/premium-packages/schemas/premium-packages.schema';
import { User, UserSchema } from './modules/users/schemas/users.schema';

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
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

  const defaultPasswordHash = await bcrypt.hash('123456', 10);

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
        isActive: true,
        isVerified: true,
      },
    },
    { upsert: true, new: true },
  );

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

  const categories: Array<{ _id: mongoose.Types.ObjectId; slug: string }> = [];
  for (const cat of categoriesData) {
    const doc = await CategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true, new: true },
    );
    categories.push({ _id: doc._id, slug: doc.slug });
  }

  const itCategory = categories.find((c) => c.slug === 'cong-nghe-thong-tin') || categories[0];

  const company = await CompanyModel.findOneAndUpdate(
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
  const sampleJobs = [
    {
      company: company._id,
      category: itCategory._id,
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
      company: company._id,
      category: itCategory._id,
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
      company: company._id,
      category: itCategory._id,
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

  for (const job of sampleJobs) {
    await JobModel.findOneAndUpdate(
      { company: job.company, title: job.title },
      { $setOnInsert: job },
      { upsert: true, new: true },
    );
  }

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

  for (const pkg of packagesData) {
    await PackageModel.findOneAndUpdate(
      { name: pkg.name },
      { $setOnInsert: pkg },
      { upsert: true, new: true },
    );
  }

  console.log('Seed completed:', {
    admin: adminUser.email,
    employer: employerUser.email,
    candidate: candidateUser.email,
    categories: categories.length,
    company: company.name,
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
