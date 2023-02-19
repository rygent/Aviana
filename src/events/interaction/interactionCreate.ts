import type BaseClient from '../../lib/BaseClient.js';
import Event from '../../lib/structures/Event.js';
import { Collection } from '@discordjs/collection';
import type { DiscordAPIError } from '@discordjs/rest';
import type { CommandInteraction, GuildMember } from 'discord.js';
import { bold, hideLinkEmbed, italic, underscore } from '@discordjs/formatters';
import { Links } from '../../lib/utils/Constants.js';
import { formatArray, formatPermissions, isNsfwChannel, resolveCommandName } from '../../lib/utils/Function.js';

export default class extends Event {
	public constructor(client: BaseClient) {
		super(client, {
			name: 'interactionCreate',
			once: false
		});
	}

	public async run(interaction: CommandInteraction<'cached' | 'raw'>) {
		if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand()) return;

		let { i18n } = this.client;
		if (interaction.inCachedGuild()) {
			const prisma = await this.client.prisma.guild.findFirst({
				where: { id: interaction.guildId },
				select: { locale: true }
			});

			i18n = this.client.i18n.setLocale(prisma!.locale);
		}

		const command = this.client.interactions.get(resolveCommandName(interaction));
		if (command) {
			if (command.disabled && !this.client.owners?.includes(interaction.user.id)) {
				return interaction.reply({ content: `${i18n.format('misc:COMMAND_DISABLED')}`, ephemeral: true });
			}

			if (command.guildOnly && !interaction.inCachedGuild()) {
				return interaction.reply({ content: `${i18n.format('misc:GUILD_ONLY')}`, ephemeral: true });
			}

			if (interaction.inGuild()) {
				const memberPermCheck = command.memberPermissions
					? this.client.defaultPermissions.add(command.memberPermissions)
					: this.client.defaultPermissions;

				if (memberPermCheck) {
					const missing = interaction.channel?.permissionsFor(interaction.member as GuildMember)
						?.missing(memberPermCheck) as string[];

					if (missing.length) {
						const replies = `${i18n.format('misc:MISSING_MEMBER_PERMISSION', { permission: formatArray(missing.map(item => underscore(italic(formatPermissions(item))))) })}`;

						return interaction.reply({ content: replies, ephemeral: true });
					}
				}

				const clientPermCheck = command.clientPermissions
					? this.client.defaultPermissions.add(command.clientPermissions)
					: this.client.defaultPermissions;

				if (clientPermCheck) {
					const missing = interaction.channel?.permissionsFor(interaction.guild?.members.me as GuildMember)
						?.missing(clientPermCheck) as string[];

					if (missing.length) {
						const replies = `${i18n.format('misc:MISSING_CLIENT_PERMISSION', { permission: formatArray(missing.map(item => underscore(italic(formatPermissions(item))))) })}`;

						return interaction.reply({ content: replies, ephemeral: true });
					}
				}

				if (command.nsfw && !isNsfwChannel(interaction.channel)) {
					return interaction.reply({ content: `${i18n.format('misc:NSFW_COMMAND')}`, ephemeral: true });
				}
			}

			if (command.ownerOnly && !this.client.owners?.includes(interaction.user.id)) {
				return interaction.reply({ content: `${i18n.format('misc:OWNER_ONLY')}`, ephemeral: true });
			}

			if (!this.client.cooldowns.has(resolveCommandName(interaction))) {
				this.client.cooldowns.set(resolveCommandName(interaction), new Collection());
			}

			const now = Date.now();
			const cooldown = this.client.cooldowns.get(resolveCommandName(interaction));

			if (cooldown?.has(interaction.user.id) && !this.client.owners?.includes(interaction.user.id)) {
				const expired = cooldown.get(interaction.user.id) as number + command.cooldown;

				if (now < expired) {
					const duration = (expired - now) / 1e3;
					return interaction.reply({ content: `${i18n.format('misc:COOLDOWN', { duration: bold(duration.toFixed(2)) })}`, ephemeral: true })
						.then(() => setTimeout(() => interaction.deleteReply(), expired - now));
				}
			}

			cooldown?.set(interaction.user.id, now);
			setTimeout(() => cooldown?.delete(interaction.user.id), command.cooldown);

			try {
				await command.execute(interaction, i18n);
			} catch (e: unknown) {
				if ((e as DiscordAPIError).name === 'DiscordAPIError[10062]') return;
				if (interaction.replied) return;
				this.client.logger.error(`${(e as Error).name}: ${(e as Error).message}`, (e as Error), true);

				const replies = `${i18n.format('misc:ERROR_OCCURRED', { link: hideLinkEmbed(Links.SupportServer) })}`;

				if (interaction.deferred) return interaction.editReply({ content: replies });
				return interaction.reply({ content: replies, ephemeral: true });
			}
		}
	}
}
