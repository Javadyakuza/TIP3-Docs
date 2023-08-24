"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNeedExternal = exports.viteExternalsPlugin = exports.createTransformModuleName = void 0;
const magic_string_1 = __importDefault(require("magic-string"));
const es_module_lexer_1 = require("es-module-lexer");
const utils_1 = require("./utils");
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
const options_1 = require("./options");
const constant_1 = require("./constant");
const transform_1 = require("./transform");
const createTransformModuleName = (options) => {
    const transformModuleName = (externalValue) => {
        const { useWindow } = options;
        if (useWindow === false) {
            return typeof externalValue === 'string' ? externalValue : externalValue.join('.');
        }
        if (typeof externalValue === 'string') {
            return `window['${externalValue}']`;
        }
        const values = externalValue.map((val) => `['${val}']`).join('');
        return `window${values}`;
    };
    return transformModuleName;
};
exports.createTransformModuleName = createTransformModuleName;
function viteExternalsPlugin(externals = {}, userOptions = {}) {
    let isBuild = false;
    let isServe = false;
    const options = (0, options_1.resolveOptions)(userOptions);
    const externalsKeys = Object.keys(externals);
    const isExternalEmpty = externalsKeys.length === 0;
    const transformModuleName = (0, exports.createTransformModuleName)(options);
    return Object.assign(Object.assign({ name: 'vite-plugin-externals' }, (userOptions.enforce ? { enforce: userOptions.enforce } : {})), { async config(config, { command }) {
            var e_1, _a;
            var _b, _c;
            isBuild = command === 'build';
            isServe = command === 'serve';
            if (!isServe) {
                return;
            }
            if (options.disableInServe) {
                return;
            }
            if (isExternalEmpty) {
                return;
            }
            const newAlias = [];
            const alias = (_c = (_b = config.resolve) === null || _b === void 0 ? void 0 : _b.alias) !== null && _c !== void 0 ? _c : {};
            if ((0, utils_1.isObject)(alias)) {
                Object.keys(alias).forEach((aliasKey) => {
                    newAlias.push({ find: aliasKey, replacement: alias[aliasKey] });
                });
            }
            else if (Array.isArray(alias)) {
                newAlias.push(...alias);
            }
            const cachePath = path_1.default.join(process.cwd(), constant_1.NODE_MODULES_FLAG, constant_1.CACHE_DIR);
            await (0, fs_extra_1.ensureDir)(cachePath);
            await (0, fs_extra_1.emptyDirSync)(cachePath);
            try {
                for (var externalsKeys_1 = __asyncValues(externalsKeys), externalsKeys_1_1; externalsKeys_1_1 = await externalsKeys_1.next(), !externalsKeys_1_1.done;) {
                    const externalKey = externalsKeys_1_1.value;
                    const externalCachePath = path_1.default.join(cachePath, `${externalKey}.js`);
                    newAlias.push({ find: new RegExp(`^${externalKey}$`), replacement: externalCachePath });
                    await (0, fs_extra_1.ensureFile)(externalCachePath);
                    await (0, fs_extra_1.writeFile)(externalCachePath, `module.exports = ${transformModuleName(externals[externalKey])};`);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (externalsKeys_1_1 && !externalsKeys_1_1.done && (_a = externalsKeys_1.return)) await _a.call(externalsKeys_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return {
                resolve: {
                    alias: newAlias,
                },
            };
        },
        async transform(code, id, _options) {
            const ssr = compatSsrInOptions(_options);
            if (isServe && options.disableInServe) {
                return;
            }
            if (!isNeedExternal.call(this, options, code, id, isBuild, ssr)) {
                return;
            }
            let s;
            let hasError = false;
            try {
                if (isBuild && id.includes(constant_1.NODE_MODULES_FLAG)) {
                    code = (0, transform_1.transformRequires)(code, externals, transformModuleName);
                }
                await es_module_lexer_1.init;
                const [imports] = (0, es_module_lexer_1.parse)(code);
                imports.forEach(({ d: dynamic, n: dependence, ss: statementStart, se: statementEnd, }) => {
                    if (dynamic !== -1) {
                        return;
                    }
                    if (!dependence) {
                        return;
                    }
                    const externalValue = externals[dependence];
                    if (!externalValue) {
                        return;
                    }
                    s = s || (s = new magic_string_1.default(code));
                    const raw = code.substring(statementStart, statementEnd);
                    const newImportStr = (0, transform_1.transformImports)(raw, externalValue, transformModuleName);
                    s.overwrite(statementStart, statementEnd, newImportStr);
                });
            }
            catch (error) {
                hasError = true;
                if (userOptions.debug) {
                    console.error(error);
                }
            }
            if (hasError || !s) {
                return { code, map: null };
            }
            return {
                code: s.toString(),
                map: s.generateMap(Object.assign({}, {
                    source: id,
                    includeContent: true,
                    hires: true,
                }, userOptions.sourceMapOptions)),
            };
        } });
}
exports.viteExternalsPlugin = viteExternalsPlugin;
function isNeedExternal(options, code, id, isBuild, ssr) {
    const { disableSsr = true, filter, } = options;
    if (disableSsr && ssr) {
        return false;
    }
    return filter.call(this, code, id, ssr !== null && ssr !== void 0 ? ssr : false, isBuild);
}
exports.isNeedExternal = isNeedExternal;
function compatSsrInOptions(options) {
    var _a;
    if (typeof options === 'boolean') {
        return options;
    }
    return (_a = options === null || options === void 0 ? void 0 : options.ssr) !== null && _a !== void 0 ? _a : false;
}
