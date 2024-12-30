import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Firestore} from '@angular/fire/firestore';
import {AsyncPipe} from '@angular/common';
import {AuthComponent} from './auth/auth.component';
import {Auth, user} from '@angular/fire/auth';
import {combineLatest, map, Observable} from 'rxjs';
import {WeekTableComponent} from './week-table.component';
import {BookableUnit, Booker, Permissions, PricingTier, ReservableWeek, Reservation, UnitPricingMap} from './types';
import {DataService} from './data-service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    AuthComponent,
    WeekTableComponent,
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

  bookers$: Observable<Booker[]>;
  currentBooker$: Observable<Booker | undefined>;
  weeks$: Observable<ReservableWeek[]>;
  reservations$: Observable<Reservation[]>;
  units$: Observable<BookableUnit[]>;
  permissions$: Observable<Permissions>;
  pricingTiers$: Observable<{ [key: string]: PricingTier }>;
  unitPricing$: Observable<UnitPricingMap>;

  constructor(dataService: DataService) {
    this.dataService = dataService;
    this.bookers$ = dataService.bookers$;
    this.permissions$ = dataService.permissions$;
    this.pricingTiers$ = dataService.pricingTiers$;
    this.reservations$ = dataService.reservations$;
    this.unitPricing$ = dataService.unitPricing$;
    this.units$ = dataService.units$;
    this.weeks$ = dataService.weeks$;

    this.currentBooker$ = combineLatest([dataService.bookers$, this.user$]).pipe(
      map(([bookers, user]) => bookers.find(booker => booker.userId === user?.uid))
    )
  }
}
