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
export class ApirtcRestConversationsService {
  apiUrl: string;
  baseUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = `${APIRTC_CLOUD.host}/api`;
    this.baseUrl = `${this.apiUrl}/conversations`;
  }

  public listMessages(access_token: string, id: string, offset?: number): Observable<ApiRTCListResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    var url = this.baseUrl + '/' + id + '/messages' + '?' + 'offset=' + (offset || 0);

    return this.http.get<ApiRTCListResponse>(encodeURI(url), { headers: headers }).pipe(
      catchError(error => {
        // rethrow to let client handle it
        return throwError(handleError(error));
      })
    );
  }

  // public delete(access_token: string, id: string) {
  //   const headers = new HttpHeaders({
  //     'Content-Type': 'application/json;charset=UTF-8',
  //     'Authorization': `Bearer ${access_token}`
  //   });

  //   return this.http.delete(encodeURI(url), { headers: headers }).pipe(
  //     catchError(error => {
  //       // rethrow to let client handle it
  //       return throwError(handleError(error));
  //     })
  //   );
  // }
}
