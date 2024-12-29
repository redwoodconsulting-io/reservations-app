import {ChangeDetectionStrategy, Component, HostListener, Inject, inject, model, output,} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatInput, MatInputModule} from '@angular/material/input';
import {BookableUnit, PricingTier, Reservation} from '../types';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import {MatLuxonDateModule} from '@angular/material-luxon-adapter';
import {DateTime} from 'luxon';
import {MatIcon} from '@angular/material/icon';

interface ReserveDialogData {
  unit: BookableUnit;
  tier: PricingTier;
  weekStartDate: DateTime;
  weekEndDate: DateTime;
}

@Component({
  selector: 'reserve-dialog',
  templateUrl: 'reserve-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    MatFormField,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatInput,
    MatHint,
    MatLabel,
    MatDialogTitle,
    FormsModule,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepickerModule,
    MatDatepicker,
    MatLuxonDateModule,
    MatInputModule,
    MatIcon,
  ]
})
export class ReserveDialog {
  readonly dialogRef = inject(MatDialogRef<ReserveDialog>);

  weekStartDate: DateTime;
  weekEndDate: DateTime;

  reservationStartDate = model(DateTime.now());
  reservationEndDate = model(DateTime.now());
  guestName = model('');

  unit: BookableUnit;
  tier: PricingTier;

  reservation = output<Reservation>();

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReserveDialogData) {
    this.unit = data.unit;
    this.tier = data.tier;

    this.weekStartDate = data.weekStartDate;
    this.weekEndDate = data.weekEndDate;
    this.reservationStartDate.set(data.weekStartDate);
    this.reservationEndDate.set(data.weekEndDate);
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onDialogClick(_event: KeyboardEvent): void {
    this.dialogRef.close({});
  }

  isValid(): boolean {
    return this.guestName().length > 0 &&
      this.reservationStartDate <= this.reservationEndDate;
  }

  onSubmit(): void {
    this.reservation.emit({
      startDate: this.reservationStartDate().toISODate(),
      endDate: this.reservationEndDate().toISODate(),
      unitId: this.unit.id,
      guestName: this.guestName(),
    });
  }
}
