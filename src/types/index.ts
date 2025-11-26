export type NodeStatus = 'Draft' | 'Revised' | 'Final';

export interface ScrivNode {
  id: string;
  title: string;
  body: string; // HTML content
  synopsis: string;
  status: NodeStatus;
  children: ScrivNode[];
  parentId: string | null;
  isFolder: boolean;
}
