import Image from '@tiptap/extension-image';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import ImageNodeView from './ImageNodeView.vue';

export const CustomImage = Image.extend({
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
        parseHTML: element => element.style.textAlign,
        renderHTML: attributes => {
          if (!attributes.textAlign) {
            return {};
          }
          return {
            style: `text-align: ${attributes.textAlign}`,
          };
        },
      },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageNodeView);
  },
});
