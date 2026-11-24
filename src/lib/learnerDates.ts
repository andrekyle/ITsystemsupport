export function latestIsoDate(...values: (string | null | undefined)[]): string | null {
  const dates = values
    .map(value => value?.slice(0, 10))
    .filter((value): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort();
  return dates[dates.length - 1] ?? null;
}

export function learnerAttendanceStartDate(
  enrolmentSignedDate: string | null | undefined,
  firstSignedDate: string | null | undefined,
): string | null {
  return latestIsoDate(firstSignedDate) ?? latestIsoDate(enrolmentSignedDate);
}
