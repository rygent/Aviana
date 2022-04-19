const InteractionCommand = require('../../../../../Structures/Interaction');
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SelectMenuBuilder } = require('@discordjs/builders');
const { ButtonStyle, ComponentType } = require('discord-api-types/v10');
const { Colors, Secrets } = require('../../../../../Utils/Constants');
const Spotify = require('node-spotify-api');
const api = new Spotify({ id: Secrets.SpotifyClientId, secret: Secrets.SpotifyClientSecret });
const moment = require('moment');
require('moment-duration-format');

module.exports = class extends InteractionCommand {

	constructor(...args) {
		super(...args, {
			name: ['search', 'spotify'],
			description: 'Search for a song on Spotify.'
		});
	}

	async run(interaction) {
		const search = await interaction.options.getString('search', true);

		const response = await api.search({ type: 'track', query: search, limit: 10 }).then(({ tracks }) => tracks.items);
		if (!response.length) return interaction.reply({ content: 'Nothing found for this search.', ephemeral: true });

		const menu = new ActionRowBuilder()
			.addComponents(new SelectMenuBuilder()
				.setCustomId('data_menu')
				.setPlaceholder('Select a song!')
				.addOptions(...response.map(res => ({
					label: this.client.utils.truncateString(res.name, 95),
					value: res.id,
					description: this.client.utils.truncateString(this.client.utils.formatArray(res.artists.map(({ name }) => name)), 95).padEnd(1)
				}))));

		const reply = await interaction.reply({ content: `I found **${response.length}** possible matches, please select one of the following:`, components: [menu], fetchReply: true });

		const filter = (i) => i.customId === 'data_menu';
		const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.SelectMenu, time: 60000 });

		collector.on('collect', async (i) => {
			if (i.user.id !== interaction.user.id) return i.deferUpdate();
			await i.deferUpdate();

			const [selected] = i.values;
			const data = response.find(item => item.id === selected);

			const button = new ActionRowBuilder()
				.addComponents(new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setEmoji({ id: '950481019012804659', name: 'spotify', animated: false })
					.setLabel('Play on Spotify')
					.setURL(data.external_urls.spotify));

			const embed = new EmbedBuilder()
				.setColor(Colors.Default)
				.setAuthor({ name: 'Spotify', iconURL: 'https://i.imgur.com/9xO7toS.png', url: 'https://www.spotify.com/' })
				.setTitle(data.name)
				.setDescription([
					`***Artists:*** ${this.client.utils.formatArray(data.artists.map(({ name }) => name))}`,
					`***Album:*** ${data.album.name}`,
					`***Tracks:*** ${data.track_number.formatNumber()} of ${data.album.total_tracks.formatNumber()}`,
					`***Released:*** ${moment(data.album.release_date).format('MMMM D, YYYY')}`,
					`***Duration:*** ${moment.duration(data.duration_ms).format('HH:mm:ss')}`,
					`***Popularity:*** ${data.popularity.formatNumber()}`
				].join('\n'))
				.setImage(data.album.images[0].url)
				.setFooter({ text: `Powered by Spotify`, iconURL: interaction.user.avatarURL() });

			return i.editReply({ content: '\u200B', embeds: [embed], components: [button] });
		});

		collector.on('end', (collected, reason) => {
			if ((collected.size === 0 || collected.filter(({ user }) => user.id === interaction.user.id).size === 0) && reason === 'time') {
				return interaction.deleteReply();
			}
		});
	}

};