import {Component, computed, inject, OnDestroy, OnInit, signal, Signal} from '@angular/core';
import {DataService} from '../data-service';
import {MatList} from '@angular/material/list';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {map, Subscription} from 'rxjs';
import {Storage} from '@angular/fire/storage';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from "@angular/material/dialog";
import {UnitPricing} from '../types';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute} from '@angular/router';
import {MatFormField} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'unit-pricing',
  standalone: true,
  imports: [
    MatList,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatFormField,
    MatSelect,
    MatOption,
    NgForOf,
    FormsModule
  ],
  templateUrl: './unit-pricing.component.html',
})
export class UnitPricingComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(Storage);

  year: Signal<Number>
  selectedUnitId = signal('');
  units = this.dataService.units;
  unitPricing: UnitPricing[];

  unit = computed(() => {
    return this.units().find(unit => unit.id === this.selectedUnitId())
  });

  private paramSubscription?: Subscription;

  ngOnInit() {

    this.paramSubscription = this.route.paramMap.pipe(
      map(params => {
        return params.get('unitId');
      })
    ).subscribe(unitId => {
      this.selectedUnitId.set(unitId || "");
    });
  }

  ngOnDestroy() {
    this.paramSubscription?.unsubscribe();
  }

  constructor(private route: ActivatedRoute) {
    this.unitPricing = [];
    this.year = toSignal(this.dataService.activeYear, {initialValue: 0});
  }

}
