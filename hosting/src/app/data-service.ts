import {Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {BookableUnit, ConfigData, PricingTier, ReservableWeek, Reservation} from './types';
import {collection, collectionData, Firestore, limit, query, where} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  pricingTiers$: Observable<{ [key: string]: PricingTier }>;
  reservations$: Observable<Reservation[]>;
  units$: Observable<BookableUnit[]>;
  weeks$: Observable<ReservableWeek[]>;

  // Eventually, this will be dynamic…
  configYear = 2025;

  constructor(firestore: Firestore) {
    // Get the pricing tier documents … with the ID field.
    // Also, store as a map from id to pricing tier.
    const pricingTiersCollection = collection(firestore, 'pricingTiers').withConverter<PricingTier>({
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

    const reservationsCollection = collection(firestore, 'reservations');
    const reservationsQuery = query(reservationsCollection, where('startDate', '>=', String(this.configYear)), where('endDate', '<', String(this.configYear + 1)));
    this.reservations$ = collectionData(reservationsQuery).pipe() as Observable<Reservation[]>;

    // Get the bookable unit documents … with the ID field.
    const bookableUnitsCollection = collection(firestore, 'units').withConverter<BookableUnit>({
      fromFirestore: snapshot => {
        const {name} = snapshot.data();
        const {id} = snapshot;
        return {id, name};
      },
      toFirestore: (it: any) => it,
    });
    this.units$ = collectionData(bookableUnitsCollection).pipe();

    const weeksCollection = collection(firestore, 'weeks');
    const weeksQuery = query(weeksCollection, where('year', '==', this.configYear), limit(1));
    this.weeks$ = collectionData(weeksQuery).pipe(
      map((it) => it[0] as ConfigData),
      map((it) => it?.weeks || []),
    );
  }
}
