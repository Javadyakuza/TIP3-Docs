"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformRequires = exports.transformImports = void 0;
const acorn_1 = require("acorn");
const transformImports = (raw, externalValue, transformModuleName) => {
    var _a;
    const ast = acorn_1.Parser.parse(raw, {
        ecmaVersion: 'latest',
        sourceType: 'module',
    });
    const specifiers = (_a = ast.body[0]) === null || _a === void 0 ? void 0 : _a.specifiers;
    if (!specifiers) {
        return '';
    }
    return specifiers.reduce((s, specifier) => {
        const { local } = specifier;
        if (specifier.type === 'ImportDefaultSpecifier') {
            s += `const ${local.name} = ${transformModuleName(externalValue)}\n`;
        }
        else if (specifier.type === 'ImportSpecifier') {
            const { imported } = specifier;
            s += `const ${local.name} = ${transformModuleName(externalValue)}.${imported.name}\n`;
        }
        else if (specifier.type === 'ImportNamespaceSpecifier') {
            s += `const ${local.name} = ${transformModuleName(externalValue)}\n`;
        }
        else if (specifier.type === 'ExportSpecifier') {
            const { exported } = specifier;
            const value = `${transformModuleName(externalValue)}${local.name !== 'default' ? `.${local.name}` : ''}`;
            if (exported.name === 'default') {
                s += `export default ${value}\n`;
            }
            else {
                s += `export const ${exported.name} = ${value}\n`;
            }
        }
        return s;
    }, '');
};
exports.transformImports = transformImports;
function transformRequires(code, externals, transformModuleName) {
    return Object.keys(externals).reduce((code, externalKey) => {
        const r = new RegExp(`require\\((["'\`])\\s*${externalKey}\\s*(\\1)\\)`, 'g');
        return code.replace(r, transformModuleName(externals[externalKey]));
    }, code);
}
exports.transformRequires = transformRequires;
