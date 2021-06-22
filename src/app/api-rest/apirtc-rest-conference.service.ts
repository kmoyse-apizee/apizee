import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, } from '@angular/common/http';

import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { handleError } from '../misc';

import { APIZEE_ACCOUNT } from './consts';

export class ConferenceOptions {

  constructor(public participants: Array<string>,
    public name: string,
    public message: string,
    public visibility: string,
    public password: number,
    public audioMute: boolean,
    public videoMute: boolean,
    public soundWaitingRoom: boolean,
    public denyGuest: boolean,
    public moderation: boolean,
    public startTime: string,
    public open: boolean,
    public durationMinutes: number,
    public reminderMinutes: number,
    public language: string,
    public invite: boolean,
    public moderator: string) {
  }
}


export class ConferenceOptionsBuilder {
  //public participants:string;
  public name: string = 'Test conf';
  public message: string = 'join me';
  public visibility: string = 'private';
  public password: number;
  public audioMute: boolean = true;
  public videoMute: boolean = false;
  public soundWaitingRoom: boolean = false;
  public denyGuest: boolean = false;
  public moderation: boolean = false;
  public startTime: string;
  public open: boolean = true;
  public durationMinutes: number;
  public reminderMinutes: number;
  public language: string = 'fr';
  public invite: boolean = true;
  public moderator: string;

  constructor(public participants: Array<string>) {
  }

  public named(name: string): ConferenceOptionsBuilder {
    this.name = name;
    return this;
  }

  public withMessage(message: string): ConferenceOptionsBuilder {
    this.message = message;
    return this;
  }

  public withPassword(password: number): ConferenceOptionsBuilder {
    this.password = password;
    return this;
  }

  public muteAudio(audioMute: boolean): ConferenceOptionsBuilder {
    this.audioMute = audioMute;
    return this;
  }

  // TODO
  // write all methods

  public build(): ConferenceOptions {
    return new ConferenceOptions(this.participants, this.name,
      this.message, this.visibility, this.password,
      this.audioMute, this.videoMute, this.soundWaitingRoom, this.denyGuest,
      this.moderation, this.startTime, this.open, this.durationMinutes,
      this.reminderMinutes, this.language, this.invite, this.moderator)
  }

}

@Injectable({
  providedIn: 'root'
})
export class ApirtcRestConferenceService {
  apiUrl: string;
  baseUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = `${APIZEE_ACCOUNT.host}/api`;
    this.baseUrl = `${this.apiUrl}/conferences`;
  }

  public createConference(access_token: string, options: ConferenceOptions) {

    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    return this.http
      .post(encodeURI(this.baseUrl + '?' +
        `participants=` + options.participants.join(',') +
        `&name=` + options.name +
        `&message=` + options.message +
        `&visibility=` + options.visibility +
        // # TODO: initially I put 'passwd21Test' but the conference product provide only a digits pad
        // # invitation were made but I could not enter the password..
        // # => Anthony shall file a BUG regarding this
        (options.password ? `&password=` + options.password : '') +
        // # TODO: when I did the test, audio was not muted...
        // # => Anthony says the API shall be updated with a new way to configure such things
        `&audioMute=` + (options.audioMute ? "true" : "false") +
        `&videoMute=` + (options.videoMute ? "true" : "false") +
        `&soundWaitingRoom=` + (options.soundWaitingRoom ? "true" : "false") +
        `&denyGuest=` + (options.denyGuest ? "true" : "false") +
        `&moderation=` + (options.moderation ? "true" : "false") +
        // # f`&startTime={urllib.parse.quote('2021-03-18T11:50:00Z')}`
        // TODO format starttime ?
        (options.startTime ? `&startTime=${options.startTime}` : '') +
        `&open=` + (options.open ? "true" : "false") +
        // duration and reminder ony valid if startTime is defined ?
        (options.startTime ?
          `&duration=` + options.durationMinutes +
          `&reminder=` + options.reminderMinutes : '') +
        //
        `&language=` + options.language +
        `&invite=` + (options.invite ? "true" : "false") +
        (options.moderator ? `&moderator=${options.moderator}` : '')
      ), {}, { headers: headers })
      .pipe(
        catchError(error => {
          // rethrow to let client handle it
          return throwError(handleError(error));
        })
      );

  }

  public listConferences(access_token: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });
    return this.http.get(encodeURI(this.baseUrl), { headers: headers }).pipe(
      catchError(error => {
        // rethrow to let client handle it
        return throwError(handleError(error));
      })
    );
  }

  public deleteConference(access_token: string, id: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });
    return this.http.delete(encodeURI(this.baseUrl + '/' + id), { headers: headers }).pipe(
      catchError(error => {
        // rethrow to let client handle it
        return throwError(handleError(error));
      })
    );
  }

}
