var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import MagicString from 'magic-string';
import { init, parse } from 'es-module-lexer';
import { isObject } from './utils';
import { emptyDirSync, ensureDir, ensureFile, writeFile } from 'fs-extra';
import path from 'path';
import { resolveOptions } from './options';
import { CACHE_DIR, NODE_MODULES_FLAG } from './constant';
import { transformImports, transformRequires } from './transform';
export const createTransformModuleName = (options) => {
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
export function viteExternalsPlugin(externals = {}, userOptions = {}) {
    let isBuild = false;
    let isServe = false;
    const options = resolveOptions(userOptions);
    const externalsKeys = Object.keys(externals);
    const isExternalEmpty = externalsKeys.length === 0;
    const transformModuleName = createTransformModuleName(options);
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
            if (isObject(alias)) {
                Object.keys(alias).forEach((aliasKey) => {
                    newAlias.push({ find: aliasKey, replacement: alias[aliasKey] });
                });
            }
            else if (Array.isArray(alias)) {
                newAlias.push(...alias);
            }
            const cachePath = path.join(process.cwd(), NODE_MODULES_FLAG, CACHE_DIR);
            await ensureDir(cachePath);
            await emptyDirSync(cachePath);
            try {
                for (var externalsKeys_1 = __asyncValues(externalsKeys), externalsKeys_1_1; externalsKeys_1_1 = await externalsKeys_1.next(), !externalsKeys_1_1.done;) {
                    const externalKey = externalsKeys_1_1.value;
                    const externalCachePath = path.join(cachePath, `${externalKey}.js`);
                    newAlias.push({ find: new RegExp(`^${externalKey}$`), replacement: externalCachePath });
                    await ensureFile(externalCachePath);
                    await writeFile(externalCachePath, `module.exports = ${transformModuleName(externals[externalKey])};`);
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
                if (isBuild && id.includes(NODE_MODULES_FLAG)) {
                    code = transformRequires(code, externals, transformModuleName);
                }
                await init;
                const [imports] = parse(code);
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
                    s = s || (s = new MagicString(code));
                    const raw = code.substring(statementStart, statementEnd);
                    const newImportStr = transformImports(raw, externalValue, transformModuleName);
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
export function isNeedExternal(options, code, id, isBuild, ssr) {
    const { disableSsr = true, filter, } = options;
    if (disableSsr && ssr) {
        return false;
    }
    return filter.call(this, code, id, ssr !== null && ssr !== void 0 ? ssr : false, isBuild);
}
function compatSsrInOptions(options) {
    var _a;
    if (typeof options === 'boolean') {
        return options;
    }
    return (_a = options === null || options === void 0 ? void 0 : options.ssr) !== null && _a !== void 0 ? _a : false;
}
