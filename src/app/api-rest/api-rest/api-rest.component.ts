import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';

import { of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { APIZEE_ACCOUNT } from '../consts';
import { ApirtcRestTokenService } from '../apirtc-rest-token.service';

import { ApirtcRestConferenceService, ConferenceOptionsBuilder } from '../apirtc-rest-conference.service';
import { ApirtcRestMediasService, ApiRTCListResponse } from '../apirtc-rest-medias.service';

@Component({
  selector: 'app-api-rest',
  templateUrl: './api-rest.component.html',
  styleUrls: ['./api-rest.component.css']
})
export class ApiRestComponent implements OnInit, AfterViewInit, OnDestroy {

  formGroup = this.fb.group({
    participants: this.fb.array([
      this.fb.control('', [Validators.required, Validators.email])
    ]),
    password: this.fb.control(1234, [Validators.required]),
    audioMute: this.fb.control(false)
  });

  access_token: string;

  createConferenceResponse: any;

  listConferencesResponse: any;
  listConferencesError: any;

  deleteConferenceResponse: any;

  mediasColumnsToDisplay = ['id', 'created', 'url'];
  mediasLength: number;
  medias: any[] = [];
  mediasPageSize = 10;

  listMediasResponse: any;
  deleteMediaResponse: any;
  @ViewChild(MatPaginator) mediasPaginator: MatPaginator;

  constructor(public apirtcRestTokenService: ApirtcRestTokenService,
    public apirtcRestConferenceService: ApirtcRestConferenceService,
    public apirtcRestMediasService: ApirtcRestMediasService,
    private fb: FormBuilder) {
  }

  ngOnInit(): void {

  }

  isLoadingResults = false;

  ngAfterViewInit() {
    this.apirtcRestTokenService.createToken(APIZEE_ACCOUNT.username, APIZEE_ACCOUNT.password)
      .subscribe(
        json => {
          //this.apirtcRestTokenService.setCachedToken(json.access_token);
          this.access_token = json.access_token;
          this.listConferences();
          this.doSetupMedias();
        },
        error => {
          console.error('ApiRestComponent::ngOnInit|createToken', error);
        });
  }

  doSetupMedias() {
    this.mediasPaginator.page.pipe(
      startWith({}),
      switchMap(() => {
        this.isLoadingResults = true;
        const offset = this.mediasPaginator.pageIndex * this.mediasPageSize;
        return this.apirtcRestMediasService.listMedias(this.access_token, offset).pipe(catchError(() => of(null)));
      }),
      map((response: ApiRTCListResponse) => {
        // Flip flag to show that loading has finished.
        this.isLoadingResults = false;
        if (response === null) {
          return [];
        }
        this.mediasLength = response.total;
        return response.data;
      })
    ).subscribe(list => this.medias = list);
  }

  ngOnDestroy(): void {
    // cleanup
    this.apirtcRestTokenService.deleteToken(this.access_token).subscribe(json => {
      console.info('ApiRestComponent::ngOnDestroy|deleteToken', json);
    }, error => {
      console.error('ApiRestComponent::ngOnDestroy|deleteToken', error);
    });
  }

  get participants() {
    return this.formGroup.get('participants') as FormArray;
  }
  get password() {
    return this.formGroup.get('password') as FormControl;
  }
  get audioMute() {
    return this.formGroup.get('audioMute') as FormControl;
  }

  getEmailErrorMessage(fc: FormControl) {
    if (fc.hasError('required')) {
      return 'You must enter a value';
    }
    return fc.hasError('email') ? 'Not a valid email' : '';
  }

  getPasswordErrorMessage(fc: FormControl) {
    if (fc.hasError('required')) {
      return 'You must enter a value';
    }
    return '';
  }

  addParticipant(): void {
    this.participants.push(new FormControl('', [Validators.required, Validators.email]));
  }

  removeParticipant(index: number): void {
    // always keep at least one
    if (index > -1 && this.participants.length > 1) {
      this.participants.removeAt(index);
    }
  }

  onSubmit(): void {
    this.apirtcRestConferenceService.createConference(this.access_token,
      new ConferenceOptionsBuilder(this.participants.controls.map(fc => fc.value))
        .withPassword(this.password.value)
        .muteAudio(this.audioMute.value)
        .build())
      .subscribe(json => {
        this.createConferenceResponse = json;
        console.info('ApiRestComponent::onSubmit|createConference', json);
      }, error => {
        console.error('ApiRestComponent::onSubmit|createConference', error);
      });
  }

  listConferences(): void {
    this.apirtcRestConferenceService.listConferences(this.access_token)
      .subscribe(json => {
        this.listConferencesResponse = json;
        console.info('ApiRestComponent::listConferences|listConferences', json);
      }, error => {
        this.listConferencesError = error;
        console.error('ApiRestComponent::listConferences|listConferences', error);
      });
  }

  deleteConference(id: string): void {
    this.apirtcRestConferenceService.deleteConference(this.access_token, id)
      .subscribe(json => {
        this.deleteConferenceResponse = json;
        console.info('ApiRestComponent::deleteConference|deleteConference', json);
      }, error => {
        console.error('ApiRestComponent::deleteConference|deleteConference', error);
      });
  }

  listMedias(): void {
    this.apirtcRestMediasService.listMedias(this.access_token)
      .subscribe(list => {
        this.listMediasResponse = list;
        this.mediasLength = list.total;
        console.info('ApiRestComponent::listMedias|listMedias', list);
      }, error => {
        console.error('ApiRestComponent::listMedias|listMedias', error);
      });
  }

  deleteMedia(id: string): void {
    this.apirtcRestMediasService.deleteMedia(this.access_token, id)
      .subscribe(json => {
        this.deleteMediaResponse = json;
        console.info('ApiRestComponent::deleteMedia|deleteMedia', json);
      }, error => {
        console.error('ApiRestComponent::deleteMedia|deleteMedia', error);
      });
  }

}
