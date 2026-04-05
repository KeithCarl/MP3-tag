import { apiClient } from './client';
import type { FolderNode, MP3FileInfo, ScanResponse, TagData } from '../types/mp3File';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export type ScanEvent =
  | { type: 'file'; scanned: number; file: MP3FileInfo }
  | { type: 'done'; total: number; capped: boolean };

export async function scanStream(
  paths: string[],
  onEvent: (e: ScanEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const resp = await fetch(`${BASE_URL}/api/v1/files/scan-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
    signal,
  });
  if (!resp.ok) throw new Error(`Scan failed: ${resp.status}`);
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop()!;
    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith('data: ')) {
        try { onEvent(JSON.parse(line.slice(6))); } catch { /* skip malformed */ }
      }
    }
  }
}

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
