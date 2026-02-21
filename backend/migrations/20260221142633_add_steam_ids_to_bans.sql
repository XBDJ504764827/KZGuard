-- Add steam_id_3 and steam_id_64 columns to the bans table
ALTER TABLE bans ADD COLUMN steam_id_3 VARCHAR(255) NULL AFTER steam_id;
ALTER TABLE bans ADD COLUMN steam_id_64 VARCHAR(255) NULL AFTER steam_id_3;
