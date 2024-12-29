import {Pipe, PipeTransform} from '@angular/core';
import {DateTime} from 'luxon';

@Pipe({
  name: 'shortDate',
  standalone: true
})
export class ShortDate implements PipeTransform {
  transform(value: DateTime): string {
    return value.toFormat('LLL dd');
  }
}
