import {inject, Injectable, signal, Signal, WritableSignal} from '@angular/core';
import {BehaviorSubject, catchError, combineLatest, filter, map, Observable, Subscription} from 'rxjs';
import {
  BookableUnit,
  Booker,
  ConfigData,
  Permissions,
  PricingTier,
  PricingTierMap,
  ReservableWeek,
  Reservation,
  ReservationAuditLog,
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
import {authState} from './auth/auth.component';
import {deleteObject, listAll, ref, Storage, StorageReference, uploadBytes} from '@angular/fire/storage';
import {FLOOR_PLANS_FOLDER} from './app.config';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly firestore: Firestore;
  private readonly storage = inject(Storage);
  private readonly auth = inject(Auth);

  bookers: Signal<Booker[]>;
  permissions$: Observable<Permissions>;
  pricingTiers$: Observable<PricingTierMap>;
  readonly reservationRoundsConfig$;
  readonly reservations$: BehaviorSubject<Reservation[]>;
  readonly reservationsAuditLog$: BehaviorSubject<ReservationAuditLog[]>;
  reservationWeekCounts$: Observable<{ [key: string]: number }>;
  units: Signal<BookableUnit[]>;
  readonly unitPricing$: BehaviorSubject<UnitPricingMap>;
  weeks$: BehaviorSubject<ReservableWeek[]>;

  readonly floorPlanFilenames: Signal<string[]>;

  private readonly reservationsCollection;

  activeYear = new BehaviorSubject(2025);
  // FIXME: query for years present in weeks collection
  availableYears = signal([2025, 2026, 2027]);

  constructor(firestore: Firestore, auth: Auth) {
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
    const reservationsAuditLogCollection = collection(firestore, 'reservationsAuditLog');
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
    this.reservationsAuditLog$ = new BehaviorSubject([] as ReservationAuditLog[]);
    this.unitPricing$ = new BehaviorSubject({} as UnitPricingMap);
    this.weeks$ = new BehaviorSubject([] as ReservableWeek[]);

    let reservationRoundsConfigSubscription: Subscription;
    let reservationsAuditLogSubscription: Subscription;
    let reservationsSubscription: Subscription;
    let weeksSubscription: Subscription;
    let unitPricingSubscription: Subscription;

    // Reset the data when the user changes.
    const a = authState(auth);
    combineLatest([this.activeYear, a]).subscribe(([year, user]) => {
      console.info(`Using data for year: ${year}`);

      // If the user is not logged in, don't bother fetching data.
      // (It will be denied by permissions anyway.)
      if (!user) {
        reservationRoundsConfigSubscription?.unsubscribe();
        reservationsSubscription?.unsubscribe();
        weeksSubscription?.unsubscribe();
        return;
      }

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

      reservationsAuditLogSubscription?.unsubscribe();
      const reservationsAuditLogQuery = query(reservationsAuditLogCollection, where('year', '==', year));
      reservationsAuditLogSubscription = collectionData(reservationsAuditLogQuery).subscribe((it) => {
        const sorted = (it as ReservationAuditLog[]).sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        this.reservationsAuditLog$.next(sorted);
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

    // Data not connected to years:

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
        const {name, floorPlanFilename} = snapshot.data();
        const {id} = snapshot;
        return {id, name, floorPlanFilename: floorPlanFilename};
      },
      toFirestore: (it: any) => it,
    });
    this.units = toSignal(collectionData(bookableUnitsCollection).pipe(
      catchError((_error, caught) => caught)
    ), {initialValue: []});

    this.reservationWeekCounts$ = this.reservations$.pipe(
      map(this.reservationsToMap)
    );

    this.floorPlanFilenames = signal<string[]>([])
    this.refreshFloorPlans()
  }

  updateUnit(unit: BookableUnit) {
    if (!unit.id) {
      throw new Error('Unit ID must be set.');
    }
    const unitsCollection = collection(this.firestore, 'units');
    const existingRef = doc(unitsCollection, unit.id);
    return updateDoc(existingRef, {...unit});
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

  async deleteFloorPlan(storageRef: StorageReference) {
    await deleteObject(storageRef);
    this.refreshFloorPlans();
  }

  async uploadFloorPlan(storageRef: StorageReference, file: File) {
    await uploadBytes(storageRef, file);
    this.refreshFloorPlans();
  }

  private refreshFloorPlans() {
    const floorPlansRoot = ref(this.storage, FLOOR_PLANS_FOLDER);
    listAll(floorPlansRoot).then(listResult => {
      const items = listResult.items.map(it => it.name);
      (this.floorPlanFilenames as WritableSignal<string[]>).set(items)
    });

  }
}
