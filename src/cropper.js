var Resizer = require('./resizer');
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
