import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-stream-video',
  templateUrl: './stream-video.component.html',
  styleUrls: ['./stream-video.component.css']
})
export class StreamVideoComponent implements OnInit, AfterViewInit {

  @ViewChild("video") remoteVideoRef: ElementRef;

  @Input() stream: any;

  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    // remote stream is attached to DOM during ngAfterViewInit because @ViewChild is not bound before this stage
    //this.remoteVideoRef.nativeElement.srcObject = this.stream;
    //this.remoteVideoRef.nativeElement.muted = false;
    this.stream.attachToElement(this.remoteVideoRef.nativeElement);
  }

}
