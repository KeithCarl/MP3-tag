import { apiClient } from './client';
import type { RenameRule, RenamePreviewResponse } from '../types/rename';

export const renameApi = {
  preview: (file_ids: string[], rule: RenameRule): Promise<RenamePreviewResponse> =>
    apiClient.post('/rename/preview', { file_ids, rule }).then((r) => r.data),

  apply: (file_ids: string[], rule: RenameRule, backup = true): Promise<RenamePreviewResponse> =>
    apiClient.post('/rename/apply', { file_ids, rule, backup }).then((r) => r.data),
};
