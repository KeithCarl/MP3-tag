import { apiClient } from './client';
import type { FolderNode, MP3FileInfo, ScanResponse, TagData } from '../types/mp3File';

export const filesApi = {
  tree: (path: string, depth = 1): Promise<FolderNode[]> =>
    apiClient.get('/files/tree', { params: { path, depth } }).then((r) => r.data.nodes ?? r.data),

  scan: (paths: string[], limit?: number): Promise<ScanResponse> =>
    apiClient.post('/files/scan', { paths, limit }).then((r) => r.data),

  getTags: (fileId: string): Promise<TagData> =>
    apiClient.get(`/files/${fileId}/tags`).then((r) => r.data),

  getInfo: (fileId: string): Promise<MP3FileInfo> =>
    apiClient.get(`/files/${fileId}/info`).then((r) => r.data),
};
