<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { ScrivNode } from '../../types';
import { useDocumentStore } from '../../stores/documentStore';
import { generateItemFromContext } from '../../services/geminiService';

const props = defineProps<{
  visible: boolean;
  mode: 'text-to-image' | 'image-to-text' | 'batch-generate';
  node: ScrivNode | null;
  contextNodes?: ScrivNode[]; // For batch-generate
}>();

const emit = defineEmits<{(e: 'close'): void; (e: 'confirm', payload: any): void}>();

const store = useDocumentStore();

const instruction = ref('');
const synopsisText = ref('');
const imagePreview = ref<string | null>(null);
const apiKey = ref('');
const isGenerating = ref(false);
const errorMsg = ref('');

interface LocalContextItem {
    original: ScrivNode;
    included: boolean;
}

const localContextItems = ref<LocalContextItem[]>([]);

watch(() => props.visible, (newVal) => {
  if (newVal) {
    errorMsg.value = '';
    if (props.mode === 'image-to-text' && props.node) {
      instruction.value = '';
      imagePreview.value = props.node.synopsisImage || null;
    } else if (props.mode === 'text-to-image' && props.node) {
      synopsisText.value = props.node.synopsis || '';
    } else if (props.mode === 'batch-generate') {
      instruction.value = '';
      // Initialize local context items
      localContextItems.value = (props.contextNodes || []).map(node => ({
        original: node,
        included: true
      }));
    }
  }
});

const title = computed(() => {
  if (props.mode === 'image-to-text') return 'Generate Text using Image';
  if (props.mode === 'text-to-image') return 'Generate Image';
  return 'Generate New Item with AI';
});

const handleConfirm = async () => {
    errorMsg.value = '';
    if (props.mode === 'batch-generate') {
        if (!apiKey.value.trim()) {
            errorMsg.value = 'Please enter a Gemini API Key.';
            return;
        }

        isGenerating.value = true;
        try {
            const context = localContextItems.value
                .filter(item => item.included)
                .map(item => ({
                    title: item.original.title,
                    synopsis: item.original.synopsis || '',
                    body: item.original.body
                }));

            const result = await generateItemFromContext(apiKey.value, context, instruction.value);
            emit('confirm', result);
        } catch (e: any) {
            errorMsg.value = e.message || 'Failed to generate content.';
        } finally {
            isGenerating.value = false;
        }
        return;
    }

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

const toggleInclude = (index: number) => {
    if (localContextItems.value[index]) {
        localContextItems.value[index].included = !localContextItems.value[index].included;
    }
};

const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
        const item = localContextItems.value[index];
        if (item) {
            localContextItems.value.splice(index, 1);
            localContextItems.value.splice(index - 1, 0, item);
        }
    } else if (direction === 'down' && index < localContextItems.value.length - 1) {
        const item = localContextItems.value[index];
        if (item) {
            localContextItems.value.splice(index, 1);
            localContextItems.value.splice(index + 1, 0, item);
        }
    }
};

</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.stop>
    <div class="modal-content" :class="{ 'wide-modal': mode === 'batch-generate' }">
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

      <div v-else-if="mode === 'text-to-image'" class="content-body">
         <div class="input-area">
            <label>Synopsis:</label>
            <textarea v-model="synopsisText" readonly class="readonly-textarea"></textarea>
            <p class="hint">This text will be used to generate the image.</p>
        </div>
      </div>

      <div v-else-if="mode === 'batch-generate'" class="content-body">
         <div class="context-list">
             <label>Context Items (Active View):</label>
             <div class="items-preview">
                 <div 
                    v-for="(item, index) in localContextItems" 
                    :key="item.original.id" 
                    class="context-item"
                    :class="{ 'excluded': !item.included }"
                 >
                     <div class="item-controls">
                        <input 
                            type="checkbox" 
                            :checked="item.included" 
                            @change="toggleInclude(index)"
                            title="Include/Exclude"
                        />
                     </div>
                     <div class="item-content">
                         <strong>{{ item.original.title }}</strong>
                         <p>{{ item.original.synopsis || '(No synopsis)' }}</p>
                     </div>
                     <div class="item-reorder">
                         <button @click="moveItem(index, 'up')" :disabled="index === 0" title="Move Up">↑</button>
                         <button @click="moveItem(index, 'down')" :disabled="index === localContextItems.length - 1" title="Move Down">↓</button>
                     </div>
                 </div>
                 <div v-if="localContextItems.length === 0" class="no-context">
                     No items in current view. AI will start fresh.
                 </div>
             </div>
         </div>
         <div class="input-area">
             <label>Gemini API Key:</label>
             <input type="password" v-model="apiKey" placeholder="Enter your Gemini API Key" class="api-input" />
         </div>
         <div class="input-area">
            <label>Instructions for New Item:</label>
            <textarea v-model="instruction" placeholder="E.g., 'Create a plot twist involving the main character...'"></textarea>
         </div>
         <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </div>

      <div class="modal-actions">
        <button @click="handleCancel" class="btn-cancel" :disabled="isGenerating">Cancel</button>
        <button @click="handleConfirm" class="btn-confirm" :disabled="isGenerating">
            {{ isGenerating ? 'Generating...' : 'Confirm' }}
        </button>
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
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.wide-modal {
    width: 600px;
}

h2 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.2rem;
    color: #333;
}

.content-body {
    margin-bottom: 20px;
    overflow-y: auto;
    flex: 1;
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
    margin-bottom: 12px;
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

.api-input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
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

.context-list {
    margin-bottom: 15px;
}

.context-list label {
    font-weight: bold;
    display: block;
    margin-bottom: 5px;
}

.items-preview {
    max-height: 150px;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 8px;
    background: #f9f9f9;
}

.context-item {
    padding: 6px;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background-color 0.2s;
}

.context-item.excluded {
    background-color: #e0e0e0;
    opacity: 0.6;
}

.item-controls {
    display: flex;
    align-items: center;
}

.item-content {
    flex: 1;
    overflow: hidden;
}

.item-reorder {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.item-reorder button {
    padding: 0 4px;
    font-size: 0.7rem;
    line-height: 1;
    height: 16px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    cursor: pointer;
}

.item-reorder button:hover:not(:disabled) {
    background: #e0e0e0;
}

.item-reorder button:disabled {
    opacity: 0.3;
    cursor: default;
}

.no-context {
    color: #999;
    font-style: italic;
    text-align: center;
    padding: 10px;
}

.error-msg {
    color: red;
    font-size: 0.9em;
    margin-top: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: auto;
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

.btn-confirm:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
</style>
