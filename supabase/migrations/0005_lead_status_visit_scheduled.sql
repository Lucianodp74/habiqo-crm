-- Add visit_scheduled to pipeline (Kanban column).
alter type lead_status add value if not exists 'visit_scheduled';
