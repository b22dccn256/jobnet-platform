'use client';

import {
  EnvironmentOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import SmartAvatar from '@/components/common/SmartAvatar';
import { formatMonthYear, formatPeriod, formatSalary, LEVEL_LABEL } from '@/lib/format';
import type { CandidateCvData, CvTemplateType } from '@/types';

interface Props {
  cv: CandidateCvData;
  template?: CvTemplateType;
}

export default function CvPaperPreview({ cv, template }: Props) {
  const selected = template || cv.profile.cvTemplate || 'modern';
  const { profile } = cv;
  const displayName = profile.fullName || profile.email;

  return (
    <div className={`cv-sheet cv-sheet--${selected}`}>
      <aside className="cv-sheet__side">
        <div className="cv-sheet__identity">
          <SmartAvatar
            src={profile.avatar}
            name={displayName}
            className="cv-sheet__avatar"
          />
          <div>
            <h2 className="cv-sheet__name">{displayName}</h2>
            {profile.desiredTitle && <p className="cv-sheet__role">{profile.desiredTitle}</p>}
            {profile.desiredLevel && (
              <span className="cv-sheet__badge">
                {LEVEL_LABEL[profile.desiredLevel] || profile.desiredLevel}
              </span>
            )}
          </div>
        </div>

        <div className="cv-sheet__side-section">
          <h4>Thông tin liên hệ</h4>
          <ul className="cv-sheet__meta-list">
            <li>
              <MailOutlined /> <span>{profile.email}</span>
            </li>
            {profile.phone && (
              <li>
                <PhoneOutlined /> <span>{profile.phone}</span>
              </li>
            )}
            {(profile.address || profile.desiredLocation) && (
              <li>
                <EnvironmentOutlined /> <span>{profile.address || profile.desiredLocation}</span>
              </li>
            )}
            {profile.website && (
              <li>
                <GlobalOutlined /> <span>{profile.website}</span>
              </li>
            )}
          </ul>
        </div>

        {(profile.dateOfBirth || profile.gender || profile.nationality || profile.desiredSalaryMin) && (
          <div className="cv-sheet__side-section">
            <h4>Thông tin cá nhân</h4>
            <dl className="cv-sheet__dl">
              {profile.gender && (
                <>
                  <dt>Giới tính</dt>
                  <dd>{profile.gender}</dd>
                </>
              )}
              {profile.dateOfBirth && (
                <>
                  <dt>Ngày sinh</dt>
                  <dd>{profile.dateOfBirth}</dd>
                </>
              )}
              {profile.nationality && (
                <>
                  <dt>Quốc gia</dt>
                  <dd>{profile.nationality}</dd>
                </>
              )}
              {profile.desiredSalaryMin ? (
                <>
                  <dt>Mức lương kỳ vọng</dt>
                  <dd>{formatSalary(profile.desiredSalaryMin)}</dd>
                </>
              ) : null}
            </dl>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="cv-sheet__side-section">
            <h4>Kỹ năng chuyên môn</h4>
            <div className="cv-sheet__tags">
              {profile.skills.map((s) => (
                <span key={s} className="cv-sheet__tag">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {cv.languages.length > 0 && (
          <div className="cv-sheet__side-section">
            <h4>Ngoại ngữ</h4>
            <ul className="cv-sheet__meta-list">
              {cv.languages.map((l, idx) => (
                <li key={l._id || idx}>
                  <strong>{l.name}</strong>
                  {l.level ? ` · ${l.level}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {cv.health.length > 0 && (
          <div className="cv-sheet__side-section">
            <h4>Sức khỏe</h4>
            {cv.health.map((h, idx) => (
              <p key={h._id || idx} className="cv-sheet__small">
                {[
                  h.height ? `Cao ${h.height}cm` : '',
                  h.weight ? `Nặng ${h.weight}kg` : '',
                  h.note || '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ))}
          </div>
        )}
      </aside>

      <div className="cv-sheet__main">
        {profile.bio && (
          <section className="cv-sheet__block">
            <h3>Giới thiệu bản thân</h3>
            <p className="cv-sheet__prose">{profile.bio}</p>
          </section>
        )}

        {cv.workExperiences.length > 0 && (
          <section className="cv-sheet__block">
            <h3>Kinh nghiệm làm việc</h3>
            {cv.workExperiences.map((w, idx) => (
              <div key={w._id || idx} className="cv-sheet__item cv-sheet__item--timeline">
                <div className="cv-sheet__item-head">
                  <strong>{w.position}</strong>
                  <span>{formatPeriod(w.startDate, w.endDate)}</span>
                </div>
                <div className="cv-sheet__item-sub">{w.company}</div>
                {w.description && <p className="cv-sheet__prose">{w.description}</p>}
              </div>
            ))}
          </section>
        )}

        {cv.projects.length > 0 && (
          <section className="cv-sheet__block">
            <h3>Dự án nổi bật</h3>
            {cv.projects.map((p, idx) => (
              <div key={p._id || idx} className="cv-sheet__item">
                <div className="cv-sheet__item-head">
                  <strong>{p.name}</strong>
                  {p.url && <span className="cv-sheet__link">{p.url}</span>}
                </div>
                {p.technologies && p.technologies.length > 0 && (
                  <div className="cv-sheet__main-tags">
                    {p.technologies.map((t) => (
                      <span key={t} className="cv-sheet__main-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {p.description && <p className="cv-sheet__prose">{p.description}</p>}
              </div>
            ))}
          </section>
        )}

        {cv.educations.length > 0 && (
          <section className="cv-sheet__block">
            <h3>Đào tạo & Học vấn</h3>
            {cv.educations.map((e, idx) => (
              <div key={e._id || idx} className="cv-sheet__item">
                <div className="cv-sheet__item-head">
                  <strong>{e.school}</strong>
                  <span>{formatPeriod(e.startDate, e.endDate)}</span>
                </div>
                <div className="cv-sheet__item-sub">
                  {[e.degree, e.major].filter(Boolean).join(' – ')}
                </div>
                {e.description && <p className="cv-sheet__prose">{e.description}</p>}
              </div>
            ))}
          </section>
        )}

        {cv.courses.length > 0 && (
          <section className="cv-sheet__block">
            <h3>Khóa học / Chứng chỉ</h3>
            {cv.courses.map((c, idx) => (
              <div key={c._id || idx} className="cv-sheet__item">
                <div className="cv-sheet__item-head">
                  <strong>{c.name}</strong>
                  {c.date && <span>{formatMonthYear(c.date)}</span>}
                </div>
                {c.organization && <div className="cv-sheet__item-sub">{c.organization}</div>}
                {c.description && <p className="cv-sheet__prose">{c.description}</p>}
              </div>
            ))}
          </section>
        )}

        {cv.otherInfo.length > 0 && (
          <section className="cv-sheet__block">
            <h3>Thông tin bổ sung</h3>
            {cv.otherInfo.map((o, idx) => {
              const meta = [
                o.hometown ? `Quê quán: ${o.hometown}` : '',
                o.religion ? `Tôn giáo: ${o.religion}` : '',
                o.emergencyContact ? `Người liên hệ: ${o.emergencyContact}` : '',
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <div key={o._id || idx} className="cv-sheet__item">
                  {meta && <div className="cv-sheet__item-sub">{meta}</div>}
                  {o.content && <p className="cv-sheet__prose">{o.content}</p>}
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
