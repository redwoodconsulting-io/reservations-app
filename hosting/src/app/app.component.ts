import {Component, inject, OnDestroy, signal, Signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Firestore} from '@angular/fire/firestore';
import {AsyncPipe} from '@angular/common';
import {AuthComponent} from './auth/auth.component';
import {Auth, User, user} from '@angular/fire/auth';
import {combineLatest, map, Observable} from 'rxjs';
import {WeekTableComponent} from './week-table.component';
import {BookableUnit, Booker, Permissions, PricingTier, ReservableWeek, Reservation, UnitPricingMap} from './types';
import {DataService} from './data-service';
import {DateTime} from 'luxon';
import {TodayService} from './utility/today-service';
import {TodayPicker} from './utility/today-picker.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    AuthComponent,
    WeekTableComponent,
    TodayPicker,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
  private readonly auth = inject(Auth);
  protected readonly dataService;
  private readonly todayService = inject(TodayService);
  user$ = user(this.auth);
  private currentUser?: User;
  private currentPermissions?: Permissions;
  private readonly firestore = inject(Firestore);

  today: Signal<DateTime>;

  title = 'Reservations-App';

  bookers$: Observable<Booker[]>;
  currentBooker$: Observable<Booker | undefined>;
  weeks$: Observable<ReservableWeek[]>;
  reservations$: Observable<Reservation[]>;
  units$: Observable<BookableUnit[]>;
  permissions$: Observable<Permissions>;
  pricingTiers$: Observable<{ [key: string]: PricingTier }>;
  unitPricing$: Observable<UnitPricingMap>;

  isAdmin = signal(false);
  currentUserSubscription;
  permissionsSubscription;

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

    this.today = this.todayService.today;

    this.currentUserSubscription = this.user$.subscribe(user => {
      this.currentUser = user || undefined
      this.isAdmin.set(!!this.currentUser && !!this.currentPermissions && this.currentPermissions?.adminUserIds.includes(this.currentUser.uid));
    });

    this.permissionsSubscription = this.permissions$.subscribe(permissions => {
      this.currentPermissions = permissions || undefined;
      this.isAdmin.set(!!this.currentUser && this.currentPermissions?.adminUserIds.includes(this.currentUser.uid));
    })
  }

  ngOnDestroy() {
    this.permissionsSubscription.unsubscribe();
    this.currentUserSubscription.unsubscribe();
  }
}
