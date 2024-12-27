export interface WeekConfig {
  startDate: string;
}

export interface ConfigData {
  year: number;
  weeks: WeekConfig[];
}

export interface BookableUnit {
  name: string;
}
