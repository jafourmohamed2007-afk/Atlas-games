# Neon Overdrive online server

The online mode of Neon Overdrive (menu → **ONLINE BATTLE**) needs this small Node.js server.
Without it, the game works as before and the online lobby shows **SERVER OFFLINE**.

- Deathmatch, up to 8 pilots per room, first to 15 kills or best score after 5 minutes, then a new match starts by itself.
- **Quick match** puts players in any open public room. **Private rooms** get a 4-digit code to share.
- The server is the referee. Players only send their inputs (move, aim, fire, dash), and the server moves everyone, fires
  the shots and decides hits, kills and respawns. A modified game in someone's browser cannot give itself kills or health.

## Run it

```bash
npm install            # once (installs the `ws` package)
npm run neon-server    # or: node server/neon-server.js
```

It listens on port 8080, at the path `/neon`. Open `http://your-server:8080/` to see a status line such as
`{"ok":true,"online":3,"rooms":1}`.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8080` | Port to listen on |
| `NEON_PATH` | `/neon` | WebSocket path |
| `NEON_KILLS` | `15` | Kills needed to win a match |
| `NEON_TIME` | `300` | Match length in seconds |
| `NEON_MAX_ROOMS` | `200` | Room limit |

Keep it running with a process manager, for example `pm2 start server/neon-server.js --name neon`.

## How the game finds the server

By default the game connects to the **same website it is served from**, at `/neon`:
`https://yoursite.com/play/neon-overdrive.html` connects to `wss://yoursite.com/neon`.
So the easiest setup is to let your web server forward `/neon` to the Node server.

**nginx**

```nginx
location /neon {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

**Caddy**

```
yoursite.com {
    reverse_proxy /neon 127.0.0.1:8080
}
```

If the game server lives on another address, set it before the game loads
(`<script>window.NEON_SERVER = 'wss://game.yoursite.com/neon'</script>`), or add `?server=wss://…/neon` to the game URL.

## Test it locally

```bash
node server/neon-server.js
# open games/neon-overdrive.html in two browser windows → ONLINE BATTLE → QUICK MATCH
node tests/neon-online.js   # automated: 2 pilots fight to the kill limit, private room + keypad, server offline
```
