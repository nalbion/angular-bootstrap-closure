/**
 * Adapted from https://github.com/angular-ui/bootstrap rating
 */
goog.provide('abc.sliderModule');

/**
 * As per the <a href="https://developer.mozilla.org/en/docs/Web/HTML/Element/Input">HTML5 &lt;input type="range"></a>
 * control, defaults to:
 *  min: 0
 *  max: 100
 *  step: 1
 *  value: average of min & max
 *
 * @returns angular.Directive
 * @ngInject
 */
abc.sliderDirectiveFactory = function () {
    return {
        restrict: 'EA',
        replace: true,
        require: ['abcSlider', 'ngModel'],
        controller: 'SliderController',           // expose an API to other directives
        // @: one-way 'text' binding
        // =: two-way direct model binding
        // &: method binding
        scope: {
            'min': '@',
            'max': '@',
            'step': '@',
            'tooltip': '@',
            'legend': '&'
        },
        //templateUrl: abc.sliderTemplateUrl,
        //templateUrl: 'template/slider.html',
        template: '<div class="ui-slider-group"><div class="ui-slider" tabindex="0" role="slider" aria-valuemin="{{min}}" aria-valuemax="{{max}}" aria-valuenow="{{value}}"><div ng-if="tooltip" class="tooltip top fade" ng-class="{in: isTipOpen}" ng-style="{left: left + \'%\'}"><div class="tooltip-arrow"></div><div class="tooltip-inner" ng-bind="value"></div></div><span class="ui-slider-handle" ng-style="{left: left + \'%\'}"></span></div><p class="hint">{{hint}}</p></div>',
        link: abc.sliderPostLink         // interact with controllers listed in 'require'
    };
};

///**
// * @param {!angular.JQLite=} element
// * @param {!angular.Attributes=} attrs
// */
//abc.sliderTemplateUrl = function (element, attrs) {
//    return 'template/slider.html';
//};

/**
 * Attach the data ($scope) to the linking function and it should return the linked html
 *
 * @param {!angular.Scope=} scope
 * @param {!angular.JQLite=} element
 * @param {!angular.Attributes=} attrs
 * @param {!Array.<!Object>=} ctrls - [abc.SliderCtrl, angular.NgModelController]
 */
abc.sliderPostLink = function (scope, element, attrs, ctrls) {
    var sliderCtrl = ctrls[0], ngModelCtrl = ctrls[1];

    sliderCtrl.init( ngModelCtrl, element );
    ngModelCtrl.$render();
};

//abc.abcSliderGroupDirectiveFactory = function () {
//    return {
//        restrict: 'C',
//        scope: {
//            tooltip: '@',
//            legend: '&'
//        },
//        transclude: true,
//        require: ['abcSliderGroup'],
//        controller: 'SliderController',
//        templateUrl: 'template/slider-group.html',
//        link: abc.sliderPostLink
//    };
//};

/**
 *
 * @constructor
 * @param {angular.Scope} $scope
 * @param {Object.<string,string>} $attrs
 * @param {Window} $window
 * @param {angular.$timeout} $timeout
 * @ngInject
 */
abc.SliderCtrl = function ($scope, $attrs, $window, $timeout) {
    var ngModelCtrl = {}, // $setViewValue: angular.noop };
        min = parseInt($attrs.min, 10) || 0,
        max = parseInt($attrs.max, 10) || 100,
        step = parseFloat($attrs.step) || 1;

    var legend = $scope['legend'];
    if (legend) {
        legend = /** @type {Object<number, string>} */(legend());
    }
    /**
     * @constant
     * @type {string}
     */
    var MOUSEDOWN_TOUCHSTART = 'mousedown touchstart';
    /**
     * @constant
     * @type {string}
     */
    var MOUSEMOVE_TOUCHMOVE = 'mousemove touchmove';
    /** @type {!angular.JQLite} */
    var _handle;
    /** @type {HTMLElement} */
    var _sliderElement;

    /**
     * @param {!angular.NgModelController} ngModelCtrl_
     * @param {!angular.JQLite} element
     */
    this.init = function(ngModelCtrl_, element) {
        ngModelCtrl = ngModelCtrl_;
        ngModelCtrl.$render = render;

        // Initialise event listeners
        var sliderElement = element.find('div');
        _sliderElement = sliderElement[0];
        _handle = sliderElement.find('span');

        sliderElement.on('keydown', onKeydown);
        sliderElement.on('click', setValueFromEvent);
        _handle.one(MOUSEDOWN_TOUCHSTART, dragStart);
        element.on('$destroy', function() {
            element.off('click', setValueFromEvent);
            _handle.off(MOUSEDOWN_TOUCHSTART, dragStart);
        });
    };

    var dragStart = function (event) {
        event.target.parentElement.focus();
        $scope['isTipOpen'] = true;
        var window = angular.element($window);
        window.on(MOUSEMOVE_TOUCHMOVE, setValueFromEvent);
        window.one('mouseup touchend', function () {
            showToolTip(false);
            window.off(MOUSEMOVE_TOUCHMOVE, setValueFromEvent);
            _handle.one(MOUSEDOWN_TOUCHSTART, dragStart);
        });
    };

    /** @param {Event} event */
    var setValueFromEvent = function (event) {
        if (event.type == 'click') {
            showToolTip(true);
        } else {
            // Stop accidental text selection while dragging
            if(event.stopPropagation) event.stopPropagation();
            if(event.preventDefault) event.preventDefault();
            event.cancelBubble=true;
            event.returnValue=false;
        }

        var value,
            x = event.touches ? event.touches[0].clientX : event.clientX,
            left = _sliderElement.offsetLeft,
            _handleHalfWidth = _handle[0].offsetWidth / 2,
            sliderWidth = _sliderElement.offsetWidth;

        if (x <= left) {
            value = min;
        } else if (x >= (left + sliderWidth)) {
            value = max;
        } else {
            var dx = x - left; // - _handleHalfWidth;
            value = min + ((dx / sliderWidth) * (max - min));
        }
        setValue(value);
    };

    var onKeydown = function(event) {
        if (/(37|38|39|40)/.test(event.which)) {
            event.preventDefault();
            event.stopPropagation();
            setValue( $scope.value + (event.which === 38 || event.which === 39 ? step : -step) );
            showToolTip(true);
        }
    };

    /**
     * Called when:
     *  $rollbackViewValue() is called. If we are rolling back the view value to the last committed value then $render() is called to update the input control.
     * or
     *  The value referenced by ng-model is changed programmatically and both the $modelValue and the $viewValue are different from last time.
     * @this {angular.NgModelController}
     */
    var render = function() {
        //if (isNaN(this.$viewValue) ) { return; }
        var value = parseFloat(this.$viewValue) || ((min + max) / 2);
        updateValue(value);
    };

    /** @param {number} value */
    var setValue = function(value) {
        if ( /*!$scope.readonly &&*/ value >= min && value <= max && value != ngModelCtrl.$viewValue ) {
            value = Math.round(value / step) * step;
            updateValue(value);
            ngModelCtrl.$setViewValue(value);
        }
    };

    /**
     * Updates $scope.value, .left and .hint
     * @param {number} value
     */
    var updateValue = function (value) {
        $scope.value = value;
        $scope.left = ((value - min)/(max - min)) * 100;

        if (undefined !== legend) {
            var label;
            for (var i in legend) {
                i = parseInt(i, 10);
                if (i > value) {
                    break;
                }
                label = legend[i];
            }
            $scope['hint'] = label;
        }
    };

    var showToolTip = function(show) {
        if (show) {
            $scope['isTipOpen'] = true;
            showToolTip(false);
        } else {
            $timeout(function() {
                $scope['isTipOpen'] = false;
            }, 1000);
        }
    };
};

abc.sliderModule = angular.module('abc.slider', [])
    .controller('SliderController', abc.SliderCtrl)
    .directive('abcSlider', abc.sliderDirectiveFactory);
    //.directive('abcSliderGroup', abc.abcSliderGroupDirectiveFactory);

