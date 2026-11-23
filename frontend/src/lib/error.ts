import { isAxiosError } from 'axios';

/** Extract a user-friendly message from an API error (NestJS returns string or string[]). */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra backend đang chạy.';
    }
    const message = (error.response.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message) && message.length > 0) return message[0];
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
