/**
 * 라이브러리 없이 TSV(탭 구분) 텍스트를 파싱하는 유틸리티.
 *
 * - 탭(\t)을 칼럼 구분자로 사용합니다.
 * - 배열 형태 컬럼(예: ["떡볶이","순대"])을 자동으로 string[] 로 변환합니다.
 */

/**
 * TSV 한 줄을 탭 기준으로 필드 배열로 분리합니다.
 */
function parseTsvLine(line: string): string[] {
  return line.split('\t');
}

/**
 * 문자열이 JSON 배열 형태(["...", "..."])인지 판별합니다.
 */
function isArrayField(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('[') && trimmed.endsWith(']');
}

/**
 * 배열 형태 문자열을 string[]로 파싱합니다.
 * 예: '[떡볶이,순대]' → ["떡볶이", "순대"]
 * 괄호 안의 쉼표는 구분자로 취급하지 않습니다. 예: [아메리카노(1,900)] → ["아메리카노(1,900)"]
 */
function parseArrayField(value: string): string[] {
  const trimmed = value.trim();
  // 대괄호 제거
  const inner = trimmed.slice(1, -1).trim();
  if (inner.length === 0) return [];

  const items: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];

    if (char === '(') {
      parenDepth++;
    } else if (char === ')') {
      parenDepth--;
    }

    if (char === ',' && parenDepth === 0) {
      items.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    items.push(current.trim());
  }

  return items;
}

/**
 * CSV 텍스트를 Record 배열로 파싱합니다.
 * 첫 번째 줄은 헤더로 사용됩니다.
 * 배열 형태 컬럼은 자동으로 string[]로 변환됩니다.
 *
 * @param csvText - CSV 원본 텍스트
 * @returns 파싱된 객체 배열
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCsv<T = Record<string, any>>(csvText: string): T[] {
  const lines = csvText
    .split('\n')
    .map((line) => line.replace(/\r$/, '')) // Windows 줄바꿈 대응
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseTsvLine(lines[0]);
  const results: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseTsvLine(lines[i]);
    const obj: Record<string, unknown> = {};

    headers.forEach((header, idx) => {
      const raw = idx < values.length ? values[idx] : '';
      obj[header] = isArrayField(raw) ? parseArrayField(raw) : raw;
    });

    results.push(obj as T);
  }

  return results;
}

/**
 * CSV 파일을 fetch 하여 특정 region의 데이터만 필터링하여 반환합니다.
 *
 * @param csvUrl - CSV 파일 경로 (예: '/data/restaurants.csv')
 * @param region - 필터링할 지역 값 (예: '서대문', '신촌')
 * @returns 해당 지역의 데이터 배열
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchCsvByRegion<T = Record<string, any>>(
  csvUrl: string,
  region: string
): Promise<T[]> {
  const response = await fetch(csvUrl);
  const text = await response.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all = parseCsv<T & { region: string }>(text) as any[];
  return all.filter((item) => item.region === region) as T[];
}
