<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { watch, onBeforeUnmount } from 'vue';
import { useDocumentStore } from '../../stores/documentStore';

const store = useDocumentStore();

const editor = useEditor({
  content: '',
  extensions: [
    StarterKit,
  ],
  onUpdate: ({ editor }) => {
    if (store.activeNodeId) {
      store.updateNode(store.activeNodeId, { body: editor.getHTML() });
    }
  },
});

// Watch for active node changes to update editor content
watch(
  () => store.activeNode,
  (newNode) => {
    if (editor.value && newNode) {
      const currentContent = editor.value.getHTML();
      // Only update if content is different to avoid cursor jumping or loops
      // But since we switch nodes, we should always update.
      // Wait, if we are just typing, store.activeNode updates, triggering this watch?
      // No, store.activeNode is a computed property returning the object.
      // If we mutate the object in store.updateNode, does it trigger the watcher?
      // Yes, because it returns the same object but reactive.
      
      // We need to check if the ID changed OR if the content is significantly different (e.g. external update)
      // For now, let's assume we only force update when ID changes.
      // But wait, watch(() => store.activeNode) triggers on deep changes? No, default is shallow for objects unless deep: true.
      // But activeNode is a computed returning a reactive object.
      
      // Let's watch activeNodeId instead for switching files.
    }
  }
);

watch(
  () => store.activeNodeId,
  (newId) => {
    if (editor.value && newId) {
      const node = store.activeNode;
      if (node && editor.value.getHTML() !== node.body) {
        editor.value.commands.setContent(node.body);
      }
    } else if (editor.value && !newId) {
        editor.value.commands.setContent('');
    }
  }
);

// Also need to handle the case where we might undo/redo in the store? 
// For now, simple binding.

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="editor-container">
    <div v-if="editor" class="toolbar">
      <button 
        @click="editor.chain().focus().toggleBold().run()" 
        :class="{ 'is-active': editor.isActive('bold') }"
      >
        Bold
      </button>
      <button 
        @click="editor.chain().focus().toggleItalic().run()" 
        :class="{ 'is-active': editor.isActive('italic') }"
      >
        Italic
      </button>
      <button 
        @click="editor.chain().focus().toggleStrike().run()" 
        :class="{ 'is-active': editor.isActive('strike') }"
      >
        Strike
      </button>
      <button 
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" 
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
      >
        H1
      </button>
      <button 
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" 
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
      >
        H2
      </button>
      <button 
        @click="editor.chain().focus().toggleBulletList().run()" 
        :class="{ 'is-active': editor.isActive('bulletList') }"
      >
        Bullet List
      </button>
    </div>
    
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  padding: 10px;
  border-bottom: 1px solid #ccc;
  background-color: #f0f0f0;
  display: flex;
  gap: 5px;
}

.toolbar button {
  padding: 5px 10px;
  border: 1px solid #ccc;
  background: white;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
}

.toolbar button.is-active {
  background-color: #333;
  color: white;
  border-color: #333;
}

.editor-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
}

/* Tiptap Basic Styles */
:deep(.ProseMirror) {
  outline: none;
  min-height: 100%;
}

:deep(.ProseMirror p) {
  margin-bottom: 1em;
}
</style>
