/**
 * Adapted from https://github.com/angular-ui/bootstrap rating
 */
goog.provide('abc.sliderModule');

abc.sliderDirective = function () {
    return {
        restrict: 'EA',
        replace: true,
        require: ['abcSlider', 'ngModel'],
        controller: 'SliderController',           // expose an API to other directives
        // @: one-way 'text' binding
        // =: two-way direct model binding
        // &: method binding
        //scope: { title: '@', content: '@', 'placement': '@', animation: '&', 'isOpen': '&' },
        scope: {
            min: '@',
            max: '@',
            step: '@'
            //list: '@'
            //onHover: '&',
            //onLeave: '&'
            //handleStyle: '='
        },
        templateUrl: 'template/slider.html',
        link: abc.sliderLink         // interact with controllers listed in 'require'
    };
};

/**
 * @param {!angular.Scope=} scope
 * @param {!angular.JQLite=} element
 * @param {!angular.Attributes=} attrs
 * @param {!Array.<!Object>=} ctrls - [abc.SliderCtrl, angular.NgModelController]
 */
abc.sliderLink = function (scope, element, attrs, ctrls) {
    var sliderCtrl = ctrls[0], ngModelCtrl = ctrls[1];

    if ( ngModelCtrl ) {
        sliderCtrl.init( ngModelCtrl, element );
        ngModelCtrl.$render();
    }

};

/**
 *
 * @constructor
 * @param {angular.Scope} $scope
 * @param {Object.<string,string>} $attrs
 * @param {Window} $window
 * @ngInject
 */
abc.SliderCtrl = function ($scope, $attrs, $window, $timeout) {
    var ngModelCtrl = {}, // $setViewValue: angular.noop };
        min = parseInt($attrs.min, 10) || 0,
        max = parseInt($attrs.max, 10) || 100,
        step = parseFloat($attrs.step) || 1;

    $scope['tipPlacement'] = 'top';
    $scope['tipAnimation'] = true;


    /**
     * @param {!angular.NgModelController} ngModelCtrl_
     * @param {!angular.JQLite} element
     */
    this.init = function(ngModelCtrl_, element) {
        ngModelCtrl = ngModelCtrl_;
        ngModelCtrl.$render = this.render;

        console.info('initial model value: ', ngModelCtrl.$modelValue);
        console.info('initial view value: ', ngModelCtrl.$viewValue);

        // Initialise event listeners
        element = element.find('div');
        var handle = element.find('span');

        /** @param {Event} event */
        var setValueFromEvent = function (event) {
            if (event.type == 'click') {
                $scope.showToolTip();
            } else {
                // Stop accidental text selection while dragging
                if(event.stopPropagation) event.stopPropagation();
                if(event.preventDefault) event.preventDefault();
                event.cancelBubble=true;
                event.returnValue=false;
            }

            var value,
                x = event.clientX, // + handleHalfWidth,
                left = element[0].offsetLeft,
                handleHalfWidth = handle[0].offsetWidth / 2,
                sliderWidth = element[0].offsetWidth;

            if (x <= left) {
                value = min;
            } else if (x >= (left + sliderWidth)) {
                value = max;
            } else {
                var dx = x - left; // - handleHalfWidth;
                value = min + ((dx / sliderWidth) * (max - min));
            }
            $scope.setValue(value);
        };

        var dragStart = $scope.dragStart = function (event) {
            event.target.parentElement.focus();
            $scope['isTipOpen'] = true;
            var window = angular.element($window);
            window.on('mousemove', setValueFromEvent);
            window.one('mouseup', function () {
                $scope['isTipOpen'] = false;
                window.off('mousemove', setValueFromEvent);
                handle.one('mousedown', $scope.dragStart);
            });
        };

        element.on('click', setValueFromEvent);
        handle.one('mousedown', dragStart);
        element.on('$destroy', function() {
            element.off('click', setValueFromEvent);
            handle.off('mousedown', dragStart);
        });
    };

    /**
     * Called when:
     *  $rollbackViewValue() is called. If we are rolling back the view value to the last committed value then $render() is called to update the input control.
     * or
     *  The value referenced by ng-model is changed programmatically and both the $modelValue and the $viewValue are different from last time.
     * @this {angular.NgModelController}
     */
    this.render = function() {
        if (isNaN(ngModelCtrl.$viewValue) ) {return;}
        var value = parseFloat(ngModelCtrl.$viewValue, 10);
        $scope.updateLeft(value);
        $scope.value = value;
    };

    /** @param {number} value */
    $scope.updateLeft = function(value) {
        $scope.left = ((value - min)/(max - min)) * 100;
    };

    /** @param {number} value */
    $scope.setValue = function(value) {
        if ( /*!$scope.readonly &&*/ value >= min && value <= max && value != ngModelCtrl.$viewValue ) {
            value = Math.round(value / step) * step;
            $scope.updateLeft(value);
            ngModelCtrl.$setViewValue(value);
        }
    };

    //$scope.reset = function() {
    //    // Not sure why angular-ui-bootstrap doesn't call $rollbackViewValue() - at this point I'll trust their judgement
    //    $scope.value = ngModelCtrl.$viewValue;
    //    //this.updateLeft($scope.value);
    //    //$scope.onLeave();
    //};

    /** @expose */
    $scope.onKeydown = function(evt) {
        if (/(37|38|39|40)/.test(evt.which)) {
            evt.preventDefault();
            evt.stopPropagation();
            console.info(evt.which === 38 || evt.which === 39 ? 'right' : 'left');
            $scope.setValue( $scope.value + (evt.which === 38 || evt.which === 39 ? step : -step) );
            $scope.showToolTip();
        }
    };

    $scope.showToolTip = function() {
        $scope['isTipOpen'] = true;
        $timeout(function() {
            $scope['isTipOpen'] = false;
        }, 1000);
    };
};

abc.sliderModule = angular.module('abc.slider', []) //, ['ui.bootstrap.tooltip'])
    .controller('SliderController', abc.SliderCtrl)
    .directive('abcSlider', abc.sliderDirective);
