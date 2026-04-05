export type RenameMode = 'template' | 'regex';

export interface RenameRule {
  mode: RenameMode;
  pattern: string;
  replacement?: string;
}

export interface RenamePreviewItem {
  file_id: string;
  old_name: string;
  new_name: string;
  conflict: boolean;
}

export interface RenamePreviewResponse {
  previews: RenamePreviewItem[];
  has_conflicts: boolean;
}
