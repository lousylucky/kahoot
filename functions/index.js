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
    memory: "256MiB",
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
        .where("gameStatus", "==", "finished")
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

exports.markStaleGamesAsFinished = onSchedule(
  {
    schedule: "*/2 * * * *",
    timeZone: "Europe/Paris",
    region: "europe-west1",
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async () => {
    const db = admin.firestore();

    const activeGamesSnapshot = await db
      .collection("games")
      .where("gameStatus", "in", ["waiting", "in_game"])
      .get();

    if (activeGamesSnapshot.empty) {
      logger.info("No active games to check.");
      return;
    }

    let markedCount = 0;

    for (const gameDoc of activeGamesSnapshot.docs) {
      const game = gameDoc.data();
      const created = game.created.toDate();
      let timeoutMs;

      if (game.gameStatus === "waiting") {
        // 5 minutes max en attente
        timeoutMs = 5 * 60 * 1000;
      } else {
        // in_game : 2 min par question + 5 min de marge
        const questionsAgg = await db
          .collection("quizzes")
          .doc(game.quizId)
          .collection("questions")
          .count()
          .get();

        const questionCount = questionsAgg.data().count;
        timeoutMs = (2 * questionCount + 5) * 60 * 1000;
      }

      const expiryTime = new Date(created.getTime() + timeoutMs);

      if (new Date() > expiryTime) {
        await gameDoc.ref.update({ gameStatus: "finished" });
        markedCount += 1;
      }
    }

    logger.info("Stale games marked as finished.", { markedCount });
  }
);
