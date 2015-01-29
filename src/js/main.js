goog.provide('abc.module');

goog.require('abc.templates');
goog.require('abc.sliderModule');


abc.module = angular.module('abc', [
    'abc.templates',
    abc.sliderModule.name
]);
