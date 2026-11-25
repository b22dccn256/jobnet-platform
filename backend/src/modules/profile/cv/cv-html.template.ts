import { escapeHtml } from '../../../common/utils/string.util';
import type { CvTemplateType } from './dto/cv.dto';

export interface CandidateCvProfile {
  _id: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  coverImage?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  website?: string;
  isVerified?: boolean;
  bio?: string;
  skills: string[];
  desiredTitle?: string;
  desiredLevel?: string;
  desiredSalaryMin?: number;
  desiredLocation?: string;
  cvUrl?: string;
  cvTemplate: CvTemplateType;
  isCvPublic: boolean;
  cvShareToken?: string;
}

export interface CandidateCvData {
  profile: CandidateCvProfile;
  educations: Array<{
    school?: string;
    major?: string;
    degree?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    description?: string;
  }>;
  workExperiences: Array<{
    position?: string;
    company?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    description?: string;
  }>;
  projects: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  courses: Array<{
    name?: string;
    organization?: string;
    date?: Date | string;
    description?: string;
  }>;
  languages: Array<{
    name?: string;
    level?: string;
  }>;
  health: Array<{
    height?: number;
    weight?: number;
    note?: string;
  }>;
  otherInfo: Array<{
    content?: string;
    religion?: string;
    hometown?: string;
    emergencyContact?: string;
  }>;
  completeness: number;
  shareUrl: string | null;
}

function formatMonthYear(value?: Date | string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatPeriod(start?: Date | string, end?: Date | string): string {
  const s = formatMonthYear(start);
  const e = formatMonthYear(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return `${s} – Hiện tại`;
  if (e) return `Đến ${e}`;
  return '';
}

function resolveImageUrl(raw?: string): string {
  if (!raw) return '';
  if (/^(https?:\/\/|data:)/i.test(raw)) return raw;
  const port = process.env.PORT || '4000';
  return `http://localhost:${port}/api/storage/file?key=${encodeURIComponent(raw)}`;
}

const TEMPLATE_THEME: Record<
  CvTemplateType,
  {
    accent: string;
    accentSoft: string;
    sidebarBg: string;
    sidebarText: string;
    sidebarMuted: string;
    headerBg: string;
    headerText: string;
    font: string;
  }
> = {
  modern: {
    accent: '#2563eb',
    accentSoft: '#eff6ff',
    sidebarBg: '#0f172a',
    sidebarText: '#f8fafc',
    sidebarMuted: '#94a3b8',
    headerBg: '#1e3a8a',
    headerText: '#ffffff',
    font: "'Segoe UI', Roboto, Arial, sans-serif",
  },
  classic: {
    accent: '#1e3a8a',
    accentSoft: '#f1f5f9',
    sidebarBg: '#f8fafc',
    sidebarText: '#0f172a',
    sidebarMuted: '#475569',
    headerBg: '#ffffff',
    headerText: '#0f172a',
    font: "Georgia, 'Times New Roman', serif",
  },
  minimal: {
    accent: '#059669',
    accentSoft: '#ecfdf5',
    sidebarBg: '#f8fafc',
    sidebarText: '#0f172a',
    sidebarMuted: '#64748b',
    headerBg: '#ffffff',
    headerText: '#0f172a',
    font: "'Helvetica Neue', Arial, sans-serif",
  },
};

/** Render an escaped, print-ready A4 HTML document for Puppeteer PDF generation. */
export function renderCvHtml(cv: CandidateCvData, template?: CvTemplateType): string {
  const selected = template || cv.profile.cvTemplate || 'modern';
  const theme = TEMPLATE_THEME[selected] || TEMPLATE_THEME.modern;
  const { profile } = cv;
  const displayName = profile.fullName || profile.email;
  const initial = (displayName || 'U').trim().charAt(0).toUpperCase();
  const avatarSrc = resolveImageUrl(profile.avatar);

  const personalRows = [
    profile.email ? ['Email', profile.email] : null,
    profile.phone ? ['Điện thoại', profile.phone] : null,
    profile.dateOfBirth ? ['Ngày sinh', profile.dateOfBirth] : null,
    profile.gender ? ['Giới tính', profile.gender] : null,
    profile.address || profile.desiredLocation
      ? ['Địa chỉ', profile.address || profile.desiredLocation || '']
      : null,
    profile.nationality ? ['Quốc gia', profile.nationality] : null,
    profile.website ? ['Website', profile.website] : null,
  ].filter((r): r is [string, string] => Boolean(r));

  const experienceHtml = cv.workExperiences.length
    ? `<section>
        <h2>Kinh nghiệm làm việc</h2>
        ${cv.workExperiences
          .map(
            (w) => `<div class="item timeline-item">
              <div class="item-head">
                <strong>${escapeHtml(w.position)}</strong>
                <span>${escapeHtml(formatPeriod(w.startDate, w.endDate))}</span>
              </div>
              <div class="item-sub">${escapeHtml(w.company)}</div>
              ${w.description ? `<p>${escapeHtml(w.description)}</p>` : ''}
            </div>`,
          )
          .join('')}
      </section>`
    : '';

  const projectsHtml = cv.projects.length
    ? `<section>
        <h2>Dự án nổi bật</h2>
        ${cv.projects
          .map(
            (p) => `<div class="item">
              <div class="item-head">
                <strong>${escapeHtml(p.name)}</strong>
                ${p.url ? `<span class="muted">${escapeHtml(p.url)}</span>` : ''}
              </div>
              ${
                p.technologies?.length
                  ? `<div class="tags">${p.technologies.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`
                  : ''
              }
              ${p.description ? `<p>${escapeHtml(p.description)}</p>` : ''}
            </div>`,
          )
          .join('')}
      </section>`
    : '';

  const educationsHtml = cv.educations.length
    ? `<section>
        <h2>Đào tạo & Học vấn</h2>
        ${cv.educations
          .map(
            (e) => `<div class="item">
              <div class="item-head">
                <strong>${escapeHtml(e.school)}</strong>
                <span>${escapeHtml(formatPeriod(e.startDate, e.endDate))}</span>
              </div>
              <div class="item-sub">${escapeHtml([e.degree, e.major].filter(Boolean).join(' – '))}</div>
              ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ''}
            </div>`,
          )
          .join('')}
      </section>`
    : '';

  const coursesHtml = cv.courses.length
    ? `<section>
        <h2>Khóa học & Chứng chỉ</h2>
        ${cv.courses
          .map(
            (c) => `<div class="item">
              <div class="item-head">
                <strong>${escapeHtml(c.name)}</strong>
                ${c.date ? `<span>${escapeHtml(formatMonthYear(c.date))}</span>` : ''}
              </div>
              ${c.organization ? `<div class="item-sub">${escapeHtml(c.organization)}</div>` : ''}
              ${c.description ? `<p>${escapeHtml(c.description)}</p>` : ''}
            </div>`,
          )
          .join('')}
      </section>`
    : '';

  const skillsHtml = profile.skills?.length
    ? `<div class="side-block">
        <h3>Kỹ năng chuyên môn</h3>
        <div class="side-tags">${profile.skills.map((s) => `<span class="side-tag">${escapeHtml(s)}</span>`).join('')}</div>
      </div>`
    : '';

  const languagesHtml = cv.languages.length
    ? `<div class="side-block">
        <h3>Ngoại ngữ</h3>
        <ul class="side-list">
          ${cv.languages
            .map((l) => `<li><strong>${escapeHtml(l.name)}</strong>${l.level ? ` · ${escapeHtml(l.level)}` : ''}</li>`)
            .join('')}
        </ul>
      </div>`
    : '';

  const healthHtml = cv.health.length
    ? `<div class="side-block">
        <h3>Thông tin sức khỏe</h3>
        ${cv.health
          .map(
            (h) =>
              `<div class="side-note">${[
                h.height ? `Cao: ${escapeHtml(String(h.height))}cm` : '',
                h.weight ? `Nặng: ${escapeHtml(String(h.weight))}kg` : '',
                h.note ? escapeHtml(h.note) : '',
              ]
                .filter(Boolean)
                .join(' · ')}</div>`,
          )
          .join('')}
      </div>`
    : '';

  const otherHtml = cv.otherInfo.length
    ? `<section>
        <h2>Thông tin bổ sung</h2>
        ${cv.otherInfo
          .map((o) => {
            const meta = [
              o.hometown ? `Quê quán: ${escapeHtml(o.hometown)}` : '',
              o.religion ? `Tôn giáo: ${escapeHtml(o.religion)}` : '',
              o.emergencyContact ? `Liên hệ khẩn cấp: ${escapeHtml(o.emergencyContact)}` : '',
            ]
              .filter(Boolean)
              .join(' · ');
            return `<div class="item">${meta ? `<div class="item-sub">${meta}</div>` : ''}${o.content ? `<p>${escapeHtml(o.content)}</p>` : ''}</div>`;
          })
          .join('')}
      </section>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>CV - ${escapeHtml(displayName)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ${theme.font};
      color: #1e293b;
      font-size: 12.5px;
      line-height: 1.55;
      background: #ffffff;
    }
    .sheet {
      display: grid;
      grid-template-columns: ${selected === 'minimal' ? '1fr' : '240px 1fr'};
      min-height: 100vh;
      border: ${selected === 'classic' ? '1px solid #cbd5e1' : 'none'};
    }
    .sidebar {
      background: ${theme.sidebarBg};
      color: ${theme.sidebarText};
      padding: 26px 20px;
      border-right: ${selected === 'classic' ? '2px solid #1e3a8a' : 'none'};
      border-bottom: ${selected === 'minimal' ? '1.5px solid #e2e8f0' : 'none'};
    }
    .avatar-wrap {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      overflow: hidden;
      background: ${theme.accent};
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 14px;
      border: 3px solid rgba(255,255,255,0.22);
    }
    .avatar-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .name { margin: 0; font-size: 21px; line-height: 1.25; font-weight: 700; }
    .role { margin-top: 4px; font-size: 13px; color: ${selected === 'modern' ? '#93c5fd' : theme.accent}; font-weight: 600; }
    .side-block { margin-top: 20px; }
    .side-block h3 {
      margin: 0 0 8px;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: ${selected === 'modern' ? '#93c5fd' : theme.accent};
      border-bottom: 1px solid rgba(148,163,184,0.28);
      padding-bottom: 4px;
    }
    .meta-row { margin-bottom: 6px; font-size: 11.5px; word-break: break-word; }
    .meta-label { color: ${theme.sidebarMuted}; display: block; font-size: 10.5px; }
    .side-tags { display: flex; flex-wrap: wrap; gap: 5px; }
    .side-tag {
      background: ${selected === 'modern' ? 'rgba(59,130,246,0.22)' : theme.accentSoft};
      color: ${selected === 'modern' ? '#dbeafe' : theme.accent};
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .side-list { margin: 0; padding-left: 16px; font-size: 11.5px; }
    .side-list li { margin-bottom: 4px; }
    .side-note { font-size: 11.5px; }
    .main { padding: 26px 28px; }
    section { margin-bottom: 18px; page-break-inside: avoid; }
    h2 {
      font-size: 13.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${theme.accent};
      border-bottom: 1.5px solid ${theme.accentSoft};
      padding-bottom: 4px;
      margin: 0 0 10px;
    }
    .item { margin-bottom: 11px; }
    .timeline-item {
      padding-left: 12px;
      border-left: 2px solid ${theme.accentSoft};
    }
    .item-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
    .item-head span { font-size: 11.5px; color: #64748b; white-space: nowrap; }
    .item-sub { color: #475569; font-weight: 600; margin-top: 2px; font-size: 12px; }
    p { margin: 4px 0 0; white-space: pre-line; color: #334155; }
    .tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
    .tag {
      background: ${theme.accentSoft};
      color: ${theme.accent};
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .muted { color: #64748b; font-size: 11px; }
  </style>
</head>
<body>
  <div class="sheet">
    <aside class="sidebar">
      <div class="avatar-wrap">
        ${avatarSrc ? `<img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(displayName)}" />` : escapeHtml(initial)}
      </div>
      <h1 class="name">${escapeHtml(displayName)}</h1>
      ${profile.desiredTitle ? `<div class="role">${escapeHtml(profile.desiredTitle)}</div>` : ''}
      ${
        personalRows.length
          ? `<div class="side-block">
              <h3>Thông tin cá nhân</h3>
              ${personalRows
                .map(
                  ([label, val]) =>
                    `<div class="meta-row"><span class="meta-label">${escapeHtml(label)}</span>${escapeHtml(val)}</div>`,
                )
                .join('')}
            </div>`
          : ''
      }
      ${skillsHtml}
      ${languagesHtml}
      ${healthHtml}
    </aside>
    <main class="main">
      ${profile.bio ? `<section><h2>Giới thiệu bản thân</h2><p>${escapeHtml(profile.bio)}</p></section>` : ''}
      ${experienceHtml}
      ${projectsHtml}
      ${educationsHtml}
      ${coursesHtml}
      ${otherHtml}
    </main>
  </div>
</body>
</html>`;
}
