import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { handleError } from '../misc';

import { APIRTC_CLOUD } from './consts';

import { ApiRTCListResponse } from './api-rest.module';

@Injectable({
  providedIn: 'root'
})
export class ApirtcRestUsersService {

  apiUrl: string;
  baseUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = `${APIRTC_CLOUD.host}/api`;
    this.baseUrl = `${this.apiUrl}/users`;
  }

  public list(access_token: string, offset?: number): Observable<ApiRTCListResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    var url = this.baseUrl + '?' + 'offset=' + (offset || 0);

    return this.http.get<ApiRTCListResponse>(encodeURI(url), { headers: headers }).pipe(
      catchError(error => {
        // rethrow to let client handle it
        return throwError(handleError(error));
      })
    );
  }

  public create(access_token: string, username: string, password: string, email: string, firstName?: string | null, lastName?: string | null, enterpriseId?: string | null) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    const url = `${this.apiUrl}/createUser`;

    return this.http
      .post(encodeURI(url + '?' +
        `username=` + username +
        `&password=` + password +
        `&email=` + email +
        (firstName ? `&firstName=` + firstName : '') +
        (lastName ? `&lastName=` + lastName : '') +
        (enterpriseId ? `&enterpriseId=` + enterpriseId : '')
      ), {}, { headers: headers })
      .pipe(
        catchError(error => {
          // rethrow to let client handle it
          return throwError(handleError(error));
        })
      );
  }

}
