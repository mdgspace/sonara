
export type FilterType = 'low-pass' | 'high-pass' | 'band-pass';

export interface Filter {
  type: FilterType;
  frequency: number;
  q: number;
}