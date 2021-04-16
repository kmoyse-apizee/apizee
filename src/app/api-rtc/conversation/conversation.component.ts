import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Inject } from '@angular/core';
import { FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";

import { WINDOW } from '../../windows-provider';

import { ApiRtcService } from '../api-rtc.service';
import { ServerService } from '../server.service';

import { StreamDecorator } from '../stream-decorator';

declare var apiCC: any;
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
  convUrl: string;

  joined = false;
  screenSharingStream = null;

  formGroup = this.fb.group({
    convName: this.fb.control('', [Validators.required])
  });

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

  // Peer Streams
  streamHolders: Array<StreamDecorator> = new Array();
  streamHoldersById: Object = {};
  //streamsByCallId: Object = {};

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
    return this.formGroup.get('convName') as FormControl;
  }

  @ViewChild("localVideo") localVideoRef: ElementRef;
  @ViewChild("screenSharingVideo") screenSharingVideoRef: ElementRef;

  constructor(@Inject(WINDOW) public window: Window,
    private route: ActivatedRoute,
    private apiRtcService: ApiRtcService,
    private serverService: ServerService,
    private fb: FormBuilder) {

    this.apiKeyFc = new FormControl(this.apiRtcService.getApiKey());

    this.userAgent = this.apiRtcService.createUserAgent();
    // This is wrong if application is hosted under a subpath
    // this.convBaseUrl = `${this.window.location.protocol}//${this.window.location.host}/conversation`;
    // prefer using :
    this.convBaseUrl = `${this.window.location.href}`;

    console.log("window.location", window.location);

    const mediaDevices = this.userAgent.getUserMediaDevices();
    console.log(JSON.stringify(mediaDevices));
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
    //
    this.onChanges();
    const _convname = this.route.snapshot.paramMap.get("convname");
    if (_convname) {
      console.log("convname", _convname);
      this.convName = _convname;
      this.convNameFc.setValue(_convname);
    }

    // Media device selection
    //
    //const mediaDevices = this.userAgent.getUserMediaDevices();
    //console.log(JSON.stringify(mediaDevices));
    // TODO : understand why always empty:
    // displays {"audioinput":{},"audiooutput":{},"videoinput":{}}
    // Seems only this works :
    this.userAgent.on("mediaDeviceChanged", updatedContacts => {
      const mediaDevices = this.userAgent.getUserMediaDevices();
      console.log("mediaDeviceChanged", JSON.stringify(mediaDevices));
      this.doUpdateMediaDevices(mediaDevices);
    });

    this.audioInFc.valueChanges.subscribe(value => {
      console.log("audioIn_fc", value);
      this.selectedAudioInDevice = value;
      this.doChangeDevice();
    });
    this.videoFc.valueChanges.subscribe(value => {
      console.log("video_fc", value);
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
            this.publish();
          }
        })
        .catch(err => { console.error('createStream error', err); });
    }
  }

  ngAfterViewInit() {
    // const mediaDevices = this.userAgent.getUserMediaDevices();
    // console.log("ngAfterViewInit",JSON.stringify(mediaDevices));
    // // Still Displays ngAfterViewInit {"audioinput":{},"audiooutput":{},"videoinput":{}}
  }

  ngOnDestroy(): void {
    this.doDestroy();
  }

  onChanges(): void {
    this.convNameFc.valueChanges.subscribe(val => {
      this.convUrl = `${this.convBaseUrl}/${val}`;
    });

    this.usernameFc.valueChanges.subscribe((selectedValue) => {
      console.log("name valueChanges:", selectedValue);
      this.userAgent.setUsername(selectedValue);
    });
  }

  onJWTAuth(credentials: any): void {
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

  on3rdPartyAuth(credentials: any): void {
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

  private doDestroy(): void {
    if (this.conversation) {
      this.conversation.destroy();
      this.conversation = null;
    }
  }

  register() {
    this.registrationError = null;
    this.userAgent.register().then((session: any) => {
      this.session = session;
    }).catch(error => {
      console.log("Registration error", error);
      this.registrationError = error;
    });
  }

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

  getOrcreateConversation(): void {

    // Create the conversation
    // TODO : the tutorials use getConversation but logs and code actually say it is deprecated
    // in favor to getOrCreateConversation(name, options = {})
    this.conversation = this.session.getOrCreateConversation(this.convNameFc.value);
    // TODO il existe aussi getOrCreateConference mais les deux retournent une Conference ou une Conversation en fonction du format du nom..
    // se faire expliquer !

    // STATS
    // Call Stats monitoring is supported on Chrome and Firefox and will be added soon on Safari
    //console.log("apiCC", apiCC);
    if ((apiCC.browser === 'Chrome') || (apiCC.browser === 'Firefox')) {
      this.userAgent.enableCallStatsMonitoring(true, { interval: 10000 });
      this.userAgent.enableActiveSpeakerDetecting(true, { threshold: 50 });
    }

    this.session.on("contactListUpdate", updatedContacts => { //display a list of connected users
      console.log("MAIN - contactListUpdate", updatedContacts);
      if (this.conversation !== null) {
        let contactList = this.conversation.getContacts();
        console.info("contactList  conversation.getContacts() :", contactList);
      }
    })

    this.conversation.on('streamListChanged', streamInfo => {
      console.log("streamListChanged :", streamInfo);
      //  USE subscribeToStream instead of subscribeToMedia?
      if (streamInfo.listEventType === 'added') {
        if (streamInfo.isRemote === true) {
          this.conversation.subscribeToStream(streamInfo.streamId)
            .then(stream => {
              console.log('subscribeToStream success:', stream);
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
      this.streamHolders.push(streamHolder);
      this.streamHoldersById[streamHolder.getId()] = streamHolder;
      //this.streamsByCallId[streamHolder.getCallId()] = streamHolder;
    }).on('streamRemoved', (stream: any) => {
      console.log('streamRemoved:', stream)
      //stream.removeFromDiv('remote-container', 'remote-media-' + stream.getId());
      for (var i = 0; i < this.streamHolders.length; i++) {
        if (this.streamHolders[i].getId() === stream.getId()) {
          const removed = this.streamHolders.splice(i, 1);
          const removedStreamHolder = removed[0];
          console.log("removedStream:", removedStreamHolder);
        }
      }
      delete this.streamHoldersById[stream.getId()];
      //delete this.streamsByCallId[stream.callId];

      console.log("getAvailableStreamList:", this.conversation.getAvailableStreamList());

    }).on('contactJoined', contact => {
        console.log("Contact that has joined :", contact);
      }).on('contactLeft', contact => {
        console.log("Contact that has left :", contact);
      });

    // STATS
    this.conversation.on('callStatsUpdate', callStats => {

      console.log("callStatsUpdate:", callStats);

      if (callStats.stats.videoReceived || callStats.stats.audioReceived) {
        // "received" media is from peer streams

        // this can be wrong because a the callId on a stream can change during Stream lifecycle
        //const streamHolder: StreamDecorator = this.streamsByCallId[callStats.callId];
        // TODO: waiting for a fix in apiRTC, workround here by using internal map Conversation#callIdToStreamId:
        // FIXTHIS: once apiRTC bug https://apizee.atlassian.net/browse/APIRTC-873 is fixed, we can use callStats.streamId instead of erroneous callStats.callId
        const streamHolder: StreamDecorator = this.streamHoldersById[this.conversation.callIdToStreamId[callStats.callId]];
        streamHolder.setQosStat({
          videoReceived: callStats.stats.videoReceived,
          audioReceived: callStats.stats.audioReceived
        });
        console.info("received", streamHolder.getQosStat());
      }
      else if (callStats.stats.videoSent || callStats.stats.audioSent) {
        // "sent" media is from local stream (to peers)
        this.localStreamHolder.setQosStat({
          videoSent: callStats.stats.videoSent,
          audioSent: callStats.stats.audioSent
        });
        console.info("sent", this.localStreamHolder.getQosStat());
      }
    });

    this.conversation.on('audioAmplitude', amplitudeInfo => {

      console.log("on:audioAmplitude", amplitudeInfo);

      if (amplitudeInfo.callId !== null) {
        // TODO :
        // There is a problem here, it seems the amplitudeInfo.callId is actually a streamId
        const streamHolder: StreamDecorator = this.streamHoldersById[amplitudeInfo.callId];
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

  destroy(): void {
    console.info('Destroy conversation');
    this.doDestroy();
  }

  // if options are specified, this is because a specific device was selected
  createStream(options?: any): Promise<Object> {
    console.log("createStream()");
    // TODO : I was following tutorial at https://dev.apirtc.com/tutorials/conferencing/conf
    // but I was stucked here because I lacked to correct way to create a stream
    // The doc redirects to other tutorials but this is even less clear...
    // I tried to create it with standard navigator.mediaDevices.getUserMedia
    // but this is not creating the correct type of object thus conversation.publish(localStream, null);
    // failed with error like [2021-03-18T15:50:36.537Z][ERROR]apiRTC(Conversation) publish() - No stream specified
    // Frederic told me thet there was actually a link to the associated guthub code for the tutorial
    // in it we can fins the correct way to create an expected apirtc stream.
    // IDEA : ajouter un message avec un lien sur le github dès le début de la page du tuto !

    /*       navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          }).then(localStream => {
            this.localStream = localStream;
            //this.localVideoRef.nativeElement.autoplay = true;
            // Seems this has to be set by code to work :
            this.localVideoRef.nativeElement.muted = true;
            // Attach stream
            this.localVideoRef.nativeElement.srcObject = localStream;
    
            //Publish your own stream to the conversation : localStream
            this.conversation.publish(localStream, null);
    
          }).catch(err => {
            alert("getUserMedia not supported by your web browser or Operating system version" + err);
          }); */

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
          // so I had to do :
          stream.attachToElement(this.localVideoRef.nativeElement);

          resolve(stream);
        }).catch(err => {
          console.error('createStream error', err);
          reject(err);
        });
    });
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

  publish(): void {
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

  unpublish(): void {
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

/*           createStream :
{…}
  audioInput: undefined
  callId: null
  contact: null
  data: MediaStream { id: "{f314a806-088f-4fd4-884a-d73265fb4bcb}", active: true, onaddtrack: null, … }
  isRemote: false
  mediaRecorder: null
  publishedInConversations: Map { ft → "8178766209097722" }
  recordedBlobs: Array []
  streamId: 4004898158847876
  type: "video"
  userMediaStreamId: "4004898158847876"
  videoInput: undefined
  <prototype>: {…}
  activateAIAnnotations: function value()
  activateAILogs: function value()
  activateAISnapshots: function value()
  addInDiv: function value(e, t, i, n, a)
  attachToElement: function value(e)
  checkImageCaptureCompatibility: function value()
  constructor: function d(e)
  disableAudioAnalysis: function value()
  enableAudioAnalysis: function value()
  getCapabilities: function value()
  getConstraints: function value()
  getContact: function value()
  getConversations: function value()
  getData: function value()
  getId: function value()
  getLabels: function value()
  getLocalMediaStreamTrack: function value()
  getOwner: function value()
  getSettings: function value()
  getStreamAIE: function value()
  getType: function value()
  hasAudio: function value()
  hasData: function value()
  hasVideo: function value()
  isAudioMuted: function value()
  isScreensharing: function value()
  isVideoMuted: function value()
  muteAudio: function value()
  muteVideo: function value()
  pauseRecord: function value()
  release: function value()
  releaseAudio: function value()
  releaseVideo: function value()
  removeFromDiv: function value(e, t)
  resumeRecord: function value()
  setAspectRatio: function value(e)
  setBrightness: function value(e)
  setCapabilities: function value(e)
  setCapability: function value(e, t)
  setColorTemperature: function value(e)
  setContrast: function value(e)
  setExposureCompensation: function value(e)
  setExposureMode: function value(e)
  setExposureTime: function value(e)
  setFacingMode: function value(e)
  setFocusDistance: function value(e)
  setFocusMode: function value(e)
  setFrameRate: function value(e)
  setHeight: function value(e)
  setIso: function value(e)
  setResizeMode: function value(e)
  setSaturation: function value(e)
  setSharpness: function value(e)
  setTorch: function value(e)
  setWhiteBalanceMode: function value(e)
  setWidth: function value(e)
  setZoom: function value(e)
  startRecord: function value(e)
  stopAIAnnotations: function value()
  stopAILogs: function value()
  stopAISnapshots: function value()
  stopRecord: function value()
  takePhoto: function value()
  takeSnapshot: function value()
  unmuteAudio: function value()
  unmuteVideo: function value()
  <prototype>: {…}

  constructor: function e(t)
  on: function value(e, t)
  removeListener: function value(e, t)
  <prototype>: {…
*/

// Screen Share streamAdded
//
// audioInput: null
// callAudioActive: false
// callAudioAvailable: true
// callAudioMuted: false
// callId: "1629628401784658"
// callVideoActive: true
// callVideoAvailable: true
// callVideoMuted: false
// contact: {…}
  // enterprise: null
  // fileTransfers: Array []
  // groups: Array [ "default", "fty" ]
  // previousMessages: Array []
  // profile: null
  // streams: Map(0)
  // userData: {…}
    // apiRTCVersion: "4.4.9"
    // audioDevicePresent: "true"
    // browser: "Firefox"
    // browser_major_version: "87"
    // browser_version: "87.0"
    // dtlsCompliant: "true"
    // id: "156276"
    // isSimulated: "false"
    // osName: "Ubuntu"
    // userConfId: "guest-f78dc267-9bd91617779587187"
    // username: "1"
    // videoDevicePresent: "true"
    // webRtcCompliant: "true"
    // <prototype>: Object { … }
  // <prototype>: Object { … }
// data: MediaStream
// active: true
// id: "janus"
// onaddtrack: function onaddtrack(e)​​
// onremovetrack: function ()
// <prototype>: MediaStreamPrototype { getAudioTracks: getAudioTracks(), getVideoTracks: getVideoTracks(), getTracks: getTracks(), … }
// isRemote: true
// mediaRecorder: null
// publishedInConversations: Map(1)
// size: 1
// <entries>
// <prototype>: Map.prototype { … }
// recordedBlobs: []
// length: 0
// <prototype>: Array []
// streamId: 2296099743439031
// type: "video"
// userMediaStreamId: null
// videoInput: null
// <prototype>: {…