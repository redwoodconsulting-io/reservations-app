import {Pipe, PipeTransform} from '@angular/core';
import {CurrencyPipe as _CurrencyPipe} from '@angular/common';

@Pipe({
  name: 'currency',
  standalone: true
})
export class CurrencyPipe implements PipeTransform {

  transform(value: number | undefined): string {
    return new _CurrencyPipe('en-US').transform(value, "USD", "symbol", "1.0-0") || "–";
  }
}
