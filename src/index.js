var Cropper = require('./cropper');

if (typeof angular !== 'undefined') {
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
        cropperContext: '='
      },
      link: function(scope, element, attrs) {
        var id = attrs.cropper;
        if (!id) throw new Error('cropper id is required');
        var cropper = Cropper({ element: element[0] });

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
} else {
  window.Cropper = Cropper;
}

module.exports = Cropper;

