'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Input, message } from 'antd';
import {
  CloseOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  RobotOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { getErrorMessage } from '@/lib/error';
import { formatSalary, WORK_MODE_LABEL } from '@/lib/format';
import { chatbotService, type ChatTurn } from '@/services/chatbot.service';
import type { Job } from '@/types';

interface WidgetTurn extends ChatTurn {
  jobs?: Job[];
  time?: string;
}

const QUICK_PROMPTS = [
  'Việc React / Next.js tại Hà Nội',
  'Việc làm Remote lương từ 15 triệu',
  'Thực tập sinh CNTT',
];

const nowTime = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function FloatingChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const prefetchedJobsRef = useRef(new Set<string>());
  const [open, setOpen] = useState(false);
  const [openingJobId, setOpeningJobId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<WidgetTurn[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Để tìm công việc phù hợp nhất với bạn, hãy cho tôi biết kỹ năng, vị trí hoặc mức lương mong muốn nhé!',
      time: 'Trực tuyến',
    },
  ]);

  useEffect(() => {
    setOpen(false);
    setOpeningJobId(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    router.prefetch('/chatbot');
    const latestJobs = turns.flatMap((t) => (t.jobs ? t.jobs.slice(0, 3) : []));
    latestJobs.forEach((job) => {
      if (!prefetchedJobsRef.current.has(job._id)) {
        prefetchedJobsRef.current.add(job._id);
        router.prefetch(`/jobs/${job._id}`);
      }
    });
  }, [open, turns, router]);

  if (
    pathname === '/chatbot' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/employer')
  ) {
    return null;
  }

  const sendMessage = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || loading) return;

    const history: ChatTurn[] = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, { role: 'user', content: trimmed, time: nowTime() }]);
    setInput('');

    try {
      setLoading(true);
      const res = await chatbotService.chat(trimmed, history);
      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          jobs: res.jobs || [],
          time: nowTime(),
        },
      ]);
    } catch (err) {
      const errMsg = getErrorMessage(err, 'Không thể kết nối tới Trợ lý AI');
      message.error(errMsg);
      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Xin lỗi, hiện không thể xử lý yêu cầu (${errMsg}). Bạn vui lòng thử lại sau giây lát nhé.`,
          time: nowTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <aside className="chat-widget" aria-label="Trợ lý Tìm việc AI">
          <div className="chat-widget__head">
            <div className="chat-widget__brand">
              <span className="chat-widget__avatar">
                <RobotOutlined />
              </span>
              <div>
                <div className="chat-widget__title">Trợ Lý Tìm Việc AI</div>
                <div className="chat-widget__status">
                  <span className="chat-widget__dot" /> Đang hoạt động
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <Link
                href="/chatbot"
                className="chat-widget__head-btn"
                title="Mở toàn màn hình"
                onClick={() => setOpen(false)}
              >
                <ExportOutlined />
              </Link>
              <button
                type="button"
                className="chat-widget__head-btn"
                onClick={() => setOpen(false)}
                aria-label="Đóng khung chat"
              >
                <CloseOutlined />
              </button>
            </div>
          </div>

          <div className="chat-widget__body">
            <div className="chat-widget__chips">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="chat-widget__chip"
                  onClick={() => sendMessage(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            {turns.map((turn, idx) => (
              <div
                key={idx}
                className={`chat-widget__turn chat-widget__turn--${turn.role}`}
              >
                <div className="chat-widget__bubble">{turn.content}</div>
                {turn.time && <div className="chat-widget__time">{turn.time}</div>}

                {turn.jobs && turn.jobs.length > 0 && (
                  <div className="chat-widget__jobs">
                    {turn.jobs.slice(0, 3).map((job) => {
                      const comp =
                        typeof job.company === 'object' && job.company !== null
                          ? job.company.name
                          : job.companyName || 'Doanh nghiệp';
                      return (
                        <div key={job._id} className="chat-widget__job-card">
                          <div className="chat-widget__job-top">
                            <div>
                              <strong>{job.title}</strong>
                              <div className="chat-widget__job-comp">{comp}</div>
                            </div>
                            <span className="chat-widget__job-mode">
                              {WORK_MODE_LABEL[job.workMode] || job.workMode}
                            </span>
                          </div>
                          <div className="chat-widget__job-meta">
                            {job.location && (
                              <span>
                                <EnvironmentOutlined /> {job.location}
                              </span>
                            )}
                            <span>
                              <DollarCircleOutlined /> {formatSalary(job.salaryMin, job.salaryMax)}
                            </span>
                          </div>
                          <Link
                            href={`/jobs/${job._id}`}
                            prefetch={true}
                            className="chat-widget__job-cta"
                            onMouseEnter={() => router.prefetch(`/jobs/${job._id}`)}
                            onClick={() => setOpeningJobId(job._id)}
                          >
                            {openingJobId === job._id ? 'Đang mở chi tiết...' : 'Xem chi tiết'}{' '}
                            <ExportOutlined />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-widget__turn chat-widget__turn--assistant">
                <div className="chat-widget__bubble">Đang phân tích và tìm việc phù hợp...</div>
              </div>
            )}
          </div>

          <div className="chat-widget__foot">
            <Input
              value={input}
              placeholder="Nhập tin nhắn..."
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={() => sendMessage(input)}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={() => sendMessage(input)}
            />
          </div>
        </aside>
      )}

      <button
        type="button"
        className={`chat-fab${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Mở Trợ lý Tìm việc AI"
      >
        {open ? <CloseOutlined /> : <RobotOutlined />}
      </button>
    </>
  );
}
