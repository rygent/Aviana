import type BaseClient from '../lib/BaseClient.js';
import Event from '../lib/structures/Event.js';
import { ActivityType } from 'discord-api-types/v10';
import { formatNumber } from '../lib/utils/Function.js';
import { PrismaClient } from '@prisma/client';
import { redBright, underline } from 'colorette';
const prisma = new PrismaClient();

export default class extends Event {
	public constructor(client: BaseClient) {
		super(client, {
			name: 'ready',
			once: true
		});
	}

	public async run() {
		this.client.logger.log(`Logged in as ${redBright(underline(`${this.client.user.tag}`))}`);
		this.client.logger.log(`Loaded ${formatNumber(this.client.commands.size + this.client.interactions.size)} commands & ${formatNumber(this.client.events.size)} events!`);

		const guilds = await this.client.guilds.fetch();
		for (const [, guild] of guilds) {
			const exist = await prisma.guild.findFirst({ where: { id: guild.id } });
			if (!exist) {
				await prisma.guild.create({ data: { id: guild.id } });
			}
		}

		const activities = [
			{ name: `v${this.client.version}`, type: ActivityType.Playing },
			{ name: '/help', type: ActivityType.Listening }
		];

		let i = 0;
		setInterval(() => {
			activities.splice(2, 1, { name: `${formatNumber(this.client.guilds.cache.reduce((a, b) => a + b.memberCount, 0))} users`, type: ActivityType.Watching });
			activities.splice(3, 1, { name: `${formatNumber(this.client.guilds.cache.size)} servers`, type: ActivityType.Competing });

			this.client.user.setActivity((activities as any)[i++ % activities.length]);
		}, 6e4);
	}
}
