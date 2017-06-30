/**
 * The Layer Replaceable Content widget allows for content to be inserted into widgets.
 *
 * @class layerUI.components.subcomponents.ReplaceableContent
 * @extends layerUI.components.Component
 */
import { registerComponent } from '../../../components/component';

registerComponent('layer-replaceable-content', {
  properties: {
    name: {},
  },
  methods: {
    _onProcessReplaceableContent() {
      if (!this.name) throw new Error('Unnamed replaceable content detected');

      let processed = false;
      //this.properties._internalState.onProcessReplaceableContentCalled = true;
      const parents = [];
      let node = this;
      while (node.parentComponent) {
        node = node.parentComponent;
        parents.unshift(node);
      }

      // TODO: Check for HTML content ShadowDOM style in the top component and load it into this component
      for (let parentIndex = 0; parentIndex < parents.length; parentIndex++) {
        const parent = parents[parentIndex];
        const generator = parent.replaceableContent && parent.replaceableContent[this.name];
        if (generator) {
          this.loadContent(parent, generator);
          processed = true;
          break;
        }
      }

      if (!processed && this.properties.originalChildNodes) {
        this.properties.originalChildNodes.forEach(item => this.nodes.content.appendChild(item));
        delete this.properties.originalChildNodes;
      }
    },
    loadContent(parent, generator) {
      let newNode;

      if (typeof generator === 'function') {
        const oldChild = this.nodes.content;
        this.removeChild(oldChild);
        newNode = generator.call(parent, this.parentComponent, this);
        if (!newNode) this.appendChild(oldChild); // lame... but handles case where callback returns null
      } else {
        newNode = generator;
      }

      if (newNode) {
        const alreadyInWidget = this.contains(newNode);

        // React only works well if React inserts the node itself (event handlers such as <div onclick={handler} /> get lost otherwise)
        if (!alreadyInWidget && (newNode.tagName !== 'DIV' || !newNode.firstChild)) {
          const tmpNode = document.createElement('div');
          tmpNode.appendChild(newNode);
          newNode = tmpNode;
        }

        if (!newNode.classList.contains('layer-replaceable-inner')) newNode.classList.add('layer-replaceable-inner');
        this.nodes.content = newNode;
        if (!alreadyInWidget) {
          this.appendChild(newNode);
        }
        this.parentComponent.onReplaceableContentAdded(this.name, newNode);
      }
    },
  },
});
