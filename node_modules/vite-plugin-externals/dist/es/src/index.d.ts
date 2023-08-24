import { TransformPluginContext } from 'rollup';
import type { Plugin } from 'vite';
import { Externals, Options, TransformModuleNameFn, UserOptions } from './types';
export declare const createTransformModuleName: (options: Options) => TransformModuleNameFn;
export declare function viteExternalsPlugin(externals?: Externals, userOptions?: UserOptions): Plugin;
export declare function isNeedExternal(this: TransformPluginContext, options: Options, code: string, id: string, isBuild: boolean, ssr?: boolean): boolean;
