const InteractionCommand = require('../../../../Structures/Interaction');
const Function = require('../../../../Utils/Function');

module.exports = class extends InteractionCommand {

	constructor(...args) {
		super(...args, {
			name: ['text', 'mocking'],
			description: 'Applies spongemock effect to your text.'
		});
	}

	async run(interaction) {
		const text = await interaction.options.getString('text', true);

		return interaction.reply({ content: Function.spongemock(text) });
	}

};