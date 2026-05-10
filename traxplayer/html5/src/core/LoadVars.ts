import { SongLoadVars, TrackToken } from './types';

export function parseLoadVars(text: string): SongLoadVars {
  const cleaned = text.trim().replace(/^\?/, '');
  const params = new URLSearchParams(cleaned);
  const data: Record<string, string> = {};

  params.forEach((value, key) => {
    data[key] = value;
  });

  return data;
}

export function parseTrack(trackData?: string): TrackToken[] {
  if (!trackData) {
    return [];
  }

  return trackData
    .split(';')
    .filter(Boolean)
    .map((entry) => {
      const [id, length] = entry.split(',');
      return {
        id: id.trim(),
        length: Number(length) || 1,
      };
    });
}
