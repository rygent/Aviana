import i18next, { TFuncKey, TFunction, TOptions } from 'i18next';
import FsBackend, { FsBackendOptions } from 'i18next-fs-backend';
import type { NonNullObject } from '@sapphire/utilities';
import type { StringMap, TFunctionResult } from '../types/Internationalization.js';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PathLike } from 'node:fs';
import { opendir } from 'node:fs/promises';
import meta from '../../locales/locale-meta.json' assert { type: 'json' };

export class Internationalization {
	public namespaces = new Set<string>();
	public readonly languages = new Map<string, TFunction>();
	public readonly languagesDirectory: string;
	protected readonly backendOptions: FsBackendOptions;
	public languagesLoaded = false;
	public locale: string;

	public constructor() {
		this.languagesDirectory = `${this.directory}locales/`;

		const languagePaths = join(this.languagesDirectory, '{{lng}}', '{{ns}}.json');
		this.backendOptions = {
			loadPath: languagePaths,
			ident: 2
		};

		this.locale = this.defaultLanguages;
	}

	private get directory(): string {
		const main = fileURLToPath(new URL('../../index.js', import.meta.url));
		return `${dirname(main) + sep}`.replace(/\\/g, '/');
	}

	private get defaultLanguages() {
		return meta.find(locale => locale.default)!.locale;
	}

	public async init() {
		const { namespaces, languages } = await this.walkRootDirectory(this.languagesDirectory);

		i18next.use(FsBackend);
		await i18next.init({
			backend: this.backendOptions,
			fallbackLng: 'en-US',
			initImmediate: false,
			interpolation: {
				escapeValue: false
			},
			load: 'all',
			defaultNS: 'default',
			ns: namespaces,
			preload: languages
		});

		this.namespaces = new Set(namespaces);
		for (const item of languages) {
			this.languages.set(item, i18next.getFixedT(item));
		}
		this.languagesLoaded = true;
	}

	public setLocale(locale: string) {
		this.locale = locale;
		return this;
	}

	public format<TResult extends TFunctionResult = string, TKeys extends TFuncKey = string, TInterpolationMap extends NonNullObject = StringMap>(
		key: TKeys | TKeys[],
		options?: TOptions<TInterpolationMap>,
		locale?: string
	): TResult {
		if (!this.languagesLoaded) throw new Error('Cannot call this method until Internationalization#init has been called');
		// eslint-disable-next-line prefer-destructuring
		if (!locale) locale = this.locale;

		const language = this.languages.get(locale);
		if (!language) throw new ReferenceError('Invalid language provided');

		return language(key, { ...options }) as TResult;
	}

	private async walkRootDirectory(directory: PathLike) {
		const languages = new Set<string>();
		const namespaces = new Set<string>();

		const dir = await opendir(directory);
		for await (const entry of dir) {
			if (!entry.isDirectory()) continue;

			languages.add(entry.name);

			for await (const namespace of this.walkLocaleDirectory(join(dir.path, entry.name), '')) {
				namespaces.add(namespace);
			}
		}

		return { namespaces: [...namespaces], languages: [...languages] };
	}

	private async *walkLocaleDirectory(directory: string, ns: string): AsyncGenerator<string> {
		const dir = await opendir(directory);
		for await (const entry of dir) {
			if (entry.isDirectory()) {
				yield *this.walkLocaleDirectory(join(dir.path, entry.name), `${ns}${entry.name}/`);
			} else if (entry.isFile() && entry.name.endsWith('.json')) {
				yield `${ns}${entry.name.slice(0, -5)}`;
			}
		}
	}
}
