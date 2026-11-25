'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Space, Tag, message } from 'antd';
import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import JobCardItem from '@/components/common/JobCardItem';
import { getErrorMessage } from '@/lib/error';
import { chatbotService, type ChatTurn } from '@/services/chatbot.service';
import type { RootState } from '@/store';
import type { Job } from '@/types';

const SAMPLE_PROMPTS = [
  'Tìm việc Junior NestJS hoặc TypeScript tại Hà Nội lương từ 15 triệu',
  'Có việc làm React / Next.js làm remote không?',
  'Tìm việc Python dữ liệu hoặc AI tại Hồ Chí Minh',
];

interface MessageBlock extends ChatTurn {
  jobs?: Job[];
}

export default function ChatbotPage() {
  const router = useRouter();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageBlock[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Tôi là trợ lý AI của JobNet (LLaMA 3.3 – Groq). Bạn hãy mô tả công việc, kỹ năng, địa điểm hoặc mức lương mong muốn bằng câu tự nhiên nhé!',
    },
  ]);

  const sendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;
    if (!accessToken) {
      message.info('Vui lòng đăng nhập tài khoản ứng viên để trò chuyện với trợ lý AI');
      router.push('/login');
      return;
    }

    const historyPayload: ChatTurn[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');

    try {
      setLoading(true);
      const res = await chatbotService.chat(trimmed, historyPayload);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          jobs: res.jobs || [],
        },
      ]);
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể kết nối tới dịch vụ Chatbot'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <div className="section__head">
        <div>
          <h1 className="section__title">
            <RobotOutlined style={{ color: '#2563eb' }} /> Trợ lý AI hỗ trợ tìm việc
          </h1>
          <p className="section__subtitle">
            Kết hợp phân tích quy tắc tiếng Việt và mô hình LLaMA 3.3 70B trên dữ liệu việc làm thực tế
          </p>
        </div>
      </div>

      <Card style={{ borderRadius: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <Space wrap>
            {SAMPLE_PROMPTS.map((p) => (
              <Tag
                key={p}
                color="processing"
                style={{ cursor: 'pointer', padding: '4px 10px' }}
                onClick={() => sendPrompt(p)}
              >
                {p}
              </Tag>
            ))}
          </Space>
        </div>

        <div
          style={{
            minHeight: 340,
            maxHeight: 520,
            overflowY: 'auto',
            padding: 16,
            borderRadius: 12,
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginBottom: 16,
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: m.role === 'user' ? '#2563eb' : '#ffffff',
                  color: m.role === 'user' ? '#ffffff' : '#0f172a',
                  border: m.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                  whiteSpace: 'pre-line',
                }}
              >
                <strong style={{ display: 'block', marginBottom: 4, fontSize: 12, opacity: 0.8 }}>
                  {m.role === 'user' ? (
                    <>
                      <UserOutlined /> Bạn
                    </>
                  ) : (
                    <>
                      <RobotOutlined /> JobNet AI
                    </>
                  )}
                </strong>
                {m.content}
              </div>

              {m.jobs && m.jobs.length > 0 && (
                <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                  {m.jobs.map((job) => (
                    <JobCardItem key={job._id} job={job} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Input
            size="large"
            placeholder="Nhập nhu cầu tìm việc của bạn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => sendPrompt(input)}
            disabled={loading}
          />
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            loading={loading}
            onClick={() => sendPrompt(input)}
          >
            Gửi
          </Button>
        </div>
      </Card>
    </div>
  );
}
