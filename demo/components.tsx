import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React, { useEffect, useRef } from 'react';
import thunkMiddleware from 'redux-thunk';
import ReactDOM from 'react-dom';
import { applyMiddleware, createStore } from 'redux';
import { DOMParser, NodeSpec, Node, Schema } from 'prosemirror-model';
import FaceOutlined from '@material-ui/icons/FaceOutlined';
import { Chip } from '@material-ui/core';
import { Provider } from 'react-redux';
import suggestion from '../src/prosemirror/plugins/suggestion';
import rootReducer from './reducers';
import { handleSuggestion } from '../src/store/actions';
import middlewares from '../src/store/middleware';
import { Suggestions, SuggestionSwitch } from '../src';

const store = createStore(rootReducer, applyMiddleware(...[thunkMiddleware, ...middlewares]));

function ChipWithIcon({ label }: { label: string }) {
  return <Chip icon={<FaceOutlined />} label={label} variant="outlined" />;
}

class MentionView {
  node: Node;

  view: EditorView;

  getPos: boolean | (() => number);

  dom: HTMLSpanElement;

  constructor(node: Node, view: EditorView, getPos: boolean | (() => number)) {
    console.log('[MentionView] constructor', node, view, getPos);
    // We'll need these later
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // The node's representation in the editor (empty, for now)
    const wrapper = document.createElement('span');
    ReactDOM.render(<ChipWithIcon label={node.attrs.label} />, wrapper);
    this.dom = wrapper;
  }
}

function createEditorState() {
  const nodes: Record<string, NodeSpec> = {
    doc: {
      content: 'block+',
    },
    // :: NodeSpec A plain paragraph textblock. Represented in the DOM
    // as a `<p>` element.
    paragraph: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM() {
        return ['p', 0];
      },
    },

    // :: NodeSpec The text node.
    text: {
      group: 'inline',
    },

    mention: {
      attrs: { label: { default: '' } },
      inline: true,
      group: 'inline',
      draggable: true,
      toDOM: (node: any) => [
        'span',
        {
          class: 'mention',
          label: node.attrs.label,
        },
        0,
      ],
      parseDOM: [
        {
          tag: 'span.mention',
          getAttrs(dom) {
            if (typeof dom !== 'string') {
              const label = (dom as HTMLSpanElement).getAttribute('label');
              console.log('label', label);
              return {
                label,
              };
            }
            return { label: '' };
          },
        },
      ],
    },
  };

  const mentionInputSchema = new Schema({
    nodes,
  });
  const contentNode = document.getElementById('componentContent') as HTMLElement;
  console.log('contentNode', contentNode);

  return EditorState.create({
    doc: DOMParser.fromSchema(mentionInputSchema).parse(contentNode),
    schema: mentionInputSchema,
    plugins: [
      ...suggestion(
        (action) => {
          console.log('handleSuggestion', action);
          // if (action.kind === 'close') {
          //   console.log('select');
          //   return false;
          // }
          // return true;
          return store.dispatch(handleSuggestion(action) as any);
        },
        /(?:^|\W)(@)$/,
        // Cancel on space after some of the triggers
        (trigger) => !trigger?.match(/(?:(?:[a-zA-Z0-9_]+)\s?=)|(?:\{\{)/),
      ),
    ],
  });
}

function InputWithMention() {
  const editorViewRef = useRef<EditorView | null>(null);
  const editorDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorDivRef.current) {
      return () => {};
    }
    const state = createEditorState();
    editorViewRef.current = new EditorView(
      { mount: editorDivRef.current },
      {
        state,
        nodeViews: {
          mention(node, view, getPos) {
            return new MentionView(node, view, getPos);
          },
        },
      },
    );

    return () => {
      editorViewRef.current?.destroy();
    };
  }, []);

  return <div ref={editorDivRef} />;
}

function ComponentDemo() {
  return (
    <div>
      <InputWithMention />
    </div>
  );
}

ReactDOM.render(
  <Provider store={store}>
    <ComponentDemo />
    <Suggestions>
      <SuggestionSwitch />
    </Suggestions>
  </Provider>,
  document.getElementById('components'),
);