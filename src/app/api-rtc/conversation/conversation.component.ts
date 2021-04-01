import { Component, OnDestroy, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Inject } from '@angular/core';
import { FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";

import { WINDOW } from '../../windows-provider';

import { ApiRtcService } from '../api-rtc.service';

import { Participant } from '../participant'

declare var apiCC: any;

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css']
})
export class ConversationComponent implements OnInit, OnDestroy {

  name = new FormControl('');

  confBaseUrl: string;
  confUrl: string;

  registered = false;
  joined = false;

  formGroup = this.fb.group({
    confName: this.fb.control('', [Validators.required])
  });

  // apiRTC objects
  userAgent: any;
  conversation: any;

  //localPeerId: string;

  // Local participant
  localParticipant: Participant;

  participants: Array<Participant> = new Array();
  participantsByStreamId: Object = {};
  participantsByCallId: Object = {};

  get confName() {
    return this.formGroup.get('confName') as FormControl;
  }

  @ViewChild("localVideo") localVideoRef: ElementRef;


  constructor(@Inject(WINDOW) public window: Window,
    private route: ActivatedRoute,
    private apiRtcService: ApiRtcService,
    private fb: FormBuilder) {

    this.userAgent = this.apiRtcService.createUserAgent();
    //this.localPeerId = this.apiRtcService.uuidv4();
    this.confBaseUrl = `${this.window.location.protocol}//${this.window.location.host}/conversation`;

  }

  // Note : beforeUnloadHandler alone does not work on android Chrome
  // seems it requires unloadHandler to do the same to work evrywhere...
  // https://stackoverflow.com/questions/35779372/window-onbeforeunload-doesnt-trigger-on-android-chrome-alt-solution
  //
  @HostListener('window:unload', ['$event'])
  unloadHandler(event) {
    console.log("unloadHandler");
    this.doHangUp();
  }

  // Use BEFORE unload to hangup (works for Firefox at least)
  // This is usefull if user closes the tab, or refreshes the page
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event) {
    console.log("beforeUnloadHandler");
    this.doHangUp();
  }

  ngOnInit(): void {

    this.onChanges();

    const conf_name = this.route.snapshot.paramMap.get("confname");

    if (conf_name) {
      this.confName.setValue(conf_name);
      this.createConference();
    }
  }

  onChanges(): void {
    this.confName.valueChanges.subscribe(val => {
      this.confUrl = `${this.confBaseUrl}/${val}`;
    });

    this.name.valueChanges.subscribe((selectedValue) => {
      console.log("name valueChanges:", selectedValue);
      this.userAgent.setUsername(selectedValue);
    });
  }

  ngOnDestroy(): void {
    this.doHangUp();
  }

  private doHangUp(): void {
    if (this.conversation) {
      this.conversation.destroy();
    }
  }

  createConference(): void {

    // {
    //   id: this.localPeerId // OPTIONAL // This is used for setting userId
    // }

    this.userAgent.register().then(session => {

      // Create the conversation
      // TODO : the tutorials use getConversation but logs and code actually say it is deprecated
      // in favor to getOrCreateConversation(name, options = {})
      this.conversation = session.getOrCreateConversation(this.confName.value);
      // TODO il existe aussi getOrCreateConference mais les deux retournent une Conference ou une Conversation en fonction du format du nom..
      // se faire expliquer !

      // STATS
      // Call Stats monitoring is supported on Chrome and Firefox and will be added soon on Safari
      //console.log("apiCC", apiCC);
      if ((apiCC.browser === 'Chrome') || (apiCC.browser === 'Firefox')) {
        this.userAgent.enableCallStatsMonitoring(true, { interval: 10000 });
        this.userAgent.enableActiveSpeakerDetecting(true, { threshold: 50 });
      }

      session.on("contactListUpdate", updatedContacts => { //display a list of connected users
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

      this.conversation.on('streamAdded', stream => {
        console.log('streamAdded, stream:', stream)
        //stream.addInDiv('remote-container', 'remote-media-' + stream.streamId, {}, false);

        const participant = Participant.build(stream);

        this.participantsByStreamId[stream.streamId] = participant;
        this.participantsByCallId[stream.callId] = participant;
        this.participants.push(participant);

      }).on('streamRemoved', stream => {
        console.log('streamRemoved:', stream)
        //stream.removeFromDiv('remote-container', 'remote-media-' + stream.streamId);
        for (var i = 0; i < this.participants.length; i++) {
          if (this.participants[i].getStream()['streamId'] === stream.streamId) {
            const removed = this.participants.splice(i, 1);
            const removedStream = removed[0];
            console.log("removedStream:", removedStream);
          }
        }
        delete this.participantsByStreamId[stream.streamId];
        delete this.participantsByCallId[stream.callId];
      }).on('contactJoined', contact => {
        console.log("Contact that has joined :", contact);
      }).on('contactLeft', contact => {
        console.log("Contact that has left :", contact);
      });

      // STATS
      this.conversation.on('callStatsUpdate', callStats => {

        console.log("callStatsUpdate:", callStats);

        if (callStats.stats.videoReceived || callStats.stats.audioReceived) {
          // "received" media is from peer participants
          const participant: Participant = this.participantsByCallId[callStats.callId];
          participant.setQosStat({
            videoReceived: callStats.stats.videoReceived,
            audioReceived: callStats.stats.audioReceived
          });
          console.info("received", participant.getQosStat());
        }
        else if (callStats.stats.videoSent || callStats.stats.audioSent) {
          // "sent" media is from local participant (to peers)
          this.localParticipant.setQosStat({
            videoSent: callStats.stats.videoSent,
            audioSent: callStats.stats.audioSent
          });
          console.info("sent", this.localParticipant.getQosStat());
        }
      });

      this.conversation.on('audioAmplitude', amplitudeInfo => {

        console.log("on:audioAmplitude", amplitudeInfo);

        if (amplitudeInfo.callId !== null) {
          // TODO :
          // There is a problem here, it seems the amplitudeInfo.callId is actually a streamId
          const participant: Participant = this.participantsByStreamId[amplitudeInfo.callId];
          participant.setSpeaking(amplitudeInfo.descriptor.isSpeaking);
        } else {
          this.localParticipant.setSpeaking(amplitudeInfo.descriptor.isSpeaking);
        }
      });

      this.registered = true;

    }).catch(error => {
      // error
      console.log("Registration error", error);
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

  publish(): void {
    console.log("publish()");
    if (this.conversation) {

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

      var createStreamOptions: any = {};
      createStreamOptions.constraints = {
        audio: true,
        video: true
      };
      this.userAgent.createStream(createStreamOptions)
        .then(stream => {
          console.log('createStream :', stream);

          /*           createStream : 
                    {…}
    ​
    audioInput: undefined
    ​
    callId: null
    ​
    contact: null
    ​
    data: MediaStream { id: "{f314a806-088f-4fd4-884a-d73265fb4bcb}", active: true, onaddtrack: null, … }
    ​
    isRemote: false
    ​
    mediaRecorder: null
    ​
    publishedInConversations: Map { ft → "8178766209097722" }
    ​
    recordedBlobs: Array []
    ​
    streamId: 4004898158847876
    ​
    type: "video"
    ​
    userMediaStreamId: "4004898158847876"
    ​
    videoInput: undefined
    ​
    <prototype>: {…}
    ​
    activateAIAnnotations: function value()​​
    activateAILogs: function value()​​
    activateAISnapshots: function value()​​
    addInDiv: function value(e, t, i, n, a)​​
    attachToElement: function value(e)​​
    checkImageCaptureCompatibility: function value()​​
    constructor: function d(e)​​
    disableAudioAnalysis: function value()​​
    enableAudioAnalysis: function value()​​
    getCapabilities: function value()​​
    getConstraints: function value()​​
    getContact: function value()​​
    getConversations: function value()​​
    getData: function value()​​
    getId: function value()​​
    getLabels: function value()​​
    getLocalMediaStreamTrack: function value()​​
    getOwner: function value()​​
    getSettings: function value()​​
    getStreamAIE: function value()​​
    getType: function value()​​
    hasAudio: function value()​​
    hasData: function value()​​
    hasVideo: function value()​​
    isAudioMuted: function value()​​
    isScreensharing: function value()​​
    isVideoMuted: function value()​​
    muteAudio: function value()​​
    muteVideo: function value()​​
    pauseRecord: function value()​​
    release: function value()​​
    releaseAudio: function value()​​
    releaseVideo: function value()​​
    removeFromDiv: function value(e, t)​​
    resumeRecord: function value()​​
    setAspectRatio: function value(e)​​
    setBrightness: function value(e)​​
    setCapabilities: function value(e)​​
    setCapability: function value(e, t)​​
    setColorTemperature: function value(e)​​
    setContrast: function value(e)​​
    setExposureCompensation: function value(e)​​
    setExposureMode: function value(e)​​
    setExposureTime: function value(e)​​
    setFacingMode: function value(e)​​
    setFocusDistance: function value(e)​​
    setFocusMode: function value(e)​​
    setFrameRate: function value(e)​​
    setHeight: function value(e)​​
    setIso: function value(e)​​
    setResizeMode: function value(e)​​
    setSaturation: function value(e)​​
    setSharpness: function value(e)​​
    setTorch: function value(e)​​
    setWhiteBalanceMode: function value(e)​​
    setWidth: function value(e)​​
    setZoom: function value(e)​​
    startRecord: function value(e)​​
    stopAIAnnotations: function value()​​
    stopAILogs: function value()​​
    stopAISnapshots: function value()​​
    stopRecord: function value()​​
    takePhoto: function value()​​
    takeSnapshot: function value()​​
    unmuteAudio: function value()​​
    unmuteVideo: function value()​​
    <prototype>: {…}
    ​
    constructor: function e(t)​​​
    on: function value(e, t)​​​
    removeListener: function value(e, t)​​​
    <prototype>: {…*/

          this.localParticipant = Participant.build(stream);

          // Attach stream
          //this.localVideoRef.nativeElement.srcObject = stream;
          // previous line CANNOT work because this stream is not the same as native one from webrtc
          // so I had to do :
          stream.attachToElement(this.localVideoRef.nativeElement);

          // Publish your own stream to the conversation
          this.conversation.publish(stream, null);
        });



    }
  }

}
