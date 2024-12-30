import {Component, inject, Input} from '@angular/core';
import {AsyncPipe, KeyValuePipe, NgForOf} from '@angular/common';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatFooterCell,
  MatFooterCellDef,
  MatFooterRow,
  MatFooterRowDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import {ShortDate} from './utility/short-date.pipe';
import {Observable, of} from 'rxjs';
import {
  BookableUnit,
  Booker,
  PricingTier,
  PricingTierMap,
  ReservableWeek,
  Reservation,
  UnitPricing,
  UnitPricingMap
} from './types';
import {DataService} from './data-service';
import {MatDivider} from '@angular/material/divider';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {ReserveDialog} from './reservations/reserve-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {DateTime} from 'luxon';
import {ANIMATION_SETTINGS} from './app.config';
import {ErrorDialog} from './utility/error-dialog.component';
import {CurrencyPipe} from './utility/currency-pipe';

interface WeekRow {
  startDate: DateTime;
  endDate: DateTime;
  pricingTier: PricingTier;
  reservations: { [key: string]: WeekReservation[] };
}

interface WeekReservation {
  startDate: Date;
  endDate: Date;
  unit: BookableUnit;
  guestName: string;
  bookerId: string;
}

@Component({
  selector: 'week-table',
  standalone: true,
  imports: [
    AsyncPipe,
    MatTable,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderCellDef,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatRow,
    MatHeaderRow,
    ShortDate,
    NgForOf,
    MatFooterCellDef,
    MatFooterCell,
    MatFooterRow,
    MatFooterRowDef,
    KeyValuePipe,
    MatDivider,
    CurrencyPipe,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './week-table.component.html',
  styleUrl: './week-table.component.css'
})
export class WeekTableComponent {
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);

  // Input fields
  private _bookers: Booker[] = [];
  private _reservations: Reservation[] = [];
  private _pricingTiers: PricingTierMap = {};
  private _units: BookableUnit[] = [];
  private _weeks: ReservableWeek[] = [];
  private _unitPricing: UnitPricingMap = {};

  // Main table fields
  tableRows$: Observable<WeekRow[]> = of([])
  displayedColumns: string[] = [];

  buildTableRows(): Observable<WeekRow[]> {
    const weeks = this._weeks;
    const units = this._units;
    const pricingTiers = this._pricingTiers;
    const reservations = this._reservations;
    const bookers = this._bookers;
    const unitPricing = this._unitPricing;

    // Don't render table rows until all data is available.
    if (!weeks.length || !units.length || !Object.keys(pricingTiers).length || !reservations.length || !bookers.length || !Object.keys(unitPricing).length) {
      return of([]);
    }

    this.displayedColumns = ['week', ...units.map(unit => unit.name)];
    return of(
      weeks.map(week => {
        const startDate = DateTime.fromISO(week.startDate);
        const endDate = startDate.plus({days: 7});
        const pricingTier = pricingTiers[week.pricingTierId];

        const weekReservations = reservations.filter(reservation => {
          const reservationStartDate = DateTime.fromISO(reservation.startDate);
          const reservationEndDate = DateTime.fromISO(reservation.endDate);
          return reservationStartDate >= startDate && reservationEndDate <= endDate;
        }).map(reservation => {
          const unit = units.find(unit => unit.id === reservation.unitId);
          return {
            startDate: new Date(Date.parse(reservation.startDate)),
            endDate: new Date(Date.parse(reservation.endDate)),
            unit,
            guestName: reservation.guestName,
            bookerId: (reservation as any).bookerId,
          } as WeekReservation;
        });

        const reservationsByUnit = weekReservations.reduce((acc: { [key: string]: WeekReservation[] }, reservation) => {
          const key = reservation.unit.id;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(reservation);
          return acc;
        }, {});

        return {startDate, endDate, pricingTier, reservations: reservationsByUnit};
      })
    );
  }

  // Input functions

  @Input()
  set bookers(value: Booker[]) {
    this._bookers = value;
    this.tableRows$ = this.buildTableRows();
  }

  @Input()
  set units(value: BookableUnit[]) {
    this._units = value;
    this.tableRows$ = this.buildTableRows();
  }

  get units() {
    return this._units;
  }

  @Input()
  set weeks(value: ReservableWeek[]) {
    this._weeks = value;
    this.tableRows$ = this.buildTableRows();
  }

  @Input()
  set pricingTiers(value: PricingTierMap) {
    this._pricingTiers = value;
    this.tableRows$ = this.buildTableRows();
  }

  get pricingTiers() {
    return this._pricingTiers;
  }

  @Input()
  set reservations(value: Reservation[]) {
    this._reservations = value;
    this.tableRows$ = this.buildTableRows();
  }

  @Input()
  set unitPricing(value: UnitPricingMap) {
    this._unitPricing = value;
    this.tableRows$ = this.buildTableRows();
  }

  // Helper functions

  addReservation(unit: BookableUnit, tier: PricingTier, weekStartDate: DateTime, weekEndDate: DateTime) {
    const unitPricing = this._unitPricing[unit.id] || [];
    const bookers = this._bookers;

    const dialogRef = this.dialog.open(ReserveDialog, {
      data: {unit, tier, weekStartDate, weekEndDate, unitPricing, bookers},
      ...ANIMATION_SETTINGS,
    });

    dialogRef.componentInstance.reservation.subscribe((reservation: Reservation) => {
      this.submitReservation(reservation);
      dialogRef.close();
    });
  }

  submitReservation(reservation: Reservation) {
    let errors: string[] = [];

    if (!reservation.guestName) {
      errors.push("Guest name is required.");
    }
    if (reservation.endDate < reservation.startDate) {
      errors.push("End date must be after start date.");
    }
    if (!reservation.bookerId) {
      errors.push("Booker is required.");
    }

    if (errors.length) {
      this.dialog.open(ErrorDialog, {data: errors.join(' '), ...ANIMATION_SETTINGS});
      return;
    }

    this.dataService.addReservation(reservation).then(() => {
      console.log('Reservation submitted');
    }).catch((error) => {
      this.dialog.open(ErrorDialog, {data: `Couldn't save reservation: ${error.message}`, ...ANIMATION_SETTINGS});
    });
  }

  unitTierPricing(unit: BookableUnit, pricingTier: PricingTier): (UnitPricing | undefined) {
    const unitPricing = this._unitPricing[unit.id];
    if (!unitPricing) {
      return undefined;
    }

    return unitPricing.find(it => it.tierId === pricingTier.id);
  }

  bookerName(bookerId: string): string | undefined {
    const booker = this._bookers.find(it => it.id === bookerId);
    return booker?.name;
  }

  rowStyle(pricingTier: PricingTier) {
    if (pricingTier) {
      const colorRgb = pricingTier.color.join(' ');
      return `background-color: rgb(${colorRgb} / 0.05)`;
    } else {
      return '';
    }
  }
}
