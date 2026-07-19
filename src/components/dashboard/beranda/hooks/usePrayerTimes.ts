import { useState, useEffect } from "react"

export interface PrayerTimes {
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  date: string;
}

export function usePrayerTimes(cityId: string = "1629") {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrayerTimes() {
      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const date = String(now.getDate()).padStart(2, '0')
        
        const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${date}`)
        const data = await res.json()
        
        if (data && data.status && data.data && data.data.jadwal) {
          const jadwal = data.data.jadwal
          setPrayerTimes({
            imsak: jadwal.imsak,
            subuh: jadwal.subuh,
            terbit: jadwal.terbit,
            dhuha: jadwal.dhuha,
            dzuhur: jadwal.dzuhur,
            ashar: jadwal.ashar,
            maghrib: jadwal.maghrib,
            isya: jadwal.isya,
            date: jadwal.tanggal
          })
        } else {
          throw new Error("Invalid API response")
        }
      } catch (error) {
        console.error("Failed to fetch prayer times:", error)
        // Fallback to mock data if API fails
        setPrayerTimes({
          imsak: "04:11",
          subuh: "04:21",
          terbit: "05:38",
          dhuha: "06:07",
          dzuhur: "11:36",
          ashar: "14:56",
          maghrib: "17:27",
          isya: "18:41",
          date: "18 Juli 2026"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPrayerTimes()
  }, [cityId])

  return { prayerTimes, loading }
}
