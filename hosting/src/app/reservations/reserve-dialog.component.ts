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
import {BookableUnit, PricingTier, Reservation, UnitPricing} from '../types';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import {MatLuxonDateModule} from '@angular/material-luxon-adapter';
import {DateTime} from 'luxon';
import {MatIcon} from '@angular/material/icon';
import {CurrencyPipe} from "../utility/currency-pipe";

interface ReserveDialogData {
  unit: BookableUnit;
  tier: PricingTier;
  unitPricing: UnitPricing[];
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
    CurrencyPipe,
  ]
})
export class ReserveDialog {
  readonly dialogRef = inject(MatDialogRef<ReserveDialog>);

  weekStartDate: DateTime;
  weekEndDate: DateTime;

  reservationStartDate = model(DateTime.now());
  reservationEndDate = model(DateTime.now());
  guestName = model('');

  readonly unit: BookableUnit;
  readonly tier: PricingTier;
  readonly unitPricing: UnitPricing[];

  reservation = output<Reservation>();

  constructor(@Inject(MAT_DIALOG_DATA) public data: ReserveDialogData) {
    this.unit = data.unit;
    this.tier = data.tier;
    this.unitPricing = data.unitPricing;

    this.weekStartDate = data.weekStartDate;
    this.weekEndDate = data.weekEndDate;
    this.reservationStartDate.set(data.weekStartDate);
    this.reservationEndDate.set(data.weekEndDate);
  }

  reservationCost(): number | undefined {
    const applicablePricing = this.unitPricing.find(it => it.tierId === this.tier.id);
    return applicablePricing?.weeklyPrice;
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
