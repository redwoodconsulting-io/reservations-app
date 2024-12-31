import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {ReservationRound, ReservationRoundsConfig} from '../types';
import {combineLatest, map, Observable} from 'rxjs';
import {DataService} from '../data-service';
import {DateTime} from 'luxon';
import {toObservable} from '@angular/core/rxjs-interop';
import {TodayService} from '../utility/today-service';

@Injectable({
  providedIn: 'root',
})
export class ReservationRoundsService {
  private readonly todayService = inject(TodayService);
  private readonly today = this.todayService.today;

  reservationRoundsConfig$: Observable<ReservationRoundsConfig>;
  reservationRounds$: Observable<ReservationRound[]>;

  currentRound: WritableSignal<ReservationRound | undefined> = signal(undefined);

  constructor(private readonly dataService: DataService) {
    this.reservationRoundsConfig$ = this.dataService.reservationRoundsConfig$;
    this.reservationRounds$ = this.reservationRoundsConfig$.pipe(
      map(config => this.definitionsToRounds(config))
    );

    combineLatest([this.reservationRounds$, toObservable(this.today)]).subscribe(
      ([rounds, today]) => {
        const round = rounds.find(round => round.startDate <= today && round.endDate >= today);
        this.currentRound.set(round);
      }
    );
  }

  definitionsToRounds(roundsConfig: ReservationRoundsConfig): ReservationRound[] {
    const firstStartDate = DateTime.fromISO(roundsConfig.startDate);
    let previousEndDate = firstStartDate;

    return roundsConfig.rounds.map(round => {
      const roundStart = previousEndDate;
      if (round.durationWeeks && round.bookerOrder?.length) {
        throw new Error(`Round #${round.position} "${round.name}" cannot have both durationWeeks and bookerOrder`);
      }

      const durationWeeks = round.durationWeeks || round.bookerOrder?.length;
      if (!durationWeeks || durationWeeks < 1) {
        throw new Error(`Round #${round.position} "${round.name}" must have durationWeeks or bookerOrder`);
      }

      const roundEnd = roundStart.plus({days: durationWeeks * 7 - 1});
      previousEndDate = roundEnd.plus({days: 1});
      return {
        name: round.name,
        position: round.position,
        startDate: roundStart,
        endDate: roundEnd,
        bookerOrder: round.bookerOrder || [],
      };
    });
  }
}
