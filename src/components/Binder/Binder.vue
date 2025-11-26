<script setup lang="ts">
import { useDocumentStore } from '../../stores/documentStore';
import BinderItem from './BinderItem.vue';

const store = useDocumentStore();

const addRootFolder = () => {
  store.addNode(null, true);
};

const addRootFile = () => {
  store.addNode(null, false);
};
</script>

<template>
  <div class="binder">
    <div class="binder-header">
      <h2>Binder</h2>
      <div class="binder-actions">
        <button @click="addRootFile" title="New Document">+Doc</button>
        <button @click="addRootFolder" title="New Folder">+Folder</button>
      </div>
    </div>
    <div class="binder-content">
      <BinderItem 
        v-for="node in store.nodes" 
        :key="node.id" 
        :node="node" 
        :depth="0" 
      />
    </div>
  </div>
</template>

<style scoped>
.binder {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid #ccc;
  background-color: #f9f9f9;
}

.binder-header {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.binder-header h2 {
  margin: 0;
  font-size: 1.2em;
}

.binder-actions button {
  margin-left: 5px;
  padding: 4px 8px;
  cursor: pointer;
}

.binder-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px 0;
}
</style>
