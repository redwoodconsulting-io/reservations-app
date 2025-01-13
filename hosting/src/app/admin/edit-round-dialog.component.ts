import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Inject,
  inject,
  model,
  ModelSignal,
  output,
} from '@angular/core';
import {MatButton, MatIconButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput, MatInputModule} from '@angular/material/input';
import {Booker, ReservationRoundDefinition} from '../types';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatLuxonDateModule} from '@angular/material-luxon-adapter';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatList, MatListItem} from '@angular/material/list';
import {MatIcon} from '@angular/material/icon';

export interface ReserveDialogData {
  existingPosition?: number;
  bookers: Booker[];
  name: string;
  durationWeeks?: number;
  subRoundBookerIds?: string[];
  bookedWeeksLimit?: number;
  allowDailyReservations: boolean;
}

@Component({
  selector: 'edit-round-dialog',
  templateUrl: 'edit-round-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    MatFormField,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatInput,
    MatLabel,
    MatDialogTitle,
    FormsModule,
    MatDatepickerModule,
    MatLuxonDateModule,
    MatInputModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatListItem,
    MatList,
    MatIconButton,
    MatIcon,

  ]
})
export class EditRoundDialog {
  readonly dialogRef = inject(MatDialogRef<EditRoundDialog>);

  readonly bookers: Booker[];
  readonly existingPosition: number | undefined;
  readonly name = model('');
  readonly durationWeeks: ModelSignal<number | undefined> = model(undefined as number | undefined);
  readonly subRoundBookerIds: ModelSignal<string[] | undefined> = model(undefined as string[] | undefined);
  readonly bookingLimitWeeks: ModelSignal<number | undefined> = model(undefined as number | undefined);
  readonly allowDailyReservations = model(false);

  readonly isRoundRobin = model(false);

  round = output<ReservationRoundDefinition>();
  deleteRound = output<void>();

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReserveDialogData) {
    this.bookers = data.bookers;
    this.existingPosition = data.existingPosition;
    this.name.set(data.name);
    this.durationWeeks.set(data.durationWeeks);
    this.subRoundBookerIds.set(data.subRoundBookerIds);
    this.bookingLimitWeeks.set(data.bookedWeeksLimit || 0);
    this.allowDailyReservations.set(data.allowDailyReservations);

    this.isRoundRobin.set(!!this.subRoundBookerIds() && this.subRoundBookerIds()!.length > 0);

    this.isRoundRobin.subscribe((isRoundRobin) => {
      if (isRoundRobin) {
        this.subRoundBookerIds.set(this.bookers.map(b => b.id));
        this.durationWeeks.set(undefined);
      } else {
        this.subRoundBookerIds.set(undefined);
        this.durationWeeks.set(0);
      }
    });
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    if (this.isValid()) {
      this.onSubmit();
    }
  }

  isValid(): boolean {
    return this.name().length > 0 &&
      (!!this.subRoundBookerIds() || !!this.durationWeeks()) &&
      !(!!this.subRoundBookerIds() && !!this.durationWeeks()) &&
      (!this.subRoundBookerIds() || this.subRoundBookerIds()!.length > 0) &&
      (!this.durationWeeks() || this.durationWeeks()! > 0);
  }

  onSubmit(): void {
    this.round.emit({
      name: this.name(),
      durationWeeks: this.durationWeeks(),
      subRoundBookerIds: this.subRoundBookerIds(),
      bookedWeeksLimit: this.bookingLimitWeeks(),
      allowDailyReservations: this.allowDailyReservations(),
    });
  }

  onDelete(): void {
    if (confirm(`Really delete round ${this.name()}? This cannot be undone`)) {
      this.deleteRound.emit();
    }
  }

  moveUp(index: number) {
    const newBookerIds = [...this.subRoundBookerIds()!];
    newBookerIds.splice(index - 1, 0, newBookerIds.splice(index, 1)[0]);
    this.subRoundBookerIds.set(newBookerIds);
  }

  moveDown(index: number) {
    const newBookerIds = [...this.subRoundBookerIds()!];
    newBookerIds.splice(index + 1, 0, newBookerIds.splice(index, 1)[0]);
    this.subRoundBookerIds.set(newBookerIds);
  }

  bookerName(bookerId: string) {
    return this.bookers.find(b => b.id === bookerId)?.name || bookerId;
  }
}
