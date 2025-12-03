<script setup lang="ts">
import { computed } from 'vue';
import { useDocumentStore } from '../../stores/documentStore';
import IndexCard from './IndexCard.vue';

const store = useDocumentStore();

const activeNode = computed(() => store.activeNode);
const children = computed(() => activeNode.value?.children || []);

</script>

<template>
  <div class="corkboard">
    <div v-if="children.length > 0" class="cards-grid">
      <IndexCard 
        v-for="child in children" 
        :key="child.id" 
        :node="child"
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
