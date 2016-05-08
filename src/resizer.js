var buildDom = require('./build-dom');
var draggable = require('./draggable');

var configMap = {
  'n':  { top: true, height: -1 },
  'w':  { left: true, width: -1 },
  'e':  { width: 1 },
  's':  { height: 1 },
  'nw': { left: true, top: true, width: -1, height: -1 },
  'ne': { top: true, width: 1, height: -1 },
  'sw': { left: true, width: -1, height: 1 },
  'se': { width: 1, height: 1 }
};

var getPosition = function (element) {
  var selfRect = element.getBoundingClientRect();
  var parentRect = element.offsetParent.getBoundingClientRect();

  return {
    left: selfRect.left - parentRect.left,
    top: selfRect.top - parentRect.top
  };
};

var Resizer = function(options) {
  for (var prop in options) {
    if (options.hasOwnProperty(prop)) this[prop] = options[prop];
  }
};

Resizer.prototype.doOnStateChange = function(state) {
};

Resizer.prototype.makeDraggable = function(dom) {
  var self = this;
  var dragState = {};
  var containment;

  draggable(dom, {
    start: function (event) {
      var parentNode = dom.parentNode;
      containment = {
        left: 0,
        top: 0,
        width: parentNode.clientWidth,
        height: parentNode.clientHeight,
        right: parentNode.clientWidth,
        bottom: parentNode.clientHeight
      };

      dragState.startLeft = event.clientX;
      dragState.startTop = event.clientY;

      var position = getPosition(dom);

      dragState.resizerStartLeft = position.left;
      dragState.resizerStartTop = position.top;
      dragState.resizerStartWidth = dom.offsetWidth;
      dragState.resizerStartHeight = dom.offsetHeight;
    },
    drag: function (event) {
      var offsetLeft = event.clientX - dragState.startLeft;
      var offsetTop = event.clientY - dragState.startTop;

      var left = dragState.resizerStartLeft + offsetLeft;
      var top = dragState.resizerStartTop + offsetTop;

      if (left < containment.left) {
        left = containment.left;
      }

      if (top < containment.top) {
        top = containment.top;
      }

      if (left + dragState.resizerStartWidth > containment.right) {
        left = containment.right - dragState.resizerStartWidth;
      }

      if (top + dragState.resizerStartHeight > containment.bottom) {
        top = containment.bottom - dragState.resizerStartHeight;
      }

      dom.style.left = left + 'px';
      dom.style.top = top + 'px';

      self.doOnStateChange();
    },
    end: function () {
      dragState = {};
      if (self.doOnDragEnd) {
        self.doOnDragEnd();
      }
    }
  });
};

Resizer.prototype.bindResizeEvent = function(dom) {
  var self = this;
  var resizeState = {};
  var aspectRatio = self.aspectRatio;

  if (typeof aspectRatio !== 'number') {
    aspectRatio = undefined;
  }

  var makeResizable = function (bar) {
    var type = bar.className.split(' ')[0];
    var transformMap = configMap[type.substr(4)];

    var containment;

    draggable(bar, {
      start: function (event) {
        var parentNode = dom.parentNode;
        containment = {
          left: 0,
          top: 0,
          width: parentNode.clientWidth,
          height: parentNode.clientHeight,
          right: parentNode.clientWidth,
          bottom: parentNode.clientHeight
        };

        resizeState.startWidth = dom.clientWidth;
        resizeState.startHeight = dom.clientHeight;
        resizeState.startLeft = event.clientX;
        resizeState.startTop = event.clientY;

        var position = getPosition(dom);
        resizeState.resizerStartLeft = position.left;
        resizeState.resizerStartTop = position.top;
      },
      drag: function (event) {
        var widthRatio = transformMap.width;
        var heightRatio = transformMap.height;

        var offsetLeft = event.clientX - resizeState.startLeft;
        var offsetTop = event.clientY - resizeState.startTop;

        var width, height, minWidth = 50, maxWidth = 10000, minHeight = 50, maxHeight = 10000;

        if (widthRatio !== undefined) {
          width = resizeState.startWidth + widthRatio * offsetLeft;
          if (width < minWidth) {
            width = minWidth;
          }

          if (maxWidth && width > maxWidth) {
            width = maxWidth;
          }
        }

        if (heightRatio !== undefined) {
          height = resizeState.startHeight + heightRatio * offsetTop;
          if (height < minHeight) {
            height = minHeight;
          }

          if (maxHeight && height > maxHeight) {
            height = maxHeight;
          }
        }

        if (aspectRatio !== undefined) {
          if (type === 'ord-n' || type === 'ord-s') {
            width = height * aspectRatio;
          } else if (type === 'ord-w' || type === 'ord-e') {
            height = width / aspectRatio;
          } else {
            if (width / height < aspectRatio) {
              height = width / aspectRatio;
            } else {
              width = height * aspectRatio;
            }
          }
        }

        var position = {
          left: resizeState.resizerStartLeft,
          top: resizeState.resizerStartTop
        };

        if (transformMap.left !== undefined) {
          position.left = resizeState.resizerStartLeft + (width - resizeState.startWidth) * widthRatio;
        }

        if (transformMap.top !== undefined) {
          position.top = resizeState.resizerStartTop + (height - resizeState.startHeight) * heightRatio;
        }

        //=== containment start

        if (width + position.left > containment.right) {
          width = containment.right - position.left;
        }

        if (position.left < containment.left) {
          width -= containment.left - position.left;
          position.left = containment.left;
        }

        if (height + position.top > containment.bottom) {
          height = containment.bottom - position.top;
        }

        if (position.top < containment.top) {
          height -= containment.top - position.top;
          position.top = containment.top;
        }

        //=== containment end

        if (aspectRatio !== undefined) {
          if (width / height < aspectRatio) {
            height = width / aspectRatio;
          } else {
            width = height * aspectRatio;
          }
        }

        if (transformMap.left !== undefined) {
          position.left = resizeState.resizerStartLeft + (width - resizeState.startWidth) * widthRatio;
        }

        if (transformMap.top !== undefined) {
          position.top = resizeState.resizerStartTop + (height - resizeState.startHeight) * heightRatio;
        }

        dom.style.width = width + 'px';
        dom.style.height = height + 'px';

        if (position.left !== undefined) {
          dom.style.left = position.left + 'px';
        }

        if (position.top !== undefined) {
          dom.style.top = position.top + 'px';
        }

        self.doOnStateChange();
      },
      end: function () {
        if (self.doOnDragEnd) {
          self.doOnDragEnd();
        }
      }
    });
  };

  var bars = dom.querySelectorAll('.resize-bar');
  var handles = dom.querySelectorAll('.resize-handle');

  var i, j;

  for (i = 0, j = bars.length; i < j; i++) {
    makeResizable(bars[i]);
  }

  for (i = 0, j = handles.length; i < j; i++) {
    makeResizable(handles[i]);
  }
};

Resizer.prototype.render = function(container) {
  var self = this;

  var dom = buildDom({
    tag: 'div',
    className: 'resizer',
    content: [
      { tag: 'div', className: 'ord-n resize-bar' },
      { tag: 'div', className: 'ord-s resize-bar' },
      { tag: 'div', className: 'ord-w resize-bar' },
      { tag: 'div', className: 'ord-e resize-bar' },
      { tag: 'div', className: 'ord-nw resize-handle' },
      { tag: 'div', className: 'ord-n resize-handle' },
      { tag: 'div', className: 'ord-ne resize-handle' },
      { tag: 'div', className: 'ord-w resize-handle' },
      { tag: 'div', className: 'ord-e resize-handle' },
      { tag: 'div', className: 'ord-sw resize-handle' },
      { tag: 'div', className: 'ord-s resize-handle' },
      { tag: 'div', className: 'ord-se resize-handle' }
    ]
  });

  self.dom = dom;

  self.bindResizeEvent(dom);
  self.makeDraggable(dom);

  if (container) {
    container.appendChild(dom);
  }

  return dom;
};

module.exports = Resizer;