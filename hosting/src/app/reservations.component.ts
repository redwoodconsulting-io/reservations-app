import {Component, computed, inject, model, OnDestroy, signal, Signal, WritableSignal} from '@angular/core';
import {AsyncPipe, KeyValuePipe, NgForOf} from '@angular/common';
import {AuthComponent, authState} from './auth/auth.component';
import {Auth, User} from '@angular/fire/auth';
import {catchError, combineLatest, from, map, Observable} from 'rxjs';
import {WeekTableComponent} from './week-table.component';
import {
  BookableUnit,
  Booker,
  Permissions,
  PricingTier,
  ReservableWeek,
  Reservation,
  ReservationAuditLog,
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
import {MatChip, MatChipSet} from '@angular/material/chips';
import {MatFormField, MatOption, MatSelect} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {MatLabel} from '@angular/material/form-field';
import {AuditLogComponent} from './reservations/audit-log.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {getDownloadURL, ref, Storage} from '@angular/fire/storage';
import {ANIMATION_SETTINGS, ANNUAL_DOCUMENTS_FOLDER} from './app.config';
import {MatIcon} from '@angular/material/icon';
import {ErrorDialog} from './utility/error-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {EditAnnualDocumentDialog} from './admin/edit-annual-document-dialog.component';
import {MatSnackBar} from '@angular/material/snack-bar';


@Component({
  selector: 'reservations',
  standalone: true,
  imports: [
    AsyncPipe,
    AuthComponent,
    WeekTableComponent,
    TodayPicker,
    RoundConfigComponent,
    BookerPickerComponent,
    MatChip,
    KeyValuePipe,
    MatChipSet,
    MatSelect,
    MatOption,
    NgForOf,
    MatFormField,
    FormsModule,
    MatLabel,
    AuditLogComponent,
    MatButton,
    RouterLink,
    MatCardContent,
    MatCardHeader,
    MatCard,
    MatIcon,
    MatIconButton,
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css',
})
export class ReservationsComponent implements OnDestroy {
  private readonly auth = inject(Auth);
  protected readonly dataService;
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(Storage);
  protected readonly reservationRoundsService = inject(ReservationRoundsService);
  private readonly todayService = inject(TodayService);
  user$ = authState(this.auth);
  private currentUser?: User;
  private currentPermissions?: Permissions;

  today: Signal<DateTime>;
  bookerIdOverride: WritableSignal<string> = signal('');

  title = 'Reservations-App';

  annualDocumentFilename: Signal<string>;
  annualDocumentDownloadUrl: Signal<Observable<string>>;
  bookers: Signal<Booker[]>;
  currentBooker: WritableSignal<Booker | undefined> = signal(undefined);
  weeks$: Observable<ReservableWeek[]>;
  reservationRounds$: Observable<ReservationRound[]>;
  reservations$: Observable<Reservation[]>;
  reservationsAuditLog$: Observable<ReservationAuditLog[]>;
  units: Signal<BookableUnit[]>;
  permissions$: Observable<Permissions>;
  pricingTiers$: Observable<{ [key: string]: PricingTier }>;
  unitPricing$: Observable<UnitPricingMap>;

  isAdmin = signal(false);
  currentUserSubscription;
  bookersSubscription;

  currentYear = model(2025);

  constructor(dataService: DataService, reservationRoundsService: ReservationRoundsService) {
    this.dataService = dataService;
    this.annualDocumentFilename = dataService.annualDocumentFilename;
    this.bookers = dataService.bookers;
    this.permissions$ = dataService.permissions$;
    this.pricingTiers$ = dataService.pricingTiers$;
    this.reservationRounds$ = reservationRoundsService.reservationRounds$;
    this.reservations$ = dataService.reservations$;
    this.reservationsAuditLog$ = dataService.reservationsAuditLog$;
    this.unitPricing$ = dataService.unitPricing$;
    this.units = dataService.units;
    this.weeks$ = dataService.weeks$;

    this.annualDocumentDownloadUrl = computed(() => {
      const rootRef = ref(this.storage, ANNUAL_DOCUMENTS_FOLDER);
      return from(getDownloadURL(ref(rootRef, this.annualDocumentFilename())))
    });

    this.currentYear.subscribe(year => {
      this.dataService.activeYear.next(year);
    })

    this.bookersSubscription = combineLatest([toObservable(dataService.bookers), this.user$, toObservable(this.bookerIdOverride)]).subscribe(
      ([bookers, user, bookerIdOverride]) => {
        this.currentBooker.set(!!bookerIdOverride ?
          bookers.find(booker => booker.id === bookerIdOverride) :
          bookers.find(booker => booker.userId === user?.uid)
        )
      }
    )

    this.today = this.todayService.today;

    this.currentUserSubscription = combineLatest([this.user$, this.permissions$]).pipe(
      map(([user, permissions]) => {
        return [user, permissions];
      }),
      catchError((_error, caught) => {
        this.currentUser = undefined;
        this.isAdmin.set(false);
        return caught;
      }),
    ).subscribe(
      ([user, permissions]) => {
        this.currentUser = (user as User) || undefined;
        this.currentPermissions = (permissions as Permissions) || undefined;
        this.isAdmin.set(!!this.currentUser && !!this.currentPermissions && this.currentPermissions.adminUserIds.includes(this.currentUser.uid));
      }
    )
  }

  ngOnDestroy() {
    this.currentUserSubscription?.unsubscribe();
    this.bookersSubscription?.unsubscribe();
  }

  bookerName(bookerId: string): string {
    return this.bookers().find(booker => booker.id === bookerId)?.name || '';
  }

  editAnnualDocument() {
    const dialogRef = this.dialog.open(EditAnnualDocumentDialog, {
      data: {
        annualDocumentFilename: this.annualDocumentFilename(),
      },
      ...ANIMATION_SETTINGS,
    });
    dialogRef.componentInstance.outputFilename.subscribe((filename: string) => {
      this.dataService.updateAnnualDocumentFilename(this.currentYear(), filename).then(() => {
        this.snackBar.open('Document updated', 'Ok', {
          duration: 3000
        });
      }).catch(error => {
        this.dialog.open(ErrorDialog, {data: `Couldn't update unit: ${error.message}`, ...ANIMATION_SETTINGS});
      });
    });
  }
}
