import {Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {
  BookableUnit,
  Booker,
  ConfigData,
  PricingTier,
  PricingTierMap,
  ReservableWeek,
  Reservation,
  UnitPricing,
  UnitPricingMap
} from './types';
import {addDoc, collection, collectionData, Firestore, limit, query, where} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly firestore: Firestore;

  bookers$: Observable<Booker[]>;
  pricingTiers$: Observable<PricingTierMap>;
  reservations$: Observable<Reservation[]>;
  units$: Observable<BookableUnit[]>;
  unitPricing$: Observable<UnitPricingMap>;
  weeks$: Observable<ReservableWeek[]>;

  // Eventually, this will be dynamic…
  configYear = 2025;

  constructor(firestore: Firestore) {
    this.firestore = firestore;

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

    const bookersCollection = collection(firestore, 'bookers').withConverter<Booker>({
      fromFirestore: snapshot => {
        const {name} = snapshot.data();
        const {id} = snapshot;
        return {id, name};
      },
      toFirestore: (it: any) => it,
    });
    this.bookers$ = collectionData(bookersCollection).pipe();

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

    const unitPricingCollection = collection(firestore, 'unitPricing')
    this.unitPricing$ = collectionData(unitPricingCollection).pipe(
      map(it => it as UnitPricing[]),
      map(
        it => {
          return it.reduce((acc, unitPricing) => {
            const key = unitPricing.unitId;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(unitPricing);
            return acc;
          }, {} as UnitPricingMap);
        }
      )
    )

    const weeksCollection = collection(firestore, 'weeks');
    const weeksQuery = query(weeksCollection, where('year', '==', this.configYear), limit(1));
    this.weeks$ = collectionData(weeksQuery).pipe(
      map((it) => it[0] as ConfigData),
      map((it) => it?.weeks || []),
    );
  }

  addReservation(reservation: Reservation) {
    return addDoc(collection(this.firestore, 'reservations'), reservation);
  }
}
