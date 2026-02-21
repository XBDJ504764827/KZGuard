CREATE TABLE IF NOT EXISTS whitelist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    steam_id VARCHAR(32) NOT NULL UNIQUE,
    steam_id_64 VARCHAR(32) UNIQUE,
    name VARCHAR(128) NOT NULL,
    status ENUM('approved', 'pending', 'rejected') NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reject_reason TEXT NULL,
    admin_name VARCHAR(255) NULL
);
