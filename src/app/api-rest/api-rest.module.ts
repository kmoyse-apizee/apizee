import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


import { ApiRestComponent } from './api-rest/api-rest.component';

// to be used from routing
export { ApiRestComponent } from './api-rest/api-rest.component';


@NgModule({
  declarations: [ApiRestComponent],
  imports: [
    CommonModule,

    FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule,
    MatListModule, MatSlideToggleModule
  ],
  exports: [ApiRestComponent]
})
export class ApiRestModule { }
