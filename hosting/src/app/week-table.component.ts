import {Component, Input, OnDestroy} from '@angular/core';
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
import {BehaviorSubject} from 'rxjs';
import {BookableUnit, WeekConfig} from './types';

interface WeekRow {
  startDate: Date;
  endDate: Date;
}

function weeksTransformer(weeks: WeekConfig[]): WeekRow[] {
  return weeks.map(week => {
    const startDate = new Date(Date.parse(week.startDate));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return {startDate, endDate};
  });
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
export class WeekTableComponent implements OnDestroy {
  // Input fields
  @Input({transform: weeksTransformer})
  weeks: WeekConfig[] = [];
  private _units: BookableUnit[] = [];

  displayedColumns: string[] = [];

  // Computed fields
  unitNames$ = new BehaviorSubject<string[]>([]);
  unitNamesSubscription = this.unitNames$.subscribe(
    names => {
      this.displayedColumns = ['week', ...names];
    }
  );

  ngOnDestroy(): void {
    this.unitNamesSubscription?.unsubscribe();
  }


  @Input()
  set units(value: BookableUnit[]) {
    this._units = value;
    this.unitNames$.next(value.map(unit => unit.name));
  }

  get units(): BookableUnit[] {
    return this._units;
  }
}
