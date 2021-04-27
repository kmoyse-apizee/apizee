import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { UtilsModule } from '../utils/utils.module';

import { ConversationComponent } from './conversation/conversation.component';
import { PeerComponent } from './peer/peer.component';
import { OneToOneComponent } from './one-to-one/one-to-one.component';

// to be used from routing
export { ConversationComponent } from './conversation/conversation.component';
export { OneToOneComponent } from './one-to-one/one-to-one.component';

import { WINDOW_PROVIDERS } from '../windows-provider';
import { AudioStatsComponent } from './audio-stats/audio-stats.component';
import { VideoStatsComponent } from './video-stats/video-stats.component';
import { StreamComponent } from './stream/stream.component';
import { StreamVideoComponent } from './stream-video/stream-video.component';

@NgModule({
  declarations: [ConversationComponent, PeerComponent, OneToOneComponent, AudioStatsComponent, VideoStatsComponent, StreamComponent, StreamVideoComponent],
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    HttpClientModule,

    MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule,
    MatListModule, MatSlideToggleModule, MatSelectModule, MatChipsModule,
    ClipboardModule,

    UtilsModule
  ],
  exports: [ConversationComponent, OneToOneComponent],
  providers: [WINDOW_PROVIDERS]
})
export class ApiRtcModule { }
