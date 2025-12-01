<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize } from './extensions/FontSize';
import { LineHeight } from './extensions/LineHeight';
import { watch, onBeforeUnmount } from 'vue';
import { useDocumentStore } from '../../stores/documentStore';

const store = useDocumentStore();

const editor = useEditor({
  content: store.activeNode?.body || '',
  extensions: [
    StarterKit,
    TextStyle,
    FontFamily,
    Color,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    FontSize,
    LineHeight,
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
      // const currentContent = editor.value.getHTML(); // Unused
      // Logic handled in activeNodeId watcher mostly
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
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="editor-container">
    <div v-if="editor" class="toolbar">
      <!-- Font Family -->
      <select 
        @change="editor.chain().focus().setFontFamily(($event.target as HTMLSelectElement).value).run()"
        :value="editor.getAttributes('textStyle').fontFamily || ''"
        class="toolbar-select"
      >
        <option value="" disabled selected>Font</option>
        <option value="Inter">Inter</option>
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Courier New">Courier New</option>
        <option value="Noto Sans KR">Noto Sans KR</option>
        <option value="Gulim">굴림 (Gulim)</option>
        <option value="Batang">바탕 (Batang)</option>
        <option value="Gungsuh">궁서 (Gungsuh)</option>
      </select>

      <!-- Font Size -->
      <select 
        @change="editor.chain().focus().setFontSize(($event.target as HTMLSelectElement).value).run()"
        :value="editor.getAttributes('textStyle').fontSize || ''"
        class="toolbar-select"
      >
        <option value="" disabled selected>Size</option>
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
        <option value="30px">30px</option>
      </select>

      <!-- Line Height -->
      <select 
        @change="editor.chain().focus().setLineHeight(($event.target as HTMLSelectElement).value).run()"
        :value="editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight || '1.5'"
        class="toolbar-select"
      >
        <option value="" disabled>Line Height</option>
        <option value="1.0">1.0</option>
        <option value="1.15">1.15</option>
        <option value="1.5">1.5</option>
        <option value="2.0">2.0</option>
        <option value="2.5">2.5</option>
      </select>

      <div class="separator"></div>

      <!-- Basic Formatting -->
      <button 
        @click="editor.chain().focus().toggleBold().run()" 
        :class="{ 'is-active': editor.isActive('bold') }"
        title="Bold"
      >
        <b>B</b>
      </button>
      <button 
        @click="editor.chain().focus().toggleItalic().run()" 
        :class="{ 'is-active': editor.isActive('italic') }"
        title="Italic"
      >
        <i>I</i>
      </button>
      <button 
        @click="editor.chain().focus().toggleStrike().run()" 
        :class="{ 'is-active': editor.isActive('strike') }"
        title="Strike"
      >
        <s>S</s>
      </button>

      <div class="separator"></div>

      <!-- Alignment -->
      <button 
        @click="editor.chain().focus().setTextAlign('left').run()" 
        :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
        title="Align Left"
      >
        Left
      </button>
      <button 
        @click="editor.chain().focus().setTextAlign('center').run()" 
        :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
        title="Align Center"
      >
        Center
      </button>
      <button 
        @click="editor.chain().focus().setTextAlign('right').run()" 
        :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
        title="Align Right"
      >
        Right
      </button>
      <button 
        @click="editor.chain().focus().setTextAlign('justify').run()" 
        :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
        title="Justify"
      >
        Justify
      </button>

      <div class="separator"></div>

      <!-- Color -->
      <input 
        type="color" 
        @input="editor.chain().focus().setColor(($event.target as HTMLInputElement).value).run()" 
        :value="editor.getAttributes('textStyle').color || '#000000'"
        title="Text Color"
        class="color-picker"
      >

      <div class="separator"></div>

      <!-- Headings -->
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
        List
      </button>
    </div>
    
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');

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
  align-items: center;
  flex-wrap: wrap;
}

.toolbar button {
  padding: 5px 10px;
  border: 1px solid #ccc;
  background: white;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.toolbar button.is-active {
  background-color: #333;
  color: white;
  border-color: #333;
}

.toolbar-select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
}

.color-picker {
  border: none;
  width: 30px;
  height: 30px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.separator {
  width: 1px;
  height: 24px;
  background-color: #ccc;
  margin: 0 5px;
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
