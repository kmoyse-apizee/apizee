import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";

import { WINDOW } from '../../windows-provider';

import { AuthServerService } from '../auth-server.service';

import { ContactDecorator, MessageDecorator, StreamDecorator } from '../model/model.module';

import { PeerSubscribeEvent } from '../peer/peer.component';

declare var apiRTC: any;

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css']
})
export class ConversationComponent implements OnInit, AfterViewInit, OnDestroy {

  apiKeyFc: FormControl;

  usernameFc = new FormControl('');

  convName: string = null;
  convBaseUrl: string;

  joined = false;
  screenSharingStream = null;

  conversationFormGroup = this.fb.group({
    convName: this.fb.control('', [Validators.required])
  });

  messageFormGroup = this.fb.group({
    message: this.fb.control('', [Validators.required])
  });

  // Simple Array of messages received on the conversation
  messages: Array<MessageDecorator> = [];

  registrationError: any = null;

  // apiRTC objects
  userAgent: any;
  session: any = null;
  conversation: any = null;

  // Local user credentials
  credentials: any = null;

  // Local Stream
  localStreamHolder: StreamDecorator;
  published = false;
  publishInPrgs = false;

  // Peer Contacts
  contactsById: Map<string, ContactDecorator> = new Map();

  // Peer Streams
  streamHoldersById: Map<string, StreamDecorator> = new Map();

  // Audio/Video Muting
  muteAudioFc = new FormControl(false);
  muteVideoFc = new FormControl(false);

  // Devices handling
  audioInDevices: Array<any>;
  audioInFc = new FormControl('');
  selectedAudioInDevice = null;

  // TODO : implement out devices selection
  audioOutDevices: Array<any>;

  videoDevices: Array<any>;
  videoFc = new FormControl('');
  selectedVideoDevice = null;

  // JSON Web Token
  token: string;

  get convNameFc() {
    return this.conversationFormGroup.get('convName') as FormControl;
  }

  get messageFc() {
    return this.messageFormGroup.get('message') as FormControl;
  }


  get convUrl(): string {
    return `${this.convBaseUrl}/${this.convNameFc.value}`;
  }

  get convUrlWithApiKey(): string {
    return `${this.convBaseUrl}/${this.convNameFc.value}?apiKey=${this.apiKeyFc.value}`;
  }

  @ViewChild("localVideo") localVideoRef: ElementRef;
  @ViewChild("screenSharingVideo") screenSharingVideoRef: ElementRef;

  constructor(@Inject(WINDOW) public window: Window,
    private route: ActivatedRoute,
    private serverService: AuthServerService,
    private fb: FormBuilder) {

    this.apiKeyFc = new FormControl('9669e2ae3eb32307853499850770b0c3');

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

  ngOnInit(): void {
    // Handle conversation name from RESTFUL path
    //
    const _convname = this.route.snapshot.paramMap.get("convname");
    if (_convname) {
      console.log("convname", _convname);
      this.convName = _convname;
      this.convNameFc.setValue(_convname);
      // Recreate remove convname from current location url :
      // use pathname: "/apizee/conversation/nnnnn"
      const path = `${this.window.location.pathname}`.split('/');
      // remove last element which is the convname
      path.pop();
      // and recreate base url
      this.convBaseUrl = `${this.window.location.origin}` + path.join('/');
    } else {
      // When no convname is provided then location.href is the expected url
      // Note : This is important to NOT try using this.convBaseUrl = `${this.window.location.protocol}//${this.window.location.host}/conversation`;
      // because 1. route can change and 2. this does not work if application is hosted under a path
      this.convBaseUrl = `${this.window.location.href}`;
    }

    // Handle apiKey, if provided as query parameter
    //
    this.route.queryParams.subscribe(params => {
      if (params['apiKey']) {
        this.apiKeyFc.setValue(params['apiKey']);
      }
    });

    // Audio/Video muting
    //
    this.muteAudioFc.valueChanges.subscribe(value => {
      console.log("muteAudioFc#valueChanges", value);
      this.toggleAudioMute();
    });
    this.muteVideoFc.valueChanges.subscribe(value => {
      console.log("muteVideoFc#valueChanges", value);
      this.toggleVideoMute();
    });

    // Media device selection handling
    //
    this.audioInFc.valueChanges.subscribe(value => {
      console.log("audioInFc#valueChanges", value);
      this.selectedAudioInDevice = value;
      this.doChangeDevice();
    });
    this.videoFc.valueChanges.subscribe(value => {
      console.log("videoFc#valueChanges", value);
      this.selectedVideoDevice = value;
      this.doChangeDevice();
    });
  }

  doUpdateMediaDevices(mediaDevices: any): void {
    // Convert map values to array
    this.audioInDevices = Object.values(mediaDevices.audioinput);
    this.audioOutDevices = Object.values(mediaDevices.audiooutput);
    this.videoDevices = Object.values(mediaDevices.videoinput);
  }

  doChangeDevice(): void {

    if (this.localStreamHolder) {

      // first, unpublish and release current local stream
      this.conversation.unpublish(this.localStreamHolder.getStream());
      this.localStreamHolder.getStream().release();

      // get selected devices
      const options = {};
      if (this.selectedAudioInDevice) {
        options['audioInputId'] = this.selectedAudioInDevice.id;
      }
      if (this.selectedVideoDevice) {
        options['videoInputId'] = this.selectedVideoDevice.id;
      }
      // and recreate a new stream
      this.createStream(options)
        .then((stream) => {
          if (this.published) {
            this.publishStream();
          }
        })
        .catch(err => { console.error('createStream error', err); });
    }
  }

  ngAfterViewInit() {
  }

  ngOnDestroy(): void {
    this.doDestroy();
  }

  private doDestroy(): void {
    this.destroyConversation();
  }

  /**
   * Entry point to ApiRTC : create a UserAgent
   */
  createUserAgent() {

    this.userAgent = new apiRTC.UserAgent({
      // format is like 'apzKey:9669e2ae3eb32307853499850770b0c3'
      uri: 'apzkey:' + this.apiKeyFc.value
    });

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
    this.userAgent = null;
  }

  /**
   * This method is called when user decides to use JSON Web Token authentication.
   * A server request is made to an authentication server that has to provide a JSON Web Token.
   * 
   * ApiRTC cloud plateform has to be configured accordingly.
   * 
   * @param credentials 
   */
  doJWTAuth(credentials: any): void {
    this.registrationError = null;
    this.credentials = credentials;
    // Authenticate to get a JWT
    this.serverService.loginJWToken(this.credentials.username, this.credentials.password).subscribe(
      json => {
        this.token = json.token;
        console.log("JWT : ", json.token);
        this.usernameFc.setValue(this.credentials.username);
        this.registerWithToken();
      },
      error => {
        console.error('ConversationComponent::onCredentials|' + JSON.stringify(error));
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
  do3rdPartyAuth(credentials: any): void {
    this.registrationError = null;
    this.credentials = credentials;
    // Authenticate to get a token
    this.serverService.loginToken(this.credentials.username, this.credentials.password).subscribe(
      json => {
        this.token = json.token;
        console.log("token : ", json.token);
        this.usernameFc.setValue(this.credentials.username);
        this.registerWithToken();
      },
      error => {
        console.error('ConversationComponent::onCredentials|' + JSON.stringify(error));
        this.registrationError = error;
      });
  }

  /**
   * In order to access 'connected' features of ApiRTC, a session to ApiRTC's servers has to be obtained through register
   */
  register() {
    this.registrationError = null;
    this.userAgent.register().then((session: any) => {
      this.session = session;
      console.log("Session:", session);
    }).catch(error => {
      console.log("Registration error", error);
      this.registrationError = error;
    });
  }

  /**
   * Registration can be made with authentication token.
   */
  registerWithToken() {
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

  /**
   * 
   */
  getOrcreateConversation(): void {

    // Create the conversation
    // TODO : the tutorials use getConversation but logs and code actually say it is deprecated
    // in favor to getOrCreateConversation(name, options = {})
    this.conversation = this.session.getOrCreateConversation(this.convNameFc.value);
    // TODO il existe aussi getOrCreateConference mais les deux retournent une Conference ou une Conversation en fonction du format du nom..
    // se faire expliquer !

    this.session.on("contactListUpdate", updatedContacts => { //display a list of connected users
      console.log("MAIN - contactListUpdate", updatedContacts);
      if (this.conversation !== null) {
        let contactList = this.conversation.getContacts();
        console.info("contactList  conversation.getContacts() :", contactList);
      }
    })

    // Streams
    //
    this.conversation.on('streamListChanged', streamInfo => {
      console.log("streamListChanged :", streamInfo);
      //  USE subscribeToStream instead of subscribeToMedia?
      if (streamInfo.listEventType === 'added') {
        if (streamInfo.isRemote === true) {
          this.conversation.subscribeToStream(streamInfo.streamId)
            .then(stream => {
              console.log('subscribeToStream success:', stream);
              // Cannot do that here, the streamHolder may not yet be in streamHoldersById
              //const streamHolder:StreamDecorator = this.streamHoldersById[stream.getId()];
              //streamHolder.setSubscribed(true);
            }).catch(err => {
              console.error('subscribeToStream error', err);
            });
        }
      }
    });

    this.conversation.on('streamAdded', (stream: any) => {
      console.log('streamAdded, stream:', stream)
      //stream.addInDiv('remote-container', 'remote-media-' + stream.getId(), {}, false);

      // TODO : does stream.getContact().getId() return the same as stream.getContact().getUserData().id ?
      // TODO : also store streams by user id ?

      const streamHolder: StreamDecorator = StreamDecorator.build(stream);
      console.log(streamHolder.getId() + "->", streamHolder);
      this.streamHoldersById.set(streamHolder.getId(), streamHolder);
      streamHolder.setSubscribed(true);
    }).on('streamRemoved', (stream: any) => {
      console.log('streamRemoved:', stream)
      // removing from the map will trigger corresponding angular component to be removed from the DOM
      this.streamHoldersById.delete(stream.getId());
      console.log("getAvailableStreamList:", this.conversation.getAvailableStreamList());
    })

    // Contacts
    //
    this.conversation.on('contactJoined', contact => {
      console.log("on:contactJoined:", contact);
      const contactHolder: ContactDecorator = ContactDecorator.build(contact);
      this.contactsById.set(contactHolder.getId(), contactHolder);
    }).on('contactLeft', contact => {
      console.log("on:contactLeft:", contact);
      this.contactsById.delete(contact.getId());
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

      if (callStats.stats.videoReceived || callStats.stats.audioReceived) {
        // "received" media is from peer streams

        // Below line can be wrong because a the callId on a stream can change during Stream lifecycle
        //const streamHolder: StreamDecorator = this.streamsByCallId[callStats.callId];
        // TODO: waiting for a fix in apiRTC (to include streamId in callStats), workround here by using internal map Conversation#callIdToStreamId:
        // FIXTHIS: once apiRTC bug https://apizee.atlassian.net/browse/APIRTC-873 is fixed, we can use callStats.streamId instead of erroneous callStats.callId
        const streamHolder: StreamDecorator = this.streamHoldersById.get(String(this.conversation.callIdToStreamId.get(callStats.callId)));
        streamHolder.setQosStat({
          videoReceived: callStats.stats.videoReceived,
          audioReceived: callStats.stats.audioReceived
        });
      }
      else if (callStats.stats.videoSent || callStats.stats.audioSent) {
        // "sent" media is from local stream (to peers)
        this.localStreamHolder.setQosStat({
          videoSent: callStats.stats.videoSent,
          audioSent: callStats.stats.audioSent
        });
      }
    });

    // Speaker detection
    //
    this.conversation.on('audioAmplitude', (amplitudeInfo: any) => {
      console.log("on:audioAmplitude", amplitudeInfo);

      if (amplitudeInfo.callId !== null) {
        // TODO :
        // There is a problem here, it seems the amplitudeInfo.callId is actually a streamId
        const streamHolder: StreamDecorator = this.streamHoldersById.get(amplitudeInfo.callId);
        if (!streamHolder) {
          console.log("UNDEFINED ? amplitudeInfo.callId=" + amplitudeInfo.callId, amplitudeInfo, this.streamHoldersById)
        }
        streamHolder.setSpeaking(amplitudeInfo.descriptor.isSpeaking);
      } else {
        if (this.localStreamHolder) { // I had to add this otherwise it crashed when localStream was released
          this.localStreamHolder.setSpeaking(amplitudeInfo.descriptor.isSpeaking);
        }
      }
    });

  }

  join(): void {
    if (this.conversation) {
      // Join the conversation
      this.conversation.join()
        .then(response => {
          //Conversation joined
          this.joined = true;
          console.info('Conversation joined', response);
        }).catch(err => {
          console.error('Conversation join error', err);
        });
    }
  }

  leave(): void {
    if (this.conversation) {
      this.conversation.leave()
        .then(() => {
          this.joined = false;
          console.info('Conversation left');
          // do not destroy otherwise you cannot join back !
          // this.conversation.destroy();
          // this.conversation = null;
        })
        .catch(err => { console.error('Conversation leave error', err); });
    }
  }

  sendMessage() {
    const messageContent = this.messageFc.value;
    this.conversation.sendMessage(messageContent).then((uuid) => {
      console.log("sendMessage", uuid, messageContent);
      this.messages.push(MessageDecorator.build(this.userAgent.getUsername(), messageContent));
    })
      .catch(err => { console.error('sendMessage error', err); });
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

  // if options are specified, this is because a specific device was selected
  createStream(options?: any): Promise<Object> {
    console.log("createStream()", options);
    return new Promise((resolve, reject) => {

      var default_createStreamOptions: any = {};
      default_createStreamOptions.constraints = {
        audio: true,
        video: true
      };

      this.userAgent.createStream(options ? options : default_createStreamOptions)
        .then(stream => {
          console.log('createStream :', stream);

          this.localStreamHolder = StreamDecorator.build(stream);

          // Attach stream
          //this.localVideoRef.nativeElement.srcObject = stream;
          // previous line CANNOT work because this stream is not the same as native one from webrtc
          // instead do :
          stream.attachToElement(this.localVideoRef.nativeElement);

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

  onSubscribeToPeer(event: PeerSubscribeEvent) {
    if (event.doSubscribe) {
      console.log("subscribeToStream", event.streamHolder);
      this.conversation.subscribeToStream(event.streamHolder.getId()).then(stream => {
        console.log('subscribeToStream success:', stream);
      }).catch(err => {
        console.error('subscribeToStream error', err);
      });
    } else {
      console.log("unsubscribeToStream", event.streamHolder);
      this.conversation.unsubscribeToStream(event.streamHolder.getId());
    }
  }

  destroyStream() {
    if (this.localStreamHolder) {
      this.localStreamHolder.getStream().release();
      this.localStreamHolder = null;

      // TODO : detachFromElement is not provided, replaced by :
      // TODO shall this be documented ? shall we provide a detachFromElement ?
      this.localVideoRef.nativeElement.src = null;
    }
  }

  publishStream(): void {
    console.log("publish()");

    const stream = this.localStreamHolder.getStream();

    if (this.conversation) {
      // Publish your own stream to the conversation
      this.publishInPrgs = true;
      this.conversation.publish(stream).then(stream => {
        this.published = true;
        this.publishInPrgs = false;
      }).catch(err => {
        console.error('publish error', err);
        this.publishInPrgs = false;
      });
    }
  }

  unpublishStream(): void {
    if (this.conversation) {
      // https://apizee.atlassian.net/browse/APIRTC-863
      //this.conversation.unpublish(this.localStream.getStream(), null);
      this.conversation.unpublish(this.localStreamHolder.getStream());
      this.published = false;
    }
  }

  toggleScreenSharing(): void {

    if (this.screenSharingStream === null) {

      const displayMediaStreamConstraints = {
        video: {
          cursor: "always"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      apiRTC.Stream.createDisplayMediaStream(displayMediaStreamConstraints, false)
        .then(stream => {

          stream.on('stopped', () => {
            //Used to detect when user stop the screenSharing with Chrome DesktopCapture UI
            console.log("stopped event on stream");
            var elem = document.getElementById('local-screensharing');
            if (elem !== null) {
              elem.remove();
            }
            this.screenSharingStream = null;
          });

          this.screenSharingStream = stream;
          this.conversation.publish(this.screenSharingStream);

          // Attach stream
          this.screenSharingStream.attachToElement(this.screenSharingVideoRef.nativeElement);
        })
        .catch(function (err) {
          console.error('Could not create screensharing stream :', err);
        });
    } else {
      this.conversation.unpublish(this.screenSharingStream);
      this.screenSharingStream.release();
      this.screenSharingStream = null;
    }
  }
}