import {
  ChangeDetectionStrategy,
  Component,
  Input,
  model,
  OnDestroy,
  output,
  signal,
  WritableSignal,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {Booker} from '../types';
import {Observable, Subscription} from 'rxjs';
import {NgForOf} from '@angular/common';
import {MatOption, MatSelect} from '@angular/material/select';

@Component({
  selector: 'booker-picker',
  templateUrl: 'booker-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatFormField,
    NgForOf,
    FormsModule,
    MatLabel,
    MatSelect,
    MatOption,
  ]
})
export class BookerPickerComponent implements OnDestroy {
  bookerId = output<string>();
  _bookerId = model('');
  bookers: WritableSignal<Booker[]> = signal([]);

  bookersSubscription?: Subscription = undefined;

  constructor() {
    this._bookerId.subscribe(id => {
      this.bookerId.emit(id);
    })
  }

  ngOnDestroy() {
    this.bookersSubscription?.unsubscribe();
  }

  @Input()
  set bookers$(value: Observable<Booker[]>) {
    this.bookersSubscription?.unsubscribe();
    this.bookersSubscription = value.subscribe(bookers => {
      this.bookers.set(bookers);
    });
  }
}
