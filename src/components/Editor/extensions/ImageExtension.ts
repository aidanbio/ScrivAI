import Image from '@tiptap/extension-image';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import ImageNodeView from './ImageNodeView.vue';

export const ImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      textAlign: {
        default: 'center',
      },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageNodeView);
  },
});
