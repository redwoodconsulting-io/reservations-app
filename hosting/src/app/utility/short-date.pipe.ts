import {Pipe, PipeTransform} from '@angular/core';
@Pipe({
  name: 'shortDate',
  standalone: true
})
export class ShortDate implements PipeTransform {
  transform(value: Date): string {
    return value.toLocaleString('default', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
}
