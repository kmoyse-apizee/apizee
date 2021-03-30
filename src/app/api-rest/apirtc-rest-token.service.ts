import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { handleError } from '../misc';

import { APIZEE_ACCOUNT } from '../consts';

@Injectable({
  providedIn: 'root'
})
export class ApirtcRestTokenService {

  apiUrl: string;
  baseUrl: string;

  //private access_token: string;

  constructor(private http: HttpClient) {
    this.apiUrl = `${APIZEE_ACCOUNT.host}/api`;
    this.baseUrl = `${this.apiUrl}/token`;
  }

  
  // public setCachedToken(access_token: string): void {
  //   this.access_token = access_token;
  // }

  // public getCachedToken(): string {
  //   return this.access_token;
  // }

  public createToken(username: string, password: string): Observable<any> {

    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8'
    });

    return this.http
      .post(encodeURI(this.baseUrl + `/?grant_type=password&username=${username}&password=${password}`), { headers: headers })
      .pipe(
        catchError(error => {
          // rethrow to let client handle it
          return throwError(handleError(error));
        })
      );
  }

  public checkUserToken(userId: string, access_token: string): Observable<any> {

    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    return this.http
      .post(encodeURI(this.apiUrl + '/checkUserToken' + `?apiKey=${APIZEE_ACCOUNT.apiKey}&userId=${userId}&token=${access_token}`), {}, { headers: headers })
      .pipe(
        catchError(error => {
          // and rethrow to let client handle it
          return throwError(handleError(error));
        })
      );
  }

  public deleteToken(access_token: string): Observable<any> {

    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    return this.http
      .delete(encodeURI(this.baseUrl), { headers: headers })
      .pipe(
        catchError(error => {
          // and rethrow to let client handle it
          return throwError(handleError(error));
        })
      );
  }
}
