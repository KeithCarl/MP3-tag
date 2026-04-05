import { apiClient } from './client';
import type { MBRecording } from '../types/musicbrainz';
import type { TagDiffResult } from '../types/musicbrainz';
import type { ID3VersionOption } from './tagsApi';

export const musicbrainzApi = {
  search: (params: { title?: string; artist?: string; album?: string; limit?: number }): Promise<MBRecording[]> =>
    apiClient.get('/musicbrainz/search', { params }).then((r) => r.data),

  apply: (params: {
    file_ids: string[];
    recording_mbid?: string;
    release_mbid?: string;
    track_number?: number;
    id3_version?: ID3VersionOption;
    dry_run?: boolean;
    backup?: boolean;
  }): Promise<TagDiffResult[]> =>
    apiClient.post('/musicbrainz/apply', params).then((r) => r.data),
};
