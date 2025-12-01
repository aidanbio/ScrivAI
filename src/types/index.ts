export type NodeStatus = 'Draft' | 'Revised' | 'Final';

export interface ScrivNode {
  id: string;
  title: string;
  body: string; // HTML content
  synopsis: string;
  synopsisImage?: string; // Base64 encoded image
  status: NodeStatus;
  children: ScrivNode[];
  parentId: string | null;
  isFolder: boolean;
  corkboardOptions?: {
    width?: number;
    height?: number;
  };
}
