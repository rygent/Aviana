import type BaseClient from '../../../lib/BaseClient.js';
import Command from '../../../lib/structures/Interaction.js';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from '@discordjs/builders';
import { ButtonStyle } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction } from 'discord.js';
import { bold, inlineCode, italic } from '@discordjs/formatters';
import type { Internationalization } from '../../../lib/modules/Internationalization.js';
import { Colors } from '../../../lib/utils/Constants.js';

export default class extends Command {
	public constructor(client: BaseClient) {
		super(client, {
			name: 'avatar',
			description: 'Display the avatar of the provided user.',
			category: 'Utility'
		});
	}

	public execute(interaction: ChatInputCommandInteraction<'cached' | 'raw'>, i18n: Internationalization) {
		const user = interaction.options.getUser('user') ?? interaction.user;

		const button = new ActionRowBuilder<ButtonBuilder>()
			.setComponents(new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('Open in Browser')
				.setURL(user.displayAvatarURL({ extension: 'png', size: 4096 })));

		const embed = new EmbedBuilder()
			.setColor(Colors.Default)
			.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
			.setDescription(`${bold(italic('ID:'))} ${inlineCode(user.id)}`)
			.setImage(user.displayAvatarURL({ size: 512 }))
			.setFooter({ text: `${i18n.format('common:POWERED_BY', { service: this.client.user.username })}`, iconURL: interaction.user.avatarURL() as string });

		return interaction.reply({ embeds: [embed], components: [button] });
	}
}
