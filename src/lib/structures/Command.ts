import type BaseClient from '../BaseClient.js';
import { BitField, Message, PermissionsBitField, PermissionsString } from 'discord.js';
import type { MessageCommandOptions } from '../types/Global.js';
import type { Internationalization } from '../modules/Internationalization.js';
import type { Awaitable } from '@sapphire/utilities';

export default abstract class Command {
	public client: BaseClient<true>;
	public readonly name: string;
	public readonly aliases: string[];
	public readonly description: string;
	public readonly category: string;
	public readonly usage: string;
	public readonly memberPermissions: Readonly<BitField<PermissionsString, bigint>>;
	public readonly clientPermissions: Readonly<BitField<PermissionsString, bigint>>;
	public readonly cooldown: number;
	public readonly disabled: boolean;
	public readonly ownerOnly: boolean;
	public readonly nsfw: boolean;

	public constructor(client: BaseClient, options: MessageCommandOptions) {
		this.client = client;
		this.name = options.name;
		this.aliases = options.aliases ?? [];
		this.description = options.description ?? 'No description provided.';
		this.category = options.category ?? 'Miscellaneous';
		this.usage = options.usage ?? '';
		this.memberPermissions = new PermissionsBitField(options.memberPermissions).freeze();
		this.clientPermissions = new PermissionsBitField(options.clientPermissions).freeze();
		this.cooldown = options.cooldown ?? 3e3;
		this.disabled = options.disabled ?? false;
		this.ownerOnly = options.ownerOnly ?? false;
		this.nsfw = options.nsfw ?? false;
	}

	public abstract execute(message: Message, args?: string[], i18n?: Internationalization): Awaitable<unknown>;
}
