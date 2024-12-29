import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Firestore} from '@angular/fire/firestore';
import {AsyncPipe, NgForOf} from '@angular/common';
import {AuthComponent} from './auth/auth.component';
import {Auth, user} from '@angular/fire/auth';
import {Observable} from 'rxjs';
import {WeekTableComponent} from './week-table.component';
import {BookableUnit, PricingTier, ReservableWeek, Reservation, UnitPricingMap} from './types';
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
  protected readonly dataService;
  user$ = user(this.auth);
  private readonly firestore = inject(Firestore);

  title = 'Reservations-App';

  weeks$: Observable<ReservableWeek[]>;
  reservations$: Observable<Reservation[]>;
  units$: Observable<BookableUnit[]>;
  pricingTiers$: Observable<{ [key: string]: PricingTier }>;
  unitPricing$: Observable<UnitPricingMap>;

  constructor(dataService: DataService) {
    this.dataService = dataService;
    this.pricingTiers$ = dataService.pricingTiers$;
    this.reservations$ = dataService.reservations$;
    this.unitPricing$ = dataService.unitPricing$;
    this.units$ = dataService.units$;
    this.weeks$ = dataService.weeks$;
  }
}
