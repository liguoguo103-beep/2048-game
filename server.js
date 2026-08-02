const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname)));

const DATA_FILE = path.join(__dirname, 'data_store.json');
let persistentData = { hallOfFame: [], players: {} };

function loadPersistentData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            persistentData = JSON.parse(raw);
        }
    } catch (e) {}
}

function savePersistentData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(persistentData, null, 2), 'utf-8');
    } catch (e) {}
}

function recordMatchScore(name, score, maxTile, isWinner = false) {
    if (!name || score <= 0) return;
    if (!persistentData.players[name]) {
        persistentData.players[name] = { name, bestScore: score, maxTile: maxTile || 2, gamesPlayed: 1, wins: isWinner ? 1 : 0 };
    } else {
        const p = persistentData.players[name];
        p.gamesPlayed = (p.gamesPlayed || 0) + 1;
        if (isWinner) p.wins = (p.wins || 0) + 1;
        if (score > p.bestScore) p.bestScore = score;
        if ((maxTile || 2) > p.maxTile) p.maxTile = maxTile;
    }
    persistentData.hallOfFame.push({ name, score, maxTile: maxTile || 2, date: new Date().toISOString().split('T')[0] });
    persistentData.hallOfFame.sort((a, b) => (b.score !== a.score ? b.score - a.score : b.maxTile - a.maxTile));
    persistentData.hallOfFame = persistentData.hallOfFame.slice(0, 20);
    savePersistentData();
}

loadPersistentData();
const rooms = {};

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getLeaderboard(room) {
    if (!room || !room.players) return [];
    return Object.values(room.players)
        .map(p => ({
            id: p.id,
            name: p.name,
            score: p.score || 0,
            maxTile: p.maxTile || 2,
            moveCount: p.moveCount || 0,
            status: p.status || 'playing',
            isHost: p.id === room.hostSocketId
        }))
        .sort((a, b) => (b.score !== a.score ? b.score - a.score : b.maxTile - a.maxTile));
}

function stopRoomTimer(room) {
    if (room && room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
    }
}

function startRoomTimer(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    stopRoomTimer(room);
    if (room.duration <= 0) return;
    room.remainingTime = room.duration;
    room.timerInterval = setInterval(() => {
        if (!rooms[roomId]) {
            clearInterval(room.timerInterval);
            return;
        }
        room.remainingTime--;
        io.to(roomId).emit('timer_tick', { remainingTime: room.remainingTime });
        if (room.remainingTime <= 0) {
            stopRoomTimer(room);
            room.status = 'ended';
            const leaderboard = getLeaderboard(room);
            const winner = leaderboard.length > 0 ? leaderboard[0] : null;
            leaderboard.forEach((p, idx) => recordMatchScore(p.name, p.score, p.maxTile, idx === 0));
            io.to(roomId).emit('match_ended', { reason: 'time_up', leaderboard, winner, hallOfFame: persistentData.hallOfFame });
        }
    }, 1000);
}

io.on('connection', (socket) => {
    socket.emit('hall_of_fame_data', persistentData.hallOfFame);

    socket.on('create_room', (data, callback) => {
        const roomId = generateRoomId();
        const playerName = (data.playerName || '玩家').trim().substring(0, 12);
        const maxPlayers = Math.max(2, Math.min(16, parseInt(data.maxPlayers || 8, 10)));
        const duration = parseInt(data.duration || 180, 10);
        rooms[roomId] = {
            id: roomId,
            hostSocketId: socket.id,
            maxPlayers, duration, remainingTime: duration, status: 'waiting',
            players: { [socket.id]: { id: socket.id, name: playerName, score: 0, maxTile: 2, moveCount: 0, status: 'waiting', grid: null } },
            timerInterval: null
        };
        socket.join(roomId);
        socket.roomId = roomId;
        const responseData = {
            success: true, roomId, playerId: socket.id, isHost: true,
            roomState: { id: roomId, hostSocketId: socket.id, maxPlayers, duration, remainingTime: duration, status: 'waiting', players: Object.values(rooms[roomId].players), leaderboard: getLeaderboard(rooms[roomId]) }
        };
        if (typeof callback === 'function') callback(responseData);
        socket.emit('room_joined', responseData);
    });

    socket.on('join_room', (data, callback) => {
        const roomId = (data.roomId || '').trim().toUpperCase();
        const playerName = (data.playerName || '玩家').trim().substring(0, 12);
        const room = rooms[roomId];
        if (!room) return typeof callback === 'function' && callback({ success: false, message: '找不到房間號碼！' });
        if (Object.keys(room.players).length >= room.maxPlayers) return typeof callback === 'function' && callback({ success: false, message: '房間已滿！' });
        socket.join(roomId);
        socket.roomId = roomId;
        room.players[socket.id] = { id: socket.id, name: playerName, score: 0, maxTile: 2, moveCount: 0, status: room.status === 'playing' ? 'playing' : 'waiting', grid: null };
        const responseData = {
            success: true, roomId, playerId: socket.id, isHost: room.hostSocketId === socket.id,
            roomState: { id: roomId, hostSocketId: room.hostSocketId, maxPlayers: room.maxPlayers, duration: room.duration, remainingTime: room.remainingTime, status: room.status, players: Object.values(room.players), leaderboard: getLeaderboard(room) }
        };
        if (typeof callback === 'function') callback(responseData);
        socket.emit('room_joined', responseData);
        io.to(roomId).emit('room_updated', { players: Object.values(room.players), leaderboard: getLeaderboard(room), status: room.status, duration: room.duration, remainingTime: room.remainingTime, maxPlayers: room.maxPlayers, hostSocketId: room.hostSocketId });
    });

    socket.on('update_player_state', (data) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        const player = room.players[socket.id];
        if (!player) return;
        player.score = data.score !== undefined ? data.score : player.score;
        player.maxTile = data.maxTile !== undefined ? data.maxTile : player.maxTile;
        player.moveCount = data.moveCount !== undefined ? data.moveCount : player.moveCount;
        player.status = data.status || player.status;
        if (data.grid) player.grid = data.grid;
        recordMatchScore(player.name, player.score, player.maxTile);
        io.to(roomId).emit('player_state_changed', { playerId: socket.id, playerData: player, leaderboard: getLeaderboard(room) });
        if (room.status === 'playing') {
            const activePlayers = Object.values(room.players).filter(p => p.status === 'playing');
            if (activePlayers.length === 0) {
                stopRoomTimer(room);
                room.status = 'ended';
                const leaderboard = getLeaderboard(room);
                leaderboard.forEach((p, idx) => recordMatchScore(p.name, p.score, p.maxTile, idx === 0));
                io.to(roomId).emit('match_ended', { reason: 'all_finished', leaderboard, winner: leaderboard[0] || null, hallOfFame: persistentData.hallOfFame });
            }
        }
    });

    socket.on('host_update_settings', (data) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        if (room.hostSocketId !== socket.id) return;
        if (data.maxPlayers) room.maxPlayers = Math.max(2, Math.min(16, parseInt(data.maxPlayers, 10)));
        if (data.duration !== undefined) {
            room.duration = parseInt(data.duration, 10);
            room.remainingTime = room.duration;
        }
        io.to(roomId).emit('room_settings_updated', { maxPlayers: room.maxPlayers, duration: room.duration, remainingTime: room.remainingTime });
    });

    socket.on('host_start_game', () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        if (room.hostSocketId !== socket.id) return;
        room.status = 'playing';
        Object.values(room.players).forEach(p => { p.score = 0; p.maxTile = 2; p.moveCount = 0; p.status = 'playing'; p.grid = null; });
        startRoomTimer(roomId);
        io.to(roomId).emit('match_started', { duration: room.duration, remainingTime: room.remainingTime, leaderboard: getLeaderboard(room) });
    });

    socket.on('send_emoji', (data) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const player = rooms[roomId].players[socket.id];
        io.to(roomId).emit('emoji_received', { playerId: socket.id, playerName: player ? player.name : '玩家', emoji: data.emoji });
    });

    socket.on('send_taunt', (data) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const player = rooms[roomId].players[socket.id];
        io.to(roomId).emit('taunt_received', { playerId: socket.id, playerName: player ? player.name : '玩家', text: data.text });
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        const room = rooms[roomId];
        delete room.players[socket.id];
        const remainingIds = Object.keys(room.players);
        if (remainingIds.length === 0) {
            stopRoomTimer(room);
            delete rooms[roomId];
        } else {
            if (room.hostSocketId === socket.id) {
                room.hostSocketId = remainingIds[0];
                room.players[remainingIds[0]].isHost = true;
            }
            io.to(roomId).emit('player_left', { playerId: socket.id, hostSocketId: room.hostSocketId, players: Object.values(room.players), leaderboard: getLeaderboard(room) });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 2048 線上多人對戰伺服器已成功啟動！`);
    console.log(`===================================================`);
});
