import {inject, Injectable, signal, Signal} from '@angular/core';
import {BehaviorSubject, catchError, filter, map, Observable, Subscription} from 'rxjs';
import {
  BookableUnit,
  Booker,
  ConfigData,
  Permissions,
  PricingTier,
  PricingTierMap,
  ReservableWeek,
  Reservation,
  ReservationRoundsConfig,
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
import {Auth} from '@angular/fire/auth';
import {toSignal} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly firestore: Firestore;
  private readonly auth = inject(Auth);

  bookers: Signal<Booker[]>;
  permissions$: Observable<Permissions>;
  pricingTiers$: Observable<PricingTierMap>;
  readonly reservationRoundsConfig$;
  readonly reservations$: BehaviorSubject<Reservation[]>;
  reservationWeekCounts$: Observable<{ [key: string]: number }>;
  units$: Observable<BookableUnit[]>;
  readonly unitPricing$: BehaviorSubject<UnitPricingMap>;
  weeks$: BehaviorSubject<ReservableWeek[]>;

  private readonly reservationsCollection;

  activeYear = new BehaviorSubject(2025);
  // FIXME: query for years present in weeks collection
  availableYears = signal([2025, 2026, 2027]);

  constructor(firestore: Firestore) {
    this.firestore = firestore;

    this.permissions$ = collectionData(
      collection(firestore, 'permissions')
    ).pipe(
      filter(it => !!it),
      map(it => it[0] as Permissions),
      catchError((_error, caught) => caught),
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

    const unitPricingCollection = collection(firestore, 'unitPricing')
    const weeksCollection = collection(firestore, 'weeks');
    const reservationRoundsCollection = collection(firestore, 'reservationRounds');
    this.reservationsCollection = collection(firestore, 'reservations').withConverter<Reservation>({
      fromFirestore: snapshot => {
        const {startDate, endDate, unitId, guestName, bookerId} = snapshot.data();
        const {id} = snapshot;
        return {id, startDate, endDate, unitId, guestName, bookerId};
      },
      toFirestore: (it: any) => it,
    });

    this.reservationRoundsConfig$ = new BehaviorSubject({
      year: 1900,
      rounds: [],
      startDate: `1900-01-01`
    } as ReservationRoundsConfig);
    this.reservations$ = new BehaviorSubject([] as Reservation[]);
    this.unitPricing$ = new BehaviorSubject({} as UnitPricingMap);
    this.weeks$ = new BehaviorSubject([] as ReservableWeek[]);

    let reservationRoundsConfigSubscription: Subscription;
    let reservationsSubscription: Subscription;
    let weeksSubscription: Subscription;
    let unitPricingSubscription: Subscription;

    this.activeYear.subscribe(year => {
      console.info(`Using data for year: ${year}`);

      reservationRoundsConfigSubscription?.unsubscribe();
      const reservationRoundsQuery = query(reservationRoundsCollection, where('year', '==', year), limit(1));
      reservationRoundsConfigSubscription = collectionData(reservationRoundsQuery).subscribe((it) => {
        if (it.length === 0) {
          this.reservationRoundsConfig$.next({
            year: year,
            rounds: [],
            startDate: `${year}-01-01`
          } as ReservationRoundsConfig);
        } else {
          this.reservationRoundsConfig$.next(it[0] as ReservationRoundsConfig);
        }
      });

      reservationsSubscription?.unsubscribe();
      const reservationsQuery = query(this.reservationsCollection, where('startDate', '>=', String(year)), where('endDate', '<', String(year + 1)));
      reservationsSubscription = collectionData(reservationsQuery).subscribe((it) => {
        this.reservations$.next(it as Reservation[]);
      });

      unitPricingSubscription?.unsubscribe();
      const unitPricingQuery = query(unitPricingCollection, where('year', '==', year));
      unitPricingSubscription = collectionData(unitPricingQuery).subscribe((it) => {
        this.unitPricing$.next(this.unitPricingsToMap(it as UnitPricing[]));
      });

      weeksSubscription?.unsubscribe();
      const weeksQuery = query(weeksCollection, where('year', '==', year), limit(1));
      weeksSubscription = collectionData(weeksQuery).subscribe((it) => {
        if (it.length === 0) {
          this.weeks$.next([] as ReservableWeek[]);
        } else {
          const configData = it[0] as ConfigData;
          this.weeks$.next(configData.weeks as ReservableWeek[]);
        }
      });
    });

    // Data not connected to years
    const bookersCollection = collection(firestore, 'bookers').withConverter<Booker>({
      // We need this to add in the id field.
      fromFirestore: snapshot => {
        const {name, userId} = snapshot.data();
        const {id} = snapshot;
        return {id, name, userId};
      },
      toFirestore: (it: any) => it,
    });
    this.bookers = toSignal(collectionData(bookersCollection).pipe(
      catchError((_error, caught) => caught)
    ), {initialValue: []});

    const bookableUnitsCollection = collection(firestore, 'units').withConverter<BookableUnit>({
      // We need this to add in the id field.
      fromFirestore: snapshot => {
        const {name} = snapshot.data();
        const {id} = snapshot;
        return {id, name};
      },
      toFirestore: (it: any) => it,
    });
    this.units$ = collectionData(bookableUnitsCollection).pipe();

    this.reservationWeekCounts$ = this.reservations$.pipe(
      map(this.reservationsToMap)
    );
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

  private reservationsToMap(reservations: Reservation[]): { [key: string]: number } {
    return reservations.reduce((acc, reservation) => {
      const key = reservation.bookerId;
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key]++;
      return acc;
    }, {} as { [key: string]: number });
  }

  private unitPricingsToMap(unitPricings: UnitPricing[]): UnitPricingMap {
    return unitPricings.reduce((acc, unitPricing) => {
      const key = unitPricing.unitId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(unitPricing);
      return acc;
    }, {} as UnitPricingMap);
  }
}
