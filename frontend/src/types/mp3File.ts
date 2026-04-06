export type ID3Version = 'id3v1.1' | 'id3v2.3' | 'id3v2.4' | 'none';

export interface TagData {
  title?: string | null;
  artist?: string | null;
  album?: string | null;
  year?: string | null;
  genre?: string | null;
  track_number?: string | null;
  comment?: string | null;
  lyrics?: string | null;
}

export interface MP3FileInfo {
  file_id: string;
  filename: string;
  path: string;
  size_bytes: number;
  duration_seconds: number;
  bitrate_kbps: number;
  id3_version: ID3Version;
  tags: TagData;
}

export interface FolderNode {
  name: string;
  path: string;
  mp3_count: number;
  has_subdirs: boolean;
  children?: FolderNode[];
}

export interface ScanResponse {
  files: MP3FileInfo[];
  total: number;
  capped: boolean;
  scanned_paths: string[];
}
