<script setup lang="ts">

import { ref, computed, watch } from 'vue';
import Binder from './components/Binder/Binder.vue';
import Editor from './components/Editor/Editor.vue';
import Inspector from './components/Inspector/Inspector.vue';
import Corkboard from './components/Corkboard/Corkboard.vue';
import ToastNotification from './components/Common/ToastNotification.vue';
import { useDocumentStore } from './stores/documentStore';
import { apiClient } from './api/client';
import { useNotificationStore } from './stores/notificationStore';

const store = useDocumentStore();
const notificationStore = useNotificationStore();
const viewMode = ref<'editor' | 'corkboard' | 'scrivenings'>('editor');

const activeNode = computed(() => store.activeNode);

const toggleView = (mode: 'editor' | 'corkboard' | 'scrivenings') => {
  viewMode.value = mode;
};

watch(activeNode, (newNode) => {
  if (newNode) {
    // Optional: Default to Editor, or remember last view
  }
});

const handleExport = async () => {
  try {
    const blob = await apiClient.downloadDB();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scrivai.db'; // SQLite DB file name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notificationStore.addNotification('Database downloaded successfully', 'success');
  } catch (error) {
    console.error('Failed to download database', error);
    notificationStore.addNotification('Failed to download database', 'error');
  }
};

const handleImport = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.db,.sqlite,.sqlite3'; // Accept SQLite DB files
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        await apiClient.uploadDB(file);
        notificationStore.addNotification('Database uploaded successfully', 'success');
        
        // Reload project to reflect changes
        const success = await store.loadProject();
        if (success) {
           notificationStore.addNotification('Project reloaded from new database', 'success');
        }
      } catch (error) {
        console.error('Failed to upload database', error);
        notificationStore.addNotification('Failed to upload database', 'error');
      }
    }
  };
  input.click();
};

const handleNodeDblClick = (id: string) => {
  store.setActiveNode(id);
  viewMode.value = 'editor';
};

</script>

<template>
  <div class="app-container">
    <aside class="binder-pane">
      <Binder />
    </aside>
    
    <main class="main-pane">
      <div class="toolbar-header">
        <div class="view-toggle">
          <button 
            :class="{ active: viewMode === 'editor' }" 
            @click="toggleView('editor')"
            title="Editor View"
          >
            📄
          </button>
          <button 
            :class="{ active: viewMode === 'scrivenings' }" 
            @click="toggleView('scrivenings')"
            title="Scrivenings Mode"
            :disabled="!activeNode?.children.length"
          >
            📑
          </button>
          <button 
            :class="{ active: viewMode === 'corkboard' }" 
            @click="toggleView('corkboard')"
            title="Corkboard View"
          >
            🗂️
          </button>
        </div>
        <div class="project-actions">
          <button @click="handleExport" title="Save Project">💾 Save</button>
          <button @click="handleImport" title="Load Project">📂 Load</button>
        </div>
        <div class="current-doc-title">
          {{ activeNode?.title || 'ScrivAI' }}
          <span v-if="viewMode === 'scrivenings'" style="font-weight: normal; font-size: 0.8em; margin-left: 8px;">(Scrivenings)</span>
        </div>
      </div>
      
      <div class="content-area">
        <Editor v-if="viewMode === 'editor' || viewMode === 'scrivenings'" :mode="viewMode" />
        <Corkboard v-else @node-dblclick="handleNodeDblClick" />
      </div>
    </main>
    
    <aside class="inspector-pane">
      <Inspector />
    </aside>
    
    <ToastNotification />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.binder-pane {
  width: 250px;
  flex-shrink: 0;
}

.main-pane {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ccc;
}

.inspector-pane {
  width: 250px;
  flex-shrink: 0;
}

.toolbar-header {
  height: 40px;
  border-bottom: 1px solid #ccc;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background-color: #f5f5f5;
}

.view-toggle {
  display: flex;
  gap: 2px;
  margin-right: 20px;
}

.project-actions {
  display: flex;
  gap: 5px;
  margin-right: 20px;
}

.project-actions button {
  border: 1px solid #ccc;
  color: black;
  background: white;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.view-toggle button {
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.view-toggle button.active {
  background: #ddd;
  font-weight: bold;
}

.current-doc-title {
  font-weight: bold;
  color: #333;
}

.content-area {
  flex-grow: 1;
  overflow: hidden;
}
</style>
