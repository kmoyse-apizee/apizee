import { Component, OnInit, OnDestroy, Input, EventEmitter, Output  } from '@angular/core';

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

  @Output() onSubscribe = new EventEmitter<StreamSubscribeEvent>();

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    console.log('StreamComponent::ngOnDestroy', this.streamHolder);
  }

  toggleSubscribe() {
    console.log("toggleSubscribe");
    this.onSubscribe.emit(new StreamSubscribeEvent(this.streamHolder, this.streamHolder.stream ? false : true));
  }
}
