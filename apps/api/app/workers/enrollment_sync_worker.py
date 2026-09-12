import argparse
import logging
import time

from app.core.config import settings
from app.db.session import SessionLocal
from app.services.enrollment_sync import (
    EnrollmentSyncAlreadyRunning,
    EnrollmentSyncService,
)


logger = logging.getLogger(__name__)


def run_once() -> None:
    db = SessionLocal()
    try:
        result = EnrollmentSyncService(db).run(trigger="scheduled")
        logger.info(
            "Enrollment sync completed with status=%s rows=%s skipped=%s",
            result.status,
            result.rows_processed,
            result.rows_skipped,
        )
    except EnrollmentSyncAlreadyRunning:
        logger.info("Enrollment sync skipped because another run is active.")
    finally:
        db.close()


def run_forever() -> None:
    interval_seconds = max(
        60,
        settings.enrollment_sync_interval_minutes * 60,
    )
    logger.info(
        "Enrollment sync worker started with interval=%s seconds.",
        interval_seconds,
    )
    while True:
        try:
            run_once()
        except Exception:
            logger.exception("Scheduled enrollment synchronization failed.")
        time.sleep(interval_seconds)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run enrollment synchronization.")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run one synchronization and exit.",
    )
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)

    if not settings.enrollment_sync_enabled:
        logger.info("Enrollment synchronization is disabled.")
        return

    if args.once:
        run_once()
    else:
        run_forever()


if __name__ == "__main__":
    main()
