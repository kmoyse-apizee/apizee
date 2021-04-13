import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { Stream } from '../stream';

@Component({
  selector: 'app-peer',
  templateUrl: './peer.component.html',
  styleUrls: ['./peer.component.css']
})
export class PeerComponent implements OnInit, AfterViewInit {

  @Input() conversation: any;
  @Input() stream: Stream;

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
    this.stream.stream.attachToElement(this.remoteVideoRef.nativeElement);
  }

  toggleSubscribe() {
    if (!this.subscribed) {
      // TODO : plutot faire un output à ce component pour notifier l'appelant qui décidera de faire le un/subscribe ??
      this.conversation.subscribeToStream(this.stream.streamId).then(stream => {
        console.log('PeerComponent::subscribeToStream success:', stream);
        this.subscribed = true;
      }).catch(err => {
        console.error('PeerComponent::subscribeToStream error', err);
      });
    } else {
      // TODO : plutot faire un output à ce component pour notifier l'appelant qui décidera de faire le un/subscribe ??
      this.conversation.unsubscribeToStream(this.stream.streamId);
      this.subscribed = false;
    }
  }

}
