<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ScrivNode } from '../../types';
import { useDocumentStore } from '../../stores/documentStore';

const props = defineProps<{
  node: ScrivNode;
  depth: number;
}>();

const store = useDocumentStore();
const isOpen = ref(true);
const dragOverPosition = ref<'before' | 'inside' | 'after' | null>(null);

const isActive = computed(() => store.activeNodeId === props.node.id);

const toggleOpen = () => {
  if (props.node.isFolder) {
    isOpen.value = !isOpen.value;
  }
};

const selectNode = () => {
  store.setActiveNode(props.node.id);
};

const addChild = (e: Event) => {
  e.stopPropagation();
  store.addNode(props.node.id, false); // Add file
};

const addFolder = (e: Event) => {
  e.stopPropagation();
  store.addNode(props.node.id, true); // Add folder
};

const removeNode = (e: Event) => {
  e.stopPropagation();
  if (confirm(`Delete ${props.node.title}?`)) {
    store.deleteNode(props.node.id);
  }
};

// Drag and Drop handlers
const onDragStart = (e: DragEvent) => {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', props.node.id);
    store.setDraggedNodeId(props.node.id);
    // Add a class to styling
  }
};

const onDragEnd = () => {
  store.setDraggedNodeId(null);
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault(); // Necessary to allow dropping
  e.stopPropagation();

  if (store.draggedNodeId === props.node.id) return;

  if (!e.currentTarget) return;
  
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  // Calculate percentage
  const percentage = y / height;

  if (props.node.isFolder) {
    if (percentage < 0.25) {
      dragOverPosition.value = 'before';
    } else if (percentage > 0.75) {
      dragOverPosition.value = 'after';
    } else {
      dragOverPosition.value = 'inside';
    }
  } else {
    // Files cannot have children, so only before/after
    if (percentage < 0.5) {
      dragOverPosition.value = 'before';
    } else {
      dragOverPosition.value = 'after';
    }
  }
};

const onDragLeave = () => {
  dragOverPosition.value = null;
};

const onDrop = (e: DragEvent) => {
  e.stopPropagation();
  const draggedId = e.dataTransfer?.getData('text/plain');
  
  if (draggedId && draggedId !== props.node.id) {
    if (dragOverPosition.value) {
      store.moveNode(draggedId, props.node.id, dragOverPosition.value);
    }
  }
  
  dragOverPosition.value = null;
};

</script>

<template>
  <div class="binder-item">
    <div 
      class="item-content" 
      :class="{ 
        active: isActive,
        'drag-over-inside': dragOverPosition === 'inside',
        'drag-over-before': dragOverPosition === 'before',
        'drag-over-after': dragOverPosition === 'after'
      }"
      @click="selectNode"
      draggable="true"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      :style="{ paddingLeft: `${depth * 20}px` }"
    >
      <span 
        v-if="node.isFolder" 
        class="toggle" 
        @click.stop="toggleOpen"
      >
        {{ isOpen ? '▼' : '▶' }}
      </span>
      <span v-else class="spacer"></span>
      
      <span class="icon">{{ node.isFolder ? '📁' : '📄' }}</span>
      <span class="title">{{ node.title }}</span>
      
      <div class="actions">
        <button v-if="node.isFolder" @click="addChild" title="Add File">+</button>
        <button v-if="node.isFolder" @click="addFolder" title="Add Folder">+F</button>
        <button @click="removeNode" title="Delete">x</button>
      </div>
    </div>

    <div v-if="node.isFolder && isOpen" class="children">
      <BinderItem 
        v-for="child in node.children" 
        :key="child.id" 
        :node="child" 
        :depth="depth + 1" 
      />
    </div>
  </div>
</template>

<style scoped>
.binder-item {
  user-select: none;
}

.item-content {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  position: relative; /* For pseudo-elements */
  border: 2px solid transparent; /* Reserve space for border to prevent layout shift */
}

.item-content:hover {
  background-color: #f0f0f0;
}

.item-content.active {
  background-color: #e0e0e0;
  font-weight: bold;
}

/* Drag and Drop Visuals */
.item-content.drag-over-inside {
  background-color: #e3f2fd; /* Light Sky Blue */
  border: 2px solid #2196f3; /* Sky Blue */
}

.item-content.drag-over-before::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 4px;
  background-color: #2196f3;
  z-index: 10;
  pointer-events: none;
}

.item-content.drag-over-after::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 4px;
  background-color: #2196f3;
  z-index: 10;
  pointer-events: none;
}

.toggle {
  cursor: pointer;
  width: 20px;
  text-align: center;
  font-size: 0.8em;
}

.spacer {
  width: 20px;
}

.icon {
  margin-right: 8px;
}

.title {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: none;
  gap: 4px;
}

.item-content:hover .actions {
  display: flex;
}

.actions button {
  padding: 2px 6px;
  font-size: 0.8em;
  border: none;
  background: #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.actions button:hover {
  background: #ccc;
}
</style>
