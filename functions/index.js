const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

const DAYS_TO_KEEP = 5;
const DELETE_BATCH_SIZE = 20;

exports.deleteExpiredGames = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Paris",
    region: "europe-west1",
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async () => {
    const db = admin.firestore();
    const cutoffDate = new Date(Date.now() - DAYS_TO_KEEP * 24 * 60 * 60 * 1000);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    let deletedCount = 0;

    while (true) {
      const expiredGamesSnapshot = await db
        .collection("games")
        .where("created", "<=", cutoffTimestamp)
        .limit(DELETE_BATCH_SIZE)
        .get();

      if (expiredGamesSnapshot.empty) {
        break;
      }

      for (const gameDoc of expiredGamesSnapshot.docs) {
        await db.recursiveDelete(gameDoc.ref);
        deletedCount += 1;
      }
    }

    logger.info("Expired games cleanup finished.", {
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      daysToKeep: DAYS_TO_KEEP,
    });
  }
);
