import { api } from './client';
import { VideoStatus, VideoUploadResponse, Video } from '../types';

export const videoApi = {
  upload: async (file: File): Promise<VideoUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<VideoUploadResponse>('/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  listByUser: async (userId: string): Promise<Video[]> => {
    const response = await api.get<Video[]>(`/video/user/${userId}`);
    return response.data;
  },

  getStatus: async (jobId: string): Promise<VideoStatus> => {
    const response = await api.get<VideoStatus>(`/video/status/${jobId}`);
    return response.data;
  },

  download: async (userId: string, videoId: string): Promise<Blob> => {
    const response = await api.get(`/video/${userId}/${videoId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
