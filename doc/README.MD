## 介绍
Image Cropper可以为图片显示一个裁剪框，裁剪框允许用户调整大小和位置，常用来做用户自定义头像的裁剪功能。

目前Image Cropper的实现是无依赖的，浏览器支持到IE8+。Image Cropper可以和Angular一块使用，也可以独立使用。

## 安装

如果你使用bower，可以在bower.json中添加这么一段配置：

    "image-cropper": "git@github.com:ElemeFE/image-cropper.git#~0.2.0"

如果你使用npm，可以直接这么安装：

    npm install image-cropper.js --save

## 引入文件

Image Cropper的使用依赖两个文件：

- dist/cropper.css
- dist/cropper.js

最简单的办法是直接在HTML中引用这两个文件，不过每个项目的情况不同，可以根据情况来决定如何引入这两个文件。 

## 使用说明

Image Cropper是因为一个裁剪头像并上传的需求诞生的。

一个裁剪头像的流程大概是这样：

- 用户选择一张本地图片。
- 用户使用鼠标拖拽裁剪头像，并实时预览不同大小的裁剪效果。
- 把用户的裁剪范围和图片提交到服务器端。

从提交到服务器端的角度来看，我们关注的点只有两个：

- 用户选择的本地图片
- 用户的裁剪结果(Rect: 相对于图片的left、top、width、height)

### 在Angular中使用

Image Cropper在同一个页面上可以指定多个Instance，该属性定义一个字符串，作为Image Cropper的一个实例的ID。

Image Cropper的ID是必需的，在下面的例子里面，我们使用avatar作为例子中的Image Cropper的实例的ID。

Image Cropper为Angular提供了三个属性Directive，通过这三个Directive的配合，即可实现图像裁剪和预览的效果。

- cropper：添加到要显示裁剪框的元素上，该directive的属性值是cropper的ID。
- cropper-preview：添加到要显示预览的元素上。
- cropper-source：添加到input type=file上。 

注意：下面例子中的data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7是一个空的gif文件，用来在用户未选择图片的情况下显示该图片。

#### cropper
cropper需要添加到要显示裁剪框的元素上，directive的属性值为Image Cropper的实例的ID，例如：

    <div class="image-container target" cropper="avatar">
      <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="noavatar" />
    </div>

#### cropper-aspect-ratio
cropper默认的款高比为1，如果需要使用其他宽高比或者不限制宽高比，则可以设置此属性。比如不限制宽高比，则可以这么设置：

    <div class="image-container target" cropper="avatar" cropper-aspect-ratio="auto">
      <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="noavatar" />
    </div>

cropper-aspect-ratio如果不是数字，则为不限制宽高比。

##### cropper-context
用户的裁剪结果需要导出到Controller中的一个变量里面，我们可以使用cropper-context来指定这个变量，比如Controller中的变量名是cropContext，则这么定义：

    <div class="image-container source" cropper="avatar" cropper-context="cropContext">
      <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="noavatar" />
    </div>

#### cropper-source
cropper-source需要添加到一个input[type=file]上，directive的属性值为Image Cropper的实例的ID，例如：

    <input type="file" name="avatar" cropper-source="avatar" />

在input[type=file]的值发生变化的时候，cropper和cropper-preview会去使用用户选择的图片。

##### cropper-file-types
Image Cropper默认支持的类型为gif、png、jpg，如果需要定义只支持者某几种格式，比如只支持jpg、png，可以这么定义：

    <input type="file" name="avatar" cropper-source="avatar" cropper-file-types="jpg,jpeg,png" />

#### cropper-preview
在用户裁剪图像的过程中，需要动态的预览不同大小的头像的效果，在显示预览图像的元素上添加这个directive。这个directive的属性值为Image Cropper的实例的ID，例如：

    <div class="image-container small" cropper-preview="avatar">
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="noavatar" />
    </div>

注意，如果设置了aspectRatio为非数值，即不限制裁剪图片的宽高比，cropper-preview的HTML应该是这种结构的：

    <div class="image-container small" id="preview-small">
      <div class="image-wrapper">
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="noavatar" />
      </div>
    </div>

### 独立使用

Image Cropper是可以不和Angular集成，独立使用的。如果你的页面中没有Angular，则在window上可以直接使用Cropper。

#### 创建Cropper实例

独立使用Cropper，需要指定这么几个属性：

- element：显示裁剪框的Element。
- aspectRatio：裁剪框的宽高比，默认值为1。如果设置非数字类型，则为不限制款高比。
- previews：数组类型，可以指定多个显示图片预览的元素。 
- onCroppedRectChange：在裁剪结果变更之后会触发这个回调。

一个例子如下：

    var cropper = new Cropper({
        element: document.getElementById('cropper-target'),
        previews: [
          document.getElementById('preview-large'),
          document.getElementById('preview-medium'),
          document.getElementById('preview-small')
        ],
        onCroppedRectChange: function(rect) {
          console.log(rect);
        }
    });

#### 更改Cropper使用的图片

Image Cropper为Angular提供了一个cropper-source来在input[type=file]变更之后更改Cropper的图片，在独立使用的时候，需要手动去做这件事。

变更Cropper的图片使用setImage方法来完成，假设input[type=file]的id为cropper-input，示例代码如下：

    var input = document.getElementById('cropper-input');
    input.onchange = function() {
      if (typeof FileReader !== 'undefined') {
        var reader = new FileReader();
        reader.onload = function (event) {
          cropper.setImage(event.target.result);
        };
        if (input.files && input.files[0]) {
          reader.readAsDataURL(input.files[0]);
        }
      } else { // IE10-
        input.select();
        input.blur();
    
        var src = document.selection.createRange().text;
        cropper.setImage(src);
      }
    };

## License
MIT
