import { ExternalValue, Externals, TransformModuleNameFn } from './types';
export declare const transformImports: (raw: string, externalValue: ExternalValue, transformModuleName: TransformModuleNameFn) => string;
export declare function transformRequires(code: string, externals: Externals, transformModuleName: TransformModuleNameFn): string;
