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

module.exports = function(element, options) {
  var moveFn = function(event) {
    if (options.drag) {
      options.drag(event);
    }
  };
  var upFn = function(event) {
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