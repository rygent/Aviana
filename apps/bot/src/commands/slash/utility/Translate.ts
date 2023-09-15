import type { BaseClient } from '#lib/structures/BaseClient.js';
import { Interaction } from '#lib/structures/Interaction.js';
import { EmbedBuilder } from '@discordjs/builders';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { bold, hideLinkEmbed, hyperlink, italic } from '@discordjs/formatters';
import { Colors } from '#lib/utils/Constants.js';
import { cutText } from '@sapphire/utilities';
import translate from '@iamtraction/google-translate';
import languages from '#assets/json/languages.json' assert { type: 'json' };

export default class extends Interaction {
	public constructor(client: BaseClient) {
		super(client, {
			name: 'translate',
			description: 'Translate your text.',
			category: 'Utility'
		});
	}

	public async execute(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
		const text = interaction.options.getString('text', true);
		const from = interaction.options.getString('from');
		const to = interaction.options.getString('to');

		const target = to ?? resolveDefaultLanguage(interaction);

		try {
			const translated = await translate(text, { from: from ?? 'auto', to: target });

			const embed = new EmbedBuilder()
				.setColor(Colors.Default)
				.setAuthor({
					name: 'Google Translate',
					iconURL: 'https://i.imgur.com/1JS81kv.png',
					url: 'https://translate.google.com/'
				})
				.setDescription(
					[
						`${cutText(translated.text, 3950)}\n`,
						`Translation from ${bold(italic(resolveLanguage(translated.from.language.iso)))} to ${bold(
							italic(resolveLanguage(target))
						)}.`
					].join('\n')
				)
				.setFooter({ text: 'Powered by Google Translate', iconURL: interaction.user.avatarURL() as string });

			return await interaction.reply({ embeds: [embed] });
		} catch (error: any) {
			if (error.code === 400) {
				const replies = `Please send valid ${hyperlink(
					'ISO 639-1',
					hideLinkEmbed('https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes')
				)} languages codes.`;

				return interaction.reply({ content: replies, ephemeral: true });
			}
		}
	}

	public override autocomplete(interaction: AutocompleteInteraction<'cached' | 'raw'>) {
		const focused = interaction.options.getFocused(true);

		const choices = languages.filter(({ name }) => name.toLowerCase().includes(focused.value.toLowerCase()));

		let respond = choices.filter(({ hoisted }) => hoisted).map(({ name, value }) => ({ name, value }));

		if (focused.value.length) {
			respond = choices.map(({ name, value }) => ({ name, value }));

			return interaction.respond(respond.slice(0, 25));
		}

		return interaction.respond(respond.slice(0, 25));
	}
}

function resolveDefaultLanguage(interaction: ChatInputCommandInteraction): string {
	if (interaction.inGuild()) {
		if (!['zh-CN', 'zh-TW'].includes(interaction.guildLocale)) {
			return new Intl.Locale(interaction.guildLocale).language;
		}

		return interaction.guildLocale;
	}

	if (!['zh-CN', 'zh-TW'].includes(interaction.locale)) {
		return new Intl.Locale(interaction.locale).language;
	}

	return interaction.locale;
}

function resolveLanguage(input: string) {
	return languages.filter(({ value }) => value.toLowerCase().includes(input.toLowerCase()))[0]!.name;
}
