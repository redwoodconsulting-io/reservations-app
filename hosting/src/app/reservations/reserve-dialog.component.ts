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
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput, MatInputModule} from '@angular/material/input';
import {BookableUnit, Booker, PricingTier, Reservation, UnitPricing} from '../types';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import {MatLuxonDateModule} from '@angular/material-luxon-adapter';
import {DateTime} from 'luxon';
import {CurrencyPipe} from "../utility/currency-pipe";
import {MatOption, MatSelect} from '@angular/material/select';

interface ReserveDialogData {
  bookers: Booker[];
  unit: BookableUnit;
  tier: PricingTier;
  unitPricing: UnitPricing[];
  weekStartDate: DateTime;
  weekEndDate: DateTime;
  startDate?: DateTime;
  endDate?: DateTime;
  initialGuestName?: string;
  initialBookerId?: string;
  existingReservationId?: string;
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
    MatLabel,
    MatDialogTitle,
    FormsModule,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepickerModule,
    MatDatepicker,
    MatLuxonDateModule,
    MatInputModule,
    CurrencyPipe,
    MatSelect,
    MatOption,
  ]
})
export class ReserveDialog {
  readonly dialogRef = inject(MatDialogRef<ReserveDialog>);

  weekStartDate: DateTime;
  weekEndDate: DateTime;

  reservationStartDate = model(DateTime.now());
  reservationEndDate = model(DateTime.now());
  guestName = model('');
  bookerId = model('');

  readonly existingReservationId: string | undefined;
  readonly bookers: Booker[];
  readonly unit: BookableUnit;
  readonly tier: PricingTier;
  readonly unitPricing: UnitPricing[];

  reservation = output<Reservation>();
  deleteReservation = output<void>();

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReserveDialogData) {
    this.unit = data.unit;
    this.tier = data.tier;
    this.unitPricing = data.unitPricing;
    this.bookers = data.bookers;

    this.weekStartDate = data.weekStartDate;
    this.weekEndDate = data.weekEndDate;

    this.reservationStartDate.set(data.startDate || data.weekStartDate);
    this.reservationEndDate.set(data.endDate || data.weekEndDate);
    this.guestName.set(data.initialGuestName || '');
    this.bookerId.set(data.initialBookerId || '');
    this.existingReservationId = data.existingReservationId;
  }

  reservationCost(): number | undefined {
    const applicablePricing = this.unitPricing.find(it => it.tierId === this.tier?.id);
    return applicablePricing?.weeklyPrice;
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    if (this.isValid()) {
      this.onSubmit();
    }
  }

  isValid(): boolean {
    return this.guestName().length > 0 &&
      this.reservationStartDate <= this.reservationEndDate &&
      !!this.bookerId();
  }

  onSubmit(): void {
    this.reservation.emit({
      id: this.existingReservationId || '',
      startDate: this.reservationStartDate().toISODate(),
      endDate: this.reservationEndDate().toISODate(),
      unitId: this.unit.id,
      guestName: this.guestName(),
      bookerId: this.bookerId(),
    });
  }

  onDelete(): void {
    if (confirm("Really delete? This cannot be undone")) {
      this.deleteReservation.emit();
    }
  }
}
