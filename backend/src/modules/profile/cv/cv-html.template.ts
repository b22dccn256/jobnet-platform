import { escapeHtml } from '../../../common/utils/string.util';
import type { CvTemplateType } from './dto/cv.dto';

export interface CandidateCvProfile {
  _id: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
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

const TEMPLATE_THEME: Record<
  CvTemplateType,
  { accent: string; accentSoft: string; headerBg: string; headerText: string; font: string }
> = {
  modern: {
    accent: '#2563eb',
    accentSoft: '#eff6ff',
    headerBg: '#1e3a8a',
    headerText: '#ffffff',
    font: "'Segoe UI', Roboto, Arial, sans-serif",
  },
  classic: {
    accent: '#0f172a',
    accentSoft: '#f1f5f9',
    headerBg: '#ffffff',
    headerText: '#0f172a',
    font: "Georgia, 'Times New Roman', serif",
  },
  minimal: {
    accent: '#059669',
    accentSoft: '#ecfdf5',
    headerBg: '#f8fafc',
    headerText: '#0f172a',
    font: "'Helvetica Neue', Arial, sans-serif",
  },
};

/** Render an escaped, print-ready A4 HTML document for Puppeteer PDF generation. */
export function renderCvHtml(cv: CandidateCvData, template?: CvTemplateType): string {
  const selected = template || cv.profile.cvTemplate || 'modern';
  const theme = TEMPLATE_THEME[selected] || TEMPLATE_THEME.modern;
  const { profile } = cv;

  const experienceHtml = cv.workExperiences.length
    ? `<section>
        <h2>Kinh nghiệm làm việc</h2>
        ${cv.workExperiences
          .map(
            (w) => `<div class="item">
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
        <h2>Học vấn</h2>
        ${cv.educations
          .map(
            (e) => `<div class="item">
              <div class="item-head">
                <strong>${escapeHtml(e.school)}</strong>
                <span>${escapeHtml(formatPeriod(e.startDate, e.endDate))}</span>
              </div>
              <div class="item-sub">${escapeHtml([e.degree, e.major].filter(Boolean).join(' – '))}</div>
            </div>`,
          )
          .join('')}
      </section>`
    : '';

  const skillsHtml = profile.skills?.length
    ? `<section>
        <h2>Kỹ năng</h2>
        <div class="tags">${profile.skills.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
      </section>`
    : '';

  const languagesHtml = cv.languages.length
    ? `<section>
        <h2>Ngoại ngữ</h2>
        <ul class="list">
          ${cv.languages
            .map((l) => `<li><strong>${escapeHtml(l.name)}</strong>${l.level ? `: ${escapeHtml(l.level)}` : ''}</li>`)
            .join('')}
        </ul>
      </section>`
    : '';

  const coursesHtml = cv.courses.length
    ? `<section>
        <h2>Khóa học & Chứng chỉ</h2>
        <ul class="list">
          ${cv.courses
            .map(
              (c) =>
                `<li><strong>${escapeHtml(c.name)}</strong>${c.organization ? ` – ${escapeHtml(c.organization)}` : ''}${c.date ? ` (${escapeHtml(formatMonthYear(c.date))})` : ''}</li>`,
            )
            .join('')}
        </ul>
      </section>`
    : '';

  const otherHtml = cv.otherInfo.length
    ? `<section>
        <h2>Thông tin bổ sung</h2>
        ${cv.otherInfo.map((o) => `<p>${escapeHtml(o.content)}</p>`).join('')}
      </section>`
    : '';

  const contactParts = [
    profile.email ? `Email: ${escapeHtml(profile.email)}` : '',
    profile.phone ? `ĐT: ${escapeHtml(profile.phone)}` : '',
    profile.desiredLocation ? `Địa điểm: ${escapeHtml(profile.desiredLocation)}` : '',
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>CV - ${escapeHtml(profile.fullName || profile.email)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ${theme.font};
      color: #1e293b;
      font-size: 13px;
      line-height: 1.55;
      background: #ffffff;
    }
    .header {
      background: ${theme.headerBg};
      color: ${theme.headerText};
      padding: 24px 28px;
      border-bottom: ${selected === 'classic' ? `2px solid ${theme.accent}` : 'none'};
      border-radius: ${selected === 'modern' ? '8px' : '0'};
      margin-bottom: 18px;
    }
    .header h1 { margin: 0; font-size: 24px; letter-spacing: -0.3px; }
    .header .role { margin-top: 4px; font-size: 14px; opacity: 0.9; font-weight: 600; }
    .header .contacts { margin-top: 10px; font-size: 12px; opacity: 0.9; display: flex; flex-wrap: wrap; gap: 14px; }
    section { margin-bottom: 16px; page-break-inside: avoid; }
    h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${theme.accent};
      border-bottom: 1.5px solid ${theme.accentSoft};
      padding-bottom: 4px;
      margin: 0 0 10px;
    }
    .item { margin-bottom: 10px; }
    .item-head { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
    .item-head span { font-size: 12px; color: #64748b; white-space: nowrap; }
    .item-sub { color: #475569; font-weight: 500; margin-top: 2px; }
    p { margin: 4px 0 0; white-space: pre-line; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .tag {
      background: ${theme.accentSoft};
      color: ${theme.accent};
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 600;
    }
    .list { margin: 0; padding-left: 18px; }
    .list li { margin-bottom: 4px; }
    .muted { color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <header class="header">
    <h1>${escapeHtml(profile.fullName || profile.email)}</h1>
    ${profile.desiredTitle ? `<div class="role">${escapeHtml(profile.desiredTitle)}</div>` : ''}
    <div class="contacts">${contactParts.map((c) => `<span>${c}</span>`).join('')}</div>
  </header>
  ${profile.bio ? `<section><h2>Giới thiệu</h2><p>${escapeHtml(profile.bio)}</p></section>` : ''}
  ${skillsHtml}
  ${experienceHtml}
  ${projectsHtml}
  ${educationsHtml}
  ${coursesHtml}
  ${languagesHtml}
  ${otherHtml}
</body>
</html>`;
}
