import { useState } from 'react';
import { musicbrainzApi } from '../api/musicbrainzApi';
import type { MBRecording } from '../types/musicbrainz';

export function useMusicBrainz() {
  const [results, setResults] = useState<MBRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (params: { title?: string; artist?: string; album?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await musicbrainzApi.search({ ...params, limit: 10 });
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
}
