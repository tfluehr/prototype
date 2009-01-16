new Test.Unit.Runner({
  setup: function() {
  },
  
  testLayoutOnAbsolutelyPositionedElements: function() {
    var layout = $('box1').getLayout();
    
    this.assertEqual(242, layout.get('width'),  'width' );
    this.assertEqual(555, layout.get('height'), 'height');
    
    this.assertEqual(3, layout.get('border-left'), 'border left');    
    this.assertEqual(10, layout.get('padding-top'), 'padding top');
    this.assertEqual(1020, layout.get('top'), 'top');
    
    this.assertEqual(25, layout.get('left'), 'left');
    
  }


});

