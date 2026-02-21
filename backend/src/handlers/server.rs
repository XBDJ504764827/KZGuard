use axum::{
    extract::{Path, State, Json, Extension},
    http::StatusCode,
    response::IntoResponse,
};
use std::sync::Arc;
use crate::AppState;
use crate::models::server::{
    ServerGroup, Server, GroupWithServers, 
    CreateGroupRequest, CreateServerRequest, UpdateServerRequest, CheckServerRequest
};
use crate::handlers::auth::Claims;
use crate::utils::log_admin_action; // Ensure this is accessible
use crate::utils::rcon::check_rcon;

// --- Groups ---

#[utoipa::path(
    get,
    path = "/api/server-groups",
    responses(
        (status = 200, description = "List server groups with servers", body = Vec<GroupWithServers>)
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn list_server_groups(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    // Fetch all groups
    let groups = sqlx::query_as::<_, ServerGroup>("SELECT * FROM server_groups ORDER BY id ASC")
        .fetch_all(&state.db)
        .await
        .unwrap_or_default();

    // Fetch all servers
    let servers = sqlx::query_as::<_, Server>("SELECT * FROM servers")
        .fetch_all(&state.db)
        .await
        .unwrap_or_default();

    // Combine
    let mut result = Vec::new();
    for g in groups {
        let group_servers: Vec<Server> = servers.iter()
            .filter(|s| s.group_id == g.id)
            .map(|s| Server {
                id: s.id,
                group_id: s.group_id,
                name: s.name.clone(),
                ip: s.ip.clone(),
                port: s.port,
                rcon_password: s.rcon_password.clone(),
                created_at: s.created_at,
                verification_enabled: s.verification_enabled,
                required_rating: s.required_rating,
                required_level: s.required_level,
                whitelist_only: s.whitelist_only,
            })
            .collect();

        result.push(GroupWithServers {
            id: g.id,
            name: g.name,
            servers: group_servers,
        });
    }

    (StatusCode::OK, Json(result)).into_response()
}

#[utoipa::path(
    post,
    path = "/api/server-groups",
    request_body = CreateGroupRequest,
    responses(
        (status = 201, description = "Group created"),
        (status = 500, description = "Server Error")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn create_group(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<Claims>,
    Json(payload): Json<CreateGroupRequest>,
) -> impl IntoResponse {
    let result = sqlx::query("INSERT INTO server_groups (name) VALUES (?)")
        .bind(&payload.name)
        .execute(&state.db)
        .await;

    match result {
        Ok(_) => {
             let _ = log_admin_action(&state.db, &user.sub, "create_group", &payload.name, "Created server group").await;
            (StatusCode::CREATED, Json("Group created")).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[utoipa::path(
    delete,
    path = "/api/server-groups/{id}",
    params(
        ("id" = i64, Path, description = "Group ID")
    ),
    responses(
        (status = 200, description = "Group deleted")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn delete_group(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<Claims>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    let result = sqlx::query("DELETE FROM server_groups WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await;

    match result {
        Ok(_) => {
            let _ = log_admin_action(&state.db, &user.sub, "delete_group", &format!("ID: {}", id), "Deleted server group").await;
            (StatusCode::OK, Json("Group deleted")).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

// --- Servers ---

#[utoipa::path(
    post,
    path = "/api/servers",
    request_body = CreateServerRequest,
    responses(
        (status = 201, description = "Server created")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn create_server(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<Claims>,
    Json(payload): Json<CreateServerRequest>,
) -> impl IntoResponse {
    let result = sqlx::query(
        "INSERT INTO servers (group_id, name, ip, port, rcon_password, verification_enabled, required_rating, required_level, whitelist_only) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(payload.group_id)
    .bind(&payload.name)
    .bind(&payload.ip)
    .bind(payload.port)
    .bind(&payload.rcon_password)
    .bind(payload.verification_enabled.unwrap_or(true))
    .bind(payload.required_rating.unwrap_or(3.0))
    .bind(payload.required_level.unwrap_or(1))
    .bind(payload.whitelist_only.unwrap_or(false))
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => {
             let _ = log_admin_action(&state.db, &user.sub, "create_server", &payload.name, &format!("{}:{}", payload.ip, payload.port)).await;
            (StatusCode::CREATED, Json("Server created")).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[utoipa::path(
    put,
    path = "/api/servers/{id}",
    params(
        ("id" = i64, Path, description = "Server ID")
    ),
    request_body = UpdateServerRequest,
    responses(
        (status = 200, description = "Server updated")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn update_server(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<Claims>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateServerRequest>,
) -> impl IntoResponse {
    if let Some(name) = payload.name {
        let _ = sqlx::query("UPDATE servers SET name = ? WHERE id = ?").bind(name).bind(id).execute(&state.db).await;
    }
    if let Some(ip) = payload.ip {
        let _ = sqlx::query("UPDATE servers SET ip = ? WHERE id = ?").bind(ip).bind(id).execute(&state.db).await;
    }
    if let Some(port) = payload.port {
        let _ = sqlx::query("UPDATE servers SET port = ? WHERE id = ?").bind(port).bind(id).execute(&state.db).await;
    }
    if let Some(pwd) = payload.rcon_password {
        let _ = sqlx::query("UPDATE servers SET rcon_password = ? WHERE id = ?").bind(pwd).bind(id).execute(&state.db).await;
    }
    if let Some(verif) = payload.verification_enabled {
        let _ = sqlx::query("UPDATE servers SET verification_enabled = ? WHERE id = ?").bind(verif).bind(id).execute(&state.db).await;
    }
    if let Some(rating) = payload.required_rating {
        let _ = sqlx::query("UPDATE servers SET required_rating = ? WHERE id = ?").bind(rating).bind(id).execute(&state.db).await;
    }
    if let Some(level) = payload.required_level {
        let _ = sqlx::query("UPDATE servers SET required_level = ? WHERE id = ?").bind(level).bind(id).execute(&state.db).await;
    }
    if let Some(whitelist) = payload.whitelist_only {
        let _ = sqlx::query("UPDATE servers SET whitelist_only = ? WHERE id = ?").bind(whitelist).bind(id).execute(&state.db).await;
    }

     let _ = log_admin_action(&state.db, &user.sub, "update_server", &format!("ID: {}", id), "Updated server").await;

    (StatusCode::OK, Json("Server updated")).into_response()
}

#[utoipa::path(
    delete,
    path = "/api/servers/{id}",
    params(
        ("id" = i64, Path, description = "Server ID")
    ),
    responses(
        (status = 200, description = "Server deleted")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn delete_server(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<Claims>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    let result = sqlx::query("DELETE FROM servers WHERE id = ?")
        .bind(id)
        .execute(&state.db)
        .await;

    match result {
        Ok(_) => {
            let _ = log_admin_action(&state.db, &user.sub, "delete_server", &format!("ID: {}", id), "Deleted server").await;
            (StatusCode::OK, Json("Server deleted")).into_response()
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

// --- Status Check ---

#[utoipa::path(
    post,
    path = "/api/servers/check",
    request_body = CheckServerRequest,
    responses(
        (status = 200, description = "Connected successfully"),
        (status = 400, description = "Connection failed")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn check_server_status(
    Json(payload): Json<CheckServerRequest>,
) -> impl IntoResponse {
    let address = format!("{}:{}", payload.ip, payload.port);
    
    // Attempt RCON connection
    // Note: rcon crate usage depends on version. rcon 0.6.0 typically: 
    // Connection::builder().connect("address", "password").await
    

    let pwd = payload.rcon_password.unwrap_or_default();
    
    match check_rcon(&address, &pwd).await {
        Ok(_) => {
            (StatusCode::OK, Json("Connected successfully")).into_response()
        },
        Err(e) => {
            (StatusCode::BAD_REQUEST, Json(format!("Connection failed: {}", e))).into_response()
        }
    }
}


// --- Player Management ---

use serde::{Serialize, Deserialize};
use regex::Regex;
use crate::utils::rcon::send_command;

#[derive(Serialize, utoipa::ToSchema)]
pub struct Player {
    pub userid: i32,
    pub name: String,
    pub steam_id: String,
    pub time: String,
    pub ping: i32,
}

#[derive(Deserialize, utoipa::ToSchema)]
pub struct KickPlayerRequest {
    pub userid: i32,
    pub reason: Option<String>,
}

#[derive(Deserialize, utoipa::ToSchema)]
pub struct BanPlayerRequest {
    pub userid: i32,
    pub duration: i32, // minutes, 0 = permanent
    pub reason: Option<String>,
}

#[utoipa::path(
    get,
    path = "/api/servers/{id}/players",
    params(
        ("id" = i64, Path, description = "Server ID")
    ),
    responses(
        (status = 200, description = "List players", body = Vec<Player>),
        (status = 404, description = "Server not found")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn get_server_players(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
) -> impl IntoResponse {
    // Get server info
    let server = sqlx::query_as::<_, Server>("SELECT * FROM servers WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

    let server = match server {
        Some(s) => s,
        None => return (StatusCode::NOT_FOUND, "Server not found").into_response(),
    };

    let address = format!("{}:{}", server.ip, server.port);
    let pwd = server.rcon_password.unwrap_or_default();

    match send_command(&address, &pwd, "status").await {
        Ok(output) => {
            tracing::info!("RCON 'status' output: \n{}", output); // Debug log

            let mut players = Vec::new();
            // Regex to parse status output
            // Regex: #\s*(\d+)\s+\d+\s+"(.+?)"\s+(\S+)\s+(\S+)\s+(\d+)
            // Output format: # userid slot "name" steamid time ping ...
            let re = Regex::new(r#"#\s+(\d+)\s+\d+\s+"(.+?)"\s+(\S+)\s+(\S+)\s+(\d+)"#).unwrap();

            for cap in re.captures_iter(&output) {
                 let userid = cap[1].parse::<i32>().unwrap_or(-1);
                 let name = cap[2].to_string();
                 let steam_id = cap[3].to_string();
                 let time = cap[4].to_string();
                 let ping = cap[5].parse::<i32>().unwrap_or(0);

                 players.push(Player {
                     userid,
                     name,
                     steam_id,
                     time,
                     ping,
                 });
            }

            (StatusCode::OK, Json(players)).into_response()
        },
        Err(e) => (StatusCode::BAD_REQUEST, Json(format!("RCON Error: {}", e))).into_response(),
    }
}

#[utoipa::path(
    post,
    path = "/api/servers/{id}/kick",
    params(
        ("id" = i64, Path, description = "Server ID")
    ),
    request_body = KickPlayerRequest,
    responses(
        (status = 200, description = "Player kicked")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn kick_player(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<Claims>,
    Path(id): Path<i64>,
    Json(payload): Json<KickPlayerRequest>,
) -> impl IntoResponse {
     let server = sqlx::query_as::<_, Server>("SELECT * FROM servers WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

    let server = match server {
        Some(s) => s,
        None => return (StatusCode::NOT_FOUND, "Server not found").into_response(),
    };

    let address = format!("{}:{}", server.ip, server.port);
    let pwd = server.rcon_password.unwrap_or_default();
    
    // Command: sm_kick #<userid> [reason]
    let reason = payload.reason.unwrap_or("Kicked by admin".to_string());
    let command = format!("sm_kick #{} \"{}\"", payload.userid, reason);

    match send_command(&address, &pwd, &command).await {
        Ok(_) => {
             let _ = log_admin_action(
                &state.db, 
                &user.sub, 
                "kick_player", 
                &format!("Server: {}, UserID: {}", server.name, payload.userid), 
                &format!("Reason: {}", reason)
            ).await;
            (StatusCode::OK, Json("Player kicked")).into_response()
        },
        Err(e) => (StatusCode::BAD_REQUEST, Json(format!("Failed to kick: {}", e))).into_response(),
    }
}

#[utoipa::path(
    post,
    path = "/api/servers/{id}/ban",
    params(
        ("id" = i64, Path, description = "Server ID")
    ),
    request_body = BanPlayerRequest,
    responses(
        (status = 200, description = "Player banned")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn ban_player(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<Claims>,
    Path(id): Path<i64>,
    Json(payload): Json<BanPlayerRequest>,
) -> impl IntoResponse {
     let server = sqlx::query_as::<_, Server>("SELECT * FROM servers WHERE id = ?")
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .unwrap_or(None);

    let server = match server {
        Some(s) => s,
        None => return (StatusCode::NOT_FOUND, "Server not found").into_response(),
    };

    let address = format!("{}:{}", server.ip, server.port);
    let pwd = server.rcon_password.unwrap_or_default();
    
    // 1. Get Player Info from "status"
    // We need SteamID and IP to ban properly in DB
    let player_info = match send_command(&address, &pwd, "status").await {
        Ok(output) => {
            let mut found = None;
            let test_re = Regex::new(&format!(r#"#\s+{}\s+"#, payload.userid)).unwrap();
            let ip_re = Regex::new(r#"#\s+\d+\s+(?:\d+\s+)?"(.+?)"\s+(\S+)\s+.*\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"#).unwrap();
            let basic_re = Regex::new(r#"#\s+\d+\s+(?:\d+\s+)?"(.+?)"\s+(\S+)"#).unwrap();

            for line in output.lines() {
                 if test_re.is_match(line) {
                     // Try to get Name, SteamID, and IP
                     if let Some(cap) = ip_re.captures(line) {
                         found = Some((cap[1].to_string(), cap[2].to_string(), cap[3].to_string()));
                     } else if let Some(cap) = basic_re.captures(line) {
                         found = Some((cap[1].to_string(), cap[2].to_string(), "0.0.0.0".to_string()));
                     }
                     break;
                 }
            }
            found
        },
        Err(_) => None, // RCON failed
    };

    let (name, steam_id, ip) = player_info.unwrap_or((
        "Unknown".to_string(), 
        "Unknown".to_string(), 
        "0.0.0.0".to_string()
    ));

    // Execute RCON Ban IMMEDIATELY before SteamAPI which is slow
    let reason = payload.reason.clone().unwrap_or_else(|| "Banned by admin".to_string());
    let command = format!("sm_ban #{} {} \"{}\"", payload.userid, payload.duration, reason);
    
    match send_command(&address, &pwd, &command).await {
        Ok(_) => {
            // Background task: Resolve Steam ID, Insert to DB, Setup Logs
            let bg_state = state.clone();
            let bg_user_sub = user.sub.clone();
            let bg_server_id = server.id;
            let bg_server_name = server.name.clone();
            let bg_duration = payload.duration;
            let bg_userid = payload.userid;

            tokio::spawn(async move {
                // Convert SteamID variants (slow HTTP request)
                use crate::services::steam_api::SteamService;
                let steam_service = SteamService::new();
                let steam_id_64 = steam_service.resolve_steam_id(&steam_id).await.unwrap_or_else(|| steam_id.clone());
                let steam_id_2 = steam_service.id64_to_id2(&steam_id_64).unwrap_or_else(|| steam_id.clone());
                let steam_id_3 = steam_service.id64_to_id3(&steam_id_64).unwrap_or_default();

                // DB Insert
                let expires_at = if bg_duration > 0 {
                    Some(chrono::Utc::now() + chrono::Duration::minutes(bg_duration as i64))
                } else {
                    None
                };
                
                let ip_only = ip.split(':').next().unwrap_or(&ip).to_string();
                
                tracing::info!("Background: Inserting ban for Name={}, SteamID={}, IP={}", name, steam_id_2, ip_only);

                let db_result = sqlx::query(
                    "INSERT INTO bans (name, steam_id, steam_id_3, steam_id_64, ip, ban_type, reason, duration, admin_name, expires_at, created_at, status, server_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'active', ?)"
                )
                .bind(&name)
                .bind(&steam_id_2)
                .bind(&steam_id_3)
                .bind(&steam_id_64)
                .bind(&ip_only)
                .bind("ip") 
                .bind(&reason)
                .bind(bg_duration.to_string())
                .bind(&bg_user_sub)
                .bind(expires_at)
                .bind(bg_server_id)
                .execute(&bg_state.db)
                .await;

                if let Err(e) = db_result {
                    tracing::error!("Background: Failed to insert ban into DB: {}", e);
                }

                let _ = log_admin_action(
                    &bg_state.db, 
                    &bg_user_sub, 
                    "ban_player_rcon_db", 
                    &format!("Server: {}, UserID: {}", bg_server_name, bg_userid), 
                    &format!("Duration: {}, Reason: {}, Player: {} ({})", bg_duration, reason, name, steam_id)
                ).await;
            });

            (StatusCode::OK, Json("Player banned and recorded")).into_response()
        },
        Err(e) => (StatusCode::BAD_REQUEST, Json(format!("Failed to ban: {}", e))).into_response(),
    }
}
