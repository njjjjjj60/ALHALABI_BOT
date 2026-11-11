const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('امسح الكود دا بواتسابك:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('اتقطع، بنحاول نعيد...');
            if (shouldReconnect) start();
        } else if (connection === 'open') {
            console.log('البوت اشتغل يا حلبي!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (text === '.منو') {
            await sock.sendMessage(from, { text: 'انا بوت الحلبي شغال بـ Baileys' });
        }
        if (text === '.السلام') {
            await sock.sendMessage(from, { text: 'وعليكم السلام يا زول، منور' });
        }
        if (text === '.ping') {
            await sock.sendMessage(from, { text: 'pong شغال فل' });
        }
    });
}

start();
