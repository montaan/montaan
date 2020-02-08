import { Client } from './quickgres-frontend';

export type QFrameAPIResponseType = 'json' | 'text' | 'arrayBuffer' | 'raw';

export class QFrameAPI {
	server: string;
	authHeaders?: any;

	constructor(server: string) {
		this.server = server;
		this.authHeaders = undefined;
	}

	request(path: string, config?: any) {
		const configHeaders = config ? config.headers : {};
		config = {
			credentials: 'include',
			...config,
			headers: { ...configHeaders, ...this.authHeaders },
		};
		return fetch(this.server + path, config);
	}

	async parseResponse(res: Response, responseType?: QFrameAPIResponseType) {
		if (res.status !== 200)
			throw Error('Response failed: ' + res.status + ' ' + res.statusText);
		if (responseType === 'raw') return res;
		if (responseType) return res[responseType]();
		const mime = res.headers.get('content-type');
		if (mime === 'application/json') return res.json();
		else if (mime === 'text/plain') return res.text();
		else if (mime === 'application/x-postgres') {
			const arrayBuffer = await res.arrayBuffer();
			const client = new Client(1);
			client.onData(arrayBuffer);
			return client.stream.rows.map((r) => r.toObject());
		} else if (/^text/.test(mime || '')) return res.text();
		else return res.arrayBuffer();
	}
	async postType(path: string, body: any, config: any, responseType: QFrameAPIResponseType) {
		return this.parseResponse(
			await this.request(path, { method: 'POST', body: JSON.stringify(body), ...config }),
			responseType
		);
	}
	async getType(path: string, config: any, responseType: QFrameAPIResponseType) {
		return this.parseResponse(await this.request(path, config), responseType);
	}
	async post(path: string, body: any, config?: object) {
		return this.parseResponse(
			await this.request(path, { method: 'POST', body: JSON.stringify(body), ...config })
		);
	}
	async get(path: string, config?: object) {
		return this.parseResponse(await this.request(path, config));
	}
}

export default QFrameAPI;
