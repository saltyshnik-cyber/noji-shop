export type CdekPvz = {
  code: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  workTime: string | null;
  coordinates: { lat: number; lon: number } | null;
};
