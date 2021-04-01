import { Inject, Injectable } from '@angular/core';

declare var apiRTC: any;

//import {UserAgent} from '@apizee/apirtc/';

@Injectable({
	providedIn: 'root'
})
export class ApiRtcService {

	constructor(@Inject('apiKey') private apiKey: string) {
	}

	public getApiKey(): string {
		return this.apiKey;
	}

	public createUserAgent() {
		return new apiRTC.UserAgent({
			// format is like 'apzKey:9669e2ae3eb32307853499850770b0c3'
			uri: 'apzkey:' + this.apiKey
		});
	}

	public uuidv4() {
		return 'xxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
		// return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		// 	var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		// 	return v.toString(16);
		// });
	}
}
