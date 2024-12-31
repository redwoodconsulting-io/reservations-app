import {Injectable, signal, Signal, WritableSignal} from '@angular/core';
import {DateTime} from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class TodayService {
  _today: WritableSignal<DateTime> = signal(DateTime.now());

  set today(value: DateTime) {
    this._today.set(value);
  }

  get today(): Signal<DateTime> {
    return this._today;
  }
}
