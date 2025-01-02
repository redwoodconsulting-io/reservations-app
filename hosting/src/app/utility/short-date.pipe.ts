import {Pipe, PipeTransform} from '@angular/core';
import {DateTime} from 'luxon';
import {Timestamp} from '@angular/fire/firestore';

@Pipe({
  name: 'shortDate',
  standalone: true
})
export class ShortDate implements PipeTransform {
  transform(value: (DateTime | Timestamp)): string {
    if (value instanceof Timestamp) {
      value = DateTime.fromMillis(value.toMillis());
    }
    return value.toFormat('LLL dd');
  }
}
