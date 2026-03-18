import { parse, addWeeks, format, differenceInDays } from "date-fns"

export function computeDateFromFrost(year: number, frostDateMMDD: string, weeksOffset: number): string {
  const frost = parse(`${year}-${frostDateMMDD}`, "yyyy-MM-dd", new Date())
  return format(addWeeks(frost, weeksOffset), "yyyy-MM-dd")
}

export function parseFrostDate(year: number, frostDateMMDD: string): Date {
  return parse(`${year}-${frostDateMMDD}`, "yyyy-MM-dd", new Date())
}

export function frostFreeDays(lastFrostMMDD: string, firstFrostMMDD: string, year: number): number {
  const last = parse(`${year}-${lastFrostMMDD}`, "yyyy-MM-dd", new Date())
  const first = parse(`${year}-${firstFrostMMDD}`, "yyyy-MM-dd", new Date())
  return differenceInDays(first, last)
}
