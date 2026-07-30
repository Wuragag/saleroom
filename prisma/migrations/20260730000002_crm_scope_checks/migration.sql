-- Scope invariant for the team-or-user scoped CRM tables: exactly one of
-- teamId/userId must be set. Both-NULL rows would be invisible to every
-- scoped query AND escape both partial unique indexes (Postgres exempts
-- NULLs), allowing silent duplicates.

ALTER TABLE "PipelineStage"
  ADD CONSTRAINT "PipelineStage_scope_check"
  CHECK (("teamId" IS NULL) <> ("userId" IS NULL));

ALTER TABLE "Company"
  ADD CONSTRAINT "Company_scope_check"
  CHECK (("teamId" IS NULL) <> ("userId" IS NULL));

ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_scope_check"
  CHECK (("teamId" IS NULL) <> ("userId" IS NULL));
