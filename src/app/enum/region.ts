export type Region = '서대문' | '신촌';

/** URL 파라미터 값 → Region 매핑 (1=서대문, 2=신촌) */
export const REGION_PARAM_MAP: Record<string, Region> = {
  '1': '서대문',
  '2': '신촌',
};

/** Region → URL 파라미터 값 매핑 */
export const REGION_TO_PARAM: Record<Region, string> = {
  '서대문': '1',
  '신촌': '2',
};

/** 기본 지역 */
export const DEFAULT_REGION: Region = '서대문';

/** URL searchParams에서 Region을 파싱 */
export function parseRegionParam(param: string | null): Region {
  if (param && REGION_PARAM_MAP[param]) {
    return REGION_PARAM_MAP[param];
  }
  return DEFAULT_REGION;
}
