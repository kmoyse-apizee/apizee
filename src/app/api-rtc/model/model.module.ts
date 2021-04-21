import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

export { ContactDecorator } from './contact-decorator';
export { MessageDecorator } from './message-decorator';
export { StreamDecorator } from './stream-decorator';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class ModelModule { }
