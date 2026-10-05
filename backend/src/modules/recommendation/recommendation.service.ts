import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommendationService {

  /**
   * Thuật toán chấm điểm ứng viên (tối đa 105 điểm):
   *  kỹ năng 35 | kinh nghiệm 25 | cấp độ 10 | dự án 10 | chức danh 5 |
   *  lương 5 | địa điểm 5 | học vấn 5 | chất lượng hồ sơ 5
   * Phân loại: EXCELLENT >=85% | GOOD 65-84% | FAIR 45-64% | WEAK <45%
   */
  async recommendCandidates(jobId: string, page = 1, limit = 10) {
    // TODO (Tuấn): lấy job, lấy hồ sơ ứng viên, chấm điểm từng tiêu chí, sắp xếp, phân trang
    return { jobId, page, limit, items: [] };
  }

  classify(percent: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'WEAK' {
    if (percent >= 85) return 'EXCELLENT';
    if (percent >= 65) return 'GOOD';
    if (percent >= 45) return 'FAIR';
    return 'WEAK';
  }

  /** Chuẩn hóa văn bản: chữ thường, bỏ dấu tiếng Việt, bỏ ký tự thừa */
  normalize(text = ''): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

}
