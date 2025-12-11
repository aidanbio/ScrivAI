import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ScrivNode } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const useDocumentStore = defineStore('document', () => {
  const nodes = ref<ScrivNode[]>([]);
  const trunkNodes = ref<ScrivNode[]>([]);
  const activeNodeId = ref<string | null>(null);
  const selectedNodeId = ref<string | null>(null);
  const draggedNodeId = ref<string | null>(null);

  // Initial dummy data
  const init = () => {
    const rootFolder: ScrivNode = {
      id: uuidv4(),
      title: 'Draft',
      body: '',
      synopsis: 'Main draft folder',
      status: 'Draft',
      children: [],
      parentId: null,
      isFolder: true,
    };
    
    const chapter1: ScrivNode = {
      id: uuidv4(),
      title: 'Chapter 1',
      body: '<p>It was a dark and stormy night...</p>',
      synopsis: 'Introduction to the protagonist',
      status: 'Draft',
      children: [],
      parentId: rootFolder.id,
      isFolder: false,
    };

    rootFolder.children.push(chapter1);
    nodes.value.push(rootFolder);
    activeNodeId.value = chapter1.id;
  };

  // Getters
  const activeNode = computed(() => {
    return findNodeById(nodes.value, activeNodeId.value) || findNodeById(trunkNodes.value, activeNodeId.value);
  });

  const selectedNode = computed(() => {
    return findNodeById(nodes.value, selectedNodeId.value) || findNodeById(trunkNodes.value, selectedNodeId.value);
  });

  // Actions
  const findNodeById = (list: ScrivNode[], id: string | null): ScrivNode | undefined => {
    if (!id) return undefined;
    for (const node of list) {
      if (node.id === id) return node;
      if (node.children.length > 0) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const addNode = (parentId: string | null, isFolder: boolean = false) => {
    const newNode: ScrivNode = {
      id: uuidv4(),
      title: isFolder ? 'New Folder' : 'New Document',
      body: '',
      synopsis: '',
      status: 'Draft',
      children: [],
      parentId: parentId,
      isFolder: isFolder,
    };

    if (parentId) {
      const parent = findNodeById(nodes.value, parentId);
      if (parent) {
        parent.children.push(newNode);
        // If parent was not a folder, maybe it should be converted? 
        // Scrivener allows files to have children, effectively acting as folders.
        // But for simplicity, we respect isFolder flag or just allow any node to have children.
        // Our type definition says children: ScrivNode[], so any node can have children.
      }
    } else {
      nodes.value.push(newNode);
    }
    
    activeNodeId.value = newNode.id;
  };

  const addTrunkNode = (file: File, fileData: string) => {
    const newNode: ScrivNode = {
      id: uuidv4(),
      title: file.name,
      body: '',
      synopsis: `Uploaded ${file.type || 'File'}`,
      status: 'Draft',
      children: [],
      parentId: null,
      isFolder: false,
      fileData: fileData,
      fileType: file.type
    };
    trunkNodes.value.push(newNode);
    activeNodeId.value = newNode.id;
  };

  const deleteNode = (id: string) => {
    const removeRecursive = (list: ScrivNode[]): boolean => {
      const index = list.findIndex(n => n.id === id);
      if (index !== -1) {
        list.splice(index, 1);
        return true;
      }
      for (const node of list) {
        if (removeRecursive(node.children)) return true;
      }
      return false;
    };
    
    removeRecursive(nodes.value);
    removeRecursive(trunkNodes.value);
    if (activeNodeId.value === id) {
      activeNodeId.value = null;
    }
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null;
    }
  };

  const updateNode = (id: string, updates: Partial<ScrivNode>) => {
    const node = findNodeById(nodes.value, id) || findNodeById(trunkNodes.value, id);
    if (node) {
      Object.assign(node, updates);
    }
  };

  const setActiveNode = (id: string) => {
    activeNodeId.value = id;
    selectedNodeId.value = null; // Reset selection when navigating
  };

  const setSelectedNode = (id: string | null) => {
    selectedNodeId.value = id;
  };

  const setDraggedNodeId = (id: string | null) => {
    draggedNodeId.value = id;
  };

  const moveNode = (draggedId: string, targetId: string | null, position: 'before' | 'after' | 'inside') => {
    // Check if target is a descendant of dragged node
    const isDescendant = (parent: ScrivNode, targetId: string): boolean => {
      if (parent.id === targetId) return true;
      for (const child of parent.children) {
        if (isDescendant(child, targetId)) return true;
      }
      return false;
    };

    // We need to find the dragged node *before* removing it to check descendants
    // But we already have logic to remove it. 
    // Let's find it first without removing to check validity.
    const findNode = (list: ScrivNode[], id: string): ScrivNode | undefined => {
      for (const node of list) {
        if (node.id === id) return node;
        if (node.children.length > 0) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return undefined;
    };

    const nodeToMove = findNode(nodes.value, draggedId) || findNode(trunkNodes.value, draggedId);
    if (!nodeToMove) return; // Should not happen

    if (targetId && isDescendant(nodeToMove, targetId)) {
      console.warn('Cannot move a node into its own descendant');
      return;
    }

    // 1. Find and remove dragged node
    let draggedNode: ScrivNode | undefined;
    
    const removeNode = (list: ScrivNode[]): ScrivNode | undefined => {
      const index = list.findIndex(n => n.id === draggedId);
      if (index !== -1) {
        return list.splice(index, 1)[0];
      }
      for (const node of list) {
        const found = removeNode(node.children);
        if (found) return found;
      }
      return undefined;
    };

    // Determine which list we are operating on
    const isBinderNode = findNode(nodes.value, draggedId) !== undefined;
    const targetList = isBinderNode ? nodes.value : trunkNodes.value;

    // Prevent moving between lists for now
    if (targetId) {
      const isTargetBinder = findNode(nodes.value, targetId) !== undefined;
      if (isBinderNode !== isTargetBinder) {
        console.warn('Cannot move nodes between Binder and Trunk');
        return;
      }
    }

    draggedNode = removeNode(targetList);
    if (!draggedNode) return;

    // 2. Insert at new location
    if (!targetId) {
      // Move to root
      draggedNode.parentId = null;
      draggedNode.parentId = null;
      targetList.push(draggedNode);
      return;
    }

    // Helper to insert
    // Re-implementing insertion logic
    const insertRecursive = (list: ScrivNode[], parentId: string | null): boolean => {
      // Check if target is in this list
      const targetIndex = list.findIndex(n => n.id === targetId);
      if (targetIndex !== -1) {
        if (position === 'inside') {
          // Add to target's children
          const target = list[targetIndex];
          if (target) {
            draggedNode!.parentId = target.id;
            target.children.push(draggedNode!);
          }
        } else if (position === 'before') {
          draggedNode!.parentId = parentId;
          list.splice(targetIndex, 0, draggedNode!);
        } else if (position === 'after') {
          draggedNode!.parentId = parentId;
          list.splice(targetIndex + 1, 0, draggedNode!);
        }
        return true;
      }
      
      for (const node of list) {
        if (insertRecursive(node.children, node.id)) return true;
      }
      return false;
    };

    insertRecursive(targetList, null);
  };

  const exportProject = (): string => {
    return JSON.stringify({
      binder: nodes.value,
      trunk: trunkNodes.value
    }, null, 2);
  };

  const importProject = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        // Legacy format
        nodes.value = parsed;
        trunkNodes.value = [];
        activeNodeId.value = null;
      } else if (parsed.binder && Array.isArray(parsed.binder)) {
        // New format
        nodes.value = parsed.binder;
        trunkNodes.value = parsed.trunk || [];
        activeNodeId.value = null;
      } else {
        console.error('Invalid project file format');
        alert('Invalid project file format');
      }
    } catch (e) {
      console.error('Failed to parse project file', e);
      alert('Failed to parse project file');
    }
  };

  // Initialize store
  init();

  return {
    nodes,
    trunkNodes,
    activeNodeId,
    activeNode,
    selectedNodeId,
    selectedNode,
    addNode,
    addTrunkNode,
    deleteNode,
    updateNode,
    setActiveNode,
    setSelectedNode,
    setDraggedNodeId,
    draggedNodeId,
    moveNode,
    exportProject,
    importProject
  };
});
