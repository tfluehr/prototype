(function() {
  
  function getPixelValue(value) {
    if ((/^\d+(px)?$/i).test(value))
      return window.parseInt(value, 10);
    
    var style = element.style.left, rStyle = element.runtimeStyle.left;  
    element.runtimeStyle.left = element.currentStyle.left;
    element.style.left = value || 0;
  
    value = element.style.pixelLeft;
  
    element.style.left = style;
    element.runtimeStyle.left = runtimeStyle;
  
    return value;  
  }
  
  Element.Layout = Class.create(Hash, {
    initialize: function($super, element, preCompute) {
      $super();
    
      this.element = $(element);
    
      Element.Layout.PROPERTIES.each( function(property) {
        this._set(property, null);
      }, this);    
    },
  
    _set: function(property, value) {
      return Hash.prototype.set.call(this, property, value);
    },
  
    set: function() {
      throw "Element.Layout properties are read-only.";
    },
  
    get: function($super, property) {
      var value = $super(property);    
      return value === null ? this._compute(property) : value;
    },
  
    _compute: function(property) {
      var value = Element.Layout.COMPUTATIONS[property].call(this, this.element);
      this._set(property, value);
      return value;
    }
  });

  Element.Layout.PROPERTIES = $w('height width top left right bottom border-left border-right border-top border-bottom padding-left padding-right padding-top padding-bottom margin-top margin-bottom margin-left margin-right padding-box-width padding-box-height border-box-width border-box-height margin-box-width margin-box-height');

  Element.Layout.COMPUTATIONS = {
    'height': function(element) {
      var borderBoxHeight = this.get('border-box-height');
      
      var borderTop = this.get('border-top'),
       borderBottom = this.get('border-bottom');
       
      var paddingTop = this.get('padding-top'),
       paddingBottom = this.get('padding-bottom');       
      
      return borderBoxHeight - borderTop - borderBottom -
       paddingTop - paddingBottom;
    },
    
    'width': function(element) {
      var borderBoxWidth = this.get('border-box-width');
      
      var borderLeft = this.get('border-left'),
       borderRight = this.get('border-right');
       
      var paddingLeft = this.get('padding-left'),
       paddingRight = this.get('padding-right');
      
      return borderBoxWidth - borderLeft - borderRight -
       paddingLeft - paddingRight; 
    },
    
    'padding-box-height': function(element) {
      return this.get('height') + this.get('padding-top') +
       this.get('padding-bottom');
    },
    
    'padding-box-width': function(element) {
      return this.get('width') + this.get('padding-left') +
       this.get('padding-right');
    },

    'border-box-width': function(element) {
      return element.offsetWidth;
    },    
    
    'border-box-height': function(element) {
      return element.offsetHeight;
    },
        
    'margin-box-height': function(element) {
      return this.get('border-box-height') + this.get('margin-top') +
       this.get('margin-bottom');
    },
    
    'margin-box-width': function(element) {
      return this.get('border-box-width') + this.get('margin-left') +
       this.get('margin-right');
    },
    
    'top': function(element) {
      return getPixelValue(element.getStyle('top'));
      //return element.positionedOffset().top;
    },
    
    'bottom': function(element) {
      return getPixelValue(element.getStyle('bottom'));
    },
    
    'left': function(element) {
      return getPixelValue(element.getStyle('left'))
      //return element.positionedOffset().left;
    },
    
    'right': function(element) {
      return getPixelValue(element.getStyle('right'));
    },
    
    'padding-top': function(element) {
      return getPixelValue(element.getStyle('paddingTop'));
    },
    
    'padding-bottom': function(element) {
      return getPixelValue(element.getStyle('paddingBottom'));
    },    
    
    'padding-left': function(element) {
      return getPixelValue(element.getStyle('paddingLeft'));
    },
    
    'padding-right': function(element) {
      return getPixelValue(element.getStyle('paddingRight'));
    },    
    
    'border-left': function(element) {
      return element.clientLeft || 
       getPixelValue(element.getStyle('borderLeftWidth'));
    },
    
    'border-right': function(element) {
      return element.clientRight ||
       getPixelValue(element.getStyle('borderRightWidth'));
    },
    
    'border-top': function(element) {
      return element.clientTop ||
        getPixelValue(element.getStyle('borderTopWidth'));
    },
    
    'border-bottom': function(element) {
      return element.clientBottom ||
        getPixelValue(element.getStyle('borderBottomWidth'));
    },
    
    'margin-left': function(element) {
      return getPixelValue(element.getStyle('marginLeft'));
    },
    
    'margin-right': function(element) {
      return getPixelValue(element.getStyle('marginRight'));
    },
    
    'margin-top': function(element) {
      return getPixelValue(element.getStyle('marginTop'));
    },
    
    'margin-bottom': function(element) {
      return getPixelValue(element.getStyle('marginBottom'));
    }
  };
  
  
  Element.addMethods({
    getLayout: function(element) {
      return new Element.Layout(element);
    },
    measure: function(element, property) {
      return $(element).getLayout().get(property);
    }
  });

})();
