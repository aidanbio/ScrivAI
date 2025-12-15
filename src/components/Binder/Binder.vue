<script setup lang="ts">
import { useDocumentStore } from '../../stores/documentStore';
import BinderItem from './BinderItem.vue';
import { ref } from 'vue';

const store = useDocumentStore();

const addRootItem = () => {
  store.addNode(null);
};

const fileInput = ref<HTMLInputElement | null>(null);

// ... existing code ...

const triggerUpload = () => {
  fileInput.value?.click();
};

const isDragOver = ref(false);

const processFile = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result as string;
    store.addTrunkNode(file, result);
  };
  reader.readAsDataURL(file);
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) processFile(file);
    target.value = '';
  }
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = true;
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const onDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }
};

const onPaste = (e: ClipboardEvent) => {
  if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
    e.preventDefault();
    const file = e.clipboardData.files[0];
    if (file) processFile(file);
  }
};
</script>

<template>
  <div class="binder">
    <div class="binder-header">
      <h2>Binder</h2>
      <div class="binder-actions">
        <button @click="addRootItem" title="New Item">+ Item</button>
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
    
    <div 
      class="trunk-section"
      :class="{ 'drag-over': isDragOver }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @paste="onPaste"
      tabindex="0"
    >
      <div class="binder-header trunk-header">
        <h2>Trunk</h2>
        <div class="binder-actions">
          <button @click="triggerUpload" title="Upload File">+File</button>
          <input 
            type="file" 
            ref="fileInput" 
            style="display: none" 
            @change="handleFileUpload"
          />
        </div>
      </div>
      <div class="binder-content trunk-content">
        <BinderItem 
          v-for="node in store.trunkNodes" 
          :key="node.id" 
          :node="node" 
          :depth="0" 
        />
      </div>
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

.trunk-section {
  border-top: 2px solid #ccc;
  display: flex;
  flex-direction: column;
  height: 30%;
  min-height: 150px;
}

.trunk-header {
  background-color: #eee;
}

.trunk-content {
  background-color: #f0f0f0;
}

.trunk-section.drag-over {
  border: 2px dashed #2196f3;
  background-color: #e3f2fd;
}

.trunk-section:focus {
  outline: none; /* Remove default focus outline */
  border-color: #aaa; /* Optional: show focus state */
}
</style>
