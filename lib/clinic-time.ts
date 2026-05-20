export const CLINIC_TIME_ZONE = "America/Costa_Rica"

function getFormatter(
  options: Intl.DateTimeFormatOptions,
  locale = "es-CR",
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: CLINIC_TIME_ZONE,
    ...options,
  })
}

function parseDateKeyParts(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return { year, month, day }
}

export function getClinicLocalParts(isoString: string) {
  const parts = getFormatter({
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(isoString))

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00"
  const hour = String(Number(get("hour")) % 24).padStart(2, "0")

  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    timeKey: `${hour}:${get("minute")}`,
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(hour),
    minute: Number(get("minute")),
  }
}

export function getClinicLocalSlot(isoString: string, slotMinutes = 30) {
  const local = getClinicLocalParts(isoString)
  const totalMinutes = local.hour * 60 + local.minute
  const roundedMinutes = Math.round(totalMinutes / slotMinutes) * slotMinutes
  const dayOffset = Math.floor(roundedMinutes / (24 * 60))
  const normalizedMinutes = roundedMinutes % (24 * 60)
  const hour = Math.floor(normalizedMinutes / 60)
  const minute = normalizedMinutes % 60

  return {
    dateKey: dayOffset === 0 ? local.dateKey : shiftClinicDateKey(local.dateKey, dayOffset),
    timeKey: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  }
}

export function getClinicTodayKey() {
  const parts = getFormatter({
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }, "en-CA").formatToParts(new Date())

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00"
  return `${get("year")}-${get("month")}-${get("day")}`
}

export function parseClinicDateKey(dateKey: string) {
  const { year, month, day } = parseDateKeyParts(dateKey)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

export function formatClinicDateKey(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function shiftClinicDateKey(dateKey: string, days: number) {
  const date = parseClinicDateKey(dateKey)
  date.setUTCDate(date.getUTCDate() + days)
  return formatClinicDateKey(date)
}

export function formatClinicDateFromKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions,
  locale = "es-CR",
) {
  return getFormatter(options, locale).format(parseClinicDateKey(dateKey))
}

export function formatClinicDateTime(
  isoString: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
  locale = "es-CR",
) {
  return getFormatter(options, locale).format(new Date(isoString))
}

export function formatClinicTime(
  isoString: string,
  locale = "es-CR",
) {
  return getFormatter(
    { hour: "2-digit", minute: "2-digit", hour12: false },
    locale,
  ).format(new Date(isoString))
}

export function getClinicNowDate() {
  return parseClinicDateKey(getClinicTodayKey())
}

export function clinicLocalDateTimeToIso(dateKey: string, timeKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const [hour, minute] = timeKey.split(":").map(Number)
  return new Date(Date.UTC(year, month - 1, day, hour + 6, minute, 0)).toISOString()
}

export function clinicLocalDateTimeToMs(dateKey: string, timeKey: string) {
  return new Date(clinicLocalDateTimeToIso(dateKey, timeKey)).getTime()
}

export function addMinutesToIso(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString()
}

export function getClinicAgeFromBirthDate(birthDate: string) {
  const birth = new Date(birthDate)
  const todayKey = getClinicTodayKey()
  const today = parseClinicDateKey(todayKey)

  let age = today.getUTCFullYear() - birth.getUTCFullYear()
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age--
  }

  return Number.isFinite(age) ? age : null
}
