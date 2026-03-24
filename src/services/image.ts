import api from "./api";

export interface UploadImageResponse {
  url: string;
  publicId: string;
  suggestedCategory?: "Recyclable" | "Organic" | "Hazardous" | "Other" | null;
  suggestedWasteTypeId?: string | null;
}

export interface UploadMultipleImageResult {
  fileName: string;
  url?: string;
  publicId?: string;
  suggestedCategory?: "Recyclable" | "Organic" | "Hazardous" | "Other" | null;
  suggestedWasteTypeId?: string | null;
  error?: string;
}

export interface UploadMultipleImagesResponse {
  results: UploadMultipleImageResult[];
  successCount: number;
  failureCount: number;
}

export const imageService = {
  // POST /api/Image/upload — Upload 1 ảnh, trả về { url, publicId }
  uploadOne: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const response = await api.post<UploadImageResponse>("/Image/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // POST /api/Image/upload-multiple — Upload nhiều ảnh, trả về danh sách mixed success / error
  uploadMultiple: async (files: File[]): Promise<UploadMultipleImagesResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file, file.name);
    });
    const response = await api.post<UploadMultipleImagesResponse>(
      "/Image/upload-multiple",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  deleteOne: async (publicId: string): Promise<void> => {
    await api.delete("/Image/delete", {
      params: { publicId },
    });
  },
};
