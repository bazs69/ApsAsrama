import { useState, useEffect } from "react"
import { getGreetingByTime, formatHijriDate, formatWIBTime, formatGregorianDate } from "@/lib/utils/dateHelpers"

export function useCurrentTime() {
  const [liveTime, setLiveTime] = useState("")
  const [liveHijri, setLiveHijri] = useState("")
  const [liveGreeting, setLiveGreeting] = useState("")
  const [liveGregorian, setLiveGregorian] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setLiveTime(formatWIBTime(now))
      setLiveHijri(formatHijriDate(now))
      setLiveGreeting(getGreetingByTime(now))
      setLiveGregorian(formatGregorianDate(now))
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return {
    liveTime,
    liveHijri,
    liveGreeting,
    liveGregorian
  }
}
