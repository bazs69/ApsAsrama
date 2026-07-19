export function getGreetingByTime(date: Date = new Date()): string {
  const hours = date.getHours()
  if (hours >= 5 && hours < 11) return "Selamat Pagi"
  if (hours >= 11 && hours < 15) return "Selamat Siang"
  if (hours >= 15 && hours < 18) return "Selamat Sore"
  return "Selamat Malam"
}

export function formatHijriDate(date: Date = new Date()): string {
  try {
    const hijriStr = new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date)
    return `${hijriStr} H`
  } catch {
    return ""
  }
}

export function formatWIBTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds} WIB`
}

export function formatTimeOnly(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function formatGregorianDate(date: Date = new Date()): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}
