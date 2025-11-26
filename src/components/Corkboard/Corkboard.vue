<script setup lang="ts">
import { computed } from 'vue';
import { useDocumentStore } from '../../stores/documentStore';
import IndexCard from './IndexCard.vue';

const store = useDocumentStore();

const activeNode = computed(() => store.activeNode);
const children = computed(() => activeNode.value?.children || []);

const onDragStart = (e: DragEvent, id: string) => {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('type', 'corkboard-card');
  }
};

const onDrop = (e: DragEvent, targetId: string) => {
  const draggedId = e.dataTransfer?.getData('text/plain');
  const type = e.dataTransfer?.getData('type');
  
  if (draggedId && draggedId !== targetId && type === 'corkboard-card') {
    // Move draggedId before targetId
    // We need to know the parent. Since we are in Corkboard of activeNode, 
    // the parent is activeNode.
    // store.moveNode handles reordering if we pass the targetId.
    // My store.moveNode implementation:
    // if position is 'before', it inserts before target.
    
    store.moveNode(draggedId, targetId, 'before');
  }
};
</script>

<template>
  <div class="corkboard">
    <div v-if="children.length > 0" class="cards-grid">
      <IndexCard 
        v-for="child in children" 
        :key="child.id" 
        :node="child"
        draggable="true"
        @dragstart="onDragStart($event, child.id)"
        @dragover.prevent
        @drop="onDrop($event, child.id)"
      />
    </div>
    <div v-else class="empty-state">
      <p>No sub-documents to display.</p>
    </div>
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
</style>
