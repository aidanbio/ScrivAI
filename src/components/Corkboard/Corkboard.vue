<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useDocumentStore } from '../../stores/documentStore';
import IndexCard from './IndexCard.vue';
import AIModal from '../AI/AIModal.vue';
import type { ScrivNode } from '../../types';

const store = useDocumentStore();

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
  mode: 'text-to-image' as 'text-to-image' | 'image-to-text',
  node: null as ScrivNode | null
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
      node: node
    };
  }
  closeContextMenu();
};

const closeAIModal = () => {
  aiModal.value.visible = false;
  aiModal.value.node = null;
};

const confirmAIModal = (payload: any) => {
  console.log('AI Generation Confirmed:', payload);
  // Future implementation: call AI service here
  closeAIModal();
};

const onGlobalClick = () => {
  if (contextMenu.value.visible) {
    closeContextMenu();
  }
};

onMounted(() => {
  window.addEventListener('click', onGlobalClick);
});

onUnmounted(() => {
  window.removeEventListener('click', onGlobalClick);
});

</script>

<template>
  <div class="corkboard">
    <div v-if="children.length > 0" class="cards-grid">
      <IndexCard 
        v-for="child in children" 
        :key="child.id" 
        :node="child"
        @context-menu="handleCardContextMenu"
      />
    </div>
    <div v-else class="empty-state">
      <p>No sub-documents to display.</p>
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

.empty-state {
  text-align: center;
  color: #888;
  margin-top: 50px;
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
