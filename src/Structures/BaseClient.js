const { Client, Collection, Intents, Permissions } = require('discord.js');
const Util = require('./Util.js');

module.exports = class BaseClient extends Client {

	constructor(options = {}) {
		super({
			intents: [
				Intents.FLAGS.GUILDS,
				Intents.FLAGS.GUILD_MESSAGES,
				Intents.FLAGS.GUILD_PRESENCES
			],
			allowedMentions: {
				parse: ['users', 'roles'],
				repliedUser: false
			}
		});
		this.validate(options);

		this.commands = new Collection();
		this.aliases = new Collection();
		this.interactions = new Collection();
		this.events = new Collection();
		this.cooldowns = new Collection();
		this.utils = new Util(this);

		this.logger = require('../Helpers/Logger.js');

		this.usersData = require('../Schemas/UserData.js');
		this.guildsData = require('../Schemas/GuildData.js');
		this.membersData = require('../Schemas/MemberData.js');

		this.databaseCache = {};
		this.databaseCache.users = new Collection();
		this.databaseCache.guilds = new Collection();
		this.databaseCache.members = new Collection();

		this.databaseCache.mutedUsers = new Collection();

		String.prototype.toProperCase = function () {
			return this.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
		};

		Number.prototype.formatNumber = function () {
			return this.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
		};

		Array.prototype.random = function () {
			return this[Math.floor(Math.random() * this.length)];
		};
	}

	async findOrCreateUser({ id: userID }, isLean) {
		if (this.databaseCache.users.get(userID)) {
			return isLean ? this.databaseCache.users.get(userID).toJSON() : this.databaseCache.users.get(userID);
		} else {
			let userData = isLean ? await this.usersData.findOne({ id: userID }).lean() : await this.usersData.findOne({ id: userID });
			if (userData) {
				if (!isLean) this.databaseCache.users.set(userID, userData);
				return userData;
			} else {
				userData = new this.usersData({ id: userID });
				await userData.save();
				this.databaseCache.users.set(userID, userData);
				return isLean ? userData.toJSON() : userData;
			}
		}
	}

	async findOrCreateGuild({ id: guildID }, isLean) {
		if (this.databaseCache.guilds.get(guildID)) {
			return isLean ? this.databaseCache.guilds.get(guildID).toJSON() : this.databaseCache.guilds.get(guildID);
		} else {
			let guildData = isLean ? await this.guildsData.findOne({ id: guildID }).populate('members').lean() : await this.guildsData.findOne({ id: guildID }).populate('members');
			if (guildData) {
				if (!isLean) this.databaseCache.guilds.set(guildID, guildData);
				return guildData;
			} else {
				guildData = new this.guildsData({ id: guildID });
				await guildData.save();
				this.databaseCache.guilds.set(guildID, guildData);
				return isLean ? guildData.toJSON() : guildData;
			}
		}
	}

	async findOrCreateMember({ id: memberID, guildID }, isLean) {
		if (this.databaseCache.members.get(`${memberID}${guildID}`)) {
			return isLean ? this.databaseCache.members.get(`${memberID}${guildID}`).toJSON() : this.databaseCache.members.get(`${memberID}${guildID}`);
		} else {
			let memberData = isLean ? await this.membersData.findOne({ guildID, id: memberID }).lean() : await this.membersData.findOne({ guildID, id: memberID });
			if (memberData) {
				if (!isLean) this.databaseCache.members.set(`${memberID}${guildID}`, memberData);
				return memberData;
			} else {
				memberData = new this.membersData({ id: memberID, guildID: guildID });
				await memberData.save();
				const guild = await this.findOrCreateGuild({ id: guildID });
				if (guild) {
					guild.members.push(memberData._id);
					await guild.save();
				}
				this.databaseCache.members.set(`${memberID}${guildID}`, memberData);
				return isLean ? memberData.toJSON() : memberData;
			}
		}
	}

	/* eslint-disable no-empty-function */
	async resolveUser(search) {
		let user = null;
		if (!search || typeof search !== 'string') return;
		if (search.match(/^<@!?(\d+)>$/)) {
			const id = search.match(/^<@!?(\d+)>$/)[1];
			user = this.users.fetch(id).catch(() => {});
			if (user) return user;
		}
		if (search.match(/^!?(\w+)#(\d+)$/)) {
			const username = search.match(/^!?(\w+)#(\d+)$/)[0];
			const discriminator = search.match(/^!?(\w+)#(\d+)$/)[1];
			user = this.users.find((users) => users.username === username && users.discriminator === discriminator);
			if (user) return user;
		}
		user = await this.users.fetch(search).catch(() => {});
		return user;
	}

	async resolveMember(search, guild) {
		let member = null;
		if (!search || typeof search !== 'string') return;
		if (search.match(/^<@!?(\d+)>$/)) {
			const id = search.match(/^<@!?(\d+)>$/)[1];
			member = await guild.members.fetch(id).catch(() => {});
			if (member) return member;
		}
		if (search.match(/^!?(\w+)#(\d+)$/)) {
			guild = await guild.fetch();
			member = guild.members.cache.find((members) => members.user.tag === search);
			if (member) return member;
		}
		member = await guild.members.fetch(search).catch(() => {});
		return member;
	}

	validate(options) {
		if (typeof options !== 'object') throw new TypeError('Options should be a type of Object.');

		const nodeVersion = parseFloat(process.versions.node);
		if (nodeVersion < 16.6) throw new Error('This client requires Node.js v16.6.x or higher.');

		if (!options.token) throw new Error('You must pass the token for the Client.');
		this.token = options.token;

		if (!options.prefix) throw new Error('You must pass a prefix for the Client.');
		if (typeof options.prefix !== 'string') throw new TypeError('Prefix should be a type of String.');
		this.prefix = options.prefix;

		if (!options.owners) throw new Error('You must pass a list of owners for the Client.');
		if (!Array.isArray(options.owners)) throw new TypeError('Owners should be a type of Array<String>.');
		this.owners = options.owners;

		if (!options.defaultPerms) throw new Error('You must pass default perm(s) for the Client.');
		this.defaultPerms = new Permissions(options.defaultPerms).freeze();

		if (!options.mongoUri) throw new Error('You must pass mongo uri for the Client.');
		this.mongoUri = options.mongoUri;
	}

	async start(token = this.token) {
		this.utils.loadDatabases();
		this.utils.loadCommands();
		this.utils.loadEvents();
		super.login(token);
	}

};
