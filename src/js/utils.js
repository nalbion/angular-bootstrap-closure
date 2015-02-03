goog.provide('abc.utils');

/**
 * @param {HTMLElement} element
 * @returns {number} pixels from the left of the page
 */
abc.utils.offsetX = function (element) {
    //try {return elm.offset();} catch(e) {}
    //element = elmement[0];
    var _x = 0;
    //var _y = 0;
    var body = document.documentElement || document.body;
    var scrollX = window.pageXOffset || body.scrollLeft;
    //var scrollY = window.pageYOffset || body.scrollTop;
    return element.getBoundingClientRect().left + scrollX;
    //_y = rawDom.getBoundingClientRect().top + scrollY;
    //return { left: _x, top:_y };
};
