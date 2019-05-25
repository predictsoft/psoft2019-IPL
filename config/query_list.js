/**
 * (C)grjoshi 6/10/2018
 * query_list.js - defines queries that will be run for psoft
 //==============================================================================
 */

module.exports = {
    getMatchDetails: function(matchID){
        return "SELECT team1.ID as Team1ID, team1.Name as Team1Name, team1.FlagUrl as Team1LogoUrl, " +
                        "team2.ID as Team2ID,team2.Name as Team2Name, team2.FlagUrl as Team2LogoUrl, " +
                        "games.ID as MatchID, " +
                        "games.Points as MatchPoints, " +
                        "games.isLocked as IsLocked, " +
                        "games.matchDate as MatchDate " +
                        "FROM " +
                        "`games` LEFT JOIN (teams as team1, teams as team2) " +
                        "ON (team1.ID = games.Team1 AND team2.ID = games.Team2) " +
                        "WHERE games.ID=" + matchID;
    },
    getUpcomingMatchDetails: function(){
        return "SELECT G.ID as MatchID, T1.ID as Team1ID, T1.Name as Team1Name, T1.FlagUrl as Team1LogoUrl, " +
                    "T2.ID as Team2ID, T2.Name as Team2Name, T2.FlagUrl as Team2LogoUrl, " +
                    "G.points as GamePoints, G.gameType as GameType, G.isLocked as IsGameLocked, G.isHidden as IsGameHidden, G.matchDate as GameDate, G.matchTime as GameTime " +
                "FROM teams T1, teams T2, games G " +
                "WHERE G.Team1 = T1.ID and G.Team2 = T2.ID AND G.isActive = 1 ORDER BY GameTime;"
    },
    addPredictionForMatch: function(userID, matchID, predictedTeamID){
        return "INSERT INTO predictions(playerID, matchID, predictedTeamID) "+
        "VALUES ('" + userID + "', '" + matchID +"', '"+ predictedTeamID +"');";
    },
    updatePredictionForMatch: function(userID, matchID, predictedTeamID){
        return "UPDATE predictions "+
        "SET predictedTeamID='" + predictedTeamID + "' WHERE  playerID=" + userID + " AND matchID=" + matchID + ";"
    },
    getPredictionListForActiveMatches: function(userID){
        return "SELECT U.userID, U.name, G.ID as gameID, (SELECT name from teams WHERE ID = P.predictedTeamID) as PredictedTeam " +
            "FROM games G, predictions P, users U " +
            "WHERE G.isActive = 1 AND G.isHidden = 0 AND G.ID = P.matchID AND P.playerID = U.userID AND U.userID <> " + userID +
        " UNION ALL " +
            "SELECT U.userID, U.name, G.ID as gameID, (SELECT name from teams WHERE ID = P.predictedTeamID) as PredictedTeam " +
            "FROM games G, predictions P, users U " +
            "WHERE G.isActive = 1 AND G.ID = P.matchID AND P.playerID = U.userID AND U.userID = " + userID ;
    },
    getUserPredictionHistory: function(userID){
        return "SELECT U.name as player_name, " + 
                    "U.points as player_points, " +
                    "G.MatchDate AS match_date, " +
                    "G.points AS game_weight, " +
                    "(SELECT Name FROM teams WHERE ID = G.Team1) AS team1, " +
                    "(SELECT Name FROM teams WHERE ID = G.Team2) AS team2, " +
                    "(SELECT Name FROM teams WHERE ID = P.predictedTeamID) AS predicted_team, " +
                    "(SELECT Name FROM teams WHERE ID = G.WinningTeamID) AS winning_team  " +
                "FROM predictions P, games G, users U " +
                "WHERE " +
                    "G.isActive = 0 AND " +
                    "G.ID = P.matchID AND " +
                    "U.userID = P.playerID AND " + 
                    "P.playerID = " + userID
    },
    getUserScores: function(){
        return "SELECT u.userID, u.name, u.points as points FROM users u WHERE name <> '[admin]' ORDER BY u.points DESC;";
    },
    getUserScoresFixed: function(userID){
        return "SELECT u.userID, u.name, COUNT(*) * 3 as points " +
    "FROM predictions p, users u, teams t, games m " +
    "WHERE u.userid = p.playerID and "+
        "t.ID = p.predictedTeamID and "+
        "m.ID = p.matchID and "+
        "(SELECT teams.Name FROM teams WHERE teams.ID = p.predictedTeamID) = (SELECT teams.Name FROM teams WHERE teams.ID = m.WinningTeamID) and " + 
        "m.isActive=0 " +
    "GROUP BY u.userid "+
    "ORDER BY points DESC;";
    },
    getPredictionStatsQuery: function(checkForHidden = false){
        var query =  "SELECT COUNT(*) as predictions_received, " +
        "(SELECT COUNT(*) from users u) as total_players " +
        "FROM predictions p " + 
        "WHERE p.matchID = (SELECT ID from games where isActive=1 " + ((checkForHidden===true)?" AND isHidden=1 " :"" )+
        //(checkForHidden===true)?" AND isHidden=1 ":"" +
        "ORDER BY matchDate, matchTime ASC LIMIT 1);"

        return query;
    },
    getNextUpcomingMatchDetail: function(search_window_in_minutes, server_timezone_offset){
        if(!server_timezone_offset){
            server_timezone_offset = '+00:00';       //GMT if not specified
        }

        return "SELECT "+
                "g.* " +
                ",CONVERT_TZ(NOW(),@@session.time_zone, '" + server_timezone_offset + "') as match_date_in_est " +
                //"g.matchTime as match_time, " +
                //"CONVERT_TZ(NOW(),@@session.time_zone, '" + server_timezone_offset + "') as server_time_in_est, " +
                //"TIME(NOW()) as now_time, " +
                //"TIME(DATE_ADD(NOW(),INTERVAL " + search_window_in_minutes + " MINUTE)) as next_" + search_window_in_minutes + "_min_time, g.* " +
                "FROM games g " +
                "WHERE g.matchDate = DATE(NOW()) AND "+
                "g.isActive = 1 AND " +
                "g.matchTime <= TIME(DATE_ADD(CONVERT_TZ(NOW(),@@session.time_zone, '" + server_timezone_offset + "'),INTERVAL " + search_window_in_minutes + " MINUTE));";
    },
    lockUpcomingActiveMatch: function(lock_threshold, server_timezone_offset){
        return "UPDATE games " +
        "SET isLocked = 1 " +
        "WHERE matchDate = DATE(NOW()) AND " +
        "matchTime <= TIME(DATE_ADD(CONVERT_TZ(NOW(),@@session.time_zone, '" + server_timezone_offset + "'),INTERVAL " + lock_threshold + " MINUTE));";
    }
};
