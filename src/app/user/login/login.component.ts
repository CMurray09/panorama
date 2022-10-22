import { Component, OnInit } from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials: {email: string, password: string} = {
    email: '',
    password: ''
  }
  showAlert: boolean = false;
  alertMsg: string = 'Please wait! We are logging you in.';
  alertColour: string = 'blue';
  inSubmission: boolean = false;

  constructor(private auth: AngularFireAuth) { }

  ngOnInit(): void {
  }

  async login(): Promise<void> {
    this.inSubmission = true;
    this.showAlert = true;
    this.alertMsg = 'Please wait! We are logging you in.';
    this.alertColour = 'blue';
    try {
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email, this.credentials.password
      );
    } catch (e) {
      this.inSubmission = false;
      this.alertMsg = 'An unexpected error occurred. Please try again later.';
      this.alertColour = 'red';
      console.error(e);
      return;
    }
    this.inSubmission = false;
    this.alertMsg = 'Success! Youa re now logged in.';
    this.alertColour = 'green';
  }

}
