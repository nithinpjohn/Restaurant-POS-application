export const MIN_AGE = 18 // legal age for alcohol; change per jurisdiction

/** Whole years since `dob` (YYYY-MM-DD), or -1 if the date is invalid or in the future. */
export function ageOf(dob: string) {
  const d = new Date(dob)
  const now = new Date()
  if (isNaN(+d) || d > now) return -1
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}
