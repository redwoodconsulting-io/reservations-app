import {Component, inject, OnDestroy, signal, Signal, WritableSignal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Firestore} from '@angular/fire/firestore';
import {AsyncPipe, KeyValuePipe} from '@angular/common';
import {AuthComponent} from './auth/auth.component';
import {Auth, User, user} from '@angular/fire/auth';
import {combineLatest, map, Observable} from 'rxjs';
import {WeekTableComponent} from './week-table.component';
import {
  BookableUnit,
  Booker,
  Permissions,
  PricingTier,
  ReservableWeek,
  Reservation,
  ReservationRound,
  UnitPricingMap
} from './types';
import {DataService} from './data-service';
import {DateTime} from 'luxon';
import {TodayService} from './utility/today-service';
import {TodayPicker} from './utility/today-picker.component';
import {ReservationRoundsService} from './reservations/reservation-rounds-service';
import {RoundConfigComponent} from './reservations/round-config.component';
import {BookerPickerComponent} from './utility/booker-picker.component';
import {toObservable} from '@angular/core/rxjs-interop';
import {MatChip} from '@angular/material/chips';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    AuthComponent,
    WeekTableComponent,
    TodayPicker,
    RoundConfigComponent,
    BookerPickerComponent,
    MatChip,
    KeyValuePipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
  private readonly auth = inject(Auth);
  protected readonly dataService;
  protected readonly reservationRoundsService = inject(ReservationRoundsService);
  private readonly todayService = inject(TodayService);
  user$ = user(this.auth);
  private currentUser?: User;
  private currentPermissions?: Permissions;
  private readonly firestore = inject(Firestore);

  today: Signal<DateTime>;
  bookerIdOverride: WritableSignal<string> = signal('');

  title = 'Reservations-App';

  bookers: Signal<Booker[]>;
  currentBooker$: Observable<Booker | undefined>;
  weeks$: Observable<ReservableWeek[]>;
  reservationRounds$: Observable<ReservationRound[]>;
  reservations$: Observable<Reservation[]>;
  units$: Observable<BookableUnit[]>;
  permissions$: Observable<Permissions>;
  pricingTiers$: Observable<{ [key: string]: PricingTier }>;
  unitPricing$: Observable<UnitPricingMap>;

  isAdmin = signal(false);
  currentUserSubscription;
  permissionsSubscription;

  constructor(dataService: DataService, reservationRoundsService: ReservationRoundsService) {
    this.dataService = dataService;
    this.bookers = dataService.bookers;
    this.permissions$ = dataService.permissions$;
    this.pricingTiers$ = dataService.pricingTiers$;
    this.reservationRounds$ = reservationRoundsService.reservationRounds$;
    this.reservations$ = dataService.reservations$;
    this.unitPricing$ = dataService.unitPricing$;
    this.units$ = dataService.units$;
    this.weeks$ = dataService.weeks$;

    this.currentBooker$ = combineLatest([toObservable(dataService.bookers), this.user$, toObservable(this.bookerIdOverride)]).pipe(
      map(([bookers, user, bookerIdOverride]) => {
        return bookerIdOverride?.length ?
          bookers.find(booker => booker.id === bookerIdOverride) :
          bookers.find(booker => booker.userId === user?.uid);
      })
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

  bookerName(bookerId: string): string {
    return this.bookers().find(booker => booker.id === bookerId)?.name || '';
  }
}
