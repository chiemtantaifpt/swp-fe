import api from "./api";

export interface UploadImageResponse {
  url: string;
  publicId: string;
}

export interface UploadMultipleImagesResponse {
  uploaded: UploadImageResponse[];
  errors: string[];
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

  // POST /api/Image/upload-multiple — Upload nhiều ảnh, trả về { uploaded: [...], errors: [...] }
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
};
