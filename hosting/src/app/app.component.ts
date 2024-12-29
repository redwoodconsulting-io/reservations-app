import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {collection, collectionData, Firestore, limit, query, where} from '@angular/fire/firestore';
import {AsyncPipe, NgForOf} from '@angular/common';
import {AuthComponent} from './auth/auth.component';
import {Auth, user} from '@angular/fire/auth';
import {map, Observable} from 'rxjs';
import {WeekTableComponent} from './week-table.component';
import {BookableUnit, ConfigData, PricingTier, Reservation, ReservableWeek} from './types';
import {DataService} from './data-service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    AuthComponent,
    WeekTableComponent,
    NgForOf,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly auth = inject(Auth);
  user$ = user(this.auth);
  private readonly firestore = inject(Firestore);

  title = 'Reservations-App';

  weeks$: Observable<ReservableWeek[]>;
  reservations$: Observable<Reservation[]>;
  units$: Observable<BookableUnit[]>;
  pricingTiers$: Observable<{ [key: string]: PricingTier }>;

  constructor(dataService: DataService) {
    this.pricingTiers$ = dataService.pricingTiers$;
    this.reservations$ = dataService.reservations$;
    this.units$ = dataService.units$;
    this.weeks$ = dataService.weeks$;
  }
}
