'use client';

import { useState } from 'react';
import { AutoComplete, Button, Card, Empty, Pagination, Select, Skeleton, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import JobCardItem from '@/components/common/JobCardItem';
import { searchService } from '@/services/search.service';
import type { Category, Job, PaginatedResponse } from '@/types';

interface Props {
  initialJobs: PaginatedResponse<Job>;
  categories: Category[];
  initialFilters: {
    q?: string;
    category?: string;
    location?: string;
    workMode?: string;
    level?: string;
  };
}

export default function JobsSearchClient({ initialJobs, categories, initialFilters }: Props) {
  const [q, setQ] = useState(initialFilters.q || '');
  const [category, setCategory] = useState<string | undefined>(initialFilters.category);
  const [location, setLocation] = useState<string | undefined>(initialFilters.location);
  const [workMode, setWorkMode] = useState<string | undefined>(initialFilters.workMode);
  const [level, setLevel] = useState<string | undefined>(initialFilters.level);
  const [page, setPage] = useState(1);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['searchJobs', q, category, location, workMode, level, page],
    queryFn: () =>
      searchService.searchJobs({ q, category, location, workMode, level, page, limit: 10 }),
    initialData:
      page === 1 &&
      q === (initialFilters.q || '') &&
      category === initialFilters.category &&
      location === initialFilters.location &&
      !workMode &&
      !level
        ? { q, ...initialJobs }
        : undefined,
  });

  const handleSuggest = async (val: string) => {
    setQ(val);
    if (val.trim().length >= 2) {
      const res = await searchService.suggest(val).catch(() => ({ suggestions: [] }));
      setSuggestions(res.suggestions || []);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="container section">
      <div className="section__head">
        <div>
          <h1 className="section__title">Tìm kiếm việc làm</h1>
          <p className="section__subtitle">
            Tra cứu nhanh qua chỉ mục Elasticsearch (hỗ trợ tiếng Việt có dấu & không dấu)
          </p>
        </div>
        {data?.engine && <Tag color="blue">Engine: {data.engine}</Tag>}
      </div>

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          <AutoComplete
            value={q}
            options={suggestions.map((s) => ({ value: s }))}
            onSearch={handleSuggest}
            onSelect={(val) => {
              setQ(val);
              setPage(1);
            }}
            placeholder="Từ khóa, kỹ năng, vị trí..."
            size="large"
          />

          <Select
            size="large"
            allowClear
            placeholder="Ngành nghề"
            value={category}
            onChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            options={categories.map((c) => ({ value: c._id, label: c.name }))}
          />

          <Select
            size="large"
            allowClear
            placeholder="Địa điểm"
            value={location}
            onChange={(v) => {
              setLocation(v);
              setPage(1);
            }}
            options={[
              { value: 'Hà Nội', label: 'Hà Nội' },
              { value: 'Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
              { value: 'Đà Nẵng', label: 'Đà Nẵng' },
            ]}
          />

          <Select
            size="large"
            allowClear
            placeholder="Hình thức"
            value={workMode}
            onChange={(v) => {
              setWorkMode(v);
              setPage(1);
            }}
            options={[
              { value: 'onsite', label: 'Tại văn phòng' },
              { value: 'remote', label: 'Từ xa (Remote)' },
              { value: 'hybrid', label: 'Linh hoạt (Hybrid)' },
            ]}
          />

          <Select
            size="large"
            allowClear
            placeholder="Cấp bậc"
            value={level}
            onChange={(v) => {
              setLevel(v);
              setPage(1);
            }}
            options={[
              { value: 'intern', label: 'Thực tập (Intern)' },
              { value: 'junior', label: 'Junior' },
              { value: 'middle', label: 'Middle' },
              { value: 'senior', label: 'Senior' },
            ]}
          />

          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={() => setPage(1)}
          >
            Lọc kết quả
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="job-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="job-card job-card--skeleton">
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <>
          <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 14 }}>
            Tìm thấy <strong>{data.total}</strong> công việc phù hợp
          </p>
          <div className="job-grid">
            {data.items.map((job) => (
              <JobCardItem key={job._id} job={job} />
            ))}
          </div>
          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={page}
              pageSize={10}
              total={data.total}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        </>
      ) : (
        <Empty description="Không tìm thấy việc làm phù hợp với bộ lọc hiện tại" />
      )}
    </div>
  );
}
