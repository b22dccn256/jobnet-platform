'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Progress,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Upload,
  message,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/error';
import { cvService, type ProfileSectionName } from '@/services/cv.service';
import type { CvTemplateType } from '@/types';

export default function CandidateCvPage() {
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);

  const { data: cv, isLoading } = useQuery({
    queryKey: ['myCv'],
    queryFn: () => cvService.getMyCv(),
  });

  const settingsMutation = useMutation({
    mutationFn: cvService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCv'] });
      message.success('Đã lưu cài đặt hồ sơ CV');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Cập nhật thất bại')),
  });

  const profileMutation = useMutation({
    mutationFn: cvService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCv'] });
      message.success('Đã cập nhật thông tin cá nhân');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Cập nhật thất bại')),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ section, payload }: { section: ProfileSectionName; payload: Record<string, unknown> }) =>
      cvService.createSectionItem(section, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCv'] });
      message.success('Đã thêm mục hồ sơ');
    },
    onError: (err) => message.error(getErrorMessage(err, 'Không thể thêm mục hồ sơ')),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ section, id }: { section: ProfileSectionName; id: string }) =>
      cvService.deleteSectionItem(section, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCv'] });
      message.success('Đã xóa mục hồ sơ');
    },
  });

  if (isLoading || !cv) {
    return (
      <div className="container section">
        <Card>Đang tải hồ sơ CV của bạn...</Card>
      </div>
    );
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await cvService.downloadPdfBlob(`/cv/me/pdf?template=${cv.profile.cvTemplate}`);
    } catch (err) {
      message.error(getErrorMessage(err, 'Không thể xuất file PDF'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container section">
      <div className="section__head">
        <div>
          <h1 className="section__title">Quản lý hồ sơ CV trực tuyến</h1>
          <p className="section__subtitle">
            Tạo, chọn mẫu, chia sẻ liên kết hoặc xuất file PDF chất lượng cao
          </p>
        </div>
        <Space wrap>
          <Select<CvTemplateType>
            value={cv.profile.cvTemplate}
            onChange={(val) => settingsMutation.mutate({ cvTemplate: val })}
            options={[
              { value: 'modern', label: 'Mẫu Hiện đại (Modern)' },
              { value: 'classic', label: 'Mẫu Cổ điển (Classic)' },
              { value: 'minimal', label: 'Mẫu Tối giản (Minimal)' },
            ]}
          />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownloadPdf}
          >
            Xuất CV PDF
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 14, marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ minWidth: 240, flex: 1 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600 }}>Độ hoàn thiện hồ sơ</p>
            <Progress percent={cv.completeness} status="active" />
          </div>

          <Space wrap>
            <span>Chia sẻ công khai:</span>
            <Switch
              checked={cv.profile.isCvPublic}
              onChange={(checked) => settingsMutation.mutate({ isCvPublic: checked })}
            />
            {cv.shareUrl && (
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(cv.shareUrl!);
                  message.success('Đã sao chép liên kết chia sẻ CV');
                }}
              >
                Sao chép link CV
              </Button>
            )}
            <Upload
              maxCount={1}
              showUploadList={false}
              beforeUpload={async (file) => {
                try {
                  const res = await cvService.uploadFile(file, 'avatar');
                  await profileMutation.mutateAsync({ avatar: res.key });
                } catch (err) {
                  message.error(getErrorMessage(err, 'Tải ảnh đại diện thất bại'));
                }
                return false;
              }}
            >
              <Button size="small" icon={<UploadOutlined />}>
                Ảnh đại diện
              </Button>
            </Upload>
          </Space>
        </div>
      </Card>

      <Card style={{ borderRadius: 14, marginBottom: 24 }} title="Thông tin cơ bản & Định hướng nghề nghiệp">
        <Form
          layout="vertical"
          initialValues={{
            fullName: cv.profile.fullName,
            phone: cv.profile.phone,
            desiredTitle: cv.profile.desiredTitle,
            desiredLevel: cv.profile.desiredLevel,
            desiredSalaryMin: cv.profile.desiredSalaryMin,
            desiredLocation: cv.profile.desiredLocation,
            skillsText: (cv.profile.skills || []).join(', '),
            bio: cv.profile.bio,
          }}
          onFinish={async (values) => {
            const skills = String(values.skillsText || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            await profileMutation.mutateAsync({
              fullName: values.fullName,
              phone: values.phone,
              desiredTitle: values.desiredTitle,
              desiredLevel: values.desiredLevel,
              desiredSalaryMin: values.desiredSalaryMin,
              desiredLocation: values.desiredLocation,
              skills,
              bio: values.bio,
            });
          }}
        >
          <div className="form-grid-2">
            <Form.Item name="fullName" label="Họ và tên">
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại">
              <Input />
            </Form.Item>
            <Form.Item name="desiredTitle" label="Vị trí ứng tuyển mong muốn">
              <Input placeholder="VD: Backend NestJS Developer" />
            </Form.Item>
            <Form.Item name="desiredLevel" label="Cấp bậc hiện tại / mong muốn">
              <Select
                allowClear
                options={[
                  { value: 'intern', label: 'Intern' },
                  { value: 'junior', label: 'Junior' },
                  { value: 'middle', label: 'Middle' },
                  { value: 'senior', label: 'Senior' },
                ]}
              />
            </Form.Item>
            <Form.Item name="desiredSalaryMin" label="Mức lương mong muốn tối thiểu (VND)">
              <InputNumber style={{ width: '100%' }} min={0} step={1000000} />
            </Form.Item>
            <Form.Item name="desiredLocation" label="Địa điểm mong muốn">
              <Input placeholder="VD: Hà Nội" />
            </Form.Item>
          </div>
          <Form.Item name="skillsText" label="Kỹ năng chuyên môn (cách nhau bởi dấu phẩy)">
            <Input placeholder="TypeScript, NestJS, React, MongoDB..." />
          </Form.Item>
          <Form.Item name="bio" label="Giới thiệu bản thân">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={profileMutation.isPending}>
            Lưu thông tin chung
          </Button>
        </Form>
      </Card>

      <Card style={{ borderRadius: 14 }}>
        <Tabs
          items={[
            {
              key: 'edu',
              label: `Học vấn (${cv.educations.length})`,
              children: (
                <>
                  {cv.educations.map((e) => (
                    <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <strong>{e.school}</strong> – {e.degree} {e.major}
                      </div>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteItemMutation.mutate({ section: 'educations', id: e._id! })}
                      />
                    </div>
                  ))}
                  <Divider />
                  <Form
                    layout="inline"
                    onFinish={(v) => {
                      addItemMutation.mutate({ section: 'educations', payload: v });
                    }}
                  >
                    <Form.Item name="school" rules={[{ required: true }]}>
                      <Input placeholder="Trường học" />
                    </Form.Item>
                    <Form.Item name="major">
                      <Input placeholder="Chuyên ngành" />
                    </Form.Item>
                    <Form.Item name="degree">
                      <Input placeholder="Bằng cấp" />
                    </Form.Item>
                    <Button type="dashed" htmlType="submit" icon={<PlusOutlined />}>
                      Thêm
                    </Button>
                  </Form>
                </>
              ),
            },
            {
              key: 'exp',
              label: `Kinh nghiệm (${cv.workExperiences.length})`,
              children: (
                <>
                  {cv.workExperiences.map((w) => (
                    <div key={w._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <strong>{w.position}</strong> tại {w.company}
                        {w.description && <p style={{ margin: '4px 0 0', color: '#64748b' }}>{w.description}</p>}
                      </div>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          deleteItemMutation.mutate({ section: 'work-experiences', id: w._id! })
                        }
                      />
                    </div>
                  ))}
                  <Divider />
                  <Form
                    layout="vertical"
                    onFinish={(v) => addItemMutation.mutate({ section: 'work-experiences', payload: v })}
                  >
                    <div className="form-grid-2">
                      <Form.Item name="position" label="Vị trí" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                      <Form.Item name="company" label="Công ty" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </div>
                    <Form.Item name="description" label="Mô tả công việc">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Button type="dashed" htmlType="submit" icon={<PlusOutlined />}>
                      Thêm kinh nghiệm
                    </Button>
                  </Form>
                </>
              ),
            },
            {
              key: 'proj',
              label: `Dự án (${cv.projects.length})`,
              children: (
                <>
                  {cv.projects.map((p) => (
                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <strong>{p.name}</strong>{' '}
                        {(p.technologies || []).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                        {p.description && <p style={{ margin: '4px 0 0', color: '#64748b' }}>{p.description}</p>}
                      </div>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteItemMutation.mutate({ section: 'projects', id: p._id! })}
                      />
                    </div>
                  ))}
                  <Divider />
                  <Form
                    layout="vertical"
                    onFinish={(v) =>
                      addItemMutation.mutate({
                        section: 'projects',
                        payload: {
                          name: v.name,
                          description: v.description,
                          url: v.url,
                          technologies: String(v.techText || '')
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  >
                    <div className="form-grid-2">
                      <Form.Item name="name" label="Tên dự án" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                      <Form.Item name="techText" label="Công nghệ (phân cách dấu phẩy)">
                        <Input placeholder="NestJS, Next.js" />
                      </Form.Item>
                    </div>
                    <Form.Item name="description" label="Mô tả">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Button type="dashed" htmlType="submit" icon={<PlusOutlined />}>
                      Thêm dự án
                    </Button>
                  </Form>
                </>
              ),
            },
            {
              key: 'lang',
              label: `Ngoại ngữ & Chứng chỉ (${cv.languages.length + cv.courses.length})`,
              children: (
                <>
                  {cv.languages.map((l) => (
                    <div key={l._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>
                        <strong>{l.name}</strong>: {l.level}
                      </span>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => deleteItemMutation.mutate({ section: 'languages', id: l._id! })}
                      />
                    </div>
                  ))}
                  <Form
                    layout="inline"
                    style={{ marginTop: 12 }}
                    onFinish={(v) => addItemMutation.mutate({ section: 'languages', payload: v })}
                  >
                    <Form.Item name="name" rules={[{ required: true }]}>
                      <Input placeholder="Ngoại ngữ (VD: Tiếng Anh)" />
                    </Form.Item>
                    <Form.Item name="level">
                      <Input placeholder="Trình độ (VD: IELTS 6.5)" />
                    </Form.Item>
                    <Button type="dashed" htmlType="submit" icon={<PlusOutlined />}>
                      Thêm ngoại ngữ
                    </Button>
                  </Form>
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
