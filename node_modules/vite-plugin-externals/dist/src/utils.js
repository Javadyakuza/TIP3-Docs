"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = void 0;
function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}
exports.isObject = isObject;
