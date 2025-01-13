import {
  Component,
  computed,
  inject,
  model,
  ModelSignal,
  OnDestroy,
  OutputRefSubscription,
  signal,
  Signal
} from '@angular/core';
import {DataService} from '../data-service';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {of} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from "@angular/material/dialog";
import {ReservationRound, ReservationRoundsConfig} from '../types';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute} from '@angular/router';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {ReservationRoundsService} from '../reservations/reservation-rounds-service';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {DateTime} from 'luxon';
import {RoundConfigComponent} from '../reservations/round-config.component';

@Component({
  selector: 'reservation-rounds-admin',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatFormField,
    FormsModule,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    MatCardActions,
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatError,
    MatSuffix,
    RoundConfigComponent,
  ],
  templateUrl: './reservation-rounds.component.html',
})
export class ReservationRoundsComponent implements OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly reservationRoundsService = inject(ReservationRoundsService);
  private readonly snackBar = inject(MatSnackBar);

  year: Signal<number>
  reservationRoundsConfig = signal({} as ReservationRoundsConfig);
  reservationRoundsDefinitions = computed(() => this.reservationRoundsConfig()?.rounds || []);

  roundsStartDate: ModelSignal<DateTime> = model(DateTime.now());

  rounds = computed(() => {
    if (!!this.reservationRoundsConfig()) {
      return of(this.reservationRoundsService.definitionsToRounds(this.reservationRoundsConfig()));
    } else {
      return of([] as ReservationRound[]);
    }
  })

  // Support data
  readonly bookers = this.dataService.bookers;
  readonly yearStart = computed(() => DateTime.fromISO(`${this.year()}-01-01`));
  readonly yearEnd = computed(() => DateTime.fromISO(`${this.year()}-12-31`));

  private roundsSubscription?: OutputRefSubscription;

  ngOnDestroy() {
    this.roundsSubscription?.unsubscribe();
  }

  constructor(private route: ActivatedRoute) {
    this.year = toSignal(this.dataService.activeYear, {initialValue: 0});
    this.dataService.reservationRoundsConfig$.subscribe(config => {
      this.reservationRoundsConfig.set(config);
      this.roundsStartDate.set(DateTime.fromISO(config.startDate));
    });

    this.roundsSubscription = this.roundsStartDate.subscribe(date => {
      const newConfig = {...this.reservationRoundsConfig()}
      newConfig.startDate = date.toISO()!;
      this.reservationRoundsConfig.set(newConfig);
    });
  }

  onSubmit() {
  }
}
