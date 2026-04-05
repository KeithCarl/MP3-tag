import { useState, useEffect, useRef } from 'react';
import { renameApi } from '../api/renameApi';
import type { RenameRule, RenamePreviewResponse } from '../types/rename';

export function useRenamePreview(fileIds: string[], rule: RenameRule | null, debounceMs = 400) {
  const [preview, setPreview] = useState<RenamePreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!rule || !rule.pattern || fileIds.length === 0) {
      setPreview(null);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await renameApi.preview(fileIds, rule);
        setPreview(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Preview failed');
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fileIds, rule, debounceMs]);

  return { preview, loading, error };
}
