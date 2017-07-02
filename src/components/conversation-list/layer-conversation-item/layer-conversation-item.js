/**
 * The Layer Conversation Item widget renders a single Conversation, typically for use representing a
 * conversation within a list of conversations.
 *
 * This is designed to go inside of the layerUI.components.ConversationsListPanel.List widget, and be a
 * concise enough summary that it can be scrolled through along
 * with hundreds of other Conversations Item widgets.
 *
 * Future Work:
 *
 * * Badges for unread messages (currently just adds a css class so styling can change if there are any unread messages)
 *
 * @class layerUI.components.ConversationsListPanel.Item.Conversation
 * @extends layerUI.components.Component
 */
import { registerComponent } from '../../../components/component';
import ListItem from '../../../mixins/list-item';
import ListItemSelection from '../../../mixins/list-item-selection';
import SizeProperty from '../../../mixins/size-property';
import '../../subcomponents/layer-conversation-last-message/layer-conversation-last-message';
import '../../subcomponents/layer-menu-button/layer-menu-button';
import '../../subcomponents/layer-avatar/layer-avatar';
import '../../subcomponents/layer-conversation-title/layer-conversation-title';

registerComponent('layer-conversation-item', {
  mixins: [ListItem, ListItemSelection, SizeProperty],
  properties: {

    // Every List Item has an item property, here it represents the Conversation to render
    item: {},

    /**
     * Enable deletion of this Conversation.
     *
     * This property is currently assumed to be settable at creation time only,
     * and does not rerender if changed.
     *
     * This property does nothing if you remove the `delete` node from the template.
     *
     * @property {Boolean} [deleteConversationEnabled=false]
     */
    deleteConversationEnabled: {
      type: Boolean,
      set(value) {
        if (this.nodes.delete) this.nodes.delete.enabled = value;
      },
    },

    /**
     * Provide a function to determine if the last message is rendered in the Conversation List.
     *
     * By default, only text/plain last-messages are fully rendered in the Conversation List.
     *
     * All other messages are rendered using the `label` passed in with their layerUI.registerMessageHandler call.
     *
     * ```javascript
     * listItem.canFullyRenderLastMessage = function(message) {
     *     return true; // Render the current Messages
     * }
     * ```
     *
     * @property {Function} [canFullyRenderLastMessage=null]
     */
    canFullyRenderLastMessage: {},

    size: {
      value: 'large',
      set(size) {
        Object.keys(this.nodes).forEach((nodeName) => {
          const node = this.nodes[nodeName];
          if (node.supportedSizes && node.supportedSizes.indexOf(size) !== -1) {
            node.size = size;
          }
        });
      },
    },

    supportedSizes: {
      value: ['tiny', 'small', 'medium', 'large'],
    },


    /**
     * Set the date format for the Conversation Item.
     *
     * Note that typically you'd set layerUI.components.ConversationsListPanel.List.dateFormat instead.
     *
     * @property {Object} [dateFormat]
     */
    dateFormat: {
      value: {
        today: { hour: 'numeric', minute: 'numeric' },
        week: { weekday: 'short' },
        older: { month: 'short', year: 'numeric' },
        default: { month: 'short', day: 'numeric' },
      },
    },

    /**
     * Provide a function that returns the menu items for the given Conversation.
     *
     * Note that this is called each time the user clicks on a menu button to open the menu,
     * but is not dynamic in that it will regenerate the list as the Conversation's properties change.
     *
     * Format is:
     *
     * ```
     * widget.getMenuOptions = function(conversation) {
     *   return [
     *     {text: "label1", method: method1},
     *     {text: "label2", method: method2},
     *     {text: "label3", method: method3}
     *   ];
     * }
     * ```
     *
     * @property {Function} getMenuOptions
     * @property {layer.Conversation} getMenuOptions.conversation
     * @property {Object[]} getMenuOptions.returns
     */
    getMenuOptions: {
      type: Function,
      set() {
        if (this.nodes.menuButton) {
          this.nodes.menuButton.getMenuOptions = this.properties.getMenuOptions;
        }
      },
    },
  },
  methods: {
    onAfterCreate() {
      const dateFormat = this.dateFormat;
      if (dateFormat && this.nodes.date) {
        Object.keys(dateFormat).forEach(formatName => (this.nodes.date[formatName + 'Format'] = dateFormat[formatName]));
      }
    },

    onRender() {
      this.onRerender();
    },

    onRerender() {
      const users = this.item.participants.filter(user => !user.sessionOwner);
      const isRead = !this.item.lastMessage || this.item.lastMessage.isRead;

      if (this.nodes.groupCounter) this.nodes.groupCounter.innerHTML = users.length;
      this.toggleClass('layer-group-conversation', users.length > 1);
      this.toggleClass('layer-direct-message-conversation', users.length <= 1);
      if (!this.item.lastMessage) {
        this.nodes.date.date = null;
        this.nodes.date.value = '';
      } else if (this.item.lastMessage.isNew()) {
        this.item.lastMessage.on('messages:change', this.onRerender, this);
        this.nodes.date.value = '';
      } else if (this.item.lastMessage.isSaving()) {
        this.nodes.date.value = 'Pending'; // LOCALIZE!
        this.item.lastMessage.on('messages:change', this.onRerender, this);
      } else {
        this.item.lastMessage.off('messages:change', this.onRerender, this);
        this.nodes.date.date = this.item.lastMessage.sentAt;
      }
      if (this.nodes.avatar) this.nodes.avatar.users = users;
      if (this.nodes.presence) this.nodes.presence.item = users.length === 1 ? users[0] : null;
      this.classList[isRead ? 'remove' : 'add']('layer-conversation-unread-messages');
    },

    /**
     * Run a filter on this item; not match => hidden; match => shown.
     *
     * @method _runFilter
     * @param {String|Regex|Function} filter
     */
    _runFilter(filter) {
      const conversation = this.properties.item;
      let match;
      if (!filter) {
        match = true;
      } else if (typeof filter === 'function') {
        match = filter(conversation);
      } else {
        const values = [];
        if (conversation.metadata.conversationName) values.push(conversation.metadata.conversationName);
        conversation.participants.forEach((identity) => {
          values.push(identity.displayName);
          values.push(identity.firstName);
          values.push(identity.lastName);
          values.push(identity.emailAddress);
        });
        if (filter instanceof RegExp) {
          match = values.filter(value => filter.test(value)).length;
        } else {
          filter = filter.toLowerCase();
          match = values.filter((value) => {
            if (value) {
              return value.toLowerCase().indexOf(filter) !== -1;
            } else {
              return false;
            }
          }).length;
        }
      }
      this.classList[match ? 'remove' : 'add']('layer-item-filtered');
    },
  },
});