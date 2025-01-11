import {Component, OnDestroy} from '@angular/core';
import {AuthComponent} from '../auth/auth.component';
import {RouterOutlet} from '@angular/router';


@Component({
  selector: 'admin',
  standalone: true,
  imports: [
    AuthComponent,
    RouterOutlet,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnDestroy {
  title = 'Reservations-App';

  constructor() {
  }

  ngOnDestroy() {
  }
}
