import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

import { ContactDecorator, StreamDecorator } from '../model/model.module';

import { StreamSubscribeEvent } from '../stream/stream.component';


@Component({
  selector: 'app-peer',
  templateUrl: './peer.component.html',
  styleUrls: ['./peer.component.css']
})
export class PeerComponent implements OnInit {

  streamHoldersById: Map<String, StreamDecorator>;

  activeIndex = 0;

  _contactHolder: ContactDecorator;
  @Input() set contactHolder(contactHolder: ContactDecorator) {
    this._contactHolder = contactHolder;
    this.streamHoldersById = contactHolder.getStreamHoldersById();
  };

  @Output() onStreamSubscription = new EventEmitter<StreamSubscribeEvent>();

  constructor() { }

  ngOnInit(): void {
  }

  emitStreamSubscription(event: StreamSubscribeEvent) {
    this.onStreamSubscription.emit(event);
  }

  prev() {
    this.activeIndex = ((this.activeIndex === 0 ? this.streamHoldersById.size : this.activeIndex) - 1) % this.streamHoldersById.size;
  }
  next() {
    this.activeIndex = (this.activeIndex + 1) % this.streamHoldersById.size;
  }
  navTo(index: number) {
    this.activeIndex = index;
  }

}
