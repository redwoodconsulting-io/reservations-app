import {
  ChangeDetectionStrategy,
  Component,
  Input,
  model,
  OnDestroy,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import {DateTime} from 'luxon';
import {Booker, ReservationAuditLog} from '../types';
import {Observable, Subscription} from 'rxjs';
import {NgForOf} from '@angular/common';
import {MatList, MatListItem, MatListItemIcon, MatListItemLine, MatListItemTitle} from '@angular/material/list';
import {ShortDate} from '../utility/short-date.pipe';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'audit-log',
  templateUrl: 'audit-log.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgForOf,
    MatList,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatListItemLine,
    ShortDate,
    MatIcon
  ]
})
export class AuditLogComponent implements OnDestroy {
  _today = model(DateTime.now());

  auditLog: WritableSignal<ReservationAuditLog[]> = signal([]);

  @Input()
  bookers: Signal<Booker[]> = signal([]);

  auditLogSubscription?: Subscription = undefined;

  ngOnDestroy() {
    this.auditLogSubscription?.unsubscribe();
  }

  @Input()
  set reservationsAuditLog$(value: Observable<ReservationAuditLog[]>) {
    this.auditLogSubscription?.unsubscribe();

    this.auditLogSubscription = value.subscribe(rounds => {
      this.auditLog.set(rounds);
    });
  }

  changeType(entry: ReservationAuditLog) {
    if (entry.changes['id']?.before === entry.changes['id']?.after) {
      return 'Reservation Updated';
    } else if (entry.changes['id']?.before === undefined) {
      return 'Reservation Created';
    } else if (entry.changes['id']?.after === undefined) {
      return 'Reservation Deleted';
    } else {
      return 'Unknown Change';
    }
  }

  changeIcon(entry: ReservationAuditLog) {
    if (this.changeType(entry) === 'Reservation Updated') {
      return 'edit';
    } else if (this.changeType(entry) === 'Reservation Created') {
      return 'add';
    } else if (this.changeType(entry) === 'Reservation Deleted') {
      return 'delete';
    } else {
      return 'error';
    }
  }
}
