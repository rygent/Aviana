const { Permissions } = require('discord.js');

module.exports = class Interaction {

	constructor(client, name, options = {}) {
		this.client = client;
		this.name = options.name || name;
		this.type = options.type || 1;
		this.description = this.type === 1 ? options.description || 'No description provided' : undefined;
		this.options = options.options || [];
		this.defaultPermission = options.defaultPermission;
		this.memberPerms = new Permissions(options.memberPerms).freeze();
		this.clientPerms = new Permissions(options.clientPerms).freeze();
		this.cooldown = options.cooldown || 3000;
		this.guildOnly = options.guildOnly || false;
		this.ownerOnly = options.ownerOnly || false;
		this.disabled = options.disabled || false;
	}

	// eslint-disable-next-line no-unused-vars
	async run(interaction) {
		throw new Error(`Interaction ${this.name} doesn't provide a run method!`);
	}

};