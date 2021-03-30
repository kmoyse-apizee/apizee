import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { Participant } from '../participant';

@Component({
  selector: 'app-peer',
  templateUrl: './peer.component.html',
  styleUrls: ['./peer.component.css']
})
export class PeerComponent implements OnInit, AfterViewInit {

  @Input() participant: Participant;

  name: string = null;

  @ViewChild("remoteVideo") remoteVideoRef: ElementRef;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    // remote stream is attached to DOM during ngAfterViewInit because @ViewChild is not bound before this stage
    //this.remoteVideoRef.nativeElement.srcObject = this.stream;
    //this.remoteVideoRef.nativeElement.muted = false;
    this.participant.stream.attachToElement(this.remoteVideoRef.nativeElement);
  }

}
