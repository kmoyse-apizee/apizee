import { Component, OnInit, OnDestroy, Input, EventEmitter, Output } from '@angular/core';

import { FormControl } from '@angular/forms';

import { StreamDecorator } from '../model/model.module';

export class StreamSubscribeEvent {
  readonly streamHolder: StreamDecorator;
  readonly doSubscribe: boolean;
  constructor(streamHolder: StreamDecorator, doSubscribe: boolean) {
    this.streamHolder = streamHolder;
    this.doSubscribe = doSubscribe;
  }
}

@Component({
  selector: 'app-stream',
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.css']
})
export class StreamComponent implements OnInit, OnDestroy {

  @Input() streamHolder: StreamDecorator;

  @Input() withDevicesControl: boolean = false;
  @Input() isLocal: boolean = false;

  @Input() set audioMuted(audioMuted: boolean) {
    this.muteAudioFc.setValue(audioMuted);
  }
  @Input() set videoMuted(videoMuted: boolean) {
    this.muteVideoFc.setValue(videoMuted);
  }

  _audioInDevices: Array<any>;
  @Input() set audioInDevices(audioInDevices: Array<any>) {
    this._audioInDevices = audioInDevices;
  }
  _videoDevices: Array<any>;
  @Input() set videoDevices(videoDevices: Array<any>) {
    this._videoDevices = videoDevices;
  }

  @Output() onSubscribe = new EventEmitter<StreamSubscribeEvent>();
  @Output() onAudioMute = new EventEmitter<boolean>();
  @Output() onVideoMute = new EventEmitter<boolean>();
  @Output() onAudioInSelected = new EventEmitter<any>();
  @Output() onVideoSelected = new EventEmitter<any>();

  // Audio/Video Muting
  muteAudioFc = new FormControl(false);
  muteVideoFc = new FormControl(false);

  // Devices handling
  audioInFc = new FormControl('');
  videoFc = new FormControl('');

  constructor() { }

  ngOnInit(): void {
    // Audio/Video muting
    //
    this.muteAudioFc.valueChanges.subscribe(value => {
      console.log("muteAudioFc#valueChanges", value);
      this.onAudioMute.emit(value);
    });
    this.muteVideoFc.valueChanges.subscribe(value => {
      console.log("muteVideoFc#valueChanges", value);
      this.onVideoMute.emit(value);
    });

    // Media device selection handling
    //
    this.audioInFc.valueChanges.subscribe(value => {
      console.log("audioInFc#valueChanges", value);
      this.onAudioInSelected.emit(value);
    });
    this.videoFc.valueChanges.subscribe(value => {
      console.log("videoFc#valueChanges", value);
      this.onVideoSelected.emit(value);
    });
  }

  ngOnDestroy(): void {
    console.log('StreamComponent::ngOnDestroy', this.streamHolder);
  }

  toggleSubscribe() {
    console.log("StreamComponent::toggleSubscribe");
    this.onSubscribe.emit(new StreamSubscribeEvent(this.streamHolder, this.streamHolder.stream ? false : true));
  }

}
