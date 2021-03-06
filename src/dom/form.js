/** section: DOM
 * Form
 *
 *  Utilities for dealing with forms in the DOM.
 *
 *  `Form` is a namespace for all things form-related, packed with form
 *  manipulation and serialization goodness. While it holds methods dealing
 *  with forms as a whole, its submodule [[Form.Element]] deals with specific
 *  form controls.
 *
 *  Many of these methods are also available directly on `form` elements.
**/

var Form = {
  /**
   *  Form.reset(form) -> Element
   *
   *  Resets a form to its default values.
  **/
  reset: function(form) {
    form = $(form);
    form.reset();
    return form;
  },

  /**
   *  Form.serializeElements(elements[, options]) -> String | Object
   *  - elements (Array): A collection of elements to include in the
   *    serialization.
   *  - options (Object): _(Optional)_ A set of options that affect the return
   *    value of the method.
   *
   *  Serialize an array of form elements to an object or string suitable
   *  for [[Ajax]] requests.
   *
   *  As per the HTML spec, disabled fields are not included.
   *
   *  If multiple elements have the same name and we're returning an object,
   *  the value for that key in the object will be an array of the field values
   *  in the order they appeared on the array of elements.
   *
   *  <h4>The Options</h4>
   *
   *  The options allow you to control two things: What kind of return
   *  value you get (an object or a string), and whether and which `submit`
   *  fields are included in that object or string.
   *
   *  If you do not supply an `options` object _at all_, the options
   *  `{hash: false}` are used.
   *
   *  If you supply an `options` object, it may have the following options:
   *  - `hash` ([[Boolean]]): `true` to return a plain object with keys and values
   *    (not a [[Hash]]; see below), `false` to return a String in query string
   *    format. If you supply an `options` object with no `hash` member, `hash`
   *    defaults to `true`. Note that this is __not__ the same as leaving off the
   *    `options` object entirely (see above).
   *  - `submit` ([[Boolean]] | [[String]]): In essence: If you omit this option the
   *    first submit button in the form is included; if you supply `false`,
   *    no submit buttons are included; if you supply the name of a submit
   *    button, the first button with that name is included. Note that the `false`
   *    value __must__ really be `false`, not _falsey_; falsey-but-not-false is
   *    like omitting the option.
   *
   *  _(Deprecated)_ If you pass in a [[Boolean]] instead of an object for `options`, it
   *  is used as the `hash` option and all other options are defaulted.
   *
   *  <h4>A <em>hash</em>, not a Hash</h4>
   *
   *  If you opt to receive an object, it is a plain JavaScript object with keys
   *  and values, __not__ a [[Hash]]. All JavaScript objects are hashes in the lower-case
   *  sense of the word, which is why the option has that somewhat-confusing name.
  **/
  serializeElements: function(elements, options) {
    // An earlier version accepted a boolean second parameter (hash) where
    // the default if omitted was false; respect that, but if they pass in an
    // options object (e.g., the new signature) but don't specify the hash option,
    // default true, as that's the new preferred approach.
    if (typeof options != 'object') options = { hash: !!options };
    else if (Object.isUndefined(options.hash)) options.hash = true;
    var key, value, submitted = false, submit = options.submit;

    var data = elements.inject({ }, function(result, element) {
      if (!element.disabled && element.name) {
        key = element.name; value = $(element).getValue();
        if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted &&
            submit !== false && (!submit || key == submit) && (submitted = true)))) {
          if (key in result) {
            // a key is already present; construct an array of values
            if (!Object.isArray(result[key])) result[key] = [result[key]];
            result[key].push(value);
          }
          else result[key] = value;
        }
      }
      return result;
    });

    return options.hash ? data : Object.toQueryString(data);
  }
};

Form.Methods = {
  /**
   *  Form.serialize(@form[, options]) -> String | Object
   *  - options (Object): A list of options that affect the return value
   *    of the method.
   *
   *  Serialize form data to an object or string suitable for Ajax requests.
   *
   *  See [[Form.serializeElements]] for details on the options.
  **/
  serialize: function(form, options) {
    return Form.serializeElements(Form.getElements(form), options);
  },

  /**
   *  Form.getElements(@form) -> [Element...]
   *
   *  Returns a collection of all controls within a form.
  **/
  getElements: function(form) {
    var elements = $(form).getElementsByTagName('*'),
        element,
        arr = [ ],
        serializers = Form.Element.Serializers;
    // `length` is not used to prevent interference with
    // length-named elements shadowing `length` of a nodelist
    for (var i = 0; element = elements[i]; i++) {
      arr.push(element);
    }
    return arr.inject([], function(elements, child) {
      if (serializers[child.tagName.toLowerCase()])
        elements.push(Element.extend(child));
      return elements;
    })
  },

  /**
   *  Form.getInputs(@form [, type [, name]]) -> [Element...]
   *  - type (String): A value for the `type` attribute against which to
   *    filter.
   *  - name (String): A value for the `name` attribute against which to
   *    filter.
   *
   *  Returns a collection of all `INPUT` elements in a form.
   *
   *  Use optional `type` and `name` arguments to restrict the search on
   *  these attributes.
  **/
  getInputs: function(form, typeName, name) {
    form = $(form);
    var inputs = form.getElementsByTagName('input');

    if (!typeName && !name) return $A(inputs).map(Element.extend);

    for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
      var input = inputs[i];
      if ((typeName && input.type != typeName) || (name && input.name != name))
        continue;
      matchingInputs.push(Element.extend(input));
    }

    return matchingInputs;
  },

  /**
   *  Form.disable(@form) -> Element
   *
   *  Disables the form as a whole. Form controls will be visible but
   *  uneditable.
  **/
  disable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('disable');
    return form;
  },

  /**
   *  Form.enable(@form) -> Element
   *
   *  Enables a fully- or partially-disabled form.
  **/
  enable: function(form) {
    form = $(form);
    Form.getElements(form).invoke('enable');
    return form;
  },

  /**
   *  Form.findFirstElement(@form) -> Element
   *
   *  Finds the first non-hidden, non-disabled control within the form.
  **/
  findFirstElement: function(form) {
    var elements = $(form).getElements().findAll(function(element) {
      return 'hidden' != element.type && !element.disabled;
    });
    var firstByIndex = elements.findAll(function(element) {
      return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
    }).sortBy(function(element) { return element.tabIndex }).first();

    return firstByIndex ? firstByIndex : elements.find(function(element) {
      return /^(?:input|select|textarea)$/i.test(element.tagName);
    });
  },

  /**
   *  Form.focusFirstElement(@form) -> Element
   *
   *  Gives keyboard focus to the first element of the form. Returns the form.
  **/
  focusFirstElement: function(form) {
    form = $(form);
    form.findFirstElement().activate();
    return form;
  },

  /**
   *  Form.request(@form[, options]) -> Ajax.Request
   *  - options (Object): Options to pass along to the `Ajax.Request`
   *    constructor.
   *
   *  A convenience method for serializing and submitting the form via an
   *  [[Ajax.Request]] to the URL of the form's `action` attribute.
   *
   *  The `options` parameter is passed to the `Ajax.Request` instance,
   *  allowing one to override the HTTP method and/or specify additional
   *  parameters and callbacks.
  **/
  request: function(form, options) {
    form = $(form), options = Object.clone(options || { });

    var params = options.parameters, action = form.readAttribute('action') || '';
    if (action.blank()) action = window.location.href;
    options.parameters = form.serialize(true);

    if (params) {
      if (Object.isString(params)) params = params.toQueryParams();
      Object.extend(options.parameters, params);
    }

    if (form.hasAttribute('method') && !options.method)
      options.method = form.method;

    return new Ajax.Request(action, options);
  }
};

/*--------------------------------------------------------------------------*/

/** section: DOM
 * Form.Element
 *
 *  Utilities for dealing with form controls in the DOM.
 *
 *  This is a collection of methods that assist in dealing with form controls.
 *  They provide ways to focus, serialize, disable/enable or extract current
 *  value from a specific control.
 *
 *  Note that nearly all these methods are available directly on `input`,
 *  `select`, and `textarea` elements. Therefore, these are equivalent:
 *
 *      Form.Element.activate('myfield');
 *      $('myfield').activate();
 *
 *  Naturally, you should always prefer the shortest form suitable in a
 *  situation. Most of these methods also return the element itself (as
 *  indicated by the return type) for chainability.
**/

Form.Element = {
  /**
   *  Form.Element.focus(element) -> Element
   *
   *  Gives keyboard focus to an element. Returns the element.
  **/
  focus: function(element) {
    $(element).focus();
    return element;
  },

  /**
   *  Form.Element.select(element) -> Element
   *
   *  Selects the current text in a text input. Returns the element.
  **/
  select: function(element) {
    $(element).select();
    return element;
  }
};

Form.Element.Methods = {

  /**
   *  Form.Element.serialize(@element) -> String
   *
   *  Returns a URL-encoded string representation of a form control in the
   *  `name=value` format.
  **/
  serialize: function(element) {
    element = $(element);
    if (!element.disabled && element.name) {
      var value = element.getValue();
      if (value != undefined) {
        var pair = { };
        pair[element.name] = value;
        return Object.toQueryString(pair);
      }
    }
    return '';
  },

  /** alias of: $F
   *  Form.Element.getValue(@element) -> String | Array
   *
   *  Returns the current value of a form control.
   *
   *  A string is returned for most controls; only multiple `select` boxes
   *  return an array of values.
   *
   *  The global shortcut for this method is [[$F]].
  **/
  getValue: function(element) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    return Form.Element.Serializers[method](element);
  },

  /**
   *  Form.Element.setValue(@element, value) -> Element
   *
   *  Sets `value` to be the value of the form control. Returns the element.
  **/
  setValue: function(element, value) {
    element = $(element);
    var method = element.tagName.toLowerCase();
    Form.Element.Serializers[method](element, value);
    return element;
  },

  /**
   *  Form.Element.clear(@element) -> Element
   *
   *  Clears the contents of a text input. Returns the element.
  **/
  clear: function(element) {
    $(element).value = '';
    return element;
  },

  /**
   *  Form.Element.present(@element) -> Element
   *
   *  Returns `true` if a text input has contents, `false` otherwise.
  **/
  present: function(element) {
    return $(element).value != '';
  },

  /**
   *  Form.Element#activate(element) -> Element
   *
   *  Gives focus to a form control and selects its contents if it is a text
   *  input.
  **/
  activate: function(element) {
    element = $(element);
    try {
      element.focus();
      if (element.select && (element.tagName.toLowerCase() != 'input' ||
          !(/^(?:button|reset|submit)$/i.test(element.type))))
        element.select();
    } catch (e) { }
    return element;
  },

  /**
   *  Form.Element.disable(@element) -> Element
   *
   *  Disables a form control, effectively preventing its value from changing
   *  until it is enabled again.
  **/
  disable: function(element) {
    element = $(element);
    element.disabled = true;
    return element;
  },

  /**
   *  Form.Element.enable(@element) -> Element
   *
   *  Enables a previously disabled form control.
  **/
  enable: function(element) {
    element = $(element);
    element.disabled = false;
    return element;
  }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;

/** section: DOM, related to: Form
 *  $F(element) -> String | Array
**/
var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = {
  input: function(element, value) {
    switch (element.type.toLowerCase()) {
      case 'checkbox':
      case 'radio':
        return Form.Element.Serializers.inputSelector(element, value);
      default:
        return Form.Element.Serializers.textarea(element, value);
    }
  },

  inputSelector: function(element, value) {
    if (Object.isUndefined(value)) return element.checked ? element.value : null;
    else element.checked = !!value;
  },

  textarea: function(element, value) {
    if (Object.isUndefined(value)) return element.value;
    else element.value = value;
  },

  select: function(element, value) {
    if (Object.isUndefined(value))
      return this[element.type == 'select-one' ?
        'selectOne' : 'selectMany'](element);
    else {
      var opt, currentValue, single = !Object.isArray(value);
      for (var i = 0, length = element.length; i < length; i++) {
        opt = element.options[i];
        currentValue = this.optionValue(opt);
        if (single) {
          if (currentValue == value) {
            opt.selected = true;
            return;
          }
        }
        else opt.selected = value.include(currentValue);
      }
    }
  },

  selectOne: function(element) {
    var index = element.selectedIndex;
    return index >= 0 ? this.optionValue(element.options[index]) : null;
  },

  selectMany: function(element) {
    var values, length = element.length;
    if (!length) return null;

    for (var i = 0, values = []; i < length; i++) {
      var opt = element.options[i];
      if (opt.selected) values.push(this.optionValue(opt));
    }
    return values;
  },

  optionValue: function(opt) {
    // extend element because hasAttribute may not be native
    return Element.extend(opt).hasAttribute('value') ? opt.value : opt.text;
  }
};

/*--------------------------------------------------------------------------*/

/** section: DOM
 * Abstract
**/

/** section: DOM
 *  class Abstract.TimedObserver
 *
 *  An abstract DOM element observer class, subclasses of which can be used to periodically
 *  check a value and trigger a callback when the value has changed.
 *
 *  A `TimedObserver` object will try to check a value using the `getValue()`
 *  instance method which must be defined by the subclass. There are two out-of-the-box subclasses:
 *  [[Form.Observer]], which serializes a form and triggers when the result has changed; and
 *  [[Form.Element.Observer]], which triggers when the value of a given form field changes.
 *
 *  <h4>Creating Your Own TimedObserver Implementations</h4>
 *
 *  It's easy to create your own `TimedObserver` implementations: Simply subclass `TimedObserver`
 *  and provide the `getValue()` method. For example, this is the complete source code for
 *  [[Form.Element.Observer]]:
 *
 *      Form.Element.Observer = Class.create(Abstract.TimedObserver, {
 *        getValue: function() {
 *          return Form.Element.getValue(this.element);
 *        }
 *      });
**/
Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
  /**
   *  new Abstract.TimedObserver(element, frequency, callback)
   *  - element (String | Element): The DOM element to watch. Can be an element instance or an ID.
   *  - frequency (Number): The frequency, in seconds&nbsp;&mdash; e.g., 0.33 to check for changes every
   *    third of a second.
   *  - callback (Function): The callback to trigger when the value changes.
   *
   *  Initializes an `Abstract.TimedObserver`; used by subclasses.
  **/
  initialize: function($super, element, frequency, callback) {
    $super(callback, frequency);
    this.element   = $(element);
    this.lastValue = this.getValue();
  },

  execute: function() {
    var value = this.getValue();
    if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  }
});

/** section: DOM
 *  class Form.Element.Observer < Abstract.TimedObserver
 *
 *  An [[Abstract.TimedObserver]] subclass that watches for changes to a form field's value.
 *  This triggers the callback when the form field's value (according to
 *  [[Form.Element#getValue]]) changes. (Note that when the value actually changes can vary from
 *  browser to browser, particularly with `select` boxes.)
**/
Form.Element.Observer = Class.create(Abstract.TimedObserver, {
  /**
   *  new Form.Element.Observer(element, frequency, callback)
   *  - element (String | Element): The form element to watch. Can be an element instance or an ID.
   *  - frequency (Number): The frequency, in seconds&nbsp;&mdash; e.g., 0.33 to check for changes every
   *    third of a second.
   *  - callback (Function): The callback to trigger when the value changes.
   *
   *  Creates a Form.Element.Observer.
  **/
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

/** section: DOM
 *  class Form.Observer < Abstract.TimedObserver
 *
 *  An [[Abstract.TimedObserver]] subclass that watches for changes to a form.
 *  The callback is triggered when the form changes&nbsp;&mdash; e.g., when any of its fields' values
 *  changes, when fields are added/removed, etc.; anything that affects the serialized
 *  form of the form (see [[Form#serialize]]).
**/
Form.Observer = Class.create(Abstract.TimedObserver, {
  /**
   *  new Form.Observer(element, frequency, callback)
   *  - element (String | Element): The element of the form to watch. Can be an element
   *    instance or an ID.
   *  - frequency (Number): The frequency, in seconds -- e.g., 0.33 to check for changes every
   *    third of a second.
   *  - callback (Function): The callback to trigger when the form changes.
   *
   *  Creates a Form.Observer.
  **/
  initialize: function($super, element, frequency, callback, enhanced, textDelay) {    
    
    if (!enhanced) {
      $super(element, frequency, callback);
    }
    else {
      element = $(element);
      var callbackTimer;
      var observerObject = this;
      var changeCallback = function(elements, form, data){
        if (!form) {
          // if the callback came from the select onChange then set the parameters to the proper values
          form = $(elements.element().form);
          elements = [elements.element()];
          data = form.serialize(true);
        }
        // if textDelay was passed and only one element has changed and the form is not submitting and the element is text/textarea then delay the callback for textDelay seconds
        if (textDelay && !form.submitting && (elements.length == 1 && (elements.first().tagName.toLowerCase() == 'textarea' || (elements.first().tagName.toLowerCase() == 'input' && elements.first().type.toLowerCase() == 'text')))) {
          clearTimeout(callbackTimer);
          callbackTimer = callback.delay(textDelay, elements, form, data);
          return;
        }
        clearTimeout(callbackTimer);
        if (elements) {
          // call the users callback function
          callback(elements, form, data);
        }
      };
      // add change event binding to all select boxes in the form because firefox (and some other browsers) change the value of select boxes when the user hasn't clicked (onHover)
      element.select('select').invoke('observe', 'change', changeCallback);
      // disable Visual Studio DotNet controls because viewstate can be very large and causes the observer to barf.
      element.select('#__EVENTTARGET', '#__EVENTARGUMENT', '#__VIEWSTATE').each(Form.Element.disable);
      var that = this;
      $super(element, frequency, (function(){
        // the starting value of the form
        var previousValue = element.serialize(true);
        var processFunc = function(form, value){
          // haven't finished previous loop	
          if (form.processing) { return; }
          var element, elements = [];
          form.processing = true;
          // new value of form
          value = value.parseQuery();
          for (var prop in value) {
            // if - not an array process normally
            if (!Object.isArray(value[prop]) && !Object.isArray(previousValue[prop])) {
              if (value[prop] !== previousValue[prop]) {
                // find all form elements with the name prop
                element = $(form).select('[name=' + prop + ']');
                element = element.find(function(el){
                  if (el.readAttribute('abortChange')) {
                    // abortChange attribute is set so don't process this element for changes and clear the attribute
                    el.writeAttribute('abortChange', false);
                    return false;
                  }
                  return $F(el) === value[prop];
                });
                if (element && element.tagName.toLowerCase() != 'select') {
                  elements.push(element);
                }
              }
            }
            else if (value[prop].toJSON() !== previousValue[prop].toJSON()) {
              // else - array compare the json string
              var val, prevVal, newVal;
              // make sure new value is an array (in case of single value) clone for safety
              val = $A(value[prop]).clone();
              // make sure previous value is an array (in case of single value) clone for safety
              prevVal = $A(previousValue[prop]).clone();
              if (val.length > prevVal.length) {
                newVal = val.reject(function(item){
                  return prevVal.indexOf(item) != -1;
                });
              }
              else {
                newVal = prevVal.reject(function(item){
                  return val.indexOf(item) != -1;
                });
              }
              // find all form elements with the name prop
              element = $(form).select('[name=' + prop + ']');
              element = element.find(function(el){
                if (el.readAttribute('abortChange')) {
                  // abortChange attribute is set so don't process this element for changes and clear the attribute	
                  el.writeAttribute('abortChange', false);
                  return false;
                }
                return el.value === newVal.reduce();
              });
              if (element && element.tagName.toLowerCase() != 'select') {
                elements.push(element);
              }
            }
          }
          for (var prop in previousValue) {
            if (Object.isUndefined(value[prop])) {
              // removed checkbox unchecked?
              element = $(form).select('[name=' + prop + ']');
              element = element.find(function(el){
                if (el.readAttribute('abortChange')) {
                  el.writeAttribute('abortChange', false);
                  return false;
                }
                return true;
              });
              if (element && element.tagName.toLowerCase() != 'select') {
                elements.push(element);
              }
            }
          }
          
          // set previous value to new value
          previousValue = value;
          if (elements.length > 0) {
            changeCallback(elements, form, value);
          }
          form.processing = false;
        };
        var wrapSubmit = function(){
          if (!observerObject.observerSubmit){
            observerObject.observerSubmit = element.submit;
            element.submit = function(){
              onSubmit(element);
              element.submit();
            }
          }          
        };
        var onSubmit = function(ev){
          var formEl;
          if (typeof(ev.element) != 'undefined'){
            formEl = ev.element();
          }
          else {
            formEl = ev;
          }
          // stop the observer
          that.stop(true);
          // to monitor when the form is submitting to prevent observers
          formEl.submitting = true;
          // process one last time prior to submitting to make sure all js has run
          processFunc(element, element.serialize());
          // enable dotnet elements so they post with the form.
          formEl.select('#__EVENTTARGET', '#__EVENTARGUMENT', '#__VIEWSTATE').invoke('enable');
          that.unwrapSubmit();
        }.bind(this);
        // wraps form.submit to make sure we catch it.
        wrapSubmit(element);
        element.observe('submit', onSubmit);
        
        return processFunc;
      })());
    }
  },
  unwrapSubmit: function(){    
    if (this.observerSubmit) {
      this.element.submit = this.observerSubmit;
      this.observerSubmit = null;
    }
  },
  stop: function(fromSubmit) {
    if (!fromSubmit) this.unwrapSubmit();      
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  },
  getValue: function() {
    return Form.serialize(this.element);
  }
});

/*--------------------------------------------------------------------------*/

/** section: DOM
 *  class Abstract.EventObserver
**/
Abstract.EventObserver = Class.create({
  initialize: function(element, callback) {
    this.element  = $(element);
    this.callback = callback;

    this.lastValue = this.getValue();
    if (this.element.tagName.toLowerCase() == 'form')
      this.registerFormCallbacks();
    else
      this.registerCallback(this.element);
  },

  onElementEvent: function() {
    var value = this.getValue();
    if (this.lastValue != value) {
      this.callback(this.element, value);
      this.lastValue = value;
    }
  },

  registerFormCallbacks: function() {
    Form.getElements(this.element).each(this.registerCallback, this);
  },

  registerCallback: function(element) {
    if (element.type) {
      switch (element.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          Event.observe(element, 'click', this.onElementEvent.bind(this));
          break;
        default:
          Event.observe(element, 'change', this.onElementEvent.bind(this));
          break;
      }
    }
  }
});

/** section: DOM
 *  class Form.Element.EventObserver < Abstract.EventObserver
**/
Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.Element.getValue(this.element);
  }
});

/** section: DOM
 *  class Form.Element.EventObserver < Abstract.EventObserver
**/
Form.EventObserver = Class.create(Abstract.EventObserver, {
  getValue: function() {
    return Form.serialize(this.element);
  }
});
