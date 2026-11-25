'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Empty, Select, Skeleton, Tag } from 'antd';
import {
  ArrowRightOutlined,
  PercentageOutlined,
  TeamOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import EmployerNav from '@/components/employer/EmployerNav';
import CandidateOverviewModal from '@/components/employer/CandidateOverviewModal';
import SmartAvatar from '@/components/common/SmartAvatar';
import { getErrorMessage } from '@/lib/error';
import { formatSalary, WORK_MODE_LABEL } from '@/lib/format';
import { employerService } from '@/services/employer.service';
import { jobsService } from '@/services/jobs.service';
import type { CandidateRecommendationItem } from '@/types';

function buildMatchReasons(item: CandidateRecommendationItem): string[] {
  const b = item.breakdown;
  const reasons: string[] = [];
  if (b.skills >= 20) {
    reasons.push(`Độ khớp kỹ năng chuyên môn cao (${b.skills}/35đ)`);
  } else if (b.skills > 0) {
    reasons.push(`Có kỹ năng liên quan (${b.skills}/35đ)`);
  }
  if (b.experience >= 15) {
    reasons.push(`Kinh nghiệm thực tế vững (${b.experience}/25đ)`);
  }
  if (b.level >= 7) {
    reasons.push(`Phù hợp cấp bậc tuyển dụng (${b.level}/10đ)`);
  }
  if (b.salary >= 4) {
    reasons.push('Mức lương kỳ vọng nằm trong ngân sách');
  }
  if (b.location >= 4) {
    reasons.push('Cùng khu vực / hình thức làm việc');
  }
  if (reasons.length === 0) {
    reasons.push(`Tổng điểm đánh giá hồ sơ: ${item.totalScore}/${item.maxScore}đ`);
  }
  return reasons.slice(0, 4);
}

export default function EmployerSuggestionsPage() {
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const { data: myJobs } = useQuery({
    queryKey: ['myEmployerJobs'],
    queryFn: () => jobsService.getMyJobs({ limit: 50 }),
  });

  useEffect(() => {
    if (!jobId && myJobs?.items && myJobs.items.length > 0) {
      setJobId(myJobs.items[0]._id);
    }
  }, [jobId, myJobs]);

  const activeJob = useMemo(
    () => (myJobs?.items || []).find((j) => j._id === jobId) || null,
    [myJobs, jobId],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendedCandidates', jobId],
    queryFn: () => employerService.getRecommendedCandidates(jobId!, { limit: 20 }),
    enabled: Boolean(jobId),
    retry: false,
  });

  const avgMatch = useMemo(() => {
    const items = data?.items || [];
    if (items.length === 0) return 0;
    return Math.round(items.reduce((acc, cur) => acc + cur.percent, 0) / items.length);
  }, [data?.items]);

  return (
    <div className="container section">
      <EmployerNav />

      <div className="section__head" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="section__title">Gợi ý ứng viên theo công việc</h1>
          <p className="section__subtitle">
            Đối sánh tự động trên thang 105 điểm (Kỹ năng, Kinh nghiệm, Cấp bậc, Dự án, Lương, Địa điểm)
          </p>
        </div>

        <Select
          size="large"
          placeholder="Chọn một tin tuyển dụng..."
          style={{ minWidth: 280 }}
          value={jobId}
          onChange={(v) => setJobId(v)}
          options={(myJobs?.items || []).map((j) => ({ value: j._id, label: j.title }))}
        />
      </div>

      {/* 3 KPI Summary Cards matching Hình 3.17 */}
      <div className="sugg-kpi-grid">
        <div className="sugg-kpi-card">
          <span className="sugg-kpi-card__icon">
            <UserSwitchOutlined />
          </span>
          <div>
            <div className="sugg-kpi-card__label">Vị trí đang tuyển</div>
            <strong className="sugg-kpi-card__value">{myJobs?.total ?? 0}</strong>
          </div>
        </div>
        <div className="sugg-kpi-card">
          <span className="sugg-kpi-card__icon">
            <TeamOutlined />
          </span>
          <div>
            <div className="sugg-kpi-card__label">Ứng viên phù hợp</div>
            <strong className="sugg-kpi-card__value">{data?.items?.length ?? 0}</strong>
          </div>
        </div>
        <div className="sugg-kpi-card">
          <span className="sugg-kpi-card__icon">
            <PercentageOutlined />
          </span>
          <div>
            <div className="sugg-kpi-card__label">Độ match trung bình</div>
            <strong className="sugg-kpi-card__value">{avgMatch}%</strong>
          </div>
        </div>
      </div>

      {!jobId ? (
        <Card style={{ borderRadius: 14 }}>
          <Empty description="Hãy tạo hoặc chọn một tin tuyển dụng để xem danh sách ứng viên phù hợp" />
        </Card>
      ) : error ? (
        <Alert
          type="warning"
          showIcon
          message="Tính năng dành cho gói Nhà tuyển dụng Premium"
          description={getErrorMessage(
            error,
            'Vui lòng nâng cấp gói dịch vụ để mở khóa thuật toán gợi ý ứng viên 105 điểm',
          )}
          action={
            <Link href="/employer/upgrade">
              <Button type="primary">Nâng cấp ngay</Button>
            </Link>
          }
        />
      ) : (
        <div className="cv-card">
          {activeJob && (
            <div className="sugg-job-banner">
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>{activeJob.title}</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  {activeJob.location || 'Toàn quốc'} ·{' '}
                  {WORK_MODE_LABEL[activeJob.workMode] || activeJob.workMode} ·{' '}
                  {formatSalary(activeJob.salaryMin, activeJob.salaryMax)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Tag color="success">{data?.items?.length || 0} ứng viên</Tag>
                <Tag color="processing">{avgMatch}% match TB</Tag>
              </div>
            </div>
          )}

          <h3 style={{ margin: '18px 0 14px', fontSize: 16 }}>Ứng viên gợi ý hàng đầu</h3>

          {isLoading ? (
            <Skeleton active avatar paragraph={{ rows: 4 }} />
          ) : data?.items && data.items.length > 0 ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {data.items.map((item) => {
                const cand = item.candidate;
                const name = cand.fullName || cand.email;
                const reasons = buildMatchReasons(item);

                return (
                  <div key={cand._id} className="sugg-cand-card">
                    <div className="sugg-cand-card__head">
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                        <SmartAvatar
                          src={cand.avatar}
                          name={name}
                          className="emp-cand-card__avatar"
                        />
                        <div>
                          <strong style={{ fontSize: 16 }}>{name}</strong>
                          <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 500 }}>
                            {cand.desiredTitle || 'Ứng viên'}
                          </div>
                        </div>
                      </div>

                      <span className="sugg-match-pill">
                        ↗ {item.percent}% match ({item.totalScore}/{item.maxScore}đ)
                      </span>
                    </div>

                    <div className="sugg-reasons-box">
                      <div className="sugg-reasons-box__title">Lý do phù hợp:</div>
                      <div className="sugg-reasons-box__grid">
                        {reasons.map((r) => (
                          <div key={r} className="sugg-reason-item">
                            <span className="sugg-reason-dot" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="sugg-cand-card__foot">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(cand.skills || []).slice(0, 6).map((skill) => (
                          <span key={skill} className="skill-chip">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <Button
                        type="primary"
                        ghost
                        onClick={() => setSelectedCandidateId(cand._id)}
                      >
                        Xem hồ sơ <ArrowRightOutlined />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty description="Chưa tìm thấy ứng viên phù hợp với tin này" />
          )}
        </div>
      )}

      <CandidateOverviewModal
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
      />
    </div>
  );
}
