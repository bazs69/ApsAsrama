import "dotenv/config";
import { MonitoringPredicate } from "@prisma/client";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Starting data migration for Monitoring Penugasan...");

  const monitorings = await prisma.monitoringPenugasan.findMany({
    where: {
      predicate: null, // Only migrate those without a predicate
    },
  });

  console.log(`Found ${monitorings.length} records to migrate.`);

  for (const m of monitorings) {
    let newPredicate: MonitoringPredicate | null = null;
    let oldStatus = m.statusMonitoring;

    switch (oldStatus) {
      case "Sangat Aktif":
        newPredicate = "SANGAT_BAIK";
        oldStatus = "Sangat Baik";
        break;
      case "Aktif":
        newPredicate = "BAIK";
        oldStatus = "Baik";
        break;
      case "Cukup Aktif":
        newPredicate = "CUKUP";
        oldStatus = "Cukup";
        break;
      case "Kurang Aktif":
        newPredicate = "KURANG";
        oldStatus = "Kurang";
        break;
      case "Tidak Aktif":
        newPredicate = "SANGAT_KURANG";
        oldStatus = "Sangat Kurang";
        break;
      default:
        // Try to handle existing ones if they already match
        if (oldStatus === "Sangat Baik") newPredicate = "SANGAT_BAIK";
        if (oldStatus === "Baik") newPredicate = "BAIK";
        if (oldStatus === "Cukup") newPredicate = "CUKUP";
        if (oldStatus === "Kurang") newPredicate = "KURANG";
        if (oldStatus === "Sangat Kurang") newPredicate = "SANGAT_KURANG";
        break;
    }

    if (newPredicate) {
      await prisma.monitoringPenugasan.update({
        where: { id: m.id },
        data: {
          predicate: newPredicate,
          statusMonitoring: oldStatus,
          // Since it's old data, we don't have individual scores, so we can mock the averageScore based on the predicate
          averageScore: 
            newPredicate === "SANGAT_BAIK" ? 5.0 :
            newPredicate === "BAIK" ? 4.0 :
            newPredicate === "CUKUP" ? 3.0 :
            newPredicate === "KURANG" ? 2.0 : 1.0,
          totalScore:
            newPredicate === "SANGAT_BAIK" ? 30 :
            newPredicate === "BAIK" ? 24 :
            newPredicate === "CUKUP" ? 18 :
            newPredicate === "KURANG" ? 12 : 6,
        },
      });
    }
  }

  console.log("Migration completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
