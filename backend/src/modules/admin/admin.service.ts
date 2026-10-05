import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {

  /** TODO (Tuấn): danh sách người dùng, khóa/mở khóa, cấp quyền */
  listUsers(page = 1, limit = 10) { return { page, limit, items: [] }; }

  /** TODO (Tuấn): duyệt/từ chối tin -> cập nhật jobs.status; nếu approved thì index vào Elasticsearch */
  moderateJob(id: string, approve: boolean, reason?: string) { return { id, approve, reason }; }

  /** TODO (Tuấn): thống kê doanh thu VNPay, số tin, số người dùng */
  report() { return { revenue: 0, users: 0, jobs: 0 }; }

}
