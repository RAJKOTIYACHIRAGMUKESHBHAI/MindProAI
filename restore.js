const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKUP_PATH = path.join(__dirname, 'backups');
const MONGO_RESTORE = path.join(__dirname, 'tools', 'mongorestore.exe');

const files = fs.readdirSync(BACKUP_PATH)
    .filter(file => file.endsWith('.gz'))
    .map(file => ({ name: file, time: fs.statSync(path.join(BACKUP_PATH, file)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

if (files.length === 0) {
    console.error("❌ No backup files found in the backups folder!");
    process.exit(1);
}

const LATEST_BACKUP = files[0].name;
const FILE_PATH = path.join(BACKUP_PATH, LATEST_BACKUP);

const cmd = `"${MONGO_RESTORE}" --nsInclude="mindproAI.*" --archive="${FILE_PATH}" --gzip`;

console.log(`⚠️ Restoring from latest backup: ${LATEST_BACKUP}...`);

exec(cmd, (err, stdout, stderr) => {
    if (err) {
        console.error("❌ Restore Failed:", err);
        return;
    }
    console.log("✅ Database Restored Successfully!");
});