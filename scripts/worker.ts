import "dotenv/config";
import { runPendingJobs } from "../src/server/jobs/queue";
import { logger } from "../src/server/log";

const poll = Number(process.env.JOBS_POLL_MS ?? 1000);
logger.info("worker_started", { poll });
async function loop() {
  try {
    const n = await runPendingJobs(10);
    if (n > 0) logger.debug("worker_ran", { n });
  } catch (e) {
    logger.error("worker_loop_error", { error: String(e) });
  }
  setTimeout(loop, poll);
}
loop();
