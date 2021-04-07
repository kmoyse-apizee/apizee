import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';

import { ApirtcRestTokenService } from '../apirtc-rest-token.service';

import { APIZEE_ACCOUNT } from '../../consts';

import { ApirtcRestConferenceService, ConferenceOptionsBuilder } from '../apirtc-rest-conference.service';

@Component({
  selector: 'app-api-rest',
  templateUrl: './api-rest.component.html',
  styleUrls: ['./api-rest.component.css']
})
export class ApiRestComponent implements OnInit, OnDestroy {

  formGroup = this.fb.group({
    participants: this.fb.array([
      this.fb.control('', [Validators.required, Validators.email])
    ]),
    password: this.fb.control(1234, [Validators.required]),
    audioMute: this.fb.control(false)
  });

  access_token:string;

  response: Object;

  constructor(public apirtcRestTokenService: ApirtcRestTokenService,
    public apirtcRestConferenceService: ApirtcRestConferenceService,
    private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.apirtcRestTokenService.createToken(APIZEE_ACCOUNT.username, APIZEE_ACCOUNT.password)
      .subscribe(
        json => {
          //this.apirtcRestTokenService.setCachedToken(json.access_token);
          this.access_token = json.access_token;
        },
        error => {
          console.error('ApiRestComponent::ngOnInit|' + JSON.stringify(error));
        });
  }

  ngOnDestroy(): void {
    // cleanup
    this.apirtcRestTokenService.deleteToken(this.access_token).subscribe(json => {
      this.response = json;
      console.info('ApiRestComponent::ngOnDestroy|' + JSON.stringify(json));
    }, error => {
      console.error('ApiRestComponent::ngOnDestroy|' + JSON.stringify(error));
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

    this.apirtcRestConferenceService.createConference(
      this.access_token,
      new ConferenceOptionsBuilder(this.participants.controls.map(fc => fc.value)).withPassword(this.password.value).muteAudio(this.audioMute.value).build())
      .subscribe(json => {
        this.response = json;
        console.info('ApiRestComponent::createConference|' + JSON.stringify(json));
      }, error => {
        console.error('ApiRestComponent::createConference|' + JSON.stringify(error));
      });

  }

  listConferences(): void {
    this.apirtcRestConferenceService.listConferences(this.access_token);

  }

}