import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, } from '@angular/common/http';

import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { handleError } from '../misc';

import { APIRTC_CLOUD } from './consts';

import { ApiRTCListResponse } from './api-rest.module';


// export interface Media {
//   id: string;
//   total_count: number;
// }

@Injectable({
  providedIn: 'root'
})
export class ApirtcRestMediasService {
  apiUrl: string;
  baseUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = `${APIRTC_CLOUD.host}/api`;
    this.baseUrl = `${this.apiUrl}/media`;
  }

  public list(access_token: string, offset?: number): Observable<ApiRTCListResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    // la requete de bas telle que contruite par le swagger :
    //?status=completed&limit=10&orderby=date&order=desc
    // FIXTHIS :: had to force '?user=all' to get some medias
    // 
    return this.http.get<ApiRTCListResponse>(encodeURI(this.baseUrl + '?user=all' + '&offset=' + (offset || 0)), { headers: headers }).pipe(
      catchError(error => {
        // rethrow to let client handle it
        return throwError(handleError(error));
      })
    );
  }

  public delete(access_token: string, id: string) {
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
