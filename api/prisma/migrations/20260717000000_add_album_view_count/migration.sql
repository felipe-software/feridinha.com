ALTER TABLE "Album" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Album"
SET "viewCount" = COALESCE(cardinality("views"), 0);
