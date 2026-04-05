export interface MBRecording {
  recording_mbid: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
  track_number?: string;
  release_mbid?: string;
  score: number;
}

export interface TagDiffField {
  field: string;
  old_value: string | null;
  new_value: string | null;
}

export interface TagDiffResult {
  file_id: string;
  filename: string;
  changes: TagDiffField[];
}
