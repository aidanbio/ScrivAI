<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { ref, computed } from 'vue';

const props = defineProps(nodeViewProps);
const resizing = ref(false);
const initialX = ref(0);
const initialWidth = ref(0);

const src = computed(() => props.node.attrs.src);
const width = computed(() => props.node.attrs.width);
const height = computed(() => props.node.attrs.height);
const textAlign = computed(() => props.node.attrs.textAlign);

const style = computed(() => ({
  width: width.value ? `${width.value}px` : 'auto',
  height: height.value ? `${height.value}px` : 'auto',
  maxWidth: '100%',
}));

const wrapperStyle = computed(() => {
  const align = textAlign.value;
  if (align === 'center') {
    return { display: 'flex', justifyContent: 'center' };
  } else if (align === 'right') {
    return { display: 'flex', justifyContent: 'flex-end' };
  } else if (align === 'left') {
    return { display: 'flex', justifyContent: 'flex-start' };
  }
  return { display: 'inline-block' };
});

const selectImage = () => {
  props.updateAttributes({ selected: true });
};

const startResize = (event: MouseEvent) => {
  event.preventDefault();
  resizing.value = true;
  initialX.value = event.clientX;
  
  const imgElement = (event.target as HTMLElement).parentElement?.querySelector('img');
  if (imgElement) {
    initialWidth.value = imgElement.offsetWidth;
  }
  
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
};

const onResize = (event: MouseEvent) => {
  if (!resizing.value) return;
  const deltaX = event.clientX - initialX.value;
  const newWidth = Math.max(50, initialWidth.value + deltaX); // Min width 50px
  
  props.updateAttributes({
    width: newWidth,
    height: null // Allow auto height to maintain aspect ratio
  });
};

const stopResize = () => {
  resizing.value = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};
</script>

<template>
  <node-view-wrapper class="image-view" :class="{ 'is-selected': props.selected }" :style="wrapperStyle">
    <div class="image-container" :style="style">
      <img :src="src" alt="" @click="selectImage" />
      <div 
        class="resize-handle" 
        @mousedown="startResize"
        v-if="props.editor.isEditable"
      ></div>
    </div>
  </node-view-wrapper>
</template>

<style scoped>
.image-view {
  /* Default display is inline-block, but dynamic style overrides it for alignment */
  line-height: 0;
  position: relative;
  max-width: 100%;
}

.image-container {
  position: relative;
  display: inline-block;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}

.resize-handle {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  background-color: #333;
  border: 1px solid #fff;
  cursor: nwse-resize;
  border-radius: 50%;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-view:hover .resize-handle,
.image-view.is-selected .resize-handle {
  opacity: 1;
}

.image-view.is-selected img {
  outline: 2px solid #0096fd;
}
</style>
