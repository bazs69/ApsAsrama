export function formatEventTitle(rawTitle: string): string {
  // Convert something like "SYSTEM_CONFIGURATION_CHANGED" to "System Configuration Changed"
  if (rawTitle.includes("_") || rawTitle === rawTitle.toUpperCase()) {
    return rawTitle
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }
  return rawTitle
}

export function formatEventDescription(description: string, metadata?: Record<string, unknown>): string {
  let formatted = description
  
  // Minimal templating if needed, or just append relevant metadata
  if (metadata) {
    if (metadata.ipAddress) {
      formatted += ` (IP: ${metadata.ipAddress})`
    }
    if (metadata.user) {
      formatted += ` by ${metadata.user}`
    }
  }
  
  return formatted
}
