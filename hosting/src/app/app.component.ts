import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {collection, collectionData, Firestore, limit, query, where} from '@angular/fire/firestore';
import {AsyncPipe, NgForOf} from '@angular/common';
import {AuthComponent} from './auth/auth.component';
import {Auth, user} from '@angular/fire/auth';
import {map, Observable} from 'rxjs';
import {WeekTableComponent} from './week-table.component';
import {BookableUnit, ConfigData, PricingTier, Reservation, WeekConfig} from './types';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    AuthComponent,
    WeekTableComponent,
    NgForOf,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly auth = inject(Auth);
  user$ = user(this.auth);
  private readonly firestore = inject(Firestore);

  title = 'Reservations-App';

  // Eventually, this will be dynamic…
  configYear = 2025;
  weeks$: Observable<WeekConfig[]>;
  reservations$: Observable<Reservation[]>;
  units$: Observable<BookableUnit[]>;
  pricingTiers$: Observable<{ [key: string]: PricingTier }>;

  constructor() {
    // Get the bookable unit documents … with the ID field.
    const bookableUnitsCollection = collection(this.firestore, 'units').withConverter<BookableUnit>({
      fromFirestore: snapshot => {
        const {name} = snapshot.data();
        const {id} = snapshot;
        return {id, name};
      },
      toFirestore: (it: any) => it,
    });
    this.units$ = collectionData(bookableUnitsCollection).pipe();

    // Get the pricing tier documents … with the ID field.
    // Also, store as a map from id to pricing tier.
    const pricingTiersCollection = collection(this.firestore, 'pricingTiers').withConverter<PricingTier>({
      fromFirestore: snapshot => {
        const {name, color} = snapshot.data();
        const {id} = snapshot;
        return {id, name, color};
      },
      toFirestore: (it: any) => it,
    });
    this.pricingTiers$ = collectionData(pricingTiersCollection).pipe(
      map(
        it => {
          return it.reduce((acc, tier) => {
            acc[tier.id] = tier;
            return acc;
          }, {} as { [key: string]: PricingTier });
        }
      )
    );

    const weeksCollection = collection(this.firestore, 'weeks');
    const weeksQuery = query(weeksCollection, where('year', '==', this.configYear), limit(1));
    this.weeks$ = collectionData(weeksQuery).pipe(
      map((it) => it[0] as ConfigData),
      map((it) => it?.weeks || []),
    );

    const reservationsCollection = collection(this.firestore, 'reservations');
    const reservationsQuery = query(reservationsCollection, where('startDate', '>=', String(this.configYear)), where('endDate', '<', String(this.configYear + 1)));
    this.reservations$ = collectionData(reservationsQuery).pipe() as Observable<Reservation[]>;
  }
}
