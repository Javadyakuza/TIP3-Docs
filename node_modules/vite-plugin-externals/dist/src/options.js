"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveOptions = exports.defaultOptions = void 0;
const constant_1 = require("./constant");
exports.defaultOptions = {
    disableInServe: false,
    disableSsr: true,
    filter(_, id, __, isBuild) {
        if (!constant_1.ID_FILTER_REG.test(id) ||
            (id.includes(constant_1.NODE_MODULES_FLAG) && !isBuild)) {
            return false;
        }
        return true;
    },
    useWindow: true,
    sourceMapOptions: {},
    debug: false,
};
function resolveOptions(userOptions) {
    return Object.assign({}, exports.defaultOptions, userOptions);
}
exports.resolveOptions = resolveOptions;
