// This file was automatically generated from slider.soy.
// Please don't edit this file by hand.

if (typeof abc == 'undefined') { var abc = {}; }
if (typeof abc.soy == 'undefined') { abc.soy = {}; }


abc.soy.slider = function(opt_data, opt_ignored) {
  return '<div class="ui-slider-group"><div class="ui-slider" tabindex="0" role="slider" aria-valuemin="{{min}}" aria-valuemax="{{max}}" aria-valuenow="{{value}}"><div ng-if="tooltip" class="tooltip top fade" ng-class="{in: isTipOpen}" ng-style="{left: left + \'%\'}"><div class="tooltip-arrow"></div><div class="tooltip-inner" ng-bind="value"></div></div><span class="ui-slider-handle" ng-style="{left: left + \'%\'}"></span></div><p class="hint">{{hint}}</p></div>';
};
