export type BBox = [number, number, number, number]; // [west, south, east, north]

export type Filters = {
  bbox: BBox | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  cloudLt: number; // 0-100
  collections: string[];
};

export type NormalizedItem = {
  id: string;
  bbox?: BBox;
  geometry?: any;
  datetime?: string;
  thumbnail?: string | null;
  collection?: string;
  cloudCover?: number | null;
  raw: any;
};

export type StoreError = {
  code: 'E01_NETWORK' | 'E02_EMPTY' | 'E03_PARSE';
  message: string;
};
