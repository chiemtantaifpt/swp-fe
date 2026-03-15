import api from "./api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceType: string;
  referenceId: string | null;
  createdTime: string;
}

export interface NotificationListResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  items: Notification[];
}

export interface NotificationListParams {
  PageNumber?: number;
  PageSize?: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationService = {
  // GET /Notification — Lấy danh sách thông báo với phân trang
  getAll: async (params?: NotificationListParams): Promise<NotificationListResponse> => {
    const response = await api.get<NotificationListResponse>("/Notification", { params });
    return response.data;
  },

  // GET /Notification/unread-count — Lấy số lượng thông báo chưa đọc
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get<UnreadCountResponse>("/Notification/unread-count");
    return response.data;
  },

  // PUT /Notification/{id}/read — Đánh dấu thông báo đã đọc
  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/Notification/${id}/read`);
  },

  // POST /Notification/read-all — Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async (): Promise<void> => {
    await api.put("/Notification/read-all");
  },
};