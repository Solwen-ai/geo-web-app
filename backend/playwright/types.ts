export type OutputRecord = {
  no: number;
  query: string;
  aio: string;
  aioBrandCompare: boolean;
  aioBrandExist: boolean;
  chatgpt: string;
  chatgptOfficialWebsiteExist: boolean;
  chatgptReference: string;
  chatgptBrandCompare: boolean;
  chatgptBrandExist: boolean;
  brandRelated: string;
  contentAnalysis: string;
  optimizeDirection: string;
  answerEngine: string;
};

// Type definitions for AiOverview
export interface Video {
  link: string;
  thumbnail: string;
  source: string;
  date: string;
}

export interface ListItem {
  title?: string;
  snippet: string;
  reference_indexes: number[];
  thumbnail?: string;
  list?: ListItem[];
}

export interface TableCell {
  [key: string]: string;
}

export interface TextBlock {
  type: "heading" | "paragraph" | "list" | "expandable" | "table";
  snippet: string;
  snippet_highlighted_words?: string[];
  reference_indexes: number[];
  thumbnail?: string;
  video?: Video;
  list?: ListItem[];
  table?: string[][];
  formatted?: any;
  text_blocks?: TextBlock[];
}

export interface Reference {
  title: string;
  link: string;
  snippet: string;
  source: string;
  index: number;
}

export interface AiOverview {
  text_blocks: TextBlock[];
  thumbnail?: string;
  references?: Reference[];
  error?: string;
  page_token?: string;
  serpapi_link?: string;
}
