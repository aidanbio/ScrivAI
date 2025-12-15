<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Binder from './components/Binder/Binder.vue';
import Editor from './components/Editor/Editor.vue';
import Inspector from './components/Inspector/Inspector.vue';
import Corkboard from './components/Corkboard/Corkboard.vue';
import { useDocumentStore } from './stores/documentStore';

const store = useDocumentStore();
const viewMode = ref<'editor' | 'corkboard'>('editor');

const activeNode = computed(() => store.activeNode);

const toggleView = (mode: 'editor' | 'corkboard') => {
  viewMode.value = mode;
};

watch(activeNode, (newNode) => {
  if (newNode) {
    // Optional: Default to Editor, or remember last view
    // For now, let's just keep current view or maybe default to editor
    // if viewMode logic needs adjustment.
    // Actually, Scrivener keeps view per item often, but simplest is:
    // Don't force switch.
  }
});

const handleExport = () => {
  const json = store.exportProject();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scrivai-project.json';
  a.click();
  URL.revokeObjectURL(url);
};

const handleImport = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          store.importProject(content);
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
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
        </div>
      </div>
      
      <div class="content-area">
        <Editor v-if="viewMode === 'editor'" />
        <Corkboard v-else />
      </div>
    </main>
    
    <aside class="inspector-pane">
      <Inspector />
    </aside>
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
