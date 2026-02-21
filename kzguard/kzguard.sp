#include <sourcemod>
#include <sdktools>
#include <sdkhooks>
#include <steamworks>

#pragma semicolon 1
#pragma newdecls required

#define PLUGIN_VERSION "0.0.1"

// 移除全局定义的 REQUIRED_RATING 和 REQUIRED_LEVEL

public Plugin myinfo = 
{
    name = "kzguard",
    author = "wwq",
    description = "CS:GO Ban System Integration",
    version = PLUGIN_VERSION,
    url = ""
};

Database g_hDatabase = null;
ConVar g_cvServerId;
ConVar g_cvApiUrl;

public void OnPluginStart()
{
    g_cvServerId = CreateConVar("kzguard_server_id", "1", "Server ID for this server instance");
    g_cvApiUrl = CreateConVar("kzguard_api_url", "http://127.0.0.1:8080", "Backend API Base URL");
    
    LogMessage("kzguard Plugin v%s Loaded. Starting database connection...", PLUGIN_VERSION);
    Database.Connect(OnDatabaseConnected, "kzguard");
    
    CreateTimer(60.0, Timer_CheckBans, _, TIMER_REPEAT);
}

public void OnDatabaseConnected(Database db, const char[] error, any data)
{
    if (db == null)
    {
        LogError("Failed to connect to kzguard database: %s", error);
        return;
    }
    
    g_hDatabase = db;
    g_hDatabase.SetCharset("utf8mb4");
    LogMessage("Connected to kzguard database successfully.");
}

public void OnClientPostAdminCheck(int client)
{
    if (IsFakeClient(client) || !g_hDatabase)
        return;

    StartVerification(client);
}

// ============================================
// 验证流程入口
// ============================================

void StartVerification(int client)
{
    char steamId[64];
    if (!GetClientAuthId(client, AuthId_SteamID64, steamId, sizeof(steamId)))
    {
        KickClient(client, "验证错误：无效的SteamID");
        return;
    }

    // 检查服务器是否启用验证并获取要求配置
    char query[256];
    Format(query, sizeof(query), "SELECT verification_enabled, required_rating, required_level, whitelist_only FROM servers WHERE id = %d", g_cvServerId.IntValue);
    g_hDatabase.Query(SQL_CheckVerificationEnabledCallback, query, GetClientUserId(client));
}

public void SQL_CheckVerificationEnabledCallback(Database db, DBResultSet results, const char[] error, any userid)
{
    int client = GetClientOfUserId(userid);
    if (client == 0) return;

    bool enabled = true;
    float requiredRating = 3.0;
    int requiredLevel = 1;
    bool whitelistOnly = false;

    if (results == null)
    {
        LogError("Failed to check verification setting: %s", error);
    }
    else if (results.FetchRow())
    {
        enabled = results.FetchInt(0) != 0;
        requiredRating = results.FetchFloat(1);
        requiredLevel = results.FetchInt(2);
        whitelistOnly = results.FetchInt(3) != 0;
    }

    if (!enabled)
    {
        LogMessage("Verification disabled for this server. Skipping for %N.", client);
        CheckBansAndAdmin(client);
        return;
    }

    // 将这些参数通过 DataPack 传递下去，不需要存在全局变量里，因为每个 client 的流程都是独立的（主要为了并发安全）
    DataPack pack = new DataPack();
    pack.WriteCell(GetClientUserId(client));
    pack.WriteFloat(requiredRating);
    pack.WriteCell(requiredLevel);
    pack.WriteCell(whitelistOnly);
    pack.Reset();

    // Step 1: Global Ban Check
    CheckGlobalBan(pack);
}

// ============================================
// Step 1: Global Ban 检查
// ============================================

void CheckGlobalBan(DataPack pack)
{
    // 回到开头
    pack.Reset();
    int userid = pack.ReadCell();
    int client = GetClientOfUserId(userid);
    
    if (client == 0 || !IsClientInGame(client))
    {
        delete pack;
        return;
    }

    char steamId[64];
    GetClientAuthId(client, AuthId_SteamID64, steamId, sizeof(steamId));
    
    char apiUrl[256];
    g_cvApiUrl.GetString(apiUrl, sizeof(apiUrl));
    
    char url[512];
    Format(url, sizeof(url), "%s/api/check_global_ban?steam_id=%s", apiUrl, steamId);
    
    Handle request = SteamWorks_CreateHTTPRequest(k_EHTTPMethodGET, url);
    SteamWorks_SetHTTPRequestContextValue(request, view_as<int>(pack));
    SteamWorks_SetHTTPCallbacks(request, OnCheckGlobalBanComplete);
    SteamWorks_SendHTTPRequest(request);
}

public int OnCheckGlobalBanComplete(Handle request, bool bFailure, bool bRequestSuccessful, EHTTPStatusCode eStatusCode, any data1)
{
    DataPack pack = view_as<DataPack>(data1);
    pack.Reset();
    int userid = pack.ReadCell();
    int client = GetClientOfUserId(userid);
    
    if (bRequestSuccessful && eStatusCode == k_EHTTPStatusCode200OK)
    {
        if (client > 0 && IsClientInGame(client))
        {
            KickClient(client, "您因 GOKZ Global Ban 而被禁止访问本服。");
            LogMessage("Kicked player %N (Global Banned)", client);
        }
        delete pack;
    }
    else
    {
        if (client > 0 && IsClientInGame(client))
        {
            pack.Reset();
            CheckWhitelistAPI(pack);
        }
        else
        {
            delete pack;
        }
    }
    
    delete request;
    return 0;
}

// ============================================
// Step 2: API 检查白名单与 Rating
// ============================================

void CheckWhitelistAPI(DataPack pack)
{
    int userid = pack.ReadCell();
    int client = GetClientOfUserId(userid);
    
    if (client == 0 || !IsClientInGame(client))
    {
        delete pack;
        return;
    }

    char steamId[64];
    GetClientAuthId(client, AuthId_SteamID64, steamId, sizeof(steamId));
    
    char apiUrl[256];
    g_cvApiUrl.GetString(apiUrl, sizeof(apiUrl));
    
    char url[512];
    Format(url, sizeof(url), "%s/api/whitelist/status?steam_id=%s", apiUrl, steamId);
    
    Handle request = SteamWorks_CreateHTTPRequest(k_EHTTPMethodGET, url);
    SteamWorks_SetHTTPRequestContextValue(request, view_as<int>(pack));
    SteamWorks_SetHTTPCallbacks(request, OnCheckWhitelistAPIComplete);
    SteamWorks_SendHTTPRequest(request);
}

public int OnCheckWhitelistAPIComplete(Handle request, bool bFailure, bool bRequestSuccessful, EHTTPStatusCode eStatusCode, any data1)
{
    DataPack pack = view_as<DataPack>(data1);
    pack.Reset();
    int userid = pack.ReadCell();
    float requiredRating = pack.ReadFloat();
    int requiredLevel = pack.ReadCell();
    bool whitelistOnly = pack.ReadCell();

    int client = GetClientOfUserId(userid);
    
    if (!bRequestSuccessful || client == 0 || !IsClientInGame(client))
    {
        delete pack;
        delete request;
        return 0;
    }
    
    if (eStatusCode == k_EHTTPStatusCode200OK)
    {
        int bodySize;
        SteamWorks_GetHTTPResponseBodySize(request, bodySize);
        char[] body = new char[bodySize + 1];
        SteamWorks_GetHTTPResponseBodyData(request, body, bodySize);
        
        // 简单提取 status, rating, level
        char status[32];
        float rating = 0.0;
        int level = 0;
        strcopy(status, sizeof(status), "none");
        
        int statusIdx = StrContains(body, "\"status\":\"");
        if (statusIdx != -1)
        {
            int start = statusIdx + 10;
            int end = start;
            while (body[end] != '"' && body[end] != '\0') end++;
            strcopy(status, (end - start + 1) > sizeof(status) ? sizeof(status) : (end - start + 1), body[start]);
        }
        
        if (StrEqual(status, "approved"))
        {
            LogMessage("Player %N approved by explicit whitelist.", client);
            CheckBansAndAdmin(client);
        }
        else if (StrEqual(status, "rejected"))
        {
            KickClient(client, "您的白名单申请已被拒绝。");
            LogMessage("Kicked player %N (Whitelist Rejected)", client);
        }
        else
        {
            if (whitelistOnly)
            {
                KickClient(client, "本服仅限白名单成员进入，您不在白名单中。");
                LogMessage("Kicked player %N (Not in Whitelist, Whitelist Only Enabled)", client);
            }
            else
            {
                // Fallback - 提取 rating 与 level
                int ratingIdx = StrContains(body, "\"gokz_rating\":");
                if (ratingIdx != -1)
                {
                    rating = StringToFloat(body[ratingIdx + 14]);
                }
                int levelIdx = StrContains(body, "\"steam_level\":");
                if (levelIdx != -1)
                {
                    level = StringToInt(body[levelIdx + 14]);
                }
                
                PerformVerification(client, level, rating, requiredLevel, requiredRating);
            }
        }
    }
    else
    {
        KickClient(client, "与白名单服务器通信失败。");
    }
    
    delete pack;
    delete request;
    return 0;
}

// ============================================
// Step 4: 执行验证判断
// ============================================

void PerformVerification(int client, int level, float rating, int requiredLevel, float requiredRating)
{
    char steamId[64];
    GetClientAuthId(client, AuthId_SteamID64, steamId, sizeof(steamId));

    bool passed = (rating >= requiredRating && level >= requiredLevel);
    char reason[256];

    if (passed)
    {
        Format(reason, sizeof(reason), "验证通过：Rating %.2f / 等级 %d", rating, level);
        LogMessage("Verification PASSED for %N: %s", client, reason);
        
        // 缓存通过的玩家
        UpdateCacheStatus(steamId, "allowed", reason);
        
        CheckBansAndAdmin(client);
    }
    else
    {
        Format(reason, sizeof(reason), "验证失败：Rating %.2f(需>=%.1f) / 等级 %d(需>=%d)", 
            rating, requiredRating, level, requiredLevel);
        LogMessage("Verification DENIED for %N: %s", client, reason);
        
        // 删除缓存，不保存失败记录
        DeleteFromCache(steamId);
        
        KickClient(client, "%s", reason);
    }
}

void UpdateCacheStatus(const char[] steamId, const char[] status, const char[] reason)
{
    char escapedReason[512];
    g_hDatabase.Escape(reason, escapedReason, sizeof(escapedReason));
    
    char query[1024];
    Format(query, sizeof(query), 
        "UPDATE kzguard.player_cache SET status = '%s', reason = '%s', updated_at = NOW() WHERE steam_id = '%s'",
        status, escapedReason, steamId);
    
    g_hDatabase.Query(SQL_GenericCallback, query);
}

void DeleteFromCache(const char[] steamId)
{
    char query[256];
    Format(query, sizeof(query), 
        "DELETE FROM kzguard.player_cache WHERE steam_id = '%s'",
        steamId);
    
    g_hDatabase.Query(SQL_GenericCallback, query);
}

public void SQL_GenericCallback(Database db, DBResultSet results, const char[] error, any data)
{
    if (results == null)
    {
        LogError("SQL query failed: %s", error);
    }
}

// ============================================
// 封禁和管理员检查
// ============================================

void CheckBansAndAdmin(int client)
{
    char steamId[32];
    char steamIdOther[32];
    char ip[32];
    char steamId64[64];
    
    GetClientAuthId(client, AuthId_SteamID64, steamId64, sizeof(steamId64));
    GetClientAuthId(client, AuthId_Steam2, steamId, sizeof(steamId));
    GetClientIP(client, ip, sizeof(ip));
    
    LogMessage("Checking bans for %N (SteamID: %s, IP: %s)", client, steamId64, ip);

    strcopy(steamIdOther, sizeof(steamIdOther), steamId);
    if (steamId[6] == '0') steamIdOther[6] = '1';
    else if (steamId[6] == '1') steamIdOther[6] = '0';
    
    // 1. Check Bans
    // Fetch ban_type (5) and steam_id_64 (6) from DB
    char query[1024];
    Format(query, sizeof(query), 
        "SELECT id, reason, duration, expires_at, ip, ban_type, steam_id_64 FROM bans WHERE (steam_id_64 = '%s' OR steam_id = '%s' OR steam_id = '%s' OR ip = '%s') AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY id DESC LIMIT 1", 
        steamId64, steamId, steamIdOther, ip);
    
    g_hDatabase.Query(SQL_CheckBanCallback, query, GetClientUserId(client));
    
    // 2. Sync Admin (Disabled per requirement: Web admins do not get in-game privileges)
    // Format(query, sizeof(query), "SELECT role FROM admins WHERE steam_id_64 = '%s' OR steam_id = '%s' OR steam_id = '%s'", steamId64, steamId, steamIdOther);
    // g_hDatabase.Query(SQL_CheckAdminCallback, query, GetClientUserId(client));
}

public void SQL_CheckBanCallback(Database db, DBResultSet results, const char[] error, any userid)
{
    int client = GetClientOfUserId(userid);
    if (client == 0) return;
    
    if (results == null)
    {
        LogError("Ban check query failed: %s", error);
        return;
    }
    
    if (results.FetchRow())
    {
        int banId = results.FetchInt(0);
        char reason[128];
        char duration[32];
        char storedIp[32];
        char banType[32];
        char bannedSteamId64[64];
        
        results.FetchString(1, reason, sizeof(reason));
        results.FetchString(2, duration, sizeof(duration));
        results.FetchString(4, storedIp, sizeof(storedIp));
        results.FetchString(5, banType, sizeof(banType));
        results.FetchString(6, bannedSteamId64, sizeof(bannedSteamId64));
        
        char clientSteamId64[64];
        char clientIp[32];
        GetClientAuthId(client, AuthId_SteamID64, clientSteamId64, sizeof(clientSteamId64));
        GetClientIP(client, clientIp, sizeof(clientIp));

        // 判断是否是本人 (SteamID 匹配)
        bool isSameAccount = StrEqual(clientSteamId64, bannedSteamId64);

        if (isSameAccount)
        {
            // Case A: 同账号匹配 (Direct Ban)
            // 如果数据库中没有 IP 记录，更新为当前玩家 IP
            if (storedIp[0] == '\0')
            {
                char updateQuery[256];
                Format(updateQuery, sizeof(updateQuery), "UPDATE bans SET ip = '%s' WHERE id = %d", clientIp, banId);
                g_hDatabase.Query(SQL_GenericCallback, updateQuery);
                LogMessage("Updated missing IP for banned player %N (BanID: %d, IP: %s)", client, banId, clientIp);
            }
            // 踢出
            KickClient(client, "您已被封禁。原因：%s（时长：%s）", reason, duration);
            LogMessage("Kicked banned player: %N (Account Match, BanID: %d)", client, banId);
        }
        else
        {
            // Case B: 异账号匹配 (IP Match)
            if (StrEqual(banType, "ip"))
            {
                // 是 IP 封禁 -> 连坐
                LogMessage("IP Ban Match for %N! (Linked to BanID: %d, IP: %s)", client, banId, clientIp);

                // 为当前马甲号创建新封禁
                char newReason[256];
                Format(newReason, sizeof(newReason), "同IP关联封禁 (Linked to %s)", bannedSteamId64);
                
                char insertQuery[1024];
                Format(insertQuery, sizeof(insertQuery), 
                    "INSERT INTO bans (name, steam_id, steam_id_64, ip, ban_type, reason, duration, admin_name, expires_at, created_at, status, server_id) SELECT '%N', 'PENDING', '%s', '%s', 'account', '%s', duration, 'System (IP Linked)', expires_at, NOW(), 'active', server_id FROM bans WHERE id = %d",
                    client, clientSteamId64, clientIp, newReason, banId);
                
                g_hDatabase.Query(SQL_GenericCallback, insertQuery);

                KickClient(client, "检测到关联封禁 IP。在此 IP 上的所有账号均被禁止进入。");
            }
            else
            {
                // 不是 IP 封禁 -> 放行
                LogMessage("Player %N shares IP with banned player (BanID: %d) but BanType is '%s'. ALLOWING access.", client, banId, banType);
                // 不执行 KickClient，直接返回
            }
        }
    }
}

public void SQL_CheckAdminCallback(Database db, DBResultSet results, const char[] error, any userid)
{
    int client = GetClientOfUserId(userid);
    if (client == 0) return;
    
    if (results == null)
    {
        LogError("Admin check query failed: %s", error);
        return;
    }
    
    if (results.FetchRow())
    {
        char role[32];
        results.FetchString(0, role, sizeof(role));
        
        AdminId admin = CreateAdmin("TempAdmin");
        if (StrEqual(role, "super_admin"))
        {
            admin.SetFlag(Admin_Root, true);
        }
        else if (StrEqual(role, "admin"))
        {
            admin.SetFlag(Admin_Generic, true);
            admin.SetFlag(Admin_Kick, true);
            admin.SetFlag(Admin_Ban, true);
        }
        
        SetUserAdmin(client, admin, true);
        LogMessage("Granted admin privileges to %N (%s)", client, role);
    }
}

// ============================================
// 定时检查封禁
// ============================================

public Action Timer_CheckBans(Handle timer)
{
    if (!g_hDatabase) return Plugin_Continue;
    
    for (int i = 1; i <= MaxClients; i++)
    {
        if (IsClientInGame(i) && !IsFakeClient(i))
        {
            CheckBansAndAdmin(i);
        }
    }
    return Plugin_Continue;
}