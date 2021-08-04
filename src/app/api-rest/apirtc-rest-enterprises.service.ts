import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { handleError } from '../misc';

import { APIRTC_CLOUD } from './consts';

import { ApiRTCListResponse } from './api-rest.module';

export class EnterpriseOptions {

  constructor(
    public email: string,
    public password: string,
    public first_name: string,
    public last_name: string,
    public domain: string,
    public name: string,
    public inherit: string,
    public type: string,
    public timezone: string
  ) {
  }
}

export class EnterpriseOptionsBuilder {

  private first_name: string;
  private last_name: string;
  private domain: string;
  private name: string;
  private inherit: string;
  private type: string;
  private timezone: string;

  constructor(private email: string,
    private password: string) {
  }

  public named(name: string): EnterpriseOptionsBuilder {
    this.name = name;
    return this;
  }

  public inherits(inherit: boolean): EnterpriseOptionsBuilder {
    this.inherit = inherit ? 'true' : 'false';
    return this;
  }

  // TODO
  // write all methods

  public build(): EnterpriseOptions {
    return new EnterpriseOptions(this.email, this.password,
      this.first_name, this.last_name, this.domain,
      this.name, this.inherit, this.type, this.timezone)
  }

}

@Injectable({
  providedIn: 'root'
})
export class ApirtcRestEnterprisesService {

  apiUrl: string;
  baseUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = `${APIRTC_CLOUD.host}/api`;
    this.baseUrl = `${this.apiUrl}/enterprises`;
  }

  public list(access_token: string, offset?: number, min_depth?: number, max_depth?: number): Observable<ApiRTCListResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    var url = this.baseUrl + '?' + 'offset=' + (offset || 0);
    if (min_depth !== undefined) {
      url += '&min_depth=' + min_depth;
    }
    if (max_depth !== undefined) {
      url += '&max_depth=' + max_depth;
    }

    return this.http.get<ApiRTCListResponse>(encodeURI(url), { headers: headers }).pipe(
      catchError(error => {
        // rethrow to let client handle it
        return throwError(handleError(error));
      })
    );
  }

  public listConversations(access_token: string, enterpriseId: string, offset?: number, limit?: number): Observable<ApiRTCListResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<ApiRTCListResponse>(encodeURI(this.baseUrl + '/' + enterpriseId + '/conversations' + '?' + 'offset=' + (offset || 0) + '&limit=' + (limit || 20)), { headers: headers }).pipe(
      catchError(error => {
        // rethrow to let client handle it
        return throwError(handleError(error));
      })
    );
  }

  public create(access_token: string, options: EnterpriseOptions) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    return this.http
      .post(encodeURI(this.baseUrl + '?' +
        `email=` + options.email +
        `&password=` + options.password +
        (options.first_name ? `&first_name=` + options.first_name : '') +
        (options.last_name ? `&last_name=` + options.last_name : '') +
        (options.domain ? `&domain=` + options.domain : '') +
        (options.name ? `&name=` + options.name : '') +
        (options.inherit ? `&inherit=` + options.inherit : '') +
        (options.type ? `&type=` + options.type : '') +
        (options.timezone ? `&timezone=` + options.timezone : '')
      ), {}, { headers: headers })
      .pipe(
        catchError(error => {
          // rethrow to let client handle it
          return throwError(handleError(error));
        })
      );
  }

  public quota(access_token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `Bearer ${access_token}`
    });

    const url = `${APIRTC_CLOUD.host}/api/quota`;

    return this.http.get<any>(encodeURI(url), { headers: headers }).pipe(
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

    //this.baseUrl + '/' + id // Does not work
    //this.baseUrl + '?enterpriseId=' + id => Does not work either
    const url = `${APIRTC_CLOUD.host}/api/deleteEnterprise?enterpriseId=${id}`; // working
    // TODO : make this API corrected !!

    return this.http.delete(encodeURI(url), { headers: headers }).pipe(
      catchError(error => {
        // rethrow to let client handle it
        return throwError(handleError(error));
      })
    );
  }
}
