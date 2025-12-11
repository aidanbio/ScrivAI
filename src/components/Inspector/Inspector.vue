<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDocumentStore } from '../../stores/documentStore';
import type { NodeStatus } from '../../types';

const store = useDocumentStore();
const fileInput = ref<HTMLInputElement | null>(null);

const activeNode = computed(() => store.selectedNode || store.activeNode);

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

const processImage = (file: File) => {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result && activeNode.value) {
      store.updateNode(activeNode.value.id, { synopsisImage: e.target.result as string });
    }
  };
  reader.readAsDataURL(file);
};

const handleImageUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    processImage(target.files[0]);
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    processImage(e.dataTransfer.files[0]);
  }
};

const handlePaste = (e: ClipboardEvent) => {
  if (e.clipboardData?.files && e.clipboardData.files[0]) {
    e.preventDefault();
    processImage(e.clipboardData.files[0]);
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const removeImage = () => {
  if (activeNode.value) {
    store.updateNode(activeNode.value.id, { synopsisImage: undefined });
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
        <div 
          class="synopsis-container"
          @drop="handleDrop"
          @dragover.prevent
          @paste="handlePaste"
        >
          <div v-if="activeNode.synopsisImage" class="image-preview">
            <img :src="activeNode.synopsisImage" alt="Synopsis Image" />
            <button @click="removeImage" class="remove-btn" title="Remove Image">×</button>
          </div>
          <div v-else class="image-placeholder" @click="triggerFileUpload">
            <span>Drop image here or click to upload</span>
          </div>
          <input 
            type="file" 
            ref="fileInput" 
            @change="handleImageUpload" 
            accept="image/*" 
            style="display: none;" 
          />
          <textarea 
            :value="activeNode.synopsis" 
            @input="updateSynopsis" 
            rows="10"
            placeholder="Enter synopsis..."
          ></textarea>
        </div>
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
  width: 100%;
  box-sizing: border-box;
}

.synopsis-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-preview {
  position: relative;
  width: 100%;
  max-height: 200px;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.remove-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

.image-placeholder {
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  color: #888;
  cursor: pointer;
  transition: border-color 0.2s;
}

.image-placeholder:hover {
  border-color: #aaa;
}

.empty-state {
  text-align: center;
  color: #888;
  margin-top: 50px;
}
</style>
