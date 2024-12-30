export interface BookableUnit {
  id: string;
  name: string;
}

export interface Booker {
  id: string;
  name: string;
}

export interface ConfigData {
  year: number;
  weeks: ReservableWeek[];
}

export interface PricingTier {
  id: string;
  name: string;
  color: number[];
}
export type PricingTierMap = { [key: string]: PricingTier };

export interface ReservableWeek {
  startDate: string;
  pricingTierId: string;
}

export interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  unitId: string;
  guestName: string;
  bookerId: string;
}

export interface UnitPricing {
  year: number;
  tierId: string;
  unitId: string;
  weeklyPrice: number;
  dailyPrice: number;
}
// Map from unit ID to array of unit pricings (identified by tiers).
export type UnitPricingMap = { [key: string]: UnitPricing[] };
