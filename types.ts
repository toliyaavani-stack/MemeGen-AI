export interface MemeText {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  strokeColor: string;
  isDragging?: boolean;
}

export interface GeneratedCaption {
  text: string;
  category?: string;
}

export interface AnalysisResult {
  title: string;
  description: string;
  tags: string[];
}

export enum AppMode {
  CAPTION = 'CAPTION',
  EDIT = 'EDIT',
  ANALYZE = 'ANALYZE',
}
