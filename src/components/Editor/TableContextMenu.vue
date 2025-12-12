<script setup lang="ts">
import { type Editor } from '@tiptap/vue-3';
import { onMounted, onUnmounted, ref } from 'vue';

defineProps<{
  editor: Editor;
  x: number;
  y: number;
}>();

const emit = defineEmits(['close']);

const menuRef = ref<HTMLElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // Prevent context menu from appearing on the custom menu itself
  menuRef.value?.addEventListener('contextmenu', (e) => e.preventDefault());
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const executeCommand = (command: () => void) => {
  command();
  emit('close');
};
</script>

<template>
  <div 
    ref="menuRef"
    class="context-menu"
    :style="{ top: `${y}px`, left: `${x}px` }"
  >
    <button @click="executeCommand(() => editor.chain().focus().addColumnAfter().run())">
      Add Column Right
    </button>
    <button @click="executeCommand(() => editor.chain().focus().addRowAfter().run())">
      Add Row Below
    </button>
    <div class="separator"></div>
    <button @click="executeCommand(() => editor.chain().focus().deleteRow().run())" class="danger">
      Delete Row
    </button>
    <button @click="executeCommand(() => editor.chain().focus().deleteColumn().run())" class="danger">
      Delete Column
    </button>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  min-width: 150px;
  padding: 4px 0;
}

button {
  text-align: left;
  background: none;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

button:hover {
  background-color: #f0f0f0;
}

button.danger {
  color: #e03131;
}

button.danger:hover {
  background-color: #ffe3e3;
}

.separator {
  height: 1px;
  background-color: #e9ecef;
  margin: 4px 0;
}
</style>
