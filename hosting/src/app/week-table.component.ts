import {Component, Input} from '@angular/core';
import {AsyncPipe, NgForOf} from '@angular/common';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
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
import {BookableUnit, PricingTier, PricingTierMap, Reservation, WeekConfig} from './types';

interface WeekRow {
  startDate: Date;
  endDate: Date;
  pricingTier: PricingTier;
  reservations: { [key: string]: WeekReservation[] };
}

interface WeekReservation {
  startDate: Date;
  endDate: Date;
  unit: BookableUnit;
  guestName: string;
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
  ],
  templateUrl: './week-table.component.html',
  styleUrl: './week-table.component.css'
})
export class WeekTableComponent {
  // Input fields
  private _reservations: Reservation[] = [];
  private _pricingTiers: PricingTierMap = {};
  private _units: BookableUnit[] = [];
  private _weeks: WeekConfig[] = [];

  // Main table fields
  tableRows$: Observable<WeekRow[]> = of([])
  displayedColumns: string[] = [];

  buildTableRows(weeks: WeekConfig[], units: BookableUnit[], pricingTiers: PricingTierMap, reservations: Reservation[]): Observable<WeekRow[]> {
    this.displayedColumns = ['week', ...units.map(unit => unit.name)];
    return of(
      weeks.map(week => {
        const startDate = new Date(Date.parse(week.startDate));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        const pricingTier = pricingTiers[week.pricingTierId];

        const weekReservations = reservations.filter(reservation => {
          const reservationStartDate = new Date(Date.parse(reservation.startDate));
          const reservationEndDate = new Date(Date.parse(reservation.endDate));
          return reservationStartDate >= startDate && reservationEndDate <= endDate;
        }).map(reservation => {
          const unit = units.find(unit => unit.id === reservation.unitId);
          return {
            startDate: new Date(Date.parse(reservation.startDate)),
            endDate: new Date(Date.parse(reservation.endDate)),
            unit,
            guestName: reservation.guestName
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

  @Input()
  set units(value: BookableUnit[]) {
    this._units = value;
    this.tableRows$ = this.buildTableRows(this._weeks, this._units, this._pricingTiers, this._reservations);
  }

  get units() {
    return this._units;
  }

  @Input()
  set weeks(value: WeekConfig[]) {
    this._weeks = value;
    this.tableRows$ = this.buildTableRows(this._weeks, this._units, this._pricingTiers, this._reservations);
  }

  @Input()
  set pricingTiers(value: PricingTierMap) {
    this._pricingTiers = value;
    this.tableRows$ = this.buildTableRows(this._weeks, this._units, this._pricingTiers, this._reservations);
  }

  @Input()
  set reservations(value: Reservation[]) {
    this._reservations = value;
    this.tableRows$ = this.buildTableRows(this._weeks, this._units, this._pricingTiers, this._reservations);
  }

  // Helper functions

  rowStyle(row: WeekRow) {
    if (row.pricingTier) {
      const colorRgb = row.pricingTier.color.join(' ');
      return `background-color: rgb(${colorRgb} / 0.05)`;
    } else {
      return '';
    }
  }
}
