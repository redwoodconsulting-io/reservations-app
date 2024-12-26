import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {AsyncPipe} from '@angular/common';
import {AuthComponent} from './auth/auth.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    AuthComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'reservations-app';
}
