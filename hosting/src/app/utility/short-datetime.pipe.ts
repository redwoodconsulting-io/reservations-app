import {Pipe, PipeTransform} from '@angular/core';
import {DateTime} from 'luxon';
import {Timestamp} from '@angular/fire/firestore';

@Pipe({
  name: 'shortDateTime',
  standalone: true
})
export class ShortDateTime implements PipeTransform {
  transform(value: (DateTime | Timestamp | undefined)): string {
    if (!value) {
      return '';
    } else if (value instanceof Timestamp) {
      value = DateTime.fromMillis(value.toMillis());
    }
    return value.toFormat('LLL dd yyyy, HH:mm');
  }
}
