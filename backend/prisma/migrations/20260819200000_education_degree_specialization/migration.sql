-- Add degreeName + specialization to Education for post-secondary
-- levels (Diploma / UG / PG / MPhil / PhD). Both nullable so existing
-- rows keep working; the wizard prompts for them only when the level
-- benefits from a degree name (e.g. "B.Tech" + "Computer Science").
ALTER TABLE "education" ADD COLUMN "degreeName"     VARCHAR(160);
ALTER TABLE "education" ADD COLUMN "specialization" VARCHAR(160);
