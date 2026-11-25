import Link from 'next/link';
import { Tag } from 'antd';
import { DollarCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { formatSalary, LEVEL_LABEL, WORK_MODE_LABEL } from '@/lib/format';
import type { Job } from '@/types';

export default function JobCardItem({ job, badge }: { job: Job; badge?: React.ReactNode }) {
  const companyObj = typeof job.company === 'object' && job.company !== null ? job.company : null;
  const companyName = companyObj?.name || job.companyName || 'Doanh nghiệp tuyển dụng';
  const companyLogo = companyObj?.logo || job.companyLogo || '';

  return (
    <Link href={`/jobs/${job._id}`} className="job-card">
      <div className="job-card__logo">
        {companyLogo ? (
          <img src={companyLogo} alt={companyName} />
        ) : (
          companyName.charAt(0).toUpperCase()
        )}
      </div>

      <div className="job-card__body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
          <h3 className="job-card__title">{job.title}</h3>
          {badge}
        </div>
        <p className="job-card__company">{companyName}</p>

        <div className="job-card__meta">
          <Tag color="green" icon={<DollarCircleOutlined />}>
            {formatSalary(job.salaryMin, job.salaryMax)}
          </Tag>
          {job.location && <Tag icon={<EnvironmentOutlined />}>{job.location}</Tag>}
          {job.workMode && <Tag color="blue">{WORK_MODE_LABEL[job.workMode] || job.workMode}</Tag>}
          {job.level && <Tag>{LEVEL_LABEL[job.level] || job.level}</Tag>}
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="job-card__skills">
            {job.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="skill-chip">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
