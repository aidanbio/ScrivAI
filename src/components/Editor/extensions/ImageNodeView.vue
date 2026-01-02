<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3';
import { ref, onUnmounted } from 'vue';

const props = defineProps(nodeViewProps);

const resizing = ref(false);
const startX = ref(0);
const startWidth = ref(0);

const onMouseDown = (event: MouseEvent) => {
  event.preventDefault();
  resizing.value = true;
  startX.value = event.clientX;
  startWidth.value = parseInt(props.node.attrs.width || '0', 10) || (event.target as HTMLElement).parentElement?.querySelector('img')?.clientWidth || 0;
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

const onMouseMove = (event: MouseEvent) => {
  if (!resizing.value) return;
  
  const currentX = event.clientX;
  const diffX = currentX - startX.value;
  const newWidth = Math.max(50, startWidth.value + diffX); // Minimum 50px
  
  props.updateAttributes({
    width: `${newWidth}px`,
  });
};

const onMouseUp = () => {
  resizing.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});
</script>

<template>
  <node-view-wrapper class="image-node-view" :class="{ 'is-selected': selected }">
    <div class="image-container" :style="{ textAlign: node.attrs.textAlign || 'center' }">
      <div 
        class="image-wrapper"
        :class="{ 'is-resizing': resizing }"
        :style="{ width: node.attrs.width || 'auto', maxWidth: '100%' }"
      >
        <img 
          :src="node.attrs.src" 
          :alt="node.attrs.alt"
          :title="node.attrs.title"
          class="image-content"
          draggable="false"
        />
        <div 
          v-if="editor.isEditable"
          class="resize-handle" 
          @mousedown="onMouseDown"
        ></div>
      </div>
    </div>
  </node-view-wrapper>
</template>

<style scoped>
.image-node-view {
  display: block;
  line-height: 0;
  margin: 1rem 0;
}

/* Default alignment handled by textAlign style binding */

.image-wrapper {
  position: relative;
  display: inline-block;
  line-height: 0;
  transition: outline 0.1s;
}

.image-content {
  width: 100%;
  height: auto;
  display: block;
}

/* Selection state */
.is-selected .image-wrapper {
  outline: 3px solid #68CEF8;
}

/* Resize handle */
.resize-handle {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background-color: #333;
  border: 1px solid white;
  border-radius: 50%;
  cursor: nwse-resize;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-wrapper:hover .resize-handle,
.is-selected .resize-handle,
.is-resizing .resize-handle {
  opacity: 1;
}
</style>
