"use strict";
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 * Fork author: Benjas333
 */

import { Buffer } from 'node:buffer';
import crypto from 'crypto';

// Possible client types (Electron, NW.js, or terminal usage)
export type MicrosoftClientType = 'electron' | 'nwjs' | 'terminal';

// Basic structure for a Minecraft profile, with optional base64 fields
export interface MinecraftSkin {
	id?: string;
	state?: string;
	url?: string;
	variant?: string;
	alias?: string;
	base64?: string; // We add base64 representation after fetching
}

export interface MinecraftProfile {
	id: string;
	name: string;
	skins?: MinecraftSkin[];
	capes?: MinecraftSkin[];
}

// Structure for errors returned by the different steps in authentication
export interface AuthError {
	error: string;
	errorType?: string;
	[key: string]: any;
}

// Xbox account details (xuid, gamertag, ageGroup)
export interface XboxAccount {
	xuid: string;
	gamertag: string;
	ageGroup: string;
}

// Main structure for successful authentication
export interface AuthResponse {
	access_token: string;
	client_token: string;
	uuid: string;
	name: string;
	refresh_token: string;
	user_properties: string;
	meta: {
		type: 'Xbox';
		access_token_expires_in: number;
		demo: boolean;
	};
	xboxAccount?: XboxAccount | AuthError;
	profile: {
		skins?: MinecraftSkin[];
		capes?: MinecraftSkin[];
	};
}

/**
 * Utility function to fetch and convert an image to base64.
 * @param url A URL to an image.
 * @returns   A string of the image in base64 format.
 */
async function getBase64(url: string): Promise<string> {
	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	return buffer.toString('base64');
}

/**
 * Utility function to convert known xsts error codes to human-readable strings.
 * @param errorCode An error code returned by the xsts endpoint.
 * @returns         A string with the error description.
 */
async function knownTokenErrors(errorCode: Number) {
	switch (errorCode) {
		case 2148916227:
			return 'ENFORCEMENT_BAN';
		case 2148916229:
			return 'ACCOUNT_PARENTALLY_RESTRICTED';
		case 2148916233:
			return 'The user does not currently have an Xbox profile - https://signup.live.com/signup - ACCOUNT_CREATION_REQUIRED';
		case 2148916234:
			return 'ACCOUNT_TERMS_OF_USE_NOT_ACCEPTED';
		case 2148916235:
			return 'ACCOUNT_COUNTRY_NOT_AUTHORIZED';
		case 2148916236:
			return 'ACCOUNT_AGE_VERIFICATION_REQUIRED';
		case 2148916237:
			return 'ACCOUNT_UNDER_CURFEW';
		case 2148916238:
			return 'The account date of birth is under 18 years and cannot proceed unless the account is added to a Family by an adult - ACCOUNT_CHILD_NOT_IN_FAMILY'; // User is under 18
		case 2148916239:
			return 'ACCOUNT_CSV_TRANSITION_REQUIRED';
		case 2148916240:
			return 'ACCOUNT_MAINTENANCE_REQUIRED';
		case 2148916243:
			return 'ACCOUNT_NAME_CHANGE_REQUIRED';
		case 2148916242:
			return 'CONTENT_ISOLATION (Verify SCID / Sandbox)';
		case 2148916255:
			return 'EXPIRED_SERVICE_TOKEN';
		case 2148916258:
			return 'EXPIRED_USER_TOKEN';
		case 2148916257:
			return 'EXPIRED_TITLE_TOKEN';
		case 2148916256:
			return 'EXPIRED_DEVICE_TOKEN';
		case 2148916259:
			return 'INVALID_DEVICE_TOKEN';
		case 2148916260:
			return 'INVALID_TITLE_TOKEN';
		case 2148916261:
			return 'INVALID_USER_TOKEN';
		default:
			return `Unknown error code (${errorCode})`;
	}
}

export default class Microsoft {
	public client_id: string;
	public type: MicrosoftClientType;
	doIncludeXboxAccount: boolean;

	/**
	 * Creates a Microsoft auth instance.
	 * @param client_id            Your Microsoft OAuth client ID (default: '00000000402b5328' if none provided).
	 * @param doIncludeXboxAccount Whether to include the Xbox account data (xuid, gamertag, and ageGroup) in the response (default: true).
	 */
	constructor(client_id: string, doIncludeXboxAccount: boolean = true) {
		this.client_id = client_id || '00000000402b5328';
		this.doIncludeXboxAccount = doIncludeXboxAccount;

		if (!!process?.versions?.electron) {
			this.type = 'electron';
		} else if (!!process?.versions?.nw) {
			this.type = 'nwjs';
		} else {
			this.type = 'terminal';
		}
	}

	/**
	 * Opens a GUI (Electron or NW.js) or uses terminal approach to fetch an OAuth2 code,
	 * and then retrieves user information from Microsoft if successful.
	 * @param type            The environment to open the OAuth window. Defaults to the auto-detected type.
	 * @param url             The full OAuth2 authorization URL. If not provided, a default is used.
	 * @param doRemoveCookies Whether to remove login cookies before opening the OAuth window (default: true).
	 * @returns               An object with user data on success, or false if canceled.
	 */
	async getAuth(type?: MicrosoftClientType, url?: string, doRemoveCookies: boolean = true): Promise<AuthResponse | AuthError | false> {
		url = url || `https://login.live.com/oauth20_authorize.srf?client_id=${this.client_id}&response_type=code&redirect_uri=https://login.live.com/oauth20_desktop.srf&scope=XboxLive.signin%20offline_access&cobrandid=8058f65d-ce06-4c30-9559-473c9275a65d&prompt=select_account`;
		type = type || this.type;

		// Dynamically require different GUI modules depending on environment
		let usercode: string | 'cancel';
		switch (type) {
			case "electron":
				usercode = await (require('./GUI/Electron.js'))(url, doRemoveCookies);
				break;
			case "nwjs":
				usercode = await (require('./GUI/NW.js'))(url, doRemoveCookies);
				break;
			case "terminal":
				usercode = await (require('./GUI/Terminal.js'))(url);
				break;
			default:
				break;
		}
		// Exchange the code for an OAuth2 token, then retrieve account data
		return !usercode || usercode === "cancel" ? false : await this.exchangeCodeForToken(usercode);
	}

	/**
	 * Exchanges an OAuth2 authorization code for an access token, then retrieves account information.
	 * @param code The OAuth2 authorization code returned by Microsoft.
	 * @returns    The authenticated user data or an error object.
	 */
	private async exchangeCodeForToken(code: string): Promise<AuthResponse | AuthError> {
		try {
			const response = await fetch('https://login.live.com/oauth20_token.srf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `client_id=${this.client_id}&code=${code}&grant_type=authorization_code&redirect_uri=https://login.live.com/oauth20_desktop.srf`
			});
			const oauth2 = await response.json();

			if (oauth2.error) return { error: oauth2.error, errorType: 'oauth2', ...oauth2 };

			return await this.getAccount(oauth2);
		} catch (error) {
			return { error: error.message || error, errorType: 'network' };
		}
	}

	/**
	 * Refreshes the user's session if the token has expired or is about to expire.
	 * Otherwise, simply fetches the user's profile.
	 *
	 * @param acc A previously obtained AuthResponse object.
	 * @returns   Updated AuthResponse (with new token if needed) or an error object.
	 */
	public async refresh(acc: AuthResponse | any): Promise<AuthResponse | AuthError> {
		const timeStamp = Math.floor(Date.now() / 1000);

		// If the token is still valid for at least 2 more hours, just re-fetch the profile
		if (timeStamp < (acc?.meta?.access_token_expires_in - 7200)) {
			const profile = await this.getProfile(acc);
			if ('error' in profile) {
				// If there's an error, return it directly
				return profile;
			}
			acc.profile = {
				skins: profile.skins,
				capes: profile.capes
			}
			return acc;
		}

		// Otherwise, refresh the token
		try {
			const response = await fetch('https://login.live.com/oauth20_token.srf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `grant_type=refresh_token&client_id=${this.client_id}&refresh_token=${acc.refresh_token}`
			});
			const oauth2 = await response.json();

			if (oauth2.error) {
				return { error: oauth2.error, errorType: 'oauth2 refresh', ...oauth2 };
			}
			// Retrieve account data with the new tokens
			return this.getAccount(oauth2);
		} catch (err: any) {
			return { error: err.message || err, errorType: 'network' };
		}
	}

	/**
	 * Retrieves and assembles the full account details (Xbox Live, XSTS, Minecraft).
	 * @param oauth2 The token object returned by the Microsoft OAuth endpoint.
	 * @returns      A fully populated AuthResponse object or an error.
	 */
	private async getAccount(oauth2: any, doIncludeXboxAccount: boolean = this.doIncludeXboxAccount): Promise<AuthResponse | AuthError> {
		// 1. Authenticate with Xbox Live
		const xbox_live = await this.fetchJSON("https://user.auth.xboxlive.com/user/authenticate", {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({
				Properties: {
					AuthMethod: "RPS",
					SiteName: "user.auth.xboxlive.com",
					RpsTicket: "d=" + oauth2.access_token
				},
				RelyingParty: "http://auth.xboxlive.com",
				TokenType: "JWT"
			}),
		});
		if (xbox_live.error) return {
			...xbox_live,
			errorType: "Xbox Live Authentication"
		}

		// 2. Authorize with XSTS for Minecraft services
		const xsts = await this.fetchJSON("https://xsts.auth.xboxlive.com/xsts/authorize", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				Properties: {
					SandboxId: "RETAIL",
					UserTokens: [xbox_live.Token]
				},
				RelyingParty: "rp://api.minecraftservices.com/",
				TokenType: "JWT"
			})
		});
		if (xsts.error || xsts.XErr) return {
			...xsts,
			error: xsts.error || xsts.XErr,
			errorType: "xsts - Minecraft API",
			errorMessage: xsts.XErr ? await knownTokenErrors(xsts.XErr) : 'No XErr code provided.'
		};

		// 5. Login with Xbox token to get a Minecraft token
		const mcLogin = await this.fetchJSON("https://api.minecraftservices.com/authentication/login_with_xbox", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				identityToken: `XBL3.0 x=${xbox_live.DisplayClaims.xui[0].uhs};${xsts.Token}`
			})
		});
		if (mcLogin.error) return {
			...mcLogin,
			errorType: "Minecraft Login"
		};

		// 6. Check if the account has purchased Minecraft
		const hasGame = await this.fetchJSON("https://api.minecraftservices.com/entitlements/mcstore", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${mcLogin.access_token}`
			}
		});
		if (hasGame.error) return {
			...hasGame,
			errorType: "Minecraft Entitlements"
		};
		if (!hasGame.items?.find((i: any) => i.name === "product_minecraft" || i.name === "game_minecraft")) return {
			error: "You don't own the game",
			errorType: "game"
		};

		// 7. Fetch the user profile (skins, capes, etc.)
		const profile = await this.getProfile(mcLogin);
		if ('error' in profile) return profile;

		let response: AuthResponse = {
			access_token: mcLogin.access_token,
			client_token: crypto.randomBytes(16).toString('hex'),
			uuid: profile.id,
			name: profile.name,
			refresh_token: oauth2.refresh_token,
			user_properties: '{}',
			meta: {
				type: "Xbox",
				access_token_expires_in: mcLogin.expires_in + Math.floor(Date.now() / 1000),
				demo: false
			},
			xboxAccount: null,
			profile: {
				skins: profile.skins,
				capes: profile.capes
			}
		};
		if (doIncludeXboxAccount) {
			response.xboxAccount = await this.getXboxAccount(xbox_live.Token);
		}
		return response;
	}

	/**
	 * Fetches the Minecraft profile (including skins and capes) for a given access token,
	 * then converts each skin/cape URL to base64.
	 *
	 * @param mcLogin An object containing `access_token` to call the Minecraft profile API.
	 * @returns       The user's Minecraft profile or an error object.
	 */
	public async getProfile(mcLogin: { access_token: string }): Promise<MinecraftProfile | AuthError> {
		const profile = await this.fetchJSON('https://api.minecraftservices.com/minecraft/profile', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${mcLogin.access_token}`
			}
		});
		if (profile.error) return {
			...profile,
			errorType: "Minecraft Profile"
		};

		// Convert each skin and cape to base64
		if (Array.isArray(profile.skins)) {
			for (const skin of profile.skins) {
				if (skin.url) skin.base64 = `data:image/png;base64,${await getBase64(skin.url)}`;
			}
		}
		if (Array.isArray(profile.capes)) {
			for (const cape of profile.capes) {
				if (cape.url) cape.base64 = `data:image/png;base64,${await getBase64(cape.url)}`;
			}
		}

		return {
			id: profile.id,
			name: profile.name,
			skins: profile.skins || [],
			capes: profile.capes || []
		};
	}

	/**
	 * Retrieves the Xbox account details (xuid, gamertag, ageGroup) for a given access token.
	 * @param accessToken An access token from the Microsoft OAuth endpoint.
	 * @returns           An object with the user's Xbox account details or an error object.
	 */
	private async getXboxAccount(accessToken: string): Promise<XboxAccount | AuthError> {
		// 3. Authorize for the standard Xbox Live realm (useful for xuid/gamertag)
		let xboxAccount = await this.fetchJSON("https://xsts.auth.xboxlive.com/xsts/authorize", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				Properties: {
					SandboxId: "RETAIL",
					UserTokens: [accessToken]
				},
				RelyingParty: "http://xboxlive.com",
				TokenType: "JWT"
			})
		});
		if (xboxAccount.error) return {
			...xboxAccount,
			errorType: "Get Xbox Account"
		};

		return {
			xuid: xboxAccount.DisplayClaims.xui[0].xid,
			gamertag: xboxAccount.DisplayClaims.xui[0].gtg,
			ageGroup: xboxAccount.DisplayClaims.xui[0].agg,
		};
	}

	/**
	 * A helper method to perform fetch and parse JSON.
	 * @param url        The endpoint URL.
	 * @param options    Fetch options (method, headers, body, etc.).
	 * @param maxRetries Maximum number of retry attempts (default: 5).
	 * @returns          The parsed JSON or an object with an error field if something goes wrong.
	 */
	private async fetchJSON(
		url: string,
		options: Record<string, any>,
		maxRetries: number = 5
	): Promise<any> {
		let attempt = 0;
		let last_error: any;
		while (attempt < maxRetries) {
			try {
				const response = await fetch(url, options);
	
				if (!response.ok && response.status !== 429) {
					const errorText = await response.text();
					throw new Error(`HTTP error: ${response.status}: ${errorText}`);
				}
				
				if (response.status === 429) {
					if (attempt >= maxRetries) {
						const body = await response.text().catch(() => '');
						throw new Error(`HTTP 429: rate limit exceeded after ${maxRetries} retries: ${body}`);
					}

					const retry_after = response.headers.get('Retry-After');
					let delay_sec = retry_after ? parseInt(retry_after, 10) : Math.pow(2, attempt);
					if (isNaN(delay_sec)) {
						const then = new Date(retry_after).getTime();
						if (then) {
							delay_sec = Math.max(0, Math.floor((then - Date.now()) / 1000));
						} else {
							delay_sec = Math.pow(2, attempt);
						}
					}
					if (delay_sec <= 0) {
						delay_sec = Math.pow(2, attempt);
					}
					await new Promise(resolve => setTimeout(resolve, delay_sec * 1000));
					attempt++;
					continue;
				}

				const content_type = response.headers.get('content-type') || '';
				if (!content_type.includes('application/json')) {
					const body = await response.text();
					throw new Error(`Unexpected response (${content_type}): ${body}`);
				}
	
				const data = await response.json();
				return data;
			} catch (err: any) {
				last_error = err;
				if (attempt >= maxRetries || (err.message && !err.message.includes('429'))) break;
				attempt++;
			}
		}
		return { error: last_error.message || last_error };
	}
}
