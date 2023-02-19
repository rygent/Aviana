import type { DefaultTFuncReturnWithObject, Namespace, TFuncKey, TFuncReturn, TypeOptions } from 'i18next';

export interface StringMap {
	[key: string]: any;
}

export type TFunctionKeys = TFuncKey | TemplateStringsArray extends infer A ? A : never;
export type TFunctionResult<N extends Namespace = TypeOptions['defaultNS'], TKPrefix = undefined> = TFuncReturn<
N,
TFunctionKeys,
DefaultTFuncReturnWithObject,
TKPrefix
>;
