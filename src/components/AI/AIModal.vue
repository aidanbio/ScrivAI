<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { ScrivNode } from '../../types';
import { useDocumentStore } from '../../stores/documentStore';

const props = defineProps<{
  visible: boolean;
  mode: 'text-to-image' | 'image-to-text';
  node: ScrivNode | null;
}>();

const emit = defineEmits<{(e: 'close'): void; (e: 'confirm', payload: any): void}>();

const store = useDocumentStore();

const instruction = ref('');
const synopsisText = ref('');
const imagePreview = ref<string | null>(null);

watch(() => props.visible, (newVal) => {
  if (newVal && props.node) {
    if (props.mode === 'image-to-text') {
      instruction.value = '';
      imagePreview.value = props.node.synopsisImage || null;
    } else {
      synopsisText.value = props.node.synopsis || '';
    }
  }
});

const title = computed(() => {
  return props.mode === 'image-to-text' ? 'Generate Text using Image' : 'Generate Image';
});

const handleConfirm = () => {
    const payload = props.mode === 'image-to-text' ? { instruction: instruction.value } : { synopsis: synopsisText.value };
    emit('confirm', payload);
};

const handleCancel = () => {
    emit('close');
};

const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0] && props.node) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            imagePreview.value = result;
            // Sync with store immediately
            if (props.node) {
                store.updateNode(props.node.id, { synopsisImage: result });
            }
        };
        reader.readAsDataURL(file);
    }
}

</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.stop>
    <div class="modal-content">
      <h2>{{ title }}</h2>
      
      <div v-if="mode === 'image-to-text'" class="content-body">
        <div class="image-area">
            <img v-if="imagePreview" :src="imagePreview" alt="Synopsis Image" class="preview-image" />
            <div v-else class="upload-placeholder">
                <p>No image attached.</p>
                <input type="file" @change="handleFileUpload" accept="image/*" />
            </div>
        </div>
        <div class="input-area">
            <label>Additional Instructions:</label>
            <textarea v-model="instruction" placeholder="Enter instructions (e.g., 'Describe the characters in detail...')"></textarea>
        </div>
      </div>

      <div v-else class="content-body">
         <div class="input-area">
            <label>Synopsis:</label>
            <textarea v-model="synopsisText" readonly class="readonly-textarea"></textarea>
            <p class="hint">This text will be used to generate the image.</p>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="handleCancel" class="btn-cancel">Cancel</button>
        <button @click="handleConfirm" class="btn-confirm">Confirm</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.2rem;
    color: #333;
}

.content-body {
    margin-bottom: 20px;
}

.image-area {
    margin-bottom: 15px;
    text-align: center;
    border: 1px dashed #ccc;
    padding: 10px;
    border-radius: 4px;
    min-height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
}

.input-area {
    display: flex;
    flex-direction: column;
}

.input-area label {
    margin-bottom: 5px;
    font-weight: bold;
    font-size: 0.9rem;
}

textarea {
    /* width: 100%; */
    height: 100px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
}

.readonly-textarea {
    background-color: #f9f9f9;
    color: #555;
}

.hint {
    font-size: 0.8rem;
    color: #888;
    margin-top: 5px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancel {
  background-color: #e0e0e0;
  color: #333;
}

.btn-confirm {
  background-color: #007bff;
  color: white;
}

.btn-confirm:hover {
  background-color: #0056b3;
}
</style>
