(function() {
  
  /** section: DOM
   * Event
   *  
   *  The namespace for Prototype's event system.
   *  
   *  <h4>Events: a fine mess</h4>
   *  
   *  Event management is one of the really sore spots of cross-browser
   *  scripting.
   *  
   *  True, the prevalent issue is: everybody does it the W3C way, and MSIE
   *  does it another way altogether. But there are quite a few subtler,
   *  sneakier issues here and there waiting to bite your ankle — such as the
   *  `keypress`/`keydown` issue with KHTML-based browsers (Konqueror and
   *  Safari). Also, MSIE has a tendency to leak memory when it comes to
   *  discarding event handlers.
   *  
   *  <h4>Prototype to the rescue</h4>
   *  
   *  Of course, Prototype smooths it over so well you’ll forget these
   *  troubles even exist. Enter the `Event` namespace. It is replete with
   *  methods that help to normalize the information reported by events across
   *  browsers.
   *  
   *  `Event` also provides a standardized list of key codes you can use with
   *  keyboard-related events.
   *  
   *  The functions you’re most likely to use a lot are [[Event.observe]],
   *  [[Event#element]] and [[Event#stop]]. If your web app uses custom events,
   *  you'll also get a lot of mileage out of [[Event.fire]].
  **/  
  var Event = {
    KEY_BACKSPACE: 8,
    KEY_TAB:       9,
    KEY_RETURN:   13,
    KEY_ESC:      27,
    KEY_LEFT:     37,
    KEY_UP:       38,
    KEY_RIGHT:    39,
    KEY_DOWN:     40,
    KEY_DELETE:   46,
    KEY_HOME:     36,
    KEY_END:      35,
    KEY_PAGEUP:   33,
    KEY_PAGEDOWN: 34,
    KEY_INSERT:   45,

    cache: {}
  };
  
  var docEl = document.documentElement;
  var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl
    && 'onmouseleave' in docEl;

  var _isButton;
  if (Prototype.Browser.IE) {
    // IE doesn't map left/right/middle the same way.
    var buttonMap = { 0: 1, 1: 4, 2: 2 };
    _isButton = function(event, code) {
      return event.button === buttonMap[code];
    };
  } else if (Prototype.Browser.WebKit) {
    // In Safari we have to account for when the user holds down
    // the "meta" key.
    _isButton = function(event, code) {
      switch (code) {
        case 0: return event.which == 1 && !event.metaKey;
        case 1: return event.which == 1 && event.metaKey;
        default: return false;
      }
    };
  } else {
    _isButton = function(event, code) {
      return event.which ? (event.which === code + 1) : (event.button === code);
    };
  }

  /**
   *  Event#isLeftClick(@event) -> Boolean
   *  
   *  Determines whether a button-related mouse event involved the left
   *  mouse button.
   *  
   *  Keep in mind that the "left" mouse button is actually the "primary" mouse
   *  button. When a mouse is in left-handed mode, the browser will report
   *  clicks of the _right_ button as "left-clicks."
  **/
  function isLeftClick(event)   { return _isButton(event, 0) }
  
  /**
   *  Event#isMiddleClick(@event) -> Boolean
   *  
   *  Determines whether a button-related mouse event involved the middle
   *  mouse button.
  **/
  function isMiddleClick(event) { return _isButton(event, 1) }
  
  /**
   *  Event#isRightClick(@event) -> Boolean
   *  
   *  Determines whether a button-related mouse event involved the right
   *  mouse button.
   *  
   *  Keep in mind that the "left" mouse button is actually the "secondary"
   *  mouse button. When a mouse is in left-handed mode, the browser will
   *  report clicks of the _left_ button as "left-clicks."
  **/
  function isRightClick(event)  { return _isButton(event, 2) }
  
  /**
   *  Event#element(@event) -> Element
   *  
   *  Returns the DOM element on which the event occurred.
  **/
  function element(event) {
    event = Event.extend(event);

    var node = event.target, type = event.type,
     currentTarget = event.currentTarget;

    if (currentTarget && currentTarget.tagName) {
      // Firefox screws up the "click" event when moving between radio buttons
      // via arrow keys. It also screws up the "load" and "error" events on images,
      // reporting the document as the target instead of the original image.
      if (type === 'load' || type === 'error' ||
        (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
          && currentTarget.type === 'radio'))
            node = currentTarget;
    }

    // Fix a Safari bug where a text node gets passed as the target of an
    // anchor click rather than the anchor itself.
    if (node.nodeType == Node.TEXT_NODE)
      node = node.parentNode;

    return Element.extend(node);
  }

  /**
   *  Event#findElement(@event, expression) -> Element
   *  
   *  Returns the first DOM element that matches a given CSS selector —
   *  starting with the element on which the event occurred, then moving up
   *  its ancestor chain.
  **/
  function findElement(event, expression) {
    var element = Event.element(event);
    if (!expression) return element;
    var elements = [element].concat(element.ancestors());
    return Selector.findElement(elements, expression, 0);
  }
  
  /**
   *  Event#pointer(@event) -> Object
   *  
   *  Returns the absolute position of the pointer for a mouse event.
   *  
   *  Returns an object in the form `{ x: Number, y: Number}`.
   *  
   *  Note that this position is absolute on the _page_, not on the
   *  _viewport_.
  **/
  function pointer(event) {
    return { x: pointerX(event), y: pointerY(event) };
  }
  
  /**
   *  Event#pointerX(event) -> Number
   *  
   *  Returns the absolute horizontal position of the pointer for a mouse
   *  event.
   *  
   *  Note that this position is absolute on the _page_, not on the
   *  _viewport_.
  **/
  function pointerX(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollLeft: 0 };
     
    return event.pageX || (event.clientX +
      (docElement.scrollLeft || body.scrollLeft) -
      (docElement.clientLeft || 0));
  }

  /**
   *  Event#pointerY(event) -> Number
   *  
   *  Returns the absolute vertical position of the pointer for a mouse
   *  event.
   *  
   *  Note that this position is absolute on the _page_, not on the
   *  _viewport_.
  **/
  function pointerY(event) {
    var docElement = document.documentElement,
     body = document.body || { scrollTop: 0 };
     
    return  event.pageY || (event.clientY +
       (docElement.scrollTop || body.scrollTop) -
       (docElement.clientTop || 0));    
  }

  
  /**
   *  Event#stop(@event) -> undefined
   *  
   *  Stops the event’s propagation and prevents its eventual default action
   *  from being triggered.
   *  
   *  Stopping an event also sets a `stopped` property on that event for
   *  future inspection.
  **/
  function stop(event) {
    Event.extend(event);
    event.preventDefault();
    event.stopPropagation();

    // Set a "stopped" property so that a custom event can be inspected
    // after the fact to determine whether or not it was stopped.
    event.stopped = true;
  }

  Event.Methods = {
    isLeftClick: isLeftClick,
    isMiddleClick: isMiddleClick,
    isRightClick: isRightClick,

    element: element,
    findElement: findElement,

    pointer: pointer,
    pointerX: pointerX,
    pointerY: pointerY,

    stop: stop
  };


  // Compile the list of methods that get extended onto Events.
  var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
    m[name] = Event.Methods[name].methodize();
    return m;
  });

  if (Prototype.Browser.IE) {
    function _relatedTarget(event) {
      var element;
      switch (event.type) {
        case 'mouseover': element = event.fromElement; break;
        case 'mouseout':  element = event.toElement;   break;
        default: return null;
      }
      return Element.extend(element);
    }

    Object.extend(methods, {
      stopPropagation: function() { this.cancelBubble = true },
      preventDefault:  function() { this.returnValue = false },
      inspect: function() { return '[object Event]' }
    });

    // IE's method for extending events.
    Event.extend = function(event, element) {
      if (!event) return false;
      if (event._extendedByPrototype) return event;

      event._extendedByPrototype = Prototype.emptyFunction;
      var pointer = Event.pointer(event);
      
      // The optional `element` argument gives us a fallback value for the
      // `target` property in case IE doesn't give us through `srcElement`.
      Object.extend(event, {
        target: event.srcElement || element,
        relatedTarget: _relatedTarget(event),
        pageX:  pointer.x,
        pageY:  pointer.y
      });
      
      return Object.extend(event, methods);
    };
  } else {
    Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
    Object.extend(Event.prototype, methods);
    Event.extend = Prototype.K;
  }

  function _createResponder(element, eventName, handler) {
    // We don't set a default on the call to Element#retrieve so that we can 
    // handle the element's "virgin" state.
    var registry = Element.retrieve(element, 'prototype_event_registry');
    
    if (Object.isUndefined(registry)) {
      // First time we've handled this element. Put it into the cache.
      CACHE.push(element);
      registry = Element.retrieve(element, 'prototype_event_registry', $H());    
    }

    var respondersForEvent = registry.get(eventName);
    if (Object.isUndefined(respondersForEvent)) {
      respondersForEvent = [];
      registry.set(eventName, respondersForEvent);
    }
    
    // Work around the issue that permits a handler to be attached more than
    // once to the same element & event type.
    if (respondersForEvent.pluck('handler').include(handler)) return false;    
    
    var responder;
    if (eventName.include(":")) {
      // Custom event.
      responder = function(event) {
        // If it's not a custom event, ignore it.
        if (Object.isUndefined(event.eventName))
          return false;
                  
        // If it's a custom event, but not the _correct_ custom event, ignore it.
        if (event.eventName !== eventName)
          return false;
          
        Event.extend(event, element);
        handler.call(element, event);
      };
    } else {
      // Non-custom event.
      if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED &&
       (eventName === "mouseenter" || eventName === "mouseleave")) {
        // If we're dealing with mouseenter or mouseleave in a non-IE browser,
        // we create a custom responder that mimics their behavior within
        // mouseover and mouseout.
        if (eventName === "mouseenter" || eventName === "mouseleave") {
          responder = function(event) {
            Event.extend(event, element);
            
            var parent = event.relatedTarget;
            while (parent && parent !== element) {
              try { parent = parent.parentNode; }
              catch(e) { parent = element; }
            }
            
            if (parent === element) return;
            
            handler.call(element, event);
          };
        }
      } else {  
        responder = function(event) {
          Event.extend(event, element);
          handler.call(element, event);
        };
      }
    }

    responder.handler = handler;
    respondersForEvent.push(responder);
    return responder;
  }
  
  function _destroyCache() {    
    for (var i = 0, length = CACHE.length; i < length; i++) {
      try {  // ran into an access denied issues with IE (haven't been able to reproduce
	  	Event.stopObserving(CACHE[i]);
	  } catch (e) {}
      CACHE[i] = null;
    }
  }
  
  var CACHE = [];

  // Internet Explorer needs to remove event handlers on page unload
  // in order to avoid memory leaks.
  if (Prototype.Browser.IE)
    window.attachEvent('onunload', _destroyCache);

  // Safari needs a dummy event handler on page unload so that it won't
  // use its bfcache. Safari <= 3.1 has an issue with restoring the "document"
  // object when page is returned to via the back button using its bfcache.
  if (Prototype.Browser.WebKit)
    window.addEventListener('unload', Prototype.emptyFunction, false);
    
    
  var _getDOMEventName = Prototype.K;
  
  if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
    _getDOMEventName = function(eventName) {
      var translations = { mouseenter: "mouseover", mouseleave: "mouseout" };      
      return eventName in translations ? translations[eventName] : eventName;      
    };
  }

  /**
   *  Event.observe(element, eventName, handler) -> Element
   *  
   *  Registers an event handler on a DOM element.
  **/
  function observe(element, eventName, handler) {
    element = $(element);
    
    var responder = _createResponder(element, eventName, handler);
    
    if (!responder) return element;

    if (eventName.include(':')) {
      // Custom event.
      if (element.addEventListener) 
        element.addEventListener("dataavailable", responder, false);
      else {
        // We observe two IE-proprietarty events: one for custom events that
        // bubble and one for custom events that do not bubble.
        element.attachEvent("ondataavailable", responder);
        element.attachEvent("onfilterchange", responder);    
      }          
    } else {
      var actualEventName = _getDOMEventName(eventName);
      
      // Ordinary event.
      if (element.addEventListener)
        element.addEventListener(actualEventName, responder, false);
      else
        element.attachEvent("on" + actualEventName, responder);
    }

    return element;
  }

  /**
   *  Event.stopObserving(element[, eventName[, handler]]) -> Element
   *  
   *  Unregisters one or more event handlers.
   *  
   *  If `handler` is omitted, unregisters all event handlers on `element`
   *  for that `eventName`. If `eventName` is also omitted, unregisters _all_
   *  event handlers on `element`.
  **/
  function stopObserving(element, eventName, handler) {
    element = $(element);
    
    var registry = Element.retrieve(element, 'prototype_event_registry');
    
    if (Object.isUndefined(registry)) return element;

    if (eventName && !handler) {
      // If an event name is passed without a handler, we stop observing all
      // handlers of that type.
      var responders = registry.get(eventName);
      
      if (Object.isUndefined(responders)) return element;
      
      responders.each( function(r) {
        Element.stopObserving(element, eventName, r.handler);
      });
      return element;
    } else if (!eventName) {
      // If both the event name and the handler are omitted, we stop observing
      // _all_ handlers on the element.
      registry.each( function(pair) {
        var eventName = pair.key, responders = pair.value;
        
        responders.each( function(r) {
          Element.stopObserving(element, eventName, r.handler);
        });        
      });
      return element;
    }
    
    var responders = registry.get(eventName);

    // Fail gracefully if there are no responders assigned.
    if (!responders) return;
    
    var responder = responders.find( function(r) { return r.handler === handler; });
    if (!responder) return element;
    
    var actualEventName = _getDOMEventName(eventName);
    
    if (eventName.include(':')) {
      // Custom event.
      if (element.removeEventListener)
        element.removeEventListener("dataavailable", responder, false);
      else {
        element.detachEvent("ondataavailable", responder);
        element.detachEvent("onfilterchange",  responder);
      }
    } else {
      // Ordinary event.
      if (element.removeEventListener)
        element.removeEventListener(actualEventName, responder, false);
      else
        element.detachEvent('on' + actualEventName, responder);
    }
      
    registry.set(eventName, responders.without(responder));

    return element;
  }

  /**
   *  Event.fire(element, eventName[, memo[, bubble = true]]) -> Event
   *  - memo (?): Metadata for the event. Will be accessible through the
   *    event's `memo` property.
   *  - bubble (Boolean): Whether the event will bubble.
   *  
   *  Fires a custom event of name `eventName` with `element` as its target.
   *  
   *  Custom events must include a colon (`:`) in their names.
  **/
  function fire(element, eventName, memo, bubble) {
    element = $(element);
    
    if (Object.isUndefined(bubble))
      bubble = true;
    
    if (element == document && document.createEvent && !element.dispatchEvent)
      element = document.documentElement;

    var event;
    if (document.createEvent) {
      event = document.createEvent('HTMLEvents');
      event.initEvent('dataavailable', true, true);
    } else {
      event = document.createEventObject();
      event.eventType = bubble ? 'ondataavailable' : 'onfilterchange';
    }

    event.eventName = eventName;
    event.memo = memo || { };

    if (document.createEvent)
      element.dispatchEvent(event);
    else
      element.fireEvent(event.eventType, event);

    return Event.extend(event);
  }


  Object.extend(Event, Event.Methods);

  Object.extend(Event, {
    fire:          fire,
    observe:       observe,
    stopObserving: stopObserving
  });

  Element.addMethods({
    /**
     *  Element#fire(@element, eventName[, memo[, bubble = true]]) -> Event
     *  See [[Event.fire]].
    **/
    fire:          fire,

    /**
     *  Element#observe(@element, eventName, handler) -> Element
     *  See [[Event.observe]].
    **/
    observe:       observe,
    
    /** 
     *  Element#stopObserving(element[, eventName[, handler]]) -> Element
     *  See [[Event.stopObserving]].
    **/
    stopObserving: stopObserving
  });

  /** section: DOM
   * document
   *  
   *  Prototype extends the built-in `document` object with several convenience
   *  methods related to events. 
  **/
  Object.extend(document, {
    /** 
     *  document.fire(eventName[, memo[, bubble = true]]) -> Event
     *  See [[Event.fire]].
    **/
    fire:          fire.methodize(),
    
    /** 
     *  document.observe(eventName, handler) -> Element
     *  See [[Event.observe]].
    **/
    observe:       observe.methodize(),
    
    /** 
     *  document.stopObserving([eventName[, handler]]) -> Element
     *  See [[Event.stopObserving]].
    **/
    stopObserving: stopObserving.methodize(),
    
    /**
     *  document.loaded -> Boolean
     *  
     *  Whether the full DOM tree is ready for manipulation.
    **/
    loaded:        false
  });

  // Export to the global scope.
  if (window.Event) Object.extend(window.Event, Event);
  else window.Event = Event;
})();

(function() {
  /* Support for the DOMContentLoaded event is based on work by Dan Webb,
     Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

  var timer;

  function fireContentLoadedEvent() {
    if (document.loaded) return;
    if (timer) window.clearTimeout(timer);
    document.loaded = true;
    document.fire('dom:loaded');
  }

  function checkReadyState() {
    if (document.readyState === 'complete') {
      document.stopObserving('readystatechange', checkReadyState);
      fireContentLoadedEvent();
    }
  }

  function pollDoScroll() {
    try { document.documentElement.doScroll('left'); }
    catch(e) {
      timer = pollDoScroll.defer();
      return;
    }
    fireContentLoadedEvent();
  }

  if (document.addEventListener) {    
    document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
  } else {
    document.observe('readystatechange', checkReadyState);
    if (window == top)
      timer = pollDoScroll.defer();
  }

  // Worst-case fallback
  Event.observe(window, 'load', fireContentLoadedEvent);
})();
