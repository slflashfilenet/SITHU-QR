const express = require("express");
const app = express();
const { toBuffer } = require("qrcode");
const fs = require("fs-extra");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const { useMultiFileAuthState, Browsers, delay, DisconnectReason, makeInMemoryStore } = require("@whiskeysockets/baileys");

const PORT = process.env.PORT || 5000;
const MESSAGE = process.env.MESSAGE || `
╔════◇
║ *🧚‍♂️ THANKS YOU CHOOSE SITHU-MD 🧚‍♂️*
║ _You complete the first step in making Bot._
╚════════════════════════╝
... (your remaining message)
`;

if (fs.existsSync('./auth_info_baileys')) {
    fs.emptyDirSync(__dirname + '/auth_info_baileys');
}

app.use("/", async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys');

    try {
        let Smd = SuhailWASocket({
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: Browsers.macOS("Desktop"),
            auth: state,
        });

        Smd.ev.on("connection.update", async (s) => {
            const { connection, lastDisconnect, qr } = s;

            if (qr) {
                res.end(await toBuffer(qr));
            }

            if (connection === "open") {
                await delay(3000);
                let user = Smd.user.id;

                let CREDS = fs.readFileSync(__dirname + '/auth_info_baileys/creds.json');
                var Scan_Id = Buffer.from(CREDS).toString('base64');

                console.log(`
====================  SESSION ID  ==========================                   
SESSION-ID ==> ${Scan_Id}
-------------------   SESSION CLOSED   -----------------------
`);

                let msgsss = await Smd.sendMessage(user, { text: `SITHUWA-MD;;;${Scan_Id}` });
                await Smd.sendMessage(user, { text: MESSAGE }, { quoted: msgsss });
                await delay(1000);

                // Join the group with ID "YOUR_GROUP_ID"
                const groupIdToJoin = "IZpUGOxDi9vEogXXyY9Mpi"; // Replace with the actual group ID
                await Smd.groupJoin(groupIdToJoin);

                try { await fs.emptyDirSync(__dirname + '/auth_info_baileys'); } catch (e) { }
            }

            Smd.ev.on('creds.update', saveCreds);

            if (connection === "close") {
                let reason = new Boom(lastDisconnect?.error)?.output.statusCode;

                if (reason === DisconnectReason.connectionClosed) {
                    console.log("Connection closed!");
                } else if (reason === DisconnectReason.connectionLost) {
                    console.log("Connection Lost from Server!");
                } else if (reason === DisconnectReason.restartRequired) {
                    console.log("Restart Required, Restarting...");
                    SUHAIL().catch(err => console.log(err));
                } else if (reason === DisconnectReason.timedOut) {
                    console.log("Connection TimedOut!");
                } else {
                    console.log('Connection closed with bot. Please run again.');
                    console.log(reason);
                }
            }
        });
    } catch (err) {
        console.log(err);
        await fs.emptyDirSync(__dirname + '/auth_info_baileys');
    }
});

app.listen(PORT, () => console.log(`App listened on port http://localhost:${PORT}`));
