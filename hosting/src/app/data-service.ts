import {inject, Injectable} from '@angular/core';
import {filter, map, Observable} from 'rxjs';
import {
  BookableUnit,
  Booker,
  ConfigData,
  Permissions,
  PricingTier,
  PricingTierMap,
  ReservableWeek,
  Reservation,
  UnitPricing,
  UnitPricingMap
} from './types';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  limit,
  query,
  updateDoc,
  where
} from '@angular/fire/firestore';
import {Auth, user} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly firestore: Firestore;
  private readonly auth = inject(Auth);

  bookers$: Observable<Booker[]>;
  permissions$: Observable<Permissions>;
  pricingTiers$: Observable<PricingTierMap>;
  reservations$: Observable<Reservation[]>;
  units$: Observable<BookableUnit[]>;
  unitPricing$: Observable<UnitPricingMap>;
  weeks$: Observable<ReservableWeek[]>;

  private readonly reservationsCollection;

  // Eventually, this will be dynamic…
  configYear = 2025;

  constructor(firestore: Firestore) {
    this.firestore = firestore;

    this.permissions$ = collectionData(
      collection(firestore, 'permissions')
    ).pipe(
      filter(it => !!it),
      map(it => it[0]),
    ) as Observable<Permissions>;

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

    this.reservationsCollection = collection(firestore, 'reservations').withConverter<Reservation>({
      fromFirestore: snapshot => {
        const {startDate, endDate, unitId, guestName, bookerId} = snapshot.data();
        const {id} = snapshot;
        return {id, startDate, endDate, unitId, guestName, bookerId};
      },
      toFirestore: (it: any) => it,
    });
    const reservationsQuery = query(this.reservationsCollection, where('startDate', '>=', String(this.configYear)), where('endDate', '<', String(this.configYear + 1)));
    this.reservations$ = collectionData(reservationsQuery).pipe() as Observable<Reservation[]>;

    const bookersCollection = collection(firestore, 'bookers').withConverter<Booker>({
      fromFirestore: snapshot => {
        const {name, userId} = snapshot.data();
        const {id} = snapshot;
        return {id, name, userId};
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

  currentBooker() {
    const currentUser = this.auth.currentUser
    return this.bookers$.pipe(
      map(bookers => bookers.find(booker => booker.userId === currentUser?.uid))
    )
  }

  addReservation(reservation: Reservation) {
    if (reservation.id) {
      throw new Error('Reservation ID must not be set.');
    }
    return addDoc(collection(this.firestore, 'reservations'), reservation);
  }

  updateReservation(reservation: Reservation) {
    if (!reservation.id) {
      throw new Error('Reservation ID must be set.');
    }
    const reservationsCollection = collection(this.firestore, 'reservations');
    const existingRef = doc(reservationsCollection, reservation.id);
    return updateDoc(existingRef, {...reservation});
  }

  deleteReservation(reservationId: string) {
    if (!reservationId) {
      throw new Error('Reservation ID must be set.');
    }
    const existingRef = doc(this.reservationsCollection, reservationId);
    return deleteDoc(existingRef);
  }
}
