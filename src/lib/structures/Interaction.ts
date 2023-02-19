import type BaseClient from '../BaseClient.js';
import { AutocompleteInteraction, BitField, CommandInteraction, PermissionsBitField, PermissionsString } from 'discord.js';
import type { InteractionCommandOptions } from '../types/Global.js';
import type { Internationalization } from '../modules/Internationalization.js';
import type { Awaitable } from '@sapphire/utilities';

export default abstract class Interaction {
	public client: BaseClient<true>;
	public readonly name: string;
	public readonly description: string;
	public readonly category: string;
	public readonly memberPermissions: Readonly<BitField<PermissionsString, bigint>>;
	public readonly clientPermissions: Readonly<BitField<PermissionsString, bigint>>;
	public readonly cooldown: number;
	public readonly disabled: boolean;
	public readonly context: boolean;
	public readonly guildOnly: boolean;
	public readonly ownerOnly: boolean;
	public readonly nsfw: boolean;

	public constructor(client: BaseClient, options: InteractionCommandOptions) {
		this.client = client;
		this.name = options.name;
		this.description = options.description ?? 'No description provided';
		this.category = options.category ?? 'Miscellaneous';
		this.memberPermissions = new PermissionsBitField(options.memberPermissions).freeze();
		this.clientPermissions = new PermissionsBitField(options.clientPermissions).freeze();
		this.cooldown = options.cooldown ?? 3e3;
		this.disabled = options.disabled ?? false;
		this.context = options.context ?? false;
		this.guildOnly = options.guildOnly ?? false;
		this.ownerOnly = options.ownerOnly ?? false;
		this.nsfw = options.nsfw ?? false;
	}

	public abstract execute(interaction: CommandInteraction<'cached' | 'raw'>, i18n?: Internationalization): Awaitable<unknown>;

	// @ts-expect-error
	public autocomplete(interaction: AutocompleteInteraction<'cached' | 'raw'>): Awaitable<unknown> {
		throw new Error(`${this.name} doesn't provide a autocomplete method!`);
	}
}
