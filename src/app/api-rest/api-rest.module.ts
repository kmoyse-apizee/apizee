import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


import { ApiRestComponent } from './api-rest/api-rest.component';

// to be used from routing
export { ApiRestComponent } from './api-rest/api-rest.component';

export interface ApiRTCListResponse {
  data: any[];
  total: number;
  next_offset: number;
}

@NgModule({
  declarations: [ApiRestComponent],
  imports: [
    CommonModule,

    FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule,
    MatListModule, MatSlideToggleModule,
    MatTableModule, MatPaginatorModule, MatProgressSpinnerModule
  ],
  exports: [ApiRestComponent]
})
export class ApiRestModule { }
