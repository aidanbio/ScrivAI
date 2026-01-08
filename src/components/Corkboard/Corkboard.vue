<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useDocumentStore } from '../../stores/documentStore';
import IndexCard from './IndexCard.vue';
import AIModal from '../AI/AIModal.vue';
import type { ScrivNode } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const store = useDocumentStore();

const emit = defineEmits<{
  (e: 'node-dblclick', id: string): void
}>();

const activeNode = computed(() => store.activeNode);
const children = computed(() => activeNode.value?.children || []);

// Context Menu State
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  nodeId: null as string | null
});

// AI Modal State
const aiModal = ref({
  visible: false,
  mode: 'text-to-image' as 'text-to-image' | 'image-to-text' | 'batch-generate',
  node: null as ScrivNode | null,
  contextNodes: [] as ScrivNode[]
});

const handleCardContextMenu = ({ event, nodeId }: { event: MouseEvent, nodeId: string }) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    nodeId: nodeId
  };
};

const closeContextMenu = () => {
  contextMenu.value.visible = false;
};

const openAIModal = (mode: 'text-to-image' | 'image-to-text') => {
  const nodeId = contextMenu.value.nodeId;
  const node = children.value.find(n => n.id === nodeId);
  
  if (node) {
    aiModal.value = {
      visible: true,
      mode: mode,
      node: node,
      contextNodes: []
    };
  }
  closeContextMenu();
};

const openBatchGenerateModal = () => {
    aiModal.value = {
        visible: true,
        mode: 'batch-generate',
        node: null,
        contextNodes: children.value // Pass current view items as context
    };
};

const handleNewItem = () => {
    // Determine parent ID: if activeNode is set, use it. Otherwise root.
    const parentId = activeNode.value ? activeNode.value.id : null;
    const newNode = store.addNode(parentId);
    emit('node-dblclick', newNode.id);
};

const closeAIModal = () => {
  aiModal.value.visible = false;
  aiModal.value.node = null;
  aiModal.value.contextNodes = [];
};

const confirmAIModal = (payload: any) => {
  console.log('AI Generation Confirmed:', payload);
  
  if (aiModal.value.mode === 'batch-generate') {
      // Create new node with generated content
      const parentId = activeNode.value ? activeNode.value.id : null;
      
      const newNode: ScrivNode = {
        id: uuidv4(),
        title: payload.title || 'AI Generated Item',
        body: payload.body || '',
        synopsis: payload.synopsis || '',
        status: 'Draft',
        children: [],
        parentId: parentId,
      };

      if (activeNode.value) {
          activeNode.value.children.push(newNode);
      } else {
          store.nodes.push(newNode);
      }
      
      // Navigate to the new node
      emit('node-dblclick', newNode.id);
  } else {
      // Existing logic for single item updates (not fully implemented in backend yet in this snippet, but handled in AIModal visually)
      // If we had logic to update keys based on payload for image/text gen:
      // const node = aiModal.value.node;
      // if (node && payload.synopsis) store.updateNode(node.id, { synopsis: payload.synopsis });
      // if (node && payload.instruction) ... (handled in AIModal for image generation mostly)
  }
  
  closeAIModal();
};

const handleBackgroundClick = () => {
  store.setSelectedNode(null);
};

const handleCardClick = (id: string) => {
  store.setSelectedNode(id);
};

const onGlobalClick = () => {
  if (contextMenu.value.visible) {
    closeContextMenu();
  }
};

const handleCardDoubleClick = (id: string) => {
  emit('node-dblclick', id);
};

onMounted(() => {
  window.addEventListener('click', onGlobalClick);
});

onUnmounted(() => {
  window.removeEventListener('click', onGlobalClick);
});

</script>

<template>
  <div class="corkboard" @click="handleBackgroundClick">
    <div class="cards-grid">
      <IndexCard 
        v-for="child in children" 
        :key="child.id" 
        :node="child"
        :is-selected="store.selectedNodeId === child.id"
        @context-menu="handleCardContextMenu"
        @click.stop="handleCardClick(child.id)"
        @dblclick.stop="handleCardDoubleClick(child.id)"
      />
      
      <!-- Action Buttons -->
      <div class="action-card new-card" @click.stop="handleNewItem">
          <div class="icon">+</div>
          <div class="label">New</div>
      </div>
      
      <div class="action-card generate-card" @click.stop="openBatchGenerateModal">
          <div class="icon">✨</div>
          <div class="label">Generate...</div>
      </div>
    </div>
    
    <div v-if="children.length === 0" class="empty-state-hint">
       <!-- Removed main empty state block to allow buttons to be always visible at top/start -->
    </div>

    <!-- Context Menu -->
    <div 
      v-if="contextMenu.visible" 
      class="context-menu" 
      :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
      @click.stop
    >
      <div class="menu-item" @click="openAIModal('image-to-text')">
        ✨ Generate Text using Image...
      </div>
      <div class="menu-item" @click="openAIModal('text-to-image')">
        ✨ Generate Image...
      </div>
    </div>

    <!-- AI Modal -->
    <AIModal 
      :visible="aiModal.visible"
      :mode="aiModal.mode"
      :node="aiModal.node"
      :context-nodes="aiModal.contextNodes"
      @close="closeAIModal"
      @confirm="confirmAIModal"
    />
  </div>
</template>

<style scoped>
.corkboard {
  padding: 20px;
  background-color: #f5f5f5; /* Cork texture color ideally */
  height: 100%;
  overflow-y: auto;
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
}

.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-content: flex-start;
}



.action-card {
    width: 200px; /* Same as IndexCard usually */
    height: 140px;
    background: rgba(255, 255, 255, 0.5);
    border: 2px dashed #ccc;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    color: #666;
}

.action-card:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: #999;
    color: #333;
    transform: translateY(-2px);
}

.action-card .icon {
    font-size: 2rem;
    margin-bottom: 5px;
}

.action-card .label {
    font-weight: bold;
    font-size: 0.9rem;
}

.new-card:hover {
    border-color: #4CAF50;
    color: #4CAF50;
}

.generate-card:hover {
    border-color: #9C27B0;
    color: #9C27B0; /* AI purple */
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
  border-radius: 4px;
  padding: 5px 0;
  z-index: 1000;
  min-width: 200px;
}

.menu-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9em;
  color: #333;
}

.menu-item:hover {
  background-color: #f0f0f0;
}
</style>
