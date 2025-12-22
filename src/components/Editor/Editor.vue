<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { BubbleMenu } from '@tiptap/extension-bubble-menu';
import StarterKit from '@tiptap/starter-kit';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { FontSize } from './extensions/FontSize';
import { LineHeight } from './extensions/LineHeight';
import { ImageExtension } from './extensions/ImageExtension';
import TableContextMenu from './TableContextMenu.vue';
import { watch, onBeforeUnmount, ref } from 'vue';
import { useDocumentStore } from '../../stores/documentStore';
import type { ScrivNode } from '../../types';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered,
  Image as ImageIcon
} from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  mode?: 'editor' | 'scrivenings';
}>(), {
  mode: 'editor'
});

const store = useDocumentStore();

const showContextMenu = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });
const fileInput = ref<HTMLInputElement | null>(null);

const handleContextMenu = (event: MouseEvent) => {
  if (!editor.value) return;

  const target = event.target as HTMLElement;
  const cell = target.closest('td, th');
  
  if (cell) {
    event.preventDefault();
    showContextMenu.value = true;
    contextMenuPos.value = { x: event.clientX, y: event.clientY };
  } else {
    showContextMenu.value = false;
  }
};

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result && editor.value) {
        editor.value.chain().focus().setImage({ src: result }).run();
      }
    };
    reader.readAsDataURL(file);
  }
  input.value = ''; // Reset input
};

const triggerImageUpload = () => {
  fileInput.value?.click();
};

const editor = useEditor({
  content: store.activeNode?.body || '',
  extensions: [
    StarterKit,
    TextStyle,
    FontFamily,
    Color,
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph', 'image'],
    }),
    FontSize,
    LineHeight,
    Highlight.configure({ multicolor: true }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    ImageExtension,
  ],
  editorProps: {
    handlePaste: (view, event) => {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.indexOf('image') === 0);

      if (imageItem) {
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              const { schema } = view.state;
              if (schema.nodes.image) {
                const node = schema.nodes.image.create({ src: result });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            }
          };
          reader.readAsDataURL(file);
        }
        return true;
      }
      return false;
    },
    handleDrop: (view, event, _slice, moved) => {
      // If the view is currently dragging something, it's an internal move. 
      // Return false to let Tiptap/ProseMirror handle the move natively.
      if ((view as any).dragging) {
        return false;
      }

      if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        if (file && file.type.indexOf('image') === 0) {
          event.preventDefault();
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              const { schema } = view.state;
              if (schema.nodes.image) {
                 // Create image with default center alignment
                 const node = schema.nodes.image.create({ 
                   src: result,
                   textAlign: 'center' 
                 });
                 const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                 if (coordinates) {
                    const transaction = view.state.tr.insert(coordinates.pos, node);
                    view.dispatch(transaction);
                 }
              }
            }
          };
          reader.readAsDataURL(file);
          return true;
        }
      }
      return false;
    }
  },
  onUpdate: ({ editor }) => {
    if (store.activeNodeId && props.mode === 'editor') {
      store.updateNode(store.activeNodeId, { body: editor.getHTML() });
    }
  },
  onBlur: () => {
    store.saveToLocalStorage();
  },
});

// Helper to gather content recursively
const getScriveningsContent = (node: ScrivNode): string => {
  let content = '';
  
  // Add own content if it exists
  if (node.body) {
    content += `
      <div class="scrivenings-item" data-id="${node.id}">
        ${node.body}
      </div>
    `;
  }
  
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      // Add separator
      content += '<hr class="scrivenings-separator">';
      content += getScriveningsContent(child);
    }
  }
  
  return content;
};

// Watch for active node changes to update editor content
watch(
  [() => store.activeNode, () => props.mode],
  ([node, mode]) => {
    if (!editor.value) return;

    if (node) {
      if (mode === 'scrivenings') {
        const content = getScriveningsContent(node);
        // Scrivenings mode: Show composite content
        if (editor.value.getHTML() !== content) {
          editor.value.commands.setContent(content);
        }
        editor.value.setEditable(false);
      } else {
        // Unified view: Always show node's content
        if (editor.value.getHTML() !== node.body) {
          editor.value.commands.setContent(node.body);
        }
        editor.value.setEditable(true);
      }
    } else {
      // No active node
      editor.value.commands.setContent('');
      editor.value.setEditable(false);
    }
  },
  { deep: true, immediate: true }
);

// Watch for active node ID changes to ensure specific handling if needed
// (covered by activeNode watcher but keeping cleanup consistent)
watch(
  () => store.activeNodeId,
  (newId) => {
    if (!newId && editor.value) {
      editor.value.commands.setContent('');
      editor.value.setEditable(false);
    }
  }
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
        @change="editor?.chain().focus().setFontFamily(($event.target as HTMLSelectElement).value).run()"
        :value="editor?.getAttributes('textStyle').fontFamily || ''"
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
        @change="editor?.chain().focus().setFontSize(($event.target as HTMLSelectElement).value).run()"
        :value="editor?.getAttributes('textStyle').fontSize || ''"
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
        @change="editor?.chain().focus().setLineHeight(($event.target as HTMLSelectElement).value).run()"
        :value="editor?.getAttributes('paragraph').lineHeight || editor?.getAttributes('heading').lineHeight || '1.5'"
        class="toolbar-select"
      >
        <option value="" disabled>Line Height</option>
        <option value="1.0">1.0</option>
        <option value="1.15">1.15</option>
        <option value="1.5">1.5</option>
        <option value="2.0">2.0</option>
        <option value="2.5">2.5</option>
      </select>

      <!-- Formatting Style (Heading/Subtitle) -->
      <select
        @change="(e) => {
          if (!editor) return;
          const value = (e.target as HTMLSelectElement).value;
          if (value === 'p') {
            editor.chain().focus().setParagraph().run();
          } else if (value === 'h1') {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          } else if (value === 'h2') {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          } else if (value === 'h3') {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          } else if (value === 'subtitle') {
            editor.chain().focus().toggleHeading({ level: 4 }).run();
          }
        }"
        :value="
          editor.isActive('heading', { level: 1 }) ? 'h1' :
          editor.isActive('heading', { level: 2 }) ? 'h2' :
          editor.isActive('heading', { level: 3 }) ? 'h3' :
          editor.isActive('heading', { level: 4 }) ? 'subtitle' :
          'p'
        "
        class="toolbar-select"
        style="width: 100px;"
      >
        <option value="p">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="subtitle">Subtitle</option>
      </select>

      <div class="separator"></div>

      <!-- Basic Formatting -->
      <button 
        @click="editor?.chain().focus().toggleBold().run()" 
        :class="{ 'is-active': editor.isActive('bold') }"
        title="Bold"
      >
        <Bold :size="16" />
      </button>
      <button 
        @click="editor?.chain().focus().toggleItalic().run()" 
        :class="{ 'is-active': editor.isActive('italic') }"
        title="Italic"
      >
        <Italic :size="16" />
      </button>
      <button 
        @click="editor?.chain().focus().toggleUnderline().run()" 
        :class="{ 'is-active': editor.isActive('underline') }"
        title="Underline"
      >
        <UnderlineIcon :size="16" />
      </button>
      <button 
        @click="editor?.chain().focus().toggleStrike().run()" 
        :class="{ 'is-active': editor.isActive('strike') }"
        title="Strike"
      >
        <Strikethrough :size="16" />
      </button>

      <div class="separator"></div>

      <!-- Alignment -->
      <button 
        @click="editor?.chain().focus().setTextAlign('left').run()" 
        :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
        title="Align Left"
      >
        <AlignLeft :size="16" />
      </button>
      <button 
        @click="editor?.chain().focus().setTextAlign('center').run()" 
        :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
        title="Align Center"
      >
        <AlignCenter :size="16" />
      </button>
      <button 
        @click="editor?.chain().focus().setTextAlign('right').run()" 
        :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
        title="Align Right"
      >
        <AlignRight :size="16" />
      </button>
      <button 
        @click="editor?.chain().focus().setTextAlign('justify').run()" 
        :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
        title="Justify"
      >
        <AlignJustify :size="16" />
      </button>

      <div class="separator"></div>

      <!-- Color -->
      <input 
        type="color" 
        @input="editor?.chain().focus().setColor(($event.target as HTMLInputElement).value).run()" 
        :value="editor?.getAttributes('textStyle').color || '#000000'"
        title="Text Color"
        class="color-picker"
      >

      <input 
        type="color" 
        @input="editor?.chain().focus().setHighlight({ color: ($event.target as HTMLInputElement).value }).run()" 
        :value="editor?.getAttributes('highlight').color || '#FFFFFF'"
        title="Background Color"
        class="color-picker"
      >
      <button 
        @click="editor?.chain().focus().unsetHighlight().unsetColor().run()"
        title="Clear Colors"
        :disabled="!editor?.isActive('highlight') && !editor?.getAttributes('textStyle').color"
      >
        ✕
      </button>

      <div class="separator"></div>

      <button 
        @click="editor?.chain().focus().toggleBulletList().run()" 
        :class="{ 'is-active': editor.isActive('bulletList') }"
        title="Bullet List"
      >
        <List :size="16" />
      </button>
      <button 
        @click="editor?.chain().focus().toggleOrderedList().run()" 
        :class="{ 'is-active': editor.isActive('orderedList') }"
        title="Ordered List"
      >
        <ListOrdered :size="16" />
      </button>

      <div class="separator"></div>

      <button 
        @click="editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
      >
        Insert Table
      </button>
      
      <div class="separator"></div>

      <!-- Image Upload -->
      <button @click="triggerImageUpload" title="Insert Image">
        <ImageIcon :size="16" />
      </button>
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleImageUpload" 
        accept="image/*" 
        style="display: none"
      >
    </div>
    
    <bubble-menu 
      v-if="editor" 
      :editor="editor" 
      :tippy-options="{ duration: 100 }"
      :should-show="({ editor }: { editor: any }) => editor.isActive('table')"
      class="bubble-menu-table"
    >
      <button @click="editor.chain().focus().addColumnBefore().run()">Add Col Before</button>
      <button @click="editor.chain().focus().addColumnAfter().run()">Add Col After</button>
      <button @click="editor.chain().focus().deleteColumn().run()">Delete Col</button>
      <button @click="editor.chain().focus().addRowBefore().run()">Add Row Before</button>
      <button @click="editor.chain().focus().addRowAfter().run()">Add Row After</button>
      <button @click="editor.chain().focus().deleteRow().run()">Delete Row</button>
      <button @click="editor.chain().focus().deleteTable().run()">Delete Table</button>
    </bubble-menu>

    <editor-content 
      :editor="editor" 
      class="editor-content"
      @contextmenu="handleContextMenu"
    />

    <TableContextMenu
      v-if="showContextMenu && editor"
      :editor="editor"
      :x="contextMenuPos.x"
      :y="contextMenuPos.y"
      @close="showContextMenu = false"
    />
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
  display: flex;
  align-items: center;
  justify-content: center;
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

:deep(.ProseMirror hr) {
  border: none;
  border-top: 2px dashed #ccc;
  margin: 20px 0;
}

/* Table Styles */
:deep(.ProseMirror table) {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0;
  overflow: hidden;
}

:deep(.ProseMirror td),
:deep(.ProseMirror th) {
  min-width: 1em;
  border: 2px solid #ced4da;
  padding: 3px 5px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

:deep(.ProseMirror th) {
  font-weight: bold;
  text-align: left;
  background-color: #f1f3f5;
}

:deep(.ProseMirror .selectedCell:after) {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(200, 200, 255, 0.4);
  pointer-events: none;
}

:deep(.ProseMirror .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: #adf;
  pointer-events: none;
}

.bubble-menu-table {
  display: flex;
  background-color: #333;
  padding: 0.2rem;
  border-radius: 0.5rem;
  gap: 0.3rem;
}

.bubble-menu-table button {
  border: none;
  background: none;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.3rem 0.5rem;
  opacity: 0.8;
  cursor: pointer;
}

.bubble-menu-table button:hover,
.bubble-menu-table button.is-active {
  opacity: 1;
  background-color: #555;
  border-radius: 0.3rem;
}
/* Scrivenings Mode Styling */
:deep(.scrivenings-separator) {
  border: none;
  border-top: 2px dashed #ccc;
  margin: 20px 0;
}

:deep(.scrivenings-item) {
  position: relative;
}


</style>
