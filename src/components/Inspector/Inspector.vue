<script setup lang="ts">
import { computed } from 'vue';
import { useDocumentStore } from '../../stores/documentStore';
import type { NodeStatus } from '../../types';

const store = useDocumentStore();

const activeNode = computed(() => store.activeNode);

const updateSynopsis = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  if (activeNode.value) {
    store.updateNode(activeNode.value.id, { synopsis: target.value });
  }
};

const updateStatus = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  if (activeNode.value) {
    store.updateNode(activeNode.value.id, { status: target.value as NodeStatus });
  }
};

const updateTitle = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (activeNode.value) {
    store.updateNode(activeNode.value.id, { title: target.value });
  }
};
</script>

<template>
  <div class="inspector">
    <div v-if="activeNode" class="inspector-content">
      <h3>Inspector</h3>
      
      <div class="field-group">
        <label>Title</label>
        <input 
          :value="activeNode.title" 
          @input="updateTitle" 
          type="text"
        />
      </div>

      <div class="field-group">
        <label>Status</label>
        <select :value="activeNode.status" @change="updateStatus">
          <option value="Draft">Draft</option>
          <option value="Revised">Revised</option>
          <option value="Final">Final</option>
        </select>
      </div>

      <div class="field-group">
        <label>Synopsis</label>
        <textarea 
          :value="activeNode.synopsis" 
          @input="updateSynopsis" 
          rows="10"
          placeholder="Enter synopsis..."
        ></textarea>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>No document selected</p>
    </div>
  </div>
</template>

<style scoped>
.inspector {
  padding: 10px;
  background-color: #f9f9f9;
  border-left: 1px solid #ccc;
  height: 100%;
  overflow-y: auto;
}

.inspector-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  font-weight: bold;
  font-size: 0.9em;
  color: #555;
}

input, select, textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

textarea {
  resize: vertical;
}

.empty-state {
  text-align: center;
  color: #888;
  margin-top: 50px;
}
</style>
