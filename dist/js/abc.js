(function(){goog.provide("abc.sliderModule");abc.sliderDirectiveFactory=function(){return{restrict:"EA",replace:true,require:["abcSlider","ngModel"],controller:"SliderController",scope:{min:"@",max:"@",step:"@",tooltip:"@",legend:"&"},templateUrl:"template/slider.html",link:abc.sliderPostLink}};abc.sliderTemplateUrl=function(element,attrs){return"template/slider.html"};
abc.sliderPostLink=function(scope,element,attrs,ctrls){var sliderCtrl=ctrls[0],ngModelCtrl=ctrls[1];if(ngModelCtrl){sliderCtrl.init(ngModelCtrl,element);ngModelCtrl.$render()}};abc.abcSliderGroupDirectiveFactory=function(){return{restrict:"C",scope:{tooltip:"@",legend:"@"},transclude:true,templateUrl:"template/slider-group.html"}};
abc.SliderCtrl=function($scope,$attrs,$window,$timeout){var ngModelCtrl={},min=parseInt($attrs.min,10)||0,max=parseInt($attrs.max,10)||100,step=parseFloat($attrs.step)||1;var legend=$scope["legend"]();this.init=function(ngModelCtrl_,element){ngModelCtrl=ngModelCtrl_;ngModelCtrl.$render=this.render;console.info("initial model value: ",ngModelCtrl.$modelValue);console.info("initial view value: ",ngModelCtrl.$viewValue);element=element.find("div");var handle=element.find("span");var setValueFromEvent=
function(event){if(event.type=="click")$scope.showToolTip();else{if(event.stopPropagation)event.stopPropagation();if(event.preventDefault)event.preventDefault();event.cancelBubble=true;event.returnValue=false}var value,x=event.clientX,left=element[0].offsetLeft,handleHalfWidth=handle[0].offsetWidth/2,sliderWidth=element[0].offsetWidth;if(x<=left)value=min;else if(x>=left+sliderWidth)value=max;else{var dx=x-left;value=min+dx/sliderWidth*(max-min)}$scope.setValue(value)};var dragStart=$scope.dragStart=
function(event){event.target.parentElement.focus();$scope["isTipOpen"]=true;var window=angular.element($window);window.on("mousemove touchmove",setValueFromEvent);window.one("mouseup",function(){$scope["isTipOpen"]=false;window.off("mousemove",setValueFromEvent);handle.one("mousedown touchstart",$scope.dragStart)})};element.on("click",setValueFromEvent);handle.one("mousedown",dragStart);element.on("$destroy",function(){element.off("click",setValueFromEvent);handle.off("mousedown",dragStart)})};this.render=function(){if(isNaN(ngModelCtrl.$viewValue))return;
var value=parseFloat(ngModelCtrl.$viewValue);$scope.updateLeft(value);$scope.value=value};$scope.updateLeft=function(value){$scope.left=(value-min)/(max-min)*100};$scope.setValue=function(value){if(value>=min&&value<=max&&value!=ngModelCtrl.$viewValue){value=Math.round(value/step)*step;$scope.updateLeft(value);$scope.value=value;var label;for(var i in legend){i=parseInt(i,10);if(i>value)break;label=legend[i]}$scope["hint"]=label;ngModelCtrl.$setViewValue(value)}};$scope.onKeydown=function(evt){if(/(37|38|39|40)/.test(evt.which)){evt.preventDefault();
evt.stopPropagation();console.info(evt.which===38||evt.which===39?"right":"left");$scope.setValue($scope.value+(evt.which===38||evt.which===39?step:-step));$scope.showToolTip()}};$scope.showToolTip=function(){$scope["isTipOpen"]=true;$timeout(function(){$scope["isTipOpen"]=false},1E3)}};abc.sliderModule=angular.module("abc.slider",[]).controller("SliderController",abc.SliderCtrl).directive("abcSlider",abc.sliderDirectiveFactory).directive("abcSliderGroup",abc.abcSliderGroupDirectiveFactory);goog.provide("abc.templates");
angular.module("abc.templates",[]).run(["$templateCache",function($templateCache){$templateCache.put("template/slider-group.html",'\x3c!--<div class="ui-slider-group">--\x3e\n    <div ng-if="tooltip" class="tooltip top fade in" ng-class="{in: isTipOpen}"\n         ng-style="{left: left + \'%\'}">\n        <div class="tooltip-arrow"></div>\n        <div class="tooltip-inner" ng-bind="value"></div>\n    </div>\n    <ng-transclude></ng-transclude>\n    <p ng-if="legend" class="hint">{{hint}}</p>\n\x3c!--</div>--\x3e\n');$templateCache.put("template/slider.html",
'<div class="ui-slider-group">\n    <div class="ui-slider" ng-keydown="onKeydown($event)"\n        tabindex="0" role="slider" aria-valuemin="{{min}}" aria-valuemax="{{max}}" aria-valuenow="{{value}}">\n        <div ng-if="tooltip" class="tooltip top fade" ng-class="{in: isTipOpen}"\n             ng-style="{left: left + \'%\'}">\n            <div class="tooltip-arrow"></div>\n            <div class="tooltip-inner" ng-bind="value"></div>\n        </div>\n        <span class="ui-slider-handle" ng-style="{left: left + \'%\'}"></span>\n    </div>\n    <p class="hint">{{hint}}</p>\n</div>\n')}]);goog.provide("abc.module");goog.require("abc.templates");goog.require("abc.sliderModule");abc.module=angular.module("abc",["abc.templates",abc.sliderModule.name]);}).call(this); //# sourceMappingURL=../abc.js.map
