<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ScrivNode } from '../../types';
import { useDocumentStore } from '../../stores/documentStore';

const props = defineProps<{
  node: ScrivNode;
}>();

const store = useDocumentStore();

const width = ref(props.node.corkboardOptions?.width || 200);
const height = ref(props.node.corkboardOptions?.height || 250);
const isResizing = ref(false);

const cardStyle = computed(() => ({
  width: `${width.value}px`,
  height: `${height.value}px`,
}));

const startResize = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isResizing.value = true;
  
  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = width.value;
  const startHeight = height.value;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const dx = moveEvent.clientX - startX;
    const dy = moveEvent.clientY - startY;
    
    width.value = Math.max(150, startWidth + dx); // Min width 150
    height.value = Math.max(150, startHeight + dy); // Min height 150
  };

  const onMouseUp = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // Save to store
    store.updateNode(props.node.id, {
      corkboardOptions: {
        width: width.value,
        height: height.value,
      }
    });
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};
</script>

<template>
  <div class="index-card" :style="cardStyle" :class="{ resizing: isResizing }">
    <div class="card-header">
      <span class="card-title">{{ node.title }}</span>
      <span class="card-status" :class="node.status.toLowerCase()">{{ node.status }}</span>
    </div>
    <div class="card-body">
      <div v-if="node.synopsisImage" class="card-image">
        <img :src="node.synopsisImage" alt="Synopsis Image" />
      </div>
      <p>{{ node.synopsis || 'No synopsis...' }}</p>
    </div>
    <div class="resize-handle" @mousedown="startResize"></div>
  </div>
</template>

<style scoped>
.index-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: grab;
  position: relative; /* For resize handle positioning */
}

.index-card.resizing {
  transition: none; /* Disable transition during resize for performance */
  z-index: 10;
}

.index-card:hover {
  transform: translateY(-2px);
  box-shadow: 3px 3px 8px rgba(0,0,0,0.15);
}

.index-card:active {
  cursor: grabbing;
}

.card-header {
  padding: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
  border-radius: 4px 4px 0 0;
  flex-shrink: 0;
}

.card-title {
  font-weight: bold;
  font-size: 0.9em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.card-status {
  font-size: 0.7em;
  padding: 2px 4px;
  border-radius: 3px;
  background: #eee;
}

.card-status.draft { background: #ffebee; color: #c62828; }
.card-status.revised { background: #e3f2fd; color: #1565c0; }
.card-status.final { background: #e8f5e9; color: #2e7d32; }

.card-body {
  padding: 10px;
  flex-grow: 1;
  overflow: hidden;
  font-size: 0.8em;
  color: #555;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-image {
  width: 100%;
  height: 100px;
  overflow: hidden;
  border-radius: 2px;
  flex-shrink: 0;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body p {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 15px;
  height: 15px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #ccc 50%);
  border-radius: 0 0 4px 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.index-card:hover .resize-handle {
  opacity: 1;
}
</style>
