const { exec } = require('child_process');
const path = require('path');
const fs = require('fs'); // Declared once at the top!

const MONGODUMP_PATH = path.join(__dirname, 'tools', 'mongodump.exe');
const DB_NAME = 'mindproAI';
const BACKUP_PATH = path.join(__dirname, 'backups');

if (!fs.existsSync(BACKUP_PATH)) {
    fs.mkdirSync(BACKUP_PATH);
}

const fileName = `backup_${DB_NAME}_${Date.now()}.gz`;
const outputPath = path.join(BACKUP_PATH, fileName);
const cmd = `"${MONGODUMP_PATH}" --db ${DB_NAME} --archive="${outputPath}" --gzip`;

console.log("⏳ Starting Backup...");

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Backup Failed: ${error.message}`);
        return;
    }
    
    console.log(`✅ Success! Backup created: ${fileName}`);

    // --- CLEANUP LOGIC ---
    // This part runs AFTER the backup is successful
    const files = fs.readdirSync(BACKUP_PATH);
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    files.forEach(file => {
        const filePath = path.join(BACKUP_PATH, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < sevenDaysAgo) {
            fs.unlinkSync(filePath); 
            console.log(`🗑️ Deleted old backup: ${file}`);
        }
    });
});