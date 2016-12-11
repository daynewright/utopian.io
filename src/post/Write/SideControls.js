// Forked from https://github.com/rajaraodv/draftjs-examples
import newDebug from 'debug';
import React, { Component } from 'react';
import { EditorState } from 'draft-js';
import Icon from '../../widgets/Icon';
import './PostEditor.scss';

const debug = newDebug('busy:PostEditor');

function getSelectedBlockNode(root) {
  const selection = root.getSelection();
  if (selection.rangeCount === 0) {
    return null;
  }
  let node = selection.getRangeAt(0).startContainer;
  do {
    if (node.getAttribute && node.getAttribute('data-block') === 'true') {
      return node;
    }
    node = node.parentNode;
  } while (node !== null);
  return null;
}

function getCurrentBlock(editorState) {
  const selectionState = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const block = contentState.getBlockForKey(selectionState.getStartKey());
  return block;
}

function addNewBlock(editorState, newType, initialData) {
  const selectionState = editorState.getSelection();
  if (!selectionState.isCollapsed()) {
    return editorState;
  }
  const contentState = editorState.getCurrentContent();
  const key = selectionState.getStartKey();
  const blockMap = contentState.getBlockMap();
  const currentBlock = getCurrentBlock(editorState);

  if (!currentBlock) {
    return editorState;
  }

  if (currentBlock.getLength() === 0) {
    if (currentBlock.getType() === newType) {
      return editorState;
    }

    const newBlock = currentBlock.merge({
      type: newType,
      data: initialData,
    });

    const newContentState = contentState.merge({
      blockMap: blockMap.set(key, newBlock),
      selectionAfter: selectionState,
    });
    return EditorState.push(editorState, newContentState, 'change-block-type');
  }
  return editorState;
}

export default class SideControls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showControls: false
    };
  }
  findNode({ editorState }) {
    if (!process.env.IS_BROWSER) return;

    const node = getSelectedBlockNode(window); // eslint-disable-line no-undef

    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    if (!selectionState.isCollapsed() ||
      selectionState.anchorKey !== selectionState.focusKey) {
      debug(
        'Selection state changed to be (collapsed, anchorKey)',
        selectionState.isCollapsed()
      );
      this.hide();
      return;
    }

    const block = contentState.getBlockForKey(selectionState.anchorKey);
    if (block.getLength() > 0) {
      debug('Block has content, hidding');
      this.hide();
      return;
    }

    if (node) {
      this.show(node);
    }
  }

  show(node) {
    this.setState({
      style: {
        top: node.offsetTop - 4,
        left: -50,
      },
    });
  }

  hide() {
    this.setState({ style: null, showControls: false });
  }

  componentWillReceiveProps(newProps) {
    this.findNode(newProps);
  }

  onClickUpload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.fileInput.click();
  };

  onChangeImage = () => {
    const fileInput = this.fileInput;
    const username = this.props.user.name;
    this.props.uploadFile({ username, fileInput })
      .then(({ value }) => {
        this.props.onChange(addNewBlock(
          this.props.editorState,
          'atomic:image', {
            src: value.url,
          }
        ));
      });
  };

  toggleMenu = (e) => {
    e.preventDefault();
    this.setState({ showControls: !this.state.showControls });
  }

  render() {
    const showControls = this.state.showControls;
    return (
      <div
        className="SideControls"
        style={this.state && this.state.style ? this.state.style : {
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <button className="Controls__button" onClick={this.toggleMenu}><Icon name={showControls ? 'close' : 'add'} /></button>
        {showControls &&
          <div className="Controls__menu">
            <button className="Controls__button"><Icon name="close" /></button>
            <button className="Controls__button" onMouseDown={this.onClickUpload} type="button">
              <Icon name="add_a_photo" />
            </button>
            <input className="Controls__image__hidden" ref={(c) => { this.fileInput = c; }} onChange={this.onChangeImage} name="file" type="file" />
            <button className="Controls__button"><Icon name="remove" /></button>
          </div>}
      </div>
    );
  }
}