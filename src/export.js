var Resizer = require('./resizer');
var Cropper = require('./cropper');

if (typeof angular !== 'undefined') {
  var cropperInstances  = window.cropperInstances = {};

  angular.module('cropper', []).directive('cropper', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var id = attrs.cropper;
        if (!id) throw new Error('cropper id is required');
        var cropper = Cropper({ element: element[0] });

        cropperInstances[id] = cropper;

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

        $el.on('change', function () {
          var input = this;
          var cropper = cropperInstances[id];

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
}

window.Resizer = Resizer;
window.Cropper = Cropper;