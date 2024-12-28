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
import {BookableUnit, PricingTier, PricingTierMap, WeekConfig} from './types';

interface WeekRow {
  startDate: Date;
  endDate: Date;
  pricingTier: PricingTier;
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
  private _weeks: WeekConfig[] = [];
  private _pricingTiers: PricingTierMap = {};
  private _units: BookableUnit[] = [];

  // Main table fields
  tableRows$: Observable<WeekRow[]> = of([])
  displayedColumns: string[] = [];

  buildTableRows(weeks: WeekConfig[], units: BookableUnit[], pricingTiers: PricingTierMap): Observable<WeekRow[]> {
    this.displayedColumns = ['week', ...units.map(unit => unit.name)];
    return of(
      weeks.map(week => {
        const startDate = new Date(Date.parse(week.startDate));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        const pricingTier = pricingTiers[week.pricingTierId];

        return {startDate, endDate, pricingTier};
      })
    );
  }

  @Input()
  set units(value: BookableUnit[]) {
    this._units = value;
    this.tableRows$ = this.buildTableRows(this._weeks, this._units, this._pricingTiers);
  }
  get units() {
    return this._units;
  }

  @Input()
  set weeks(value: WeekConfig[]) {
    this._weeks = value;
    this.tableRows$ = this.buildTableRows(this._weeks, this._units, this._pricingTiers);
  }

  @Input()
  set pricingTiers(value: PricingTierMap) {
    this._pricingTiers = value;
    this.tableRows$ = this.buildTableRows(this._weeks, this._units, this._pricingTiers);
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
