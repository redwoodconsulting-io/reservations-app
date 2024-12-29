export interface WeekConfig {
  startDate: string;
  pricingTierId: string;
}

export interface ConfigData {
  year: number;
  weeks: WeekConfig[];
}

export interface BookableUnit {
  id: string;
  name: string;
}

export interface Reservation {
  startDate: string;
  endDate: string;
  unitId: string;
  guestName: string;
}

export interface PricingTier {
  id: string;
  name: string;
  color: number[];
}

export type PricingTierMap = { [key: string]: PricingTier };
