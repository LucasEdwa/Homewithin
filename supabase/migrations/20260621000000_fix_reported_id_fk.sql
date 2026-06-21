-- Fix reported_id FK on reports and circle_reports.
-- Without ON DELETE SET NULL, deleting a user who was ever reported would fail
-- with a FK violation. Set null so reports are preserved for audit purposes.

alter table reports
  drop constraint if exists reports_reported_id_fkey,
  add constraint reports_reported_id_fkey
    foreign key (reported_id) references auth.users(id) on delete set null;

alter table circle_reports
  drop constraint if exists circle_reports_reported_id_fkey,
  add constraint circle_reports_reported_id_fkey
    foreign key (reported_id) references auth.users(id) on delete set null;
