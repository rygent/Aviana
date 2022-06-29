export * from '../Assets/js/Badge.js';

export const Colors = {
	Default: 0x2f3136,
	Green: 0x77dd77,
	Yellow: 0xfdfd96,
	Orange: 0xffb347,
	Red: 0xff6961,
	Grey: 0xcfcfc4
};

export const Credentials = {
	ImdbApiKey: process.env.IMDB_API_KEY,
	ImgurClientId: process.env.IMGUR_CLIENT_ID,
	OpenWeatherApiKey: process.env.OPEN_WEATHER_API_KEY,
	SpotifyClientId: process.env.SPOTIFY_CLIENT_ID,
	SpotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET
};

export const Emojis = {
	Alarm: '<:alarm:950481082191581224>',
	Info: '<:info:950481046821036082>',
	Online: '<:online:712397262256472075>',
	Idle: '<:idle:712397201955094708>',
	Dnd: '<:dnd:712397154836283392>',
	Offline: '<:offline:712397086100029440>',
	Verified: '<:verified:945933555089952848>',
	Spotify: '<:spotify:950481019012804659>'
};

export const Links = {
	SupportServer: process.env.SUPPORT_SERVER_URL,
	LoggerWebhook: process.env.LOGGER_WEBHOOK_URL,
	ReportWebhook: process.env.REPORT_WEBHOOK_URL,
	GuildWebhook: process.env.GUILD_WEBHOOK_URL
};
