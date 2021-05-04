import { ThrowStmt } from '@angular/compiler';
import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";

import { WINDOW } from '../../windows-provider';

import { AuthServerService } from '../auth-server.service';

import { ContactDecorator, MessageDecorator, StreamDecorator, RecordingInfoDecorator } from '../model/model.module';

import { StreamSubscribeEvent, BackgroundImageEvent } from '../stream/stream.component';

declare var apiRTC: any;

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css']
})
export class ConversationComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild("fileVideo") fileVideoRef: ElementRef;

  // FormControl/Group objects
  //
  // TODO : do not provide a default apiKey
  apiKeyFc: FormControl = new FormControl('9669e2ae3eb32307853499850770b0c3');

  usernameFc: FormControl = new FormControl({ value: '', disabled: true });

  conversationFormGroup = this.fb.group({
    name: this.fb.control('', [Validators.required])
  });

  messageFormGroup = this.fb.group({
    message: this.fb.control('', [Validators.required])
  });
  fileFormGroup = this.fb.group({
    file: this.fb.control('', [Validators.required])
  });
  videoFileFormGroup = this.fb.group({
    file: this.fb.control('', [Validators.required])
  });

  // Simple Array of messages received on the conversation
  messages: Array<MessageDecorator> = [];

  // Conversation urls
  //
  conversationBaseUrl: string;
  conversationUrl: string;
  conversationUrlWithApiKey: string;

  // apiRTC objects
  userAgent: any;
  session: any = null;
  conversation: any = null;

  // Local user credentials
  credentials: any = null;

  // Local Streams
  localStreamHolder: StreamDecorator;
  screenSharingStreamHolder: StreamDecorator = null;
  videoStreamHolder: StreamDecorator = null;

  // Template helper attributes
  recording = false;
  recordingError = null;

  registerInPrgs = false;
  registrationError: any = null;

  joinInPrgs = false;
  joinError: any = null;
  joined = false;

  publishInPrgs = false;

  // Peer Contacts
  // Keep here only contacts that joined the conversation
  contactHoldersById: Map<string, ContactDecorator> = new Map();

  // Peer Streams
  streamHoldersById: Map<string, StreamDecorator> = new Map();

  // Recorded Media
  recordingsByMediaId: Map<string, any> = new Map();

  // Authentication Token (JSON or other)
  token: string;

  // Devices handling
  audioInDevices: Array<any>;
  videoDevices: Array<any>;
  // TODO : implement out devices selection
  audioOutDevices: Array<any>;

  selectedAudioInDevice = null;
  selectedVideoDevice = null;

  currentBackground: string | BackgroundImageEvent = 'none';

  // Convenient FormControl getters
  //
  get conversationNameFc() {
    return this.conversationFormGroup.get('name') as FormControl;
  }

  get messageFc() {
    return this.messageFormGroup.get('message') as FormControl;
  }

  constructor(@Inject(WINDOW) public window: Window,
    private activatedRoute: ActivatedRoute,
    private authServerService: AuthServerService,
    private fb: FormBuilder) {

    console.log("window.location", window.location);
  }

  // Note : beforeUnloadHandler alone does not work on android Chrome
  // seems it requires unloadHandler to do the same to work evrywhere...
  // https://stackoverflow.com/questions/35779372/window-onbeforeunload-doesnt-trigger-on-android-chrome-alt-solution
  //
  @HostListener('window:unload', ['$event'])
  unloadHandler(event) {
    console.log("unloadHandler");
    this.doDestroy();
  }

  // Use BEFORE unload to hangup (works for Firefox at least)
  // This is usefull if user closes the tab, or refreshes the page
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event) {
    console.log("beforeUnloadHandler");
    this.doDestroy();
  }

  buildConversationUrls() {
    this.conversationUrl = `${this.conversationBaseUrl}/${this.conversationNameFc.value}`;
    this.conversationUrlWithApiKey = `${this.conversationBaseUrl}/${this.conversationNameFc.value}?apiKey=${this.apiKeyFc.value}`;
  }

  ngOnInit(): void {
    // Handle conversation name and url from RESTFUL path
    //
    const conversationName = this.activatedRoute.snapshot.paramMap.get("name");
    if (conversationName) {
      this.conversationNameFc.setValue(conversationName);
      // Recreate remove conversationName from current location url :
      // use pathname that looks like "/path/to/conversationName"
      const path = `${this.window.location.pathname}`.split('/');
      // remove last element which is the conversationName
      path.pop();
      // and recreate base url
      this.conversationBaseUrl = `${this.window.location.origin}` + path.join('/');
    } else {
      // When no conversationName is provided then location.href is the expected url
      // Note : This is important to NOT try using this.convBaseUrl = `${this.window.location.protocol}//${this.window.location.host}/conversation`;
      // because 1. route can change and 2. this does not work if application is hosted under a path
      this.conversationBaseUrl = `${this.window.location.href}`;
    }

    this.buildConversationUrls();

    // Handle conversation url when its inputs change
    //
    this.conversationNameFc.valueChanges.subscribe(value => {
      this.buildConversationUrls();
    });
    this.apiKeyFc.valueChanges.subscribe(value => {
      this.buildConversationUrls();
    });

    // Handle apiKey, if provided as query parameter
    //
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['apiKey']) {
        this.apiKeyFc.setValue(params['apiKey']);
      }
    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy(): void {
    this.doDestroy();
  }

  private doDestroy(): void {
    if (this.localStreamHolder) {
      if (this.localStreamHolder.isPublished()) {
        this.unpublishStream();
      }
      this.releaseStream();
    }
    if (this.screenSharingStreamHolder) {
      if (this.screenSharingStreamHolder.isPublished()) {
        this.unpublishScreenSharingStream();
      }
      this.releaseScreenSharingStream();
    }
    if (this.videoStreamHolder) {
      if (this.videoStreamHolder.isPublished()) {
        this.unpublishVideoStream();
      }
      this.releaseVideoStream()
    }
    this.destroyConversation();
  }

  /***************************************************************************
    ApiRTC UserAgent
   */

  createUserAgent() {

    this.userAgent = new apiRTC.UserAgent({
      // format is like 'apzKey:9669e2ae3eb32307853499850770b0c3'
      uri: 'apzkey:' + this.apiKeyFc.value
    });

    this.usernameFc.enable();

    // Media device selection handling
    //
    //const mediaDevices = this.userAgent.getUserMediaDevices();
    //console.log(JSON.stringify(mediaDevices));
    // TODO : understand why always empty:
    // displays {"audioinput":{},"audiooutput":{},"videoinput":{}}
    // Seems working only inside on:mediaDeviceChanged block :
    this.userAgent.on("mediaDeviceChanged", updatedContacts => {
      const mediaDevices = this.userAgent.getUserMediaDevices();
      console.log("mediaDeviceChanged", JSON.stringify(mediaDevices));
      this.doUpdateMediaDevices(mediaDevices);
    });

    this.usernameFc.valueChanges.subscribe((selectedValue) => {
      console.log("name valueChanges:", selectedValue);
      this.userAgent.setUsername(selectedValue);
    });
  }

  nullifyUserAgent() {
    this.usernameFc.disable();
    this.userAgent = null;
  }

  /***************************************************************************
    ApiRTC Authentication and registration
  *
  * In order to access 'connected' features of ApiRTC, a session to ApiRTC's servers has to be obtained through register
  */
  register() {
    this.registrationError = null;
    this.registerInPrgs = true;
    this.userAgent.register().then((session: any) => {
      this.session = session;
      console.log("Session:", session);
      this.usernameFc.setValue(this.userAgent.getUsername());
      this.doListenSessionEvents();
      this.registerInPrgs = false;
      this.registrationError = null;
    }).catch(error => {
      console.log("ConversationComponent::register", error);
      this.registerInPrgs = false;
      this.registrationError = error;
    });
  }

  /**
   * This method is called when user decides to use JSON Web Token authentication.
   * A server request is made to an authentication server that has to provide a JSON Web Token.
   * 
   * ApiRTC cloud plateform has to be configured accordingly.
   * 
   * @param credentials 
   */
  registerWithJWTAuth(credentials: any): void {
    this.registrationError = null;
    this.registerInPrgs = true;
    this.credentials = credentials;
    // Authenticate to get a JWT
    this.authServerService.loginJWToken(this.credentials.username, this.credentials.password).subscribe(
      json => {
        this.token = json.token;
        console.log("doJWTAuth, JWT:", json.token);
        this.usernameFc.setValue(this.credentials.username);
        this.doRegisterWithToken();
        this.registerInPrgs = false;
        this.registrationError = null;
      },
      error => {
        console.error('ConversationComponent::doJWTAuth', error);
        this.registerInPrgs = false;
        this.registrationError = error;
      });
  }

  /**
   * This method is called when user decides to a 3rd party authentication server.
   * A server request is made to an authentication server that has to provide an authentication token.
   * 
   * ApiRTC cloud plateform has to be configured accordingly.
   * 
   * @param credentials 
   */
  registerWith3rdPartyAuth(credentials: any): void {
    this.registrationError = null;
    this.registerInPrgs = true;
    this.credentials = credentials;
    // Authenticate to get a token
    this.authServerService.loginToken(this.credentials.username, this.credentials.password).subscribe(
      json => {
        this.token = json.token;
        console.log("do3rdPartyAuth, token:", json.token);
        this.usernameFc.setValue(this.credentials.username);
        this.doRegisterWithToken();
        this.registerInPrgs = false;
        this.registrationError = null;
      },
      error => {
        console.error('ConversationComponent::do3rdPartyAuth', error);
        this.registerInPrgs = false;
        this.registrationError = error;
      });
  }

  /**
   * Registration can be made with authentication token.
   */
  doRegisterWithToken() {
    this.registrationError = null;
    const registerInformation = this.credentials ? {
      id: this.credentials.username,
      token: this.token
    } : {};

    this.userAgent.register(registerInformation).then((session: any) => {
      // TODO : if I don't use same registerInformation.id as the user id (username) that was used to create the token,
      // I get error :
      //[2021-04-08T15:23:30.150Z][ERROR]apiRTC(ApiCC_Channel) Channel error : access token failure: invalid channelId apiRTC-latest.min.js:5:19425
      //[2021-04-08T15:23:30.155Z][ERROR]apiRTC(UserAgent) register() - ApiRTC Initialization error : Channel Error : access token failure: invalid channelId
      // This is misleading as we never heard about a channelId before !
      this.session = session;
      console.log("Session:", session);
      this.doListenSessionEvents();
      this.registrationError = null;
    }).catch(error => {
      console.log("Registration error", error);
      this.registrationError = error;
    });
  }

  unregister() {
    this.userAgent.unregister();
    this.session = null;
    this.token = null;
  }

  // Helper methods
  /*
   * Because apiRTC events of contactJoin may appear AFTER a StreamListChanged with a stream from such contact
  * I need to make sure 
  * Note : how can we make this thread safe ?
  * => a response from stackoverflow seem to indicate there is nothing to worry about
  * Other than HTML5 web workers (which are very tightly controlled and not apparently what you are asking about),
  *  Javascript in the browser is single threaded so regular Javascript programming does not have thread safety issues.
  *  One thread of execution will finish before the next one is started. No two pieces of Javascript are running at exactly the same time.
   */
  getOrCreateContactHolder(contact: any): ContactDecorator {
    const contactId = String(contact.getId());
    if (this.contactHoldersById.has(contactId)) {
      return this.contactHoldersById.get(contactId);
    } else {
      const contactHolder: ContactDecorator = ContactDecorator.build(contact);
      this.contactHoldersById.set(contactHolder.getId(), contactHolder);
      return contactHolder;
    }
  }

  doListenSessionEvents(): void {
    this.session.on('contactListUpdate', updatedContacts => { //display a list of connected users
      console.log("MAIN - contactListUpdate", updatedContacts);
      // TODO: should we also prefer this list update rather than contactJoined/Left to handle list of contacts 
      // like we do for streams with streamListChanged ?
      // if (this.conversation !== null) {
      //   let contactList = this.conversation.getContacts();
      //   console.info("contactList  conversation.getContacts() :", contactList);

      for (var contact of updatedContacts.userDataChanged) {
        const contactId = String(contact.getId());

        //const contactHolder: ContactDecorator = this.contactHoldersById.get(contactId); // Fails because 'contactListUpdate' is also fired first when a new contact comes in the Session
        // so we need to actually create the contact and this very moment...
        //const contactHolder: ContactDecorator = this.getOrCreateContactHolder(contact); // not a good idea finaly : my application only wants to see contacts that joined the conversation
        // if this is a creation then it would not be usefull to update, but we do it in case of it was just a get...
        // TODO: but events should be reworked to avoid that kind of trick
        // Finally, just check if we have created this contact already (because it has joined the conversation) and update it. Otherwise just ignore it
        // TODO : Note that we may consider this as a security hole : all client application get notified of users connected with same apiKey
        // but not necessarily having joined the same conversation...
        const contactHolder: ContactDecorator = this.contactHoldersById.get(contactId);
        if (contactHolder) {
          contactHolder.update(contact);
        }
      }

      // }
    })
  }

  /***************************************************************************
    Handle Media device change
   */

  doUpdateMediaDevices(mediaDevices: any): void {
    // Convert map values to array
    this.audioInDevices = Object.values(mediaDevices.audioinput);
    this.audioOutDevices = Object.values(mediaDevices.audiooutput);
    this.videoDevices = Object.values(mediaDevices.videoinput);
  }

  changeLocalStream(): void {

    if (this.localStreamHolder) {

      const published = this.localStreamHolder.isPublished();

      // first, unpublish and release current local stream
      if (published) {
        this.conversation.unpublish(this.localStreamHolder.getStream());
      }
      this.localStreamHolder.getStream().release();

      // Set localStreamHolder to null in order to destroy the associated component
      this.localStreamHolder = null;

      // get selected devices
      const options = {};
      if (this.selectedAudioInDevice) {
        options['audioInputId'] = this.selectedAudioInDevice.id;
      }
      if (this.selectedVideoDevice) {
        options['videoInputId'] = this.selectedVideoDevice.id;
      }

      if (this.currentBackground instanceof BackgroundImageEvent) {
        options['filters'] = [{ type: 'backgroundSubtraction', options: { backgroundMode: 'image', image: this.currentBackground.imageData } }];
      }
      else {
        switch (this.currentBackground) {
          case 'none':
            break;
          case 'blur':
            console.log('blur selected');
            options['filters'] = [{ type: 'backgroundSubtraction', options: { backgroundMode: 'blur' } }];
            break;
          case 'transparent':
            options['filters'] = [{ type: 'backgroundSubtraction', options: { backgroundMode: 'transparent' } }];
            break;
          //case 'image':
          // TODO request for an image  
          //options['filters'][{ type: 'backgroundSubtraction', options: { backgroundMode: 'image', image: imageData } }];
          //console.log("backgroundMode 'image' not implemented");
          //  break;
          default:
            console.log(`Sorry, not a good filter value`);
        }
      }

      // and recreate a new stream
      this.createStream(options)
        .then((stream) => {
          // if local stream was published consider we should publish changed one
          if (published) {
            this.publishStream();
          }
        })
        .catch(err => { console.error('createStream error', err); });
    }
  }



  /***************************************************************************
    ApiRTC Conversation
   */

  getOrcreateConversation(): void {

    // Create the conversation
    // TODO : the tutorials use getConversation but logs and code actually say it is deprecated
    // in favor to getOrCreateConversation(name, options = {})
    this.conversation = this.session.getOrCreateConversation(this.conversationNameFc.value);
    // TODO il existe aussi getOrCreateConference mais les deux retournent une Conference ou une Conversation en fonction du format du nom..
    // se faire expliquer !

    // Streams
    //
    this.conversation.on('streamListChanged', streamInfo => {
      console.log("streamListChanged :", streamInfo);

      // The streamListChanged event is usefull to maintain a list of streams published on a conversation.
      // The event carries a streamInfo Object, which is not an actual apiRTC.Stream, that provides information
      // on what actually happened (streamInfo.listEventType : added or removed) to which stream (streamInfo.streamId),
      // and who the streams belongs to (streamInfo.contact).

      const streamId = String(streamInfo.streamId);
      const contactId = String(streamInfo.contact.getId());

      if (streamInfo.listEventType === 'added') {
        if (streamInfo.isRemote === true) {
          console.log('adding Stream:', streamId);
          const streamHolder: StreamDecorator = StreamDecorator.build(streamInfo);
          console.log(streamHolder.getId() + "->", streamHolder);
          this.streamHoldersById.set(streamHolder.getId(), streamHolder);
          const contactHolder: ContactDecorator = this.getOrCreateContactHolder(streamInfo.contact);
          console.log("typeof streamInfo.contact.getId()", typeof streamInfo.contact.getId());
          contactHolder.addStream(streamHolder);

          this.conversation.subscribeToStream(streamInfo.streamId)
            .then(stream => {
              console.log('subscribeToStream success:', stream);
              // Cannot do that here, the streamHolder may not yet be in streamHoldersById
              // TODO : this is something we should think about in an api redesign ?
              //const streamHolder:StreamDecorator = this.streamHoldersById[stream.getId()];
              //streamHolder.setSubscribed(true);
            }).catch(err => {
              console.error('subscribeToStream error', err);
            });
        }
      } else if (streamInfo.listEventType === 'removed') {
        if (streamInfo.isRemote === true) {

          console.log('removing Stream:', streamId);
          this.streamHoldersById.delete(streamId);
          const contactHolder = this.contactHoldersById.get(contactId);
          contactHolder.removeStream(streamId);
          // if (contactHolder.getStreamHoldersById().size === 0) {
          //   // Remove contact if it has no more streams
          //   this.contactHoldersById.delete(contactId);
          // }
        }
      }
    });

    this.conversation.on('streamAdded', (stream: any) => {
      console.log('streamAdded, stream:', stream);
      // 'streamAdded' actually means that a stream is published by a peer and thus is ready to be displayed.
      // The event comes with a Stream object that can be attached to DOM
      // TODO : ask to rename this event ?
      //
      // Get our object
      const streamHolder: StreamDecorator = this.streamHoldersById.get(String(stream.getId()));
      streamHolder.setStream(stream);

    }).on('streamRemoved', (stream: any) => {
      console.log('on:streamRemoved:', stream)
      // 'streamRemoved' actually means that a stream is no more readable : either because :
      // - peer left,
      // - or peer decided to unpublish this stream,
      // - or we decided to unsubscribe to this stream. (in which case we won't receive a 'streamListChanged' with listEventType==='removed' event)
      // TODO : rename this event ?
      //
      // Get our object representing to notion of a peer stream and just set its apiRTC stream to null : the
      // component will remove the video tag from the DOM.
      // But we don't remove our object because the associated component may stay there, associated to a contact,
      // with button allowing us to re-subscribe.
      // Our object may only be removed if 'streamListChanged' says it should.
      const streamHolder: StreamDecorator = this.streamHoldersById.get(String(stream.getId()));
      // Warn : our object may already have been removed by 'streamListChanged' handler
      if (streamHolder) {
        streamHolder.setStream(null);
      }

      console.log("getAvailableStreamList:", this.conversation.getAvailableStreamList());
    })

    // Contacts
    //
    this.conversation.on('contactJoined', contact => {
      console.log("on:contactJoined:", contact);
      const contactHolder: ContactDecorator = this.getOrCreateContactHolder(contact);
    }).on('contactLeft', contact => {
      console.log("on:contactLeft:", contact);
      this.contactHoldersById.delete(contact.getId());
    });

    // Messages
    //
    this.conversation.on('message', (message: any) => {
      console.log("on:message:", message);
      this.messages.push(MessageDecorator.buildFromMessage(message));
    });

    // QoS Statistics
    //
    if ((apiRTC.browser === 'Chrome') || (apiRTC.browser === 'Firefox')) {
      // TODO : safari ??
      this.userAgent.enableCallStatsMonitoring(true, { interval: 10000 });
      this.userAgent.enableActiveSpeakerDetecting(true, { threshold: 50 });
    }
    this.conversation.on('callStatsUpdate', (callStats: any) => {
      console.log("on:callStatsUpdate:", callStats);

      // Below line can be wrong because a the callId on a stream can change during Stream lifecycle
      //const streamHolder: StreamDecorator = this.streamsByCallId[callStats.callId];

      // TODO: waiting for a fix in apiRTC (to include streamId in callStats), workround here by using internal map Conversation#callIdToStreamId:
      // FIXTHIS: once apiRTC bug https://apizee.atlassian.net/browse/APIRTC-873 is fixed, we can use callStats.streamId instead of erroneous callStats.callId
      const streamId = String(this.conversation.callIdToStreamId.get(callStats.callId));

      if (callStats.stats.videoReceived || callStats.stats.audioReceived) {
        // "received" media is from peer streams
        const streamHolder: StreamDecorator = this.streamHoldersById.get(streamId);
        streamHolder.setQosStat({
          video: callStats.stats.videoReceived,
          audio: callStats.stats.audioReceived
        });
      }
      else if (callStats.stats.videoSent || callStats.stats.audioSent) {
        // "sent" media is from local stream(s) (to peers)
        if (this.localStreamHolder && streamId === this.localStreamHolder.getId()) {
          console.log("setQosStat on localStreamHolder", streamId);
          this.localStreamHolder.setQosStat({
            video: callStats.stats.videoSent,
            audio: callStats.stats.audioSent
          });
        } else if (this.screenSharingStreamHolder && streamId === this.screenSharingStreamHolder.getId()) {
          console.log("setQosStat on screenSharingStreamHolder", streamId);
          this.screenSharingStreamHolder.setQosStat({
            video: callStats.stats.videoSent,
            audio: callStats.stats.audioSent
          });
        } else if (this.videoStreamHolder && streamId === this.videoStreamHolder.getId()) {
          console.log("setQosStat on videoStreamHolder", streamId);
          this.videoStreamHolder.setQosStat({
            video: callStats.stats.videoSent,
            audio: callStats.stats.audioSent
          });
        } else {
          console.error("No local Stream found for", streamId);
        }
      }
    });

    // Speaker detection
    //
    this.conversation.on('audioAmplitude', (amplitudeInfo: any) => {
      //console.log("on:audioAmplitude", amplitudeInfo);

      if (amplitudeInfo.callId !== null) {
        // TODO :
        // There is a problem here, it seems the amplitudeInfo.callId is actually a streamId
        const streamHolder: StreamDecorator = this.streamHoldersById.get(amplitudeInfo.callId);
        if (!streamHolder) {
          // TODO : is this a bug ? even after having unscribscribed to a stream I still receive audioAmplitude events corresponding to it 
          console.log("UNDEFINED ? amplitudeInfo.callId=" + amplitudeInfo.callId, amplitudeInfo, this.streamHoldersById)
        }
        streamHolder.setSpeaking(amplitudeInfo.descriptor.isSpeaking);
      } else {
        if (this.localStreamHolder) { // I had to add this otherwise it crashed when localStream was released
          this.localStreamHolder.setSpeaking(amplitudeInfo.descriptor.isSpeaking);
        }
      }
    });

    // Recording
    //
    this.conversation.on('recordingAvailable', (recordingInfo: any) => {
      console.log("on:recordingAvailable", recordingInfo);
      this.recordingsByMediaId.set(recordingInfo.mediaId, new RecordingInfoDecorator(recordingInfo, true));
    });


    // File upload
    //

    this.conversation.on('transferBegun', () => {
      this.uploadProgressPercentage = 0;
    });
    this.conversation.on('transferProgress', (progress) => {
      this.uploadProgressPercentage = progress.percentage;
    });
    this.conversation.on('transferEnded', () => {
      this.uploadProgressPercentage = 100;
    });
  }

  uploadProgressPercentage = 0;

  join(): void {
    this.joinError = null;
    this.joinInPrgs = true;
    this.conversation.join()
      .then(response => {
        console.info('Conversation joined', response);
        this.joined = true;
        this.joinInPrgs = false;
      }).catch(err => {
        console.error('Conversation join error', err);
        this.joinInPrgs = false;
        this.joinError = err;
      });
  }

  leave(): void {
    this.joinError = null;
    this.joinInPrgs = true;
    this.conversation.leave()
      .then(() => {
        console.info('Conversation left');
        this.joined = false;
        this.joinInPrgs = false;
        // do not destroy otherwise you cannot join back !
        // this.conversation.destroy();
        // this.conversation = null;
      })
      .catch((err: any) => {
        console.error('Conversation leave error', err);
        this.joinInPrgs = false;
        this.joinError = err;
      });
  }

  toggleRecording() {
    this.recordingError = null;
    this.recording = !this.recording;
    console.log("toggleRecord", this.recording);
    if (this.recording) {
      this.conversation.startRecording()
        .then((recordingInfo: any) => {
          console.info('startRecording', recordingInfo);

        })
        .catch((err: any) => {
          console.error('startRecording', err);
          console.error('startRecording', JSON.stringify({ message: err.error.message }));
          this.recordingError = err;
          this.recording = false;
        });
    }
    else {
      this.conversation.stopRecording()
        .then((recordingInfo: any) => {
          console.info('stopRecording', recordingInfo);
          this.recordingsByMediaId.set(recordingInfo.mediaId, new RecordingInfoDecorator(recordingInfo, false));
        })
        .catch((err: any) => {
          console.error('stopRecording', err);
          this.recordingError = err;
        });
    }
  }

  destroyConversation(): void {
    console.info('Destroy conversation');
    if (this.conversation) {
      if (this.joined) {
        this.conversation.leave()
          .then(() => {
            this.joined = false;
            this.conversation.destroy();
            this.conversation = null;
          })
          .catch(err => { console.error('Conversation leave error', err); });
      }
      else {
        this.conversation.destroy();
        this.conversation = null;
      }
    }
  }

  /***************************************************************************
    Send Messages
   */

  sendMessage() {
    const message = this.messageFc.value;
    this.messageFc.setValue('');
    this.doSendMessage(message);

  }

  doSendMessage(message: string) {
    this.conversation.sendMessage(message).then((uuid) => {
      console.log("sendMessage", uuid, message);
      this.messages.push(MessageDecorator.build(this.userAgent.getUsername(), message));
    })
      .catch(err => { console.error('sendMessage error', err); });
  }

  /***************************************************************************
    Send Files
   */
  selectedFile: File;
  selectFile(event: any): void {
    const file: File | null = event.target.files.item(0);
    this.selectedFile = file;
  }

  sendFile(): void {
    this.conversation.pushData({ 'file': this.selectedFile })
      .then((cloudMediaInfo: any) => {
        console.log('File uploaded :', cloudMediaInfo);
        // Send file link message to the chat
        this.doSendMessage('New file uploaded: <a href="' + cloudMediaInfo.url + '" target="_blank"><b>OPEN FILE</b></a>');
      })
      .catch((err) => {
        console.log('File uploading error :', err);
      });
  }

  /***************************************************************************
    ApiRTC Streams
   */

  // if options are specified, this is because a specific device was selected
  createStream(options?: any): Promise<Object> {
    console.log("createStream()", options);
    return new Promise((resolve, reject) => {

      //var default_createStreamOptions: any = { enhancedAudioActivated: true }; // => FAILS on chrome
      var default_createStreamOptions: any = {};
      default_createStreamOptions.constraints = {
        audio: true,
        video: true,
      };

      this.userAgent.createStream(options ? options : default_createStreamOptions)
        .then(stream => {
          console.log('createStream :', stream);

          // build fake streamInfo object to build a local stream.
          // TODO : enhance this in apiRTC
          const streamInfo = { streamId: String(stream.getId()), isRemote: false, type: 'regular' };
          this.localStreamHolder = StreamDecorator.build(streamInfo);
          this.localStreamHolder.setStream(stream);

          resolve(stream);
        }).catch(err => {
          console.error('createStream error', err);
          reject(err);
        });
    });
  }

  toggleAudioMute() {
    if (this.localStreamHolder.getStream().isAudioMuted()) {
      this.localStreamHolder.getStream().unmuteAudio();
    }
    else { this.localStreamHolder.getStream().muteAudio(); }
  }

  toggleVideoMute() {
    if (this.localStreamHolder.getStream().isVideoMuted()) {
      this.localStreamHolder.getStream().unmuteVideo();
    }
    else { this.localStreamHolder.getStream().muteVideo(); }
  }

  subscribeOrUnsubscribeToStream(event: StreamSubscribeEvent) {
    console.log("subscribeOrUnsubscribeToStream", event);
    if (event.doSubscribe) {
      this.conversation.subscribeToStream(event.streamHolder.getId()).then((stream: any) => {
        console.log('onStreamSubscribe success:', stream);
      }).catch(err => {
        console.error('onStreamSubscribe error', err);
      });
    } else {
      this.conversation.unsubscribeToStream(event.streamHolder.getId());
    }
  }

  releaseStream() {
    this.localStreamHolder.getStream().release();
    this.localStreamHolder = null;
  }

  publishStream(): void {
    const stream = this.localStreamHolder.getStream();
    console.log("publishStream()", stream);

    // Publish your own stream to the conversation
    this.publishInPrgs = true;
    this.conversation.publish(stream).then((stream: any) => {
      this.localStreamHolder.setPublished(true);
      this.publishInPrgs = false;
    }).catch(err => {
      console.error('publish error', err);
      this.publishInPrgs = false;
    });
  }

  unpublishStream(): void {
    const stream = this.localStreamHolder.getStream();
    console.log("unpublishStream()", stream);
    this.conversation.unpublish(this.localStreamHolder.getStream());
    this.localStreamHolder.setPublished(false);
  }

  toggleScreenSharing(): void {

    if (this.screenSharingStreamHolder === null) {

      const displayMediaStreamConstraints = {
        video: {
          cursor: "always"
        },
        // TODO : is audio relevant here ?
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      apiRTC.Stream.createDisplayMediaStream(displayMediaStreamConstraints, false)
        .then((stream: any) => {
          stream.on('stopped', () => {
            // Used to detect when user stop the screenSharing with Chrome DesktopCapture UI
            console.log("screenSharingStream on:stopped");
            if (this.screenSharingStreamHolder.isPublished()) {
              this.unpublishScreenSharingStream();
            }
            this.releaseScreenSharingStream();
          });

          // build fake streamInfo object to build a local stream.
          // TODO : enhance this in apiRTC
          const streamInfo = { streamId: String(stream.getId()), isRemote: false, type: 'regular' };
          this.screenSharingStreamHolder = StreamDecorator.build(streamInfo);
          this.screenSharingStreamHolder.setStream(stream);
          // and publish it
          console.log("publish", stream);
          this.conversation.publish(this.screenSharingStreamHolder.getStream()).then((stream: any) => {
            this.screenSharingStreamHolder.setPublished(true);
          }).catch(err => {
            console.error('toggleScreenSharing()::publish', err);
          });
        })
        .catch(function (err) {
          console.error('Could not create screensharing stream :', err);
        });
    } else {
      this.unpublishScreenSharingStream();
      this.releaseScreenSharingStream();
    }
  }

  unpublishScreenSharingStream() {
    this.conversation.unpublish(this.screenSharingStreamHolder.getStream());
    this.screenSharingStreamHolder.setPublished(false);
  }

  releaseScreenSharingStream() {
    this.screenSharingStreamHolder.getStream().release();
    this.screenSharingStreamHolder = null;
  }

  /***************************************************************************
  Create video Stream from file
 */

  createVideoStream(event: any) {
    // To create a MediaStream from a video file, go through a 'video' DOM element
    //

    // Get file the user selected
    const file: File | null = event.target.files.item(0);

    // Prepare the 'loadeddata' event that will actually create Stream instance
    const videoElement = this.fileVideoRef.nativeElement;
    videoElement.onloadeddata = () => {
      // Note that video handling should be applied after data loaded
      const mediaStream = (apiRTC.browser === 'Firefox') ? videoElement.mozCaptureStream() : videoElement.captureStream();
      apiRTC.Stream.createStreamFromMediaStream(mediaStream)
        .then((stream: any) => {
          const streamInfo = { streamId: String(stream.getId()), isRemote: false, type: 'regular' };
          this.videoStreamHolder = StreamDecorator.build(streamInfo);
          this.videoStreamHolder.setStream(stream);
          console.info('createVideoStream()::createStreamFromMediaStream', stream);
        })
        .catch((err) => {
          console.error('createVideoStream()::createStreamFromMediaStream', err);
        });
      // free memory
      URL.revokeObjectURL(videoElement.src);
    };

    // Read from file to 'video' DOM element
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const buffer: ArrayBuffer = e.target.result as ArrayBuffer;
      const videoBlob = new Blob([new Uint8Array(buffer)], { type: 'video/mp4' });
      const url = window.URL.createObjectURL(videoBlob);
      videoElement.src = url;
    };
    reader.readAsArrayBuffer(file);
  }

  togglePublishVideoStream() {
    console.info('togglePublishVideoStream()', this.videoStreamHolder);
    if (this.videoStreamHolder.isPublished()) {
      this.unpublishVideoStream();
    } else {
      this.conversation.publish(this.videoStreamHolder.getStream()).then((stream: any) => {
        this.videoStreamHolder.setPublished(true);
      }).catch(err => {
        console.error('togglePublishVideoStream()::publish', err);
      });
    }
  }

  unpublishVideoStream() {
    this.conversation.unpublish(this.videoStreamHolder.getStream());
    this.videoStreamHolder.setPublished(false);
  }

  releaseVideoStream() {
    this.videoStreamHolder.getStream().release();
    this.videoStreamHolder = null;
  }

}