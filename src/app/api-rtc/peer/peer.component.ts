import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { Participant } from '../participant';

@Component({
  selector: 'app-peer',
  templateUrl: './peer.component.html',
  styleUrls: ['./peer.component.css']
})
export class PeerComponent implements OnInit, AfterViewInit {

  @Input() conversation: any;
  @Input() participant: Participant;


  name: string = null;
  subscribed: boolean = false;


  @ViewChild("remoteVideo") remoteVideoRef: ElementRef;

  constructor() { }

  ngOnInit(): void {
    this.toggleSubscribe();
  }

  ngAfterViewInit() {
    // remote stream is attached to DOM during ngAfterViewInit because @ViewChild is not bound before this stage
    //this.remoteVideoRef.nativeElement.srcObject = this.stream;
    //this.remoteVideoRef.nativeElement.muted = false;
    this.participant.stream.attachToElement(this.remoteVideoRef.nativeElement);
  }

  toggleSubscribe() {
    if (!this.subscribed) {
      this.conversation.subscribeToStream(this.participant.streamId).then(stream => {
        console.log('PeerComponent::subscribeToStream success:', stream);
        this.subscribed = true;
      }).catch(err => {
        console.error('PeerComponent::subscribeToStream error', err);
      });
    } else {
      this.conversation.unsubscribeToStream(this.participant.streamId);
      this.subscribed = false;
    }
  }


}
