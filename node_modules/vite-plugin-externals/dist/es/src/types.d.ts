import { TransformPluginContext } from 'rollup';
import { SourceMapOptions } from 'magic-string';
import type { Plugin } from 'vite';
export declare type ExternalValue = string | string[];
export declare type Externals = Record<string, ExternalValue>;
export interface Options {
    disableInServe: boolean;
    disableSsr: boolean;
    filter: (this: TransformPluginContext, code: string, id: string, ssr: boolean, isBuild: boolean) => boolean;
    useWindow: boolean;
    enforce?: Plugin['enforce'];
    sourceMapOptions: Partial<SourceMapOptions>;
    debug: boolean;
}
export declare type UserOptions = Partial<Options>;
export declare type TransformModuleNameFn = (externalValue: ExternalValue) => string;
