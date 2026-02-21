CREATE TABLE IF NOT EXISTS server_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    userid INT NOT NULL,
    steam_id VARCHAR(32) NOT NULL,
    steam_id_64 VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    ip VARCHAR(32) NOT NULL,
    time_connected VARCHAR(32) NOT NULL,
    ping INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY(server_id, userid),
    INDEX(server_id)
);
