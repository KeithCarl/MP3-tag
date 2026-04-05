import { apiClient } from './client';
import type { TagData } from '../types/mp3File';
import type { TagDiffResult } from '../types/musicbrainz';

export type ID3VersionOption = 'id3v1.1' | 'id3v2.3' | 'id3v2.4';

export interface TagWriteRequest {
  tags: TagData;
  id3_version: ID3VersionOption;
  dry_run?: boolean;
  backup?: boolean;
}

export interface BatchTagWriteRequest {
  file_ids: string[];
  tags: TagData;
  id3_version: ID3VersionOption;
  dry_run?: boolean;
  backup?: boolean;
}

export const tagsApi = {
  writeTags: (fileId: string, req: TagWriteRequest): Promise<TagDiffResult> =>
    apiClient.put(`/tags/${fileId}`, req).then((r) => r.data),

  batchWrite: (req: BatchTagWriteRequest): Promise<TagDiffResult[]> =>
    apiClient.post('/tags/batch', req).then((r) => r.data),

  preview: (req: BatchTagWriteRequest): Promise<TagDiffResult[]> =>
    apiClient.post('/tags/preview', { ...req, dry_run: true }).then((r) => r.data),
};
