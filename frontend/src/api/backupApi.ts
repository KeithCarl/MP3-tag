import { apiClient } from './client';

export interface BackupEntry {
  file_id: string;
  bak_path: string;
  original_path: string;
}

export const backupApi = {
  list: (path?: string): Promise<BackupEntry[]> =>
    apiClient.get('/backup/list', { params: { path } }).then((r) => r.data),

  restore: (fileId: string): Promise<void> =>
    apiClient.post(`/backup/restore/${fileId}`).then((r) => r.data),

  delete: (fileId: string): Promise<void> =>
    apiClient.delete(`/backup/${fileId}`).then((r) => r.data),
};
