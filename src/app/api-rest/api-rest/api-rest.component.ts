import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';

import { of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { ApirtcRestTokenService } from '../apirtc-rest-token.service';

import { ApirtcRestConferenceService, ConferenceOptionsBuilder } from '../apirtc-rest-conference.service';
import { ApirtcRestMediasService } from '../apirtc-rest-medias.service';
import { ApirtcRestEnterprisesService, EnterpriseOptionsBuilder } from '../apirtc-rest-enterprises.service';
import { ApirtcRestConversationsService } from '../apirtc-rest-conversations.service';

import { ApiRTCListResponse } from '../api-rest.module';


// const USER_ACCOUNT = {
//   //userId: 7613,
//   username: 'kmoyse',
//   password: '@pi21Zee',
//   //apiKey: "e17da9125276f8e8ad4e91222bbd5a36"
// }

//a sub enterprise user (non inherit) :
// const USER_ACCOUNT = {
//   username: 'kevin-moyse@apizee.com',
//   password: '@pi21Zee',
// }

// const USER_ACCOUNT = {
//   username: 'kevin.2@apizee.com',
//   password: '@pi21Zee',
// }

// const USER_ACCOUNT = {
//   username: 'kevin-3@apizee.com',
//   password: '@pi21Zee'
// }

// const USER_ACCOUNT = {
//   username: 'kevin_moyse@yahoo.fr',
//   password: '@pi21Zee'
// }

const USER_ACCOUNT = {
  username: 'kevin.moyse@apizee.com',
  password: '@pi21Zee'
}

//a sub enterprise user (inherit=true) :
// const USER_ACCOUNT = {
//   username: 'kevin.inherit@apizee.com',
//   password: '@pi21Zee',
// }

// on cloud.apizee.com :
//     userId: 19391,
//     username: 'kevin_moyse@yahoo.fr',
//     password: '@pi21Zee',
//     apiKey: "9669e2ae3eb32307853499850770b0c3"

@Component({
  selector: 'app-api-rest',
  templateUrl: './api-rest.component.html',
  styleUrls: ['./api-rest.component.css']
})
export class ApiRestComponent implements OnInit, AfterViewInit, OnDestroy {

  confFormGroup = this.fb.group({
    participants: this.fb.array([
      this.fb.control('', [Validators.required, Validators.email])
    ]),
    password: this.fb.control(1234, [Validators.required]),
    audioMute: this.fb.control(false)
  });

  access_token: string;

  createConferenceResponse: any;
  createConferenceError: any;

  getConferenceResponse: any;
  getConferenceError: any;

  listConferencesResponse: any;
  listConferencesError: any;

  deleteConferenceResponse: any;

  isLoadingMediasResults = false;
  mediasColumnsToDisplay = ['id', 'created', 'url'];
  mediasLength: number;
  medias: any[] = [];
  mediasPageSize = 10;

  deleteMediaResponse: any;

  enterpriseformGroup = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control(null, [Validators.required]),
    name: this.fb.control(null)
  });

  // Enterprises
  get eemail() {
    return this.enterpriseformGroup.get('email') as FormControl;
  }
  get epassword() {
    return this.enterpriseformGroup.get('password') as FormControl;
  }
  get ename() {
    return this.enterpriseformGroup.get('name') as FormControl;
  }

  isLoadingEnterprisesResults = false;
  enterprisesColumnsToDisplay = ['id', 'created', 'name', 'api_key'];
  enterprisesLength: number;
  enterprises: any[] = [];
  enterprisesPageSize = 10;

  isLoadingConversationsResults = false;
  conversationsColumnsToDisplay = ['id', 'created_at'];
  conversationsLength: number;
  conversations: any[] = [];
  conversationsPageSize = 10;

  createEnterpriseResponse: any;
  createEnterpriseError: any;
  deleteEnterpriseResponse: any;

  deleteConversationResponse: any;

  quotaResponse: any;


  enterpriseId: string;

  //@ViewChild(MatPaginator) mediasPaginator: MatPaginator;
  @ViewChild("mediasElt") mediasPaginator: MatPaginator;
  @ViewChild("enterprisesElt") enterprisesPaginator: MatPaginator;
  @ViewChild("conversationsElt") conversationsPaginator: MatPaginator;

  constructor(public apirtcRestTokenService: ApirtcRestTokenService,
    public apirtcRestConferenceService: ApirtcRestConferenceService,
    public apirtcRestMediasService: ApirtcRestMediasService,
    public apirtcRestEnterprisesService: ApirtcRestEnterprisesService,
    public apirtcRestConversationsService: ApirtcRestConversationsService,
    private fb: FormBuilder) {
  }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    this.apirtcRestTokenService.createToken(USER_ACCOUNT.username, USER_ACCOUNT.password)
      .subscribe(
        json => {
          //this.apirtcRestTokenService.setCachedToken(json.access_token);
          this.access_token = json.access_token;
          this.listConferences();
          this.doListMedias();
          this.doListEnterprises();
          this.doQuota();

          //this.doListConversations("3573");
          //code	2
          // message	"You do not have permission to scan conversations."
          // details	""

          this.apirtcRestEnterprisesService.list(this.access_token, 0, 0, 0).subscribe(json => {
            console.log('ApiRestComponent::ngAfterViewInit|get root enterprise', json);
            this.enterpriseId = json.data[0].id;
            this.doListConversations(this.enterpriseId);
          }, error => {
            console.error('ApiRestComponent::ngAfterViewInit|listEnterprises', error);
          });
        },
        error => {
          console.error('ApiRestComponent::ngOnInit|createToken', error);
        });
  }

  doListMedias() {
    this.mediasPaginator.page.pipe(
      startWith({}),
      switchMap(() => {
        this.isLoadingMediasResults = true;
        const offset = this.mediasPaginator.pageIndex * this.mediasPageSize;
        return this.apirtcRestMediasService.list(this.access_token, offset).pipe(catchError(() => of(null)));
      }),
      map((response: ApiRTCListResponse) => {
        // Flip flag to show that loading has finished.
        this.isLoadingMediasResults = false;
        if (response === null) {
          return [];
        }
        this.mediasLength = response.total;
        return response.data;
      })
    ).subscribe(list => {
      console.log('doListMedias', list);
      this.medias = list
    });
  }

  doListConversations(enterpriseId: string) {
    this.conversationsPaginator.page.pipe(
      startWith({}),
      switchMap(() => {
        this.isLoadingConversationsResults = true;
        const offset = this.conversationsPaginator.pageIndex * this.conversationsPageSize;
        return this.apirtcRestEnterprisesService.listConversations(this.access_token, enterpriseId, offset).pipe(catchError(() => of(null)));
      }),
      map((response: ApiRTCListResponse) => {
        // Flip flag to show that loading has finished.
        this.isLoadingConversationsResults = false;
        if (response === null) {
          return [];
        }
        this.conversationsLength = response.total;
        return response.data;
      })
    ).subscribe(list => {
      console.log('doListConversations', list);
      this.conversations = list;
    });
  }

  doListEnterprises() {
    this.enterprisesPaginator.page.pipe(
      startWith({}),
      switchMap(() => {
        this.isLoadingEnterprisesResults = true;
        const offset = this.enterprisesPaginator.pageIndex * this.enterprisesPageSize;
        return this.apirtcRestEnterprisesService.list(this.access_token, offset).pipe(catchError(() => of(null)));
      }),
      map((response: ApiRTCListResponse) => {
        // Flip flag to show that loading has finished.
        this.isLoadingEnterprisesResults = false;
        if (response === null) {
          return [];
        }
        this.enterprisesLength = response.total;
        return response.data;
      })
    ).subscribe(list => {
      console.log('doListEnterprises', list);
      this.enterprises = list;
    });
  }

  doQuota() {
    this.apirtcRestEnterprisesService.quota(this.access_token).subscribe(json => {
      this.quotaResponse = json;
    }, error => {
      console.error('ApiRestComponent::doQuota|quota', error);
    });
  }

  listConversations(enterpriseId: string) {
    this.apirtcRestEnterprisesService.listConversations(this.access_token, enterpriseId).subscribe(json => {
      console.log('ApiRestComponent::listConversations|listConversations', json);
    }, error => {
      console.error('ApiRestComponent::listConversations|listConversations', error);
    });
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
    return this.confFormGroup.get('participants') as FormArray;
  }
  get password() {
    return this.confFormGroup.get('password') as FormControl;
  }
  get audioMute() {
    return this.confFormGroup.get('audioMute') as FormControl;
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

  createConference(): void {
    this.apirtcRestConferenceService.createConference(this.access_token,
      new ConferenceOptionsBuilder(this.participants.controls.map(fc => fc.value))
        .withPassword(this.password.value)
        .muteAudio(this.audioMute.value).withScope("sso")
        .build())
      .subscribe(json => {
        this.createConferenceResponse = json;
        console.info('ApiRestComponent::onSubmit|createConference', json);
      }, error => {
        console.error('ApiRestComponent::onSubmit|createConference', error);
        this.createConferenceError = error;
      });
  }


  getConference(conferenceId: string): void {
    this.apirtcRestConferenceService.getConference(this.access_token, conferenceId, "sso")
      .subscribe(json => {
        this.getConferenceResponse = json;
        console.info('getConference', json);
      }, error => {
        console.error('getConference', error);
        this.getConferenceError = error;
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

  deleteConversation(id: string): void {
    // TODO : DELETE /conversations not implemented in ApiRTC ?
    // this.apirtcRestConversationsService.delete(this.access_token, id)
    //   .subscribe(json => {
    //     this.deleteConversationResponse = json;
    //     console.info('ApiRestComponent::deleteConversation|delete', json);
    //   }, (error: any) => {
    //     console.error('ApiRestComponent::deleteConversation|delete', error);
    //   });
  }

  listMessages(conversationId: string): void {
    this.apirtcRestConversationsService.listMessages(this.access_token, conversationId)
      .subscribe(json => {
        this.deleteConversationResponse = json;
        console.info('ApiRestComponent::listMessages|listMessages', json);
      }, (error: any) => {
        console.error('ApiRestComponent::listMessages|listMessages', error);
      });
  }

  // listMedias(): void {
  //   this.apirtcRestMediasService.listMedias(this.access_token)
  //     .subscribe(list => {
  //       this.listMediasResponse = list;
  //       this.mediasLength = list.total;
  //       console.info('ApiRestComponent::listMedias|listMedias', list);
  //     }, error => {
  //       console.error('ApiRestComponent::listMedias|listMedias', error);
  //     });
  // }

  deleteMedia(id: string): void {
    this.apirtcRestMediasService.delete(this.access_token, id)
      .subscribe(json => {
        this.deleteMediaResponse = json;
        console.info('ApiRestComponent::deleteMedia|deleteMedia', json);
      }, error => {
        console.error('ApiRestComponent::deleteMedia|deleteMedia', error);
      });
  }

  createEnterprise(): void {
    const ob = new EnterpriseOptionsBuilder(this.eemail.value, this.epassword.value);
    if (this.ename.value) {
      ob.named(this.ename.value);
    }
    ob.inherits(true);
    this.apirtcRestEnterprisesService.create(this.access_token, ob.build())
      .subscribe(json => {
        this.createEnterpriseResponse = json;
        console.info('ApiRestComponent::createEnterprise|create', json);
      }, error => {
        console.error('ApiRestComponent::createEnterprise|create', error);
        this.createEnterpriseError = error;
      });
  }

  deleteEnterprise(id: string): void {
    this.apirtcRestEnterprisesService.delete(this.access_token, id)
      .subscribe(json => {
        this.deleteEnterpriseResponse = json;
        console.info('ApiRestComponent::deleteEnterprise|delete', json);
      }, error => {
        console.error('ApiRestComponent::deleteEnterprise|delete', error);
      });
  }

}
