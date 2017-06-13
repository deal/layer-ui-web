/**
 * The Layer Menu renders a menu absolutely positioned beside the specified node.
 *
 * ```
 * var menuButton = document.createElement('layer-menu-button');
 * menuButton.item = message;
 * menuButton.options = [
 *   {text: "delete", method: function(item) {item.delete(Layer.Constants.DELETION_MODE.ALL);}
 * ];
 * ```
 *
 * @class layerUI.components.subcomponents.MenuButton
 * @extends layerUI.components.Component
 */
import Layer from 'layer-websdk';
import { registerComponent } from '../../../components/component';

registerComponent('layer-menu', {
  properties: {
    options: {
      set(value) {
        const menu = document.createElement('div');
        menu.classList.add('layer-menu-button-menu-list');
        value.forEach((option) => {
          const menuItem = document.createElement('div');
          menuItem.classList.add('layer-menu-button-menu-item');
          menuItem.innerHTML = option.text;
          menuItem.addEventListener('click', (evt) => option.method(this.item));
          menu.appendChild(menuItem);
        });
        if (this.firstChild) {
          this.replaceChild(menu, this.firstChild);
        } else {
          this.appendChild(menu);
        }
      },
    },

    /**
     * Different buttons may need menus of differing widths; set it here and its applied by the button, not style sheet.
     *
     * @proeprty {Number} [menuWidth=100]
     */
    menuWidth: {
      value: 100,
      type: Number,
      set(value) {
        this.style.width = value + 'px';
      },
    },

    isShowing: {
      set(value) {
        if (value) {
          this._showNear(this.near);
        }
        this.toggleClass('layer-menu-list-showing', value);
      },
    },

    item: {},
    near: {},
  },
  methods: {

    /**
     * Constructor.
     *
     * @method onCreate
     * @private
     */
    onCreate() {
      this.onDocumentClick = this.onDocumentClick.bind(this);
      document.addEventListener('click', this.onDocumentClick);
    },

    onDestroy() {
      document.removeEventListener('click', this.onDocumentClick);
    },

    onDocumentClick(evt) {
      if (this.isShowing) this.isShowing = false;
    },


    _showNear() {
      const node = this.near;
      const bounds = node.getBoundingClientRect();
      if (bounds.right + this.menuWidth > document.body.clientWidth) {
        this.style.left = '';
        this.style.right = bounds.left + 'px';
      } else {
        this.style.right = '';
        this.style.left = bounds.right + 'px';
      }
      // TODO: May have to fix issues with this showing too low or high
      this.style.bottom = '';
      this.style.top = bounds.bottom + 'px';
      this.style.width = this.menuWidth + 'px';
      setTimeout(() => {
        if (this.offsetTop + this.clientHeight > document.body.clientHeight) {
          this.style.top = '';
          this.style.bottom = '2px';
        }
      }, 1);
    },
  },
});