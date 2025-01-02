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
import {BookableUnit, Booker, ReservationAuditLog} from '../types';
import {Observable, Subscription} from 'rxjs';
import {NgForOf} from '@angular/common';
import {MatList, MatListItem, MatListItemIcon, MatListItemLine, MatListItemTitle} from '@angular/material/list';
import {ShortDate} from '../utility/short-date.pipe';
import {MatIcon} from '@angular/material/icon';
import {ShortDateTime} from '../utility/short-datetime.pipe';
import {MatAccordion, MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';

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
    MatIcon,
    ShortDateTime,
    ShortDate,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
  ]
})
export class AuditLogComponent implements OnDestroy {
  _today = model(DateTime.now());

  auditLog: WritableSignal<ReservationAuditLog[]> = signal([]);

  @Input() bookers: Signal<Booker[]> = signal([]);
  @Input() units: Signal<BookableUnit[]> = signal([]);

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
    switch (entry.changeType) {
      case 'update':
        return 'Reservation Updated';
      case 'create':
        return 'Reservation Created';
      case 'delete':
        return 'Reservation Deleted';
      default:
        return 'Unknown Change';
    }
  }

  changeIcon(entry: ReservationAuditLog) {
    switch (entry.changeType) {
      case 'update':
        return 'edit';
      case 'create':
        return 'add';
      case 'delete':
        return 'delete';
      default:
        return 'error';
    }
  }

  unitBefore(entry: ReservationAuditLog) {
    return this.units().find(unit => unit.id === entry.before['unitId']);
  }

  unitAfter(entry: ReservationAuditLog) {
    return this.units().find(unit => unit.id === entry.after['unitId']);
  }

  startDateChanged(entry: ReservationAuditLog) {
    return entry.before['startDate'] != entry.after['startDate'];
  }

  startDateBefore(entry: ReservationAuditLog) {
    if (entry.before['startDate']) {
      return DateTime.fromISO(entry.before['startDate']);
    } else {
      return undefined;
    }
  }

  startDateAfter(entry: ReservationAuditLog) {
    if (entry.after['startDate']) {
      return DateTime.fromISO(entry.after['startDate']);
    } else {
      return undefined;
    }
  }

  endDateChanged(entry: ReservationAuditLog) {
    return entry.before['endDate'] != entry.after['endDate'];
  }

  endDateBefore(entry: ReservationAuditLog) {
    if (entry.before['endDate']) {
      return DateTime.fromISO(entry.before['endDate']);
    } else {
      return undefined;
    }
  }

  endDateAfter(entry: ReservationAuditLog) {
    if (entry.after['endDate']) {
      return DateTime.fromISO(entry.after['endDate']);
    } else {
      return undefined;
    }
  }

  guestBefore(entry: ReservationAuditLog) {
    return entry.before['guestName'];
  }

  guestAfter(entry: ReservationAuditLog) {
    return entry.after['guestName'];
  }

  bookerBefore(entry: ReservationAuditLog) {
    return this.bookers().find(booker => booker.id === entry.before['bookerId']);
  }

  bookerAfter(entry: ReservationAuditLog) {
    return this.bookers().find(booker => booker.id === entry.after['bookerId']);
  }

  unitFor(entry: ReservationAuditLog) {
    const unitId = entry.before['unitId'] || entry.after['unitId'];
    return this.units().find(unit => unit.id === unitId);
  }

  startDate(entry: ReservationAuditLog) {
    return DateTime.fromISO(entry.before['startDate'] || entry.after['startDate']);
  }

  endDate(entry: ReservationAuditLog) {
    return DateTime.fromISO(entry.before['endDate'] || entry.after['endDate']);
  }

  guestFor(entry: ReservationAuditLog) {
    return entry.before['guestName'] || entry.after['guestName'];
  }

  bookerFor(entry: ReservationAuditLog) {
    const bookerId = entry.before['bookerId'] || entry.after['bookerId'];
    return this.bookers().find(booker => booker.id === bookerId);
  }

  changes(entry: ReservationAuditLog) {
    const changes = [];
    for (const key in entry.before) {
      if (entry.before[key] !== entry.after[key]) {
        changes.push({key, before: entry.before[key], after: entry.after[key]});
      }
    }
    for (const key in entry.after) {
      if (entry.before[key] !== entry.after[key] && entry.before[key] === undefined) {
        changes.push({key, before: entry.before[key], after: entry.after[key]});
      }
    }
    return changes;
  }


}
