import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import { FormBuilder, Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  fgroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  @Output() credentials = new EventEmitter<Object>();

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
  }

  get username() {
    return this.fgroup.get('username') as FormControl;
  }
  get password() {
    return this.fgroup.get('password') as FormControl;
  }

  submit() {
    this.credentials.emit({ username: this.username.value, password: this.password.value });
  }
}
