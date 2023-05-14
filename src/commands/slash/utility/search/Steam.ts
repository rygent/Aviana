import type BaseClient from '../../../../lib/BaseClient.js';
import Command from '../../../../lib/structures/Interaction.js';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder } from '@discordjs/builders';
import { ButtonStyle, ComponentType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, StringSelectMenuInteraction } from 'discord.js';
import { bold, hyperlink, inlineCode, italic, underscore } from '@discordjs/formatters';
import { Advances, Colors } from '../../../../lib/utils/Constants.js';
import { formatArray, titleCase } from '../../../../lib/utils/Function.js';
import { nanoid } from 'nanoid';
import { request } from 'undici';

export default class extends Command {
	public constructor(client: BaseClient) {
		super(client, {
			name: 'search steam',
			description: 'Search for a Games on Steam.',
			category: 'Utility'
		});
	}

	public async execute(interaction: ChatInputCommandInteraction<'cached' | 'raw'>) {
		const search = interaction.options.getString('search', true);

		const raw = await request(`https://store.steampowered.com/api/storesearch/?term=${search}&l=en&cc=us`, {
			method: 'GET',
			headers: { 'User-Agent': Advances.UserAgent },
			maxRedirections: 20
		});

		const response = await raw.body.json().then(({ items }) => items.filter((item: any) => item.type === 'app'));
		if (!response.length) return interaction.reply({ content: 'Nothing found for this search.', ephemeral: true });

		const selectId = nanoid();
		const select = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
			new StringSelectMenuBuilder()
				.setCustomId(selectId)
				.setPlaceholder('Select a game')
				.setOptions(
					...response.map((data: any) => ({
						value: data.id.toString(),
						label: data.name
					}))
				)
		);

		const reply = await interaction.reply({
			content: `I found ${bold(response.length)} possible matches, please select one of the following:`,
			components: [select]
		});

		const filter = (i: StringSelectMenuInteraction) => i.user.id === interaction.user.id;
		const collector = reply.createMessageComponentCollector({
			filter,
			componentType: ComponentType.StringSelect,
			time: 6e4,
			max: 1
		});

		collector.on('ignore', (i) => void i.deferUpdate());
		collector.on('collect', async (i) => {
			const [ids] = i.values;
			const data = await request(`https://store.steampowered.com/api/appdetails?appids=${ids}&l=en&cc=us`, {
				method: 'GET',
				headers: { 'User-Agent': Advances.UserAgent },
				maxRedirections: 20
			}).then((res) => res.body.json().then((item) => item[ids!].data));

			const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
				new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel('Open in Browser')
					.setURL(`https://store.steampowered.com/app/${data.steam_appid}/`)
			);

			const embed = new EmbedBuilder()
				.setColor(Colors.Default)
				.setAuthor({ name: 'Steam', iconURL: 'https://i.imgur.com/xxr2UBZ.png', url: 'http://store.steampowered.com/' })
				.setTitle(data.name)
				.setDescription(data.short_description)
				.addFields({
					name: underscore(italic('Detail')),
					value: [
						`${bold(italic('Release Date:'))} ${
							data.release_date.coming_soon ? 'Coming soon' : data.release_date.date
						}`,
						`${bold(italic('Price:'))} ${inlineCode(
							data.price_overview ? data.price_overview.final_formatted : 'Free'
						)}`,
						`${bold(italic('Genres:'))} ${data.genres.map(({ description }: any) => description).join(', ')}`,
						...(data.platforms
							? [
									`${bold(italic('Platform:'))} ${titleCase(
										formatArray(Object.keys(data.platforms).filter((item) => data.platforms[item]))
									).replace(/And/g, 'and')}`
							  ]
							: []),
						...(data.metacritic
							? [
									`${bold(italic('Metascores:'))} ${data.metacritic.score} from ${hyperlink(
										'metacritic',
										data.metacritic.url
									)}`
							  ]
							: []),
						`${bold(italic('Developers:'))} ${data.developers.join(', ')}`,
						`${bold(italic('Publishers:'))} ${data.publishers.join(', ')}`,
						...(data.content_descriptors?.notes
							? [`\n${italic(data.content_descriptors.notes.replace(/\r|\n/g, ''))}`]
							: [])
					].join('\n'),
					inline: false
				})
				.setImage(data.header_image)
				.setFooter({ text: 'Powered by Steam', iconURL: interaction.user.avatarURL() as string });

			return void i.update({ content: null, embeds: [embed], components: [button] });
		});

		collector.on('end', (collected, reason) => {
			if (!collected.size && reason === 'time') {
				return interaction.deleteReply();
			}
		});
	}
}
