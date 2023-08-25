export interface Clipping {
  title: string;
  author: string;
  highlight: string;
  page: number;
  startPosition: number;
  endPosition?: number;
  isNote: boolean;
}

export interface GroupedClipping {
  title: string;
  author: string;
  highlights: Highlight[];
}

export interface Sync {
  title: string;
  author: string;
  highlightCount: number;
}

export interface Highlight {
  highlight: string;
  page: number;
  startPosition: number;
  endPosition?: number;
  isNote: boolean;
}