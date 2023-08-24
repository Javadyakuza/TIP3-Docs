"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transform_1 = require("../src/transform");
const index_1 = require("../src/index");
const options_1 = require("../src/options");
const transformModuleName = (0, index_1.createTransformModuleName)(options_1.defaultOptions);
describe('transformImports', () => {
    test('transform ImportDefaultSpecifier', () => {
        expect((0, transform_1.transformImports)(`import Vue from 'vue'`, 'Vue', transformModuleName))
            .toBe(`const Vue = window['Vue']\n`);
    });
    test('transform ImportSpecifier', () => {
        expect((0, transform_1.transformImports)(`import { reactive, ref as r } from 'vue'`, 'Vue', transformModuleName))
            .toBe(`const reactive = window['Vue'].reactive\nconst r = window['Vue'].ref\n`);
    });
    test('transform ImportNamespaceSpecifier', () => {
        expect((0, transform_1.transformImports)(`import * as vue from 'vue'`, 'Vue', transformModuleName))
            .toBe(`const vue = window['Vue']\n`);
    });
    test('transform ExportSpecifier', () => {
        expect((0, transform_1.transformImports)(`export { default as Vue } from 'Vue'`, 'Vue', transformModuleName))
            .toBe(`export const Vue = window['Vue']\n`);
        expect((0, transform_1.transformImports)(`export { default } from 'vue'`, 'Vue', transformModuleName))
            .toBe(`export default window['Vue']\n`);
        expect((0, transform_1.transformImports)(`export { useState } from 'react'`, 'React', transformModuleName))
            .toBe(`export const useState = window['React'].useState\n`);
        expect((0, transform_1.transformImports)(`export { useState as useState2 } from 'react'`, 'React', transformModuleName))
            .toBe(`export const useState2 = window['React'].useState\n`);
    });
});
describe('transformRequire', () => {
    test('test transformRequires', () => {
        expect((0, transform_1.transformRequires)(`const Vue = require('vue');`, { vue: 'Vue' }, transformModuleName))
            .toBe(`const Vue = window['Vue'];`);
        expect((0, transform_1.transformRequires)(`const { reactive, ref } = require('vue');`, { vue: 'Vue' }, transformModuleName))
            .toBe(`const { reactive, ref } = window['Vue'];`);
    });
});
