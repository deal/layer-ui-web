describe('layer-conversation-panel', function() {
  var el, testRoot, client, conversation, user1, query;

  beforeAll(function(done) {
    if (layerUI.components['layer-conversation-panel'] && !layerUI.components['layer-conversation-panel'].classDef) layerUI.init({});
    setTimeout(done, 1000);
  });

  afterEach(function() {
    jasmine.clock().uninstall();
  });

  beforeEach(function() {
    jasmine.clock().install();

    client = new layer.Client({
      appId: 'layer:///apps/staging/Fred'
    });
    client.user = new layer.Identity({
      client: client,
      userId: 'FrodoTheDodo',
      displayName: 'Frodo the Dodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true,
      sessionOwner: true
    });

    user1 = new layer.Identity({
      client: client,
      userId: 'SaurumanTheMildlyAged',
      displayName: 'Sauruman the Mildly Aged',
      id: 'layer:///identities/SaurumanTheMildlyAged',
      isFullIdentity: true
    });

    client._clientAuthenticated();

    if (layerUI.components['layer-conversation-panel'] && !layerUI.components['layer-conversation-panel'].classDef) layerUI.init({});
    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-conversation-panel');
    testRoot.appendChild(el);
    conversation = client.createConversation({
      participants: ['layer:///identities/FrodoTheDodo', 'layer:///identities/SaurumanTheMildlyAged']
    });

    query = client.createQuery({
      model: layer.Query.Message
    });
    query.isFiring = false;
    for (i = 0; i < 100; i++) {
      query.data.push(conversation.createMessage("M " + i).send());
    }

    el.query = query;
    jasmine.clock().tick(1);
  });

  afterEach(function() {
    document.body.removeChild(testRoot);
    if (el) el.onDestroy();
  });

  describe('Event Handling', function() {
    it("Should call onMessageDeleted when child triggers layer-message-deleted", function() {
      var spy = jasmine.createSpy('callback');
      el.onMessageDeleted = spy;
      el.firstChild.trigger('layer-message-deleted', {message: query.data[1]});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });

    it("Should call onSendMessage when child triggers layer-send-message", function() {
      var spy = jasmine.createSpy('callback');
      el.onSendMessage = spy;
      el.firstChild.trigger('layer-send-message', {message: conversation.createMessage("hey")});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });

    it("Should call onTypingIndicatorChange when child triggers layer-typing-indicator-change", function() {
      var spy = jasmine.createSpy('callback');
      el.onTypingIndicatorChange = spy;
      el.firstChild.trigger('layer-typing-indicator-change', {});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });

    it("Should call onComposerChangeValue when child triggers layer-composer-change-value", function() {
      var spy = jasmine.createSpy('callback');
      el.onComposerChangeValue = spy;
      el.firstChild.trigger('layer-composer-change-value', {});
      expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
    });
  });

  describe("The query properties", function() {
    beforeEach(function() {
      testRoot.innerHTML = '<layer-conversation-panel use-generated-query="false"></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();
      el = testRoot.firstChild;
    });

    it("Should reject a value that isnt in query id format", function() {
      el.queryId = "fred";
      expect(el.queryId).toEqual("");
      expect(el.query).toBe(null);
    });

    it("Should accept a value that is in query id format", function() {
      el.queryId = query.id;
      expect(el.queryId).toEqual(query.id);
      expect(el.query).toBe(null);
    });

    it("Should set the query from queryId if there is a client", function() {
      el.client = client;
      el.queryId = query.id;
      expect(el.queryId).toEqual(query.id);
      expect(el.query).toBe(query);
    });

    it("Should set the list query when query is set", function() {
      expect(el.nodes.list.query).toBe(null);
      el.query = query;
      expect(el.nodes.list.query).toBe(query);
    });

    it("Should destroy the existing query if hasGeneratedQuery is true", function() {
      el.client = client;
      var query2 = client.createQuery({model: layer.Conversation});
      el.query = query2;
      el.properties.hasGeneratedQuery = true;
      el.query = query;
      expect(query2.isDestroyed).toBe(true);
      expect(el.properties.hasGeneratedQuery).toBe(false);
    });

    it("Should not destroy the existing query if hasGeneratedQuery is false", function() {
      el.client = client;
      var query2 = client.createQuery({model: layer.Conversation});
      el.query = query2;
      el.properties.hasGeneratedQuery = false;
      el.query = query;
      expect(query2.isDestroyed).toBe(false);
      expect(el.properties.hasGeneratedQuery).toBe(false);
    });

    it("Should call _setupGeneratedQuery once the client is set", function() {
        testRoot.innerHTML = '<layer-conversation-panel></layer-conversation-panel>';
        CustomElements.takeRecords();
        layer.Util.defer.flush();

        var el = testRoot.firstChild;
        spyOn(el, "_setupGeneratedQuery");
        el.client = client;
        expect(el._setupGeneratedQuery).toHaveBeenCalledWith();
      });

      it("Should not call _setupGeneratedQuery once the client is set if useGeneratedQuery is false", function() {
        testRoot.innerHTML = '<layer-conversation-panel use-generated-query="false"></layer-conversation-panel>';
        CustomElements.takeRecords();
        layer.Util.defer.flush();

        var el = testRoot.firstChild;
        spyOn(el, "_setupGeneratedQuery");
        el.client = client;
        expect(el.useGeneratedQuery).toBe(false);
        expect(el._setupGeneratedQuery).not.toHaveBeenCalledWith();
      });
  });

  describe("The hasGeneratedQuery property", function() {
    it("Should call _setupConversation if set to true", function() {
      el.conversationId = conversation.id;
      el.client = client;
      spyOn(el, "_setupConversation");
      el.hasGeneratedQuery = true;
      expect(el._setupConversation).toHaveBeenCalled();
    });

    it("Should not call _setupConversation if set to false", function() {
      el.conversationId = conversation.id;
      el.client = client;
      spyOn(el, "_setupConversation");
      el.hasGeneratedQuery = false;
      expect(el._setupConversation).not.toHaveBeenCalled();
    });

    it("Should not call _setupConversation if set to true but no conversationId", function() {
      el.conversationId = '';
      el.client = client;
      spyOn(el, "_setupConversation");
      el.hasGeneratedQuery = true;
      expect(el._setupConversation).not.toHaveBeenCalled();
    });

    it("Should not call _setupConversation if no client", function() {
      el.conversationId = conversation.id;
      el.client = null;
      spyOn(el, "_setupConversation");
      el.hasGeneratedQuery = true;
      expect(el._setupConversation).not.toHaveBeenCalled();
    });
  });

  describe("The conversationId property", function() {
    beforeEach(function() {
      testRoot.innerHTML = '<layer-conversation-panel></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();
      el = testRoot.firstChild;
    });

    it("Should ignore if not a properly formatted id", function() {
      el.conversationId = 'Frodo';
      expect(el.conversationId).toEqual('');
    });

    it("Should call _setupConversation if there is a client", function() {
      spyOn(el, "_setupConversation");
      el.client = client;
      el.conversationId = conversation.id;
      expect(el._setupConversation).toHaveBeenCalledWith();
    });

    it("Should call not call _setupConversation if there is not a client", function() {
      spyOn(el, "_setupConversation");
      el.conversationId = conversation.id;
      expect(el._setupConversation).not.toHaveBeenCalled();
    });

    it("Should wait until client.isReady", function() {
      client.isReady = false;
      el.client = client;
      spyOn(el, "_setupConversation");

      // Run
      el.conversationId = conversation.id;
      expect(el._setupConversation).not.toHaveBeenCalled();

      // Second run
      client._clientReady();
      expect(el._setupConversation).toHaveBeenCalled();
    });

    it("Should load the conversation if not cached", function() {
      el.client = client;
      expect(el.conversation).toBe(null);

      // Run
      el.conversationId = conversation.id.replace(/.$/, 'z');

      // Posttest
      expect(el.conversation).toEqual(jasmine.any(layer.Conversation));
      expect(el.conversation.isLoading).toBe(true);
    });

    it("Should clear the conversation if set to empty string", function() {
      el.client = client;
      el.conversation = conversation;
      expect(el.nodes.typingIndicators.conversation).toBe(conversation);

      el.conversationId = "";
      expect(el.conversation).toBe(null);
      expect(el.nodes.typingIndicators.conversation).toBe(null);
    });
  });

  describe("The conversation property", function() {
    beforeEach(function() {
      testRoot.innerHTML = '<layer-conversation-panel></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();
      el = testRoot.firstChild;
    });

    it("Should ignore invalid values", function() {
      el.conversation = {hey: "ho"};
      expect(el.conversation).toBe(null);
    });

    it("Should call _setupConversation if there is a value or not", function() {
      spyOn(el, "_setupConversation");
      el.client = client;
      el.conversation = conversation;
      expect(el._setupConversation).toHaveBeenCalled();
      el._setupConversation.calls.reset();

      el.conversation = null;
      expect(el._setupConversation).toHaveBeenCalled();
    });
  });

  describe("The autoFocusConversation property", function() {
    it("Should default to true", function() {
      testRoot.innerHTML = '<layer-conversation-panel></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();

      el = testRoot.firstChild;
      expect(el.autoFocusConversation).toBe(true);
    });

    it("Should be initializable to false", function() {
      testRoot.innerHTML = '<layer-conversation-panel auto-focus-conversation="false"></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();

      el = testRoot.firstChild;
      expect(el.autoFocusConversation).toBe(false);
    });

    it("Should be initializable to true", function() {
      testRoot.innerHTML = '<layer-conversation-panel auto-focus-conversation="true"></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();

      el = testRoot.firstChild;
      expect(el.autoFocusConversation).toBe(true);
    });
  });

  describe("The client property", function() {
    it("Should setup the conversation if there is a conversationId", function() {
      testRoot.innerHTML = '<layer-conversation-panel conversation-id="' + conversation.id + '"></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();

      el = testRoot.firstChild;
      spyOn(el, "_setupConversation");
      el.client = client;
      expect(el._setupConversation).toHaveBeenCalledWith();

      // Inverse Test
      testRoot.innerHTML = '<layer-conversation-panel></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();

      el = testRoot.firstChild;
      spyOn(el, "_setupConversation");
      el.client = client;
      expect(el._setupConversation).not.toHaveBeenCalled();
    });

    it("Should setup the query if there is a queryId", function() {
      testRoot.innerHTML = '<layer-conversation-panel use-generated-query="false" query-id="' + query.id + '"></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();

      el = testRoot.firstChild;
      expect(el.query).toBe(null);
      el.client = client;
      expect(el.query).toBe(query);

      // Inverse test
      testRoot.innerHTML = '<layer-conversation-panel use-generated-query="false"></layer-conversation-panel>';
      CustomElements.takeRecords();
      layer.Util.defer.flush();

      el = testRoot.firstChild;
      expect(el.query).toBe(null);
      el.client = client;
      expect(el.query).toBe(null);
    });
  });

  describe("The onRenderListItem property", function() {
    it("Should set the list onRenderListItem property", function() {
      var f = function() {};
      el.onRenderListItem = f;
      layer.Util.defer.flush();
      expect(el.nodes.list.onRenderListItem).toBe(f);
    });
  });

  describe("The emptyMessageListNode property", function() {
    it("Should set the list emptyNode property", function() {
      var div = document.createElement('div');
      el.emptyMessageListNode = div;
      layer.Util.defer.flush();
      expect(el.nodes.list.emptyNode).toBe(div);
    });
  });

  describe("The composeButtons property", function() {
    it("Should set the list composeButtons property", function() {
      var buttons = [document.createElement("button"), document.createElement("button")];
      var moreButtons = [document.createElement("button")];
      el.composeButtons = buttons;
      el.composeButtonsLeft = moreButtons;
      layer.Util.defer.flush();
      expect(el.nodes.composer.buttons).toBe(buttons);
      expect(el.nodes.composer.buttonsLeft).toBe(moreButtons);
    });
  });


  describe("The composeText property", function() {
    it("Should set the list composeText property", function() {
      el.composeText = "Frodo Must Cry";
      layer.Util.defer.flush();
      expect(el.nodes.composer.value).toEqual("Frodo Must Cry");
    });
  });

  describe("The composePlaceholder property", function() {
    it("Should set the list composePlaceholder property", function() {
      el.composePlaceholder = "Frodo Must Cry";
      layer.Util.defer.flush();
      expect(el.nodes.composer.placeholder).toEqual("Frodo Must Cry");
    });
  });

  describe("The dateRenderer property", function() {
    it("Should pass the property to the list", function() {
      var f = function() {}
      el.dateRenderer = f;
      layer.Util.defer.flush();
      expect(el.nodes.list.dateRenderer).toBe(f);
    });
  });

  describe("The messageStatusRenderer property", function() {
    it("Should pass the property to the list", function() {
      var f = function() {}
      el.messageStatusRenderer = f;
      layer.Util.defer.flush();
      expect(el.nodes.list.messageStatusRenderer).toBe(f);
    });
  });

  describe("The created() method", function() {
    it("Should setup basic properties", function() {
      expect(el.nodes.list.tagName).toEqual('LAYER-MESSAGES-LIST');
      expect(el.nodes.composer.tagName).toEqual('LAYER-COMPOSER');
      expect(el.nodes.typingIndicators.tagName).toEqual('LAYER-TYPING-INDICATOR');
    });

    it("Should set a tabIndex of -1 if its unset", function() {
      expect(el.tabIndex).toEqual(-1);

      // Inverse
      testRoot.innerHTML = '<layer-conversation-panel tabindex="5"></layer-conversation-panel>';
      CustomElements.takeRecords();
      el = testRoot.firstChild;
      expect(el.tabIndex).toEqual(5);
    });
  });

  describe("The _onKeyDown() method", function() {
    beforeEach(function() {
      spyOn(el, "focusText");
    });

    it("Should call focusText if a character is hit while not focusing on an input", function(done) {
      el.focus();
      jasmine.clock().uninstall();
      setTimeout(function() {
        el._onKeyDown({
          keyCode: 70,
          metaKey: false,
          ctrlKey: false
        });
        expect(el.focusText).toHaveBeenCalledWith();
        done();
      }, 1);
    });

    it("Should not call focusText if a character is hit while focusing on an input", function() {
      var input = document.createElement("input");
      testRoot.appendChild(input);
      input.focus();
      el._onKeyDown({
        keyCode: 70,
        metaKey: false,
        ctrlKey: false
      });
      expect(el.focusText).not.toHaveBeenCalled();
    });

    it("Should not call focusText if a charater is hit while holding a metaKey or ctrlKey", function() {
      el._onKeyDown({
        keyCode: 70,
        metaKey: false,
        ctrlKey: true
      });
      expect(el.focusText).not.toHaveBeenCalled();
    });

    it("Should not call focusText if a non-character key is hit", function() {
      el._onKeyDown({
        keyCode: 4,
        metaKey: false,
        ctrlKey: false
      });
      expect(el.focusText).not.toHaveBeenCalled();
    });
  });

  describe("The focusText() method", function() {
    it("Should call the composers focus method", function() {
      spyOn(el.nodes.composer, "focus");
      el.focusText();
      expect(el.nodes.composer.focus).toHaveBeenCalledWith();
    });
  });

  describe("The send() method", function() {
    it("Should call the composers focus method", function() {
      spyOn(el.nodes.composer, "send");
      el.send();
      expect(el.nodes.composer.send).toHaveBeenCalledWith();
    });

    it("Should send optional parts", function() {
      spyOn(el.nodes.composer, "send");
      el.send([{mimeType: "hey", body: "ho"}]);
      expect(el.nodes.composer.send).toHaveBeenCalledWith([{mimeType: "hey", body: "ho"}]);
    });
  });

  describe("The _setupConversation() method", function() {
    beforeEach(function() {
      CustomElements.takeRecords();
      layer.Util.defer.flush();
      el.client = client;
    });
    it("Should setup the composers Conversation", function() {
      expect(el.nodes.composer.conversation).toBe(null);
      el.conversationId = conversation.id;
      expect(el.nodes.composer.conversation).toBe(conversation);
    });

    it("Should setup the typing-indicators Conversation", function() {
      expect(el.nodes.typingIndicators.conversation).toBe(null);
      el.conversationId = conversation.id;
      expect(el.nodes.typingIndicators.conversation).toBe(conversation);

    });

    it("Should call focusText if autoFocusConversation", function() {
      spyOn(el, "focusText");
      el.conversationId = conversation.id;
      expect(el.focusText).toHaveBeenCalledWith();

      // Inverse
      el.focusText.calls.reset();
      el.autoFocusConversation = false;
      el.conversationId = conversation.id;
      expect(el.focusText).not.toHaveBeenCalled();
    });

    it("Should delay if client is not ready", function() {
      spyOn(el.query, "update");
      client.isReady = false;
      el.hasGeneratedQuery = true;
      el.conversation = conversation;

      expect(el.query.update).not.toHaveBeenCalled();
      client._clientReady();
      expect(el.query.update).toHaveBeenCalled();
    });

    it("Should clear the conversation", function() {
      spyOn(el, "_setupConversation").and.callThrough();
      el.conversation = conversation;
      expect(el.nodes.composer.conversation).toBe(conversation);

      el.conversation = null;

      expect(el._setupConversation).toHaveBeenCalled();
      expect(el.nodes.composer.conversation).toBe(null);
    });

    it("Should retry when client isReady", function() {
      spyOn(el, "_setupConversation").and.callThrough();
      client.isReady = false;
      el.conversationId = conversation.id.replace(/.$/, 'z');
      el.hasGeneratedQuery = true;

      expect(el._setupConversation).toHaveBeenCalled();
      el._setupConversation.calls.reset();

      client._clientReady();
      expect(el._setupConversation).toHaveBeenCalled();
    });

    it("Should not update the predicate if its not a generated query", function() {
      spyOn(query, "update");
      el.hasGeneratedQuery = false;
      el.conversation = conversation;
      expect(query.update).not.toHaveBeenCalled();
    });

    it("Should update conversation query predicate", function() {
      spyOn(query, "update");
      el.hasGeneratedQuery = true;
      el.conversation = conversation;
      expect(query.update).toHaveBeenCalledWith({
        predicate: 'conversation.id = "' + conversation.id + '"'
      });
    });

    it("Should update channel query predicate", function() {
      spyOn(query, "update");
      el.hasGeneratedQuery = true;
      var channel = client.createChannel({
        name: "test"
      });
      el.conversation = channel;
      expect(query.update).toHaveBeenCalledWith({
        predicate: 'channel.id = "' + channel.id +'"'
      });
    });
  });
});