(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./build-dom":3,"./draggable":5}],2:[function(require,module,exports){
var Cropper = require('./cropper');

var cropperInstances = {};

Cropper.getInstance = function(id) {
  return cropperInstances[id];
};

angular.module('cropper', [])
.factory('Cropper', function() {
  return Cropper;
})
.directive('cropper', function() {
  return {
    restrict: 'A',
    scope: {
      cropperContext: '=',
      cropperAspectRatio: '@'
    },
    link: function(scope, element, attrs) {
      var id = attrs.cropper;
      if (!id) throw new Error('cropper id is required');
      var cropperAspectRatio = scope.cropperAspectRatio;

      if (cropperAspectRatio) {
        if (/^\d*(\.)?\d+$/g.test(cropperAspectRatio)) {
          cropperAspectRatio = parseFloat(cropperAspectRatio);
        }
      } else {
        cropperAspectRatio = 1;
      }

      var cropper = Cropper({ element: element[0], aspectRatio: cropperAspectRatio });

      cropperInstances[id] = cropper;

      var cropperContext = scope.cropperContext;

      cropper.onCroppedRectChange = function(rect) {
        if (cropperContext) {
          cropperContext.left = rect.left;
          cropperContext.top = rect.top;
          cropperContext.width = rect.width;
          cropperContext.height = rect.height;
        }
        try { scope.$apply(); } catch(e) {}
      };

      scope.$on('$destroy', function() {
        cropperInstances[id] = null;
        delete cropperInstances[id];
      });
    }
  };
}).directive('cropperPreview', function(){
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var id = attrs.cropperPreview;
      if (!id) throw new Error('cropper id is required');

      var cropper = cropperInstances[id];

      if (cropper) {
        cropper.addPreview(element[0]);
      }
    }
  }
}).directive('cropperSource', function() {
  return {
    restrict: 'A',
    link: function ($scope, $el, attrs) {
      var id = attrs.cropperSource;
      if (!id) throw new Error('cropper id is required');

      var fileValidateRegex = /\.(jpg|png|gif|jpeg)$/i;
      var fileTypes = attrs.cropperFileTypes;

      if (fileTypes) {
        var types = fileTypes.split(',');
        if (types.length > 0) {
          fileValidateRegex = new RegExp('\.(' + types.join('|') + ')$', 'i');
        }
      }

      $el.on('change', function () {
        var input = this;
        var cropper = cropperInstances[id];

        var fileName = input.value;
        if (!fileValidateRegex.test(fileName)) {
          cropper.setImage();
          return;
        }

        if (typeof FileReader !== 'undefined') {
          var reader = new FileReader();
          reader.onload = function (event) {
            cropper.setImage(event.target.result);
          };
          if (input.files && input.files[0]) {
            reader.readAsDataURL(input.files[0]);
          }
        } else {
          input.select();
          input.blur();

          var src = document.selection.createRange().text;
          cropper.setImage(src);
        }
      });
    }
  };
});
},{"./cropper":4}],3:[function(require,module,exports){
var buildDOM = function(config, refs) {
  if (!config) return null;
  var dom, childElement;
  if (config.tag) {
    dom = document.createElement(config.tag);
    for (var prop in config) {
      if (config.hasOwnProperty(prop)) {
        if (prop === 'content' || prop === 'tag') continue;
        if (prop === 'key' && refs) {
          var key = config[prop];
          if (key) {
            refs[key] = dom;
          }
        }
        dom[prop] = config[prop];
      }
    }
    var content = config.content;
    if (content instanceof Array) {
      for (var i = 0, j = content.length; i < j; i++) {
        var child = content[i];
        childElement = buildDOM(child, refs);
        dom.appendChild(childElement);
      }
    } else if (typeof content === 'string') {
      childElement = document.createTextNode(content);
      dom.appendChild(childElement);
    }
  }
  return dom;
};

module.exports = buildDOM;
},{}],4:[function(require,module,exports){
var Resizer = require('./Resizer');
var buildDom = require('./build-dom');

var blankImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

var preLoadElement;

var ieVersion = Number(document.documentMode);

var getImageSize = function(src, callback) {
  if (ieVersion < 10) {
    if (!preLoadElement) {
      preLoadElement = document.createElement('div');
      preLoadElement.style.position = 'absolute';
      preLoadElement.style.width = '1px';
      preLoadElement.style.height = '1px';
      preLoadElement.style.left = '-9999px';
      preLoadElement.style.top = '-9999px';
      preLoadElement.style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=image)';
      document.body.insertBefore(preLoadElement, document.body.firstChild);
    }

    preLoadElement.filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src = src;

    var size = {
      width: preLoadElement.offsetWidth,
      height: preLoadElement.offsetHeight
    };

    if (typeof callback === 'function') {
      callback(size);
    }
  } else {
    var image = new Image();
    image.onload = function() {
      var size = {
        width: image.width,
        height: image.height
      };
      if (typeof callback === 'function') {
        callback(size);
      }
    };
    image.src = src;
  }
};

var Cropper = function(options) {
  var cropper = this;
  if (!(this instanceof Cropper)) {
    cropper = new Cropper();
  }
  cropper.aspectRatio = 1;
  for (var prop in options) {
    if (options.hasOwnProperty(prop)) cropper[prop] = options[prop];
  }

  if (cropper.element) {
    cropper.render(cropper.element);
  }

  return cropper;
};

Cropper.prototype.resetResizer = function() {
  var resizer = this.resizer;
  var cropperRect = this.cropperRect;
  var aspectRatio = this.aspectRatio;

  if (typeof aspectRatio !== 'number') {
    aspectRatio = 1;
  }

  var width = 100;
  var height = 100 / aspectRatio;

  var resizerDom = resizer.dom;
  resizerDom.style.width = width + 'px';
  resizerDom.style.height = height + 'px';

  if (cropperRect) {
    resizerDom.style.left = (cropperRect.width - width) / 2 + 'px';
    resizerDom.style.top = (cropperRect.height - height) / 2 + 'px';
  } else {
    resizerDom.style.left = resizerDom.style.top = '';
  }

  resizer.doOnStateChange();
  resizer.doOnDragEnd();
};

Cropper.prototype.setImage = function(src) {
  var element = this.element;
  var sourceImage = element.querySelector('img');
  var resizeImage = this.refs.image;

  var self = this;

  if (src === undefined || src === null) {
    resizeImage.src = sourceImage.src = blankImage;
    resizeImage.style.width = resizeImage.style.height = resizeImage.style.left = resizeImage.style.top = '';
    sourceImage.style.width = sourceImage.style.height = sourceImage.style.left = sourceImage.style.top = '';

    self.updatePreview(blankImage);

    self.dom.style.display = 'none';
    self.resetResizer();

    self.dom.style.left = self.dom.style.top = '';
    self.dom.style.width = element.offsetWidth + 'px';
    self.dom.style.height = element.offsetHeight + 'px';

    self.croppedRect = {
      width: 0,
      height: 0,
      left: 0,
      top: 0
    };

    self.onCroppedRectChange && self.onCroppedRectChange(self.croppedRect);

    return;
  }

  getImageSize(src, function(size) {
    if (ieVersion < 10) {
      resizeImage.src = sourceImage.src = blankImage;
      resizeImage.style.filter = sourceImage.style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale)';

      sourceImage.filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src = src;
      resizeImage.filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src = src;
    }

    self.imageSize = size;

    var elementWidth = element.offsetWidth;
    var elementHeight = element.offsetHeight;

    var dom = self.dom;

    var cropperRect = {};

    if (size.width / size.height > elementWidth / elementHeight) {
      cropperRect.width = elementWidth;
      cropperRect.height = elementWidth * size.height / size.width;
      cropperRect.top = (elementHeight - cropperRect.height) / 2;
      cropperRect.left = 0;
    } else {
      cropperRect.height = elementHeight;
      cropperRect.width = elementHeight * size.width / size.height;
      cropperRect.top = 0;
      cropperRect.left = (elementWidth - cropperRect.width) / 2;
    }

    self.cropperRect = cropperRect;

    for (var style in cropperRect) {
      if (cropperRect.hasOwnProperty(style)) {
        dom.style[style] = sourceImage.style[style] = resizeImage.style[style] = cropperRect[style] + 'px';
      }
    }

    if (!ieVersion || ieVersion > 9) {
      resizeImage.src = sourceImage.src = src;
    }

    self.dom.style.display = '';
    self.resetResizer();

    self.updatePreview(src);
  });
};

Cropper.prototype.addPreview = function(preview) {
  var previews = this.previews;
  if (!previews) {
    previews = this.previews = [];
  }
  previews.push(preview);
};

Cropper.prototype.render = function(container) {
  var resizer = new Resizer({ aspectRatio: this.aspectRatio });
  var refs = {};

  var dom = buildDom({
    tag: 'div',
    className: 'cropper',
    content: [{
      tag: 'div',
      className: 'mask'
    }]
  }, refs);

  var resizerDom = resizer.render(dom);

  var img = buildDom({
    tag: 'div',
    className: 'wrapper',
    content: [{
      tag: 'img',
      key: 'image',
      src: blankImage
    }]
  }, refs);

  var self = this;
  self.refs = refs;

  resizer.doOnStateChange = function() {
    var left = parseInt(resizerDom.style.left, 10) || 0;
    var top = parseInt(resizerDom.style.top, 10) || 0;

    var image = refs.image;

    image.style.left = -left + 'px';
    image.style.top = -top + 'px';

    self.updatePreview();
  };

  resizer.doOnDragEnd = function() {
    var left = parseInt(resizerDom.style.left, 10) || 0;
    var top = parseInt(resizerDom.style.top, 10) || 0;
    var resizerWidth = resizerDom.offsetWidth;
    var resizerHeight = resizerDom.offsetHeight;

    var imageSize = self.imageSize;
    var cropperRect = self.cropperRect;
    if (cropperRect) {
      var scale = cropperRect.width / imageSize.width;

      self.croppedRect = {
        width: Math.floor(resizerWidth / scale),
        height: Math.floor(resizerHeight / scale),
        left: Math.floor(left / scale),
        top: Math.floor(top / scale)
      };

      self.onCroppedRectChange && self.onCroppedRectChange(self.croppedRect);
    }
  };
  self.resizer = resizer;
  self.dom = dom;

  resizerDom.insertBefore(img, resizerDom.firstChild);

  container.appendChild(dom);

  self.dom.style.display = 'none';
};

Cropper.prototype.updatePreview = function(src) {
  var imageSize = this.imageSize;
  var cropperRect = this.cropperRect;
  if (!imageSize || !cropperRect) return;

  var previews = this.previews || [];

  var resizerDom = this.resizer.dom;
  var resizerLeft = parseInt(resizerDom.style.left, 10) || 0;
  var resizerTop = parseInt(resizerDom.style.top, 10) || 0;

  var resizerWidth = resizerDom.offsetWidth;
  var resizerHeight = resizerDom.offsetHeight;

  for (var i = 0, j = previews.length; i < j; i++) {
    var previewElement = previews[i];
    var previewImage = previewElement.querySelector('img');
    var previewWrapper = previewElement.querySelector('div');

    if (!previewImage) continue;

    if (src === blankImage) {
      previewImage.style.width = previewImage.style.height = previewImage.style.left = previewImage.style.top = '';
      previewImage.src = blankImage;
    } else {
      if (ieVersion < 10) {
        if (src) {
          previewImage.src = blankImage;

          previewImage.style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale)';
          previewImage.filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src = src;
          previewImage.style.width = cropperRect.width + 'px';
          previewImage.style.height = cropperRect.height + 'px';
        }
      } else if (src) {
        previewImage.src = src;
      }

      var elementWidth = previewElement.offsetWidth;
      var elementHeight = previewElement.offsetHeight;

      var scale = elementWidth / resizerWidth;

      if (previewWrapper) {
        var elementRatio = elementWidth / elementHeight;
        var resizerRatio = resizerWidth / resizerHeight;

        if (elementRatio < resizerRatio) {
          previewWrapper.style.width = elementWidth + 'px';
          previewWrapper.style.height = resizerHeight * elementWidth / resizerWidth + 'px';
          previewWrapper.style.top = (elementHeight - previewWrapper.clientHeight) / 2 + 'px';
          previewWrapper.style.left = '';
        } else {
          var visibleWidth = resizerWidth * elementHeight / resizerHeight;
          scale = visibleWidth / resizerWidth;
          previewWrapper.style.height = elementHeight + 'px';
          previewWrapper.style.width = visibleWidth + 'px';
          previewWrapper.style.left = (elementWidth - previewWrapper.clientWidth) / 2 + 'px';
          previewWrapper.style.top = '';
        }
      }

      previewImage.style.width = scale * cropperRect.width + 'px';
      previewImage.style.height = scale * cropperRect.height + 'px';
      previewImage.style.left = -resizerLeft * scale + 'px';
      previewImage.style.top = -resizerTop * scale + 'px';
    }
  }
};

module.exports = Cropper;
},{"./Resizer":1,"./build-dom":3}],5:[function(require,module,exports){
var bind = function(element, event, fn) {
  if (element.attachEvent) {
    element.attachEvent('on' + event, fn);
  } else {
    element.addEventListener(event, fn, false);
  }
};

var unbind = function(element, event, fn) {
  if (element.detachEvent) {
    element.detachEvent('on' + event, fn);
  } else {
    element.removeEventListener(event, fn);
  }
};

var isDragging = false;

var isIE8 = Number(document.documentMode) < 9;

var fixEvent = function(event) {
  var scrollTop = Math.max(window.scrollY || 0, document.documentElement.scrollTop || 0);
  var scrollLeft = Math.max(window.scrollX || 0, document.documentElement.scrollLeft || 0);

  event.target = event.srcElement;
  event.pageX = scrollLeft + event.clientX;
  event.pageY = scrollTop + event.clientY;
};

module.exports = function(element, options) {
  var moveFn = function(event) {
    if (isIE8) {
      fixEvent(event);
    }
    if (options.drag) {
      options.drag(event);
    }
  };
  var upFn = function(event) {
    if (isIE8) {
      fixEvent(event);
    }
    unbind(document, 'mousemove', moveFn);
    unbind(document, 'mouseup', upFn);
    document.onselectstart = null;
    document.ondragstart = null;

    isDragging = false;

    if (options.end) {
      options.end(event);
    }
  };
  bind(element, 'mousedown', function(event) {
    if (isIE8) {
      fixEvent(event);
    }
    if (isDragging) return;
    document.onselectstart = function() { return false; };
    document.ondragstart = function() { return false; };

    bind(document, 'mousemove', moveFn);
    bind(document, 'mouseup', upFn);
    isDragging = true;

    if (options.start) {
      options.start(event);
    }
  });
};
},{}],6:[function(require,module,exports){
window.Cropper = require('./cropper');
},{"./cropper":4}],7:[function(require,module,exports){
if (typeof angular !== 'undefined') {
  require('./angular');
} else {
  require('./export');
}


},{"./angular":2,"./export":6}]},{},[7]);
