import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ApiRestModule } from './api-rest/api-rest.module';
import { ApiRtcModule } from './api-rtc/api-rtc.module';
import { DocumentationComponent } from './documentation/documentation.component';

@NgModule({
  declarations: [
    AppComponent,
    DocumentationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,

    // Material
    MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule,

    // Project
    ApiRestModule, ApiRtcModule
  ],
  providers: [
    // { provide: 'apiKey', useValue: '9669e2ae3eb32307853499850770b0c3' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {


}
