import { Node, mergeAttributes } from '@tiptap/core';

export const ScriveningsItem = Node.create({
  name: 'scriveningsItem',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      'data-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          return {
            'data-id': attributes['data-id'],
          }
        },
      },
      class: {
        default: 'scrivenings-item',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div',
        getAttrs: element => {
          const el = element as HTMLElement;
          return el.classList.contains('scrivenings-item') && el.hasAttribute('data-id') ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'scrivenings-item' }), 0];
  },
});
