<script setup lang="ts">
import { ref, computed } from 'vue';
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

// Automatically switch to corkboard if a folder is selected?
// Or just let user decide. 
// Scrivener default: Folder -> Corkboard, File -> Editor.
// Let's implement that auto-switch logic but allow manual override?
// For now, manual toggle is safer and simpler.
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
