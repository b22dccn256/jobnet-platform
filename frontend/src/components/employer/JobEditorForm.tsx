'use client';

import { Button, Card, Form, Input, InputNumber, Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { jobsService, type UpsertJobPayload } from '@/services/jobs.service';
import type { Job } from '@/types';

interface Props {
  initialJob?: Job;
  submitting: boolean;
  onSubmit: (payload: UpsertJobPayload) => void;
}

export default function JobEditorForm({ initialJob, submitting, onSubmit }: Props) {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => jobsService.getCategories(),
  });

  const initialCategory =
    initialJob?.category && typeof initialJob.category === 'object'
      ? initialJob.category._id
      : (initialJob?.category as string | undefined);

  return (
    <Card style={{ borderRadius: 14 }}>
      <Form
        layout="vertical"
        initialValues={{
          title: initialJob?.title,
          category: initialCategory,
          location: initialJob?.location || 'Hà Nội',
          workMode: initialJob?.workMode || 'onsite',
          level: initialJob?.level || 'junior',
          education: initialJob?.education || 'Đại học',
          salaryMin: initialJob?.salaryMin,
          salaryMax: initialJob?.salaryMax,
          deadline: initialJob?.deadline ? initialJob.deadline.slice(0, 10) : undefined,
          skillsText: (initialJob?.skills || []).join(', '),
          description: initialJob?.description,
          requirements: initialJob?.requirements,
          benefits: initialJob?.benefits,
        }}
        onFinish={(values) => {
          const skills = String(values.skillsText || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          onSubmit({
            title: values.title,
            category: values.category,
            location: values.location,
            workMode: values.workMode,
            level: values.level,
            education: values.education,
            salaryMin: values.salaryMin,
            salaryMax: values.salaryMax,
            deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
            skills,
            description: values.description,
            requirements: values.requirements,
            benefits: values.benefits,
          });
        }}
      >
        <div className="form-grid-2">
          <Form.Item name="title" label="Tiêu đề vị trí tuyển dụng" rules={[{ required: true }]}>
            <Input placeholder="VD: Backend NestJS Developer" />
          </Form.Item>
          <Form.Item name="category" label="Danh mục nghề nghiệp">
            <Select
              allowClear
              options={(categories?.items || []).map((c) => ({ value: c._id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="location" label="Địa điểm làm việc">
            <Input placeholder="VD: Hà Nội" />
          </Form.Item>
          <Form.Item name="workMode" label="Hình thức làm việc">
            <Select
              options={[
                { value: 'onsite', label: 'Tại văn phòng (Onsite)' },
                { value: 'remote', label: 'Từ xa (Remote)' },
                { value: 'hybrid', label: 'Linh hoạt (Hybrid)' },
              ]}
            />
          </Form.Item>
          <Form.Item name="level" label="Cấp bậc yêu cầu">
            <Select
              options={[
                { value: 'intern', label: 'Intern' },
                { value: 'junior', label: 'Junior' },
                { value: 'middle', label: 'Middle' },
                { value: 'senior', label: 'Senior' },
              ]}
            />
          </Form.Item>
          <Form.Item name="education" label="Yêu cầu học vấn">
            <Input placeholder="VD: Đại học / Cao đẳng" />
          </Form.Item>
          <Form.Item name="salaryMin" label="Lương tối thiểu (VND)">
            <InputNumber style={{ width: '100%' }} min={0} step={1000000} />
          </Form.Item>
          <Form.Item name="salaryMax" label="Lương tối đa (VND)">
            <InputNumber style={{ width: '100%' }} min={0} step={1000000} />
          </Form.Item>
          <Form.Item name="deadline" label="Hạn nộp hồ sơ">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="skillsText" label="Kỹ năng yêu cầu (phân cách bởi dấu phẩy)">
            <Input placeholder="TypeScript, NestJS, MongoDB" />
          </Form.Item>
        </div>

        <Form.Item name="description" label="Mô tả công việc">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="requirements" label="Yêu cầu ứng viên">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="benefits" label="Quyền lợi">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={submitting} size="large">
          {initialJob ? 'Lưu thay đổi (gửi duyệt lại)' : 'Đăng tin tuyển dụng'}
        </Button>
      </Form>
    </Card>
  );
}
