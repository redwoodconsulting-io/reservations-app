import {Injectable} from '@angular/core';
import {ReservationRound, ReservationRoundsConfig} from '../types';
import {map, Observable} from 'rxjs';
import {DataService} from '../data-service';
import {DateTime} from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class ReservationRoundsService {
  reservationRoundsConfig$: Observable<ReservationRoundsConfig>;
  reservationRounds$: Observable<ReservationRound[]>;

  constructor(private readonly dataService: DataService) {
    this.reservationRoundsConfig$ = this.dataService.reservationRoundsConfig$;
    this.reservationRounds$ = this.reservationRoundsConfig$.pipe(
      map(config => this.definitionsToRounds(config))
    );
  }

  definitionsToRounds(roundsConfig: ReservationRoundsConfig): ReservationRound[] {
    const firstStartDate = DateTime.fromISO(roundsConfig.startDate);
    let previousEndDate = firstStartDate;

    return roundsConfig.rounds.map(round => {
      const roundStart = previousEndDate;
      const durationWeeks = round.durationWeeks || round.bookerOrder?.length || 0;
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
