// scripts/backup-database.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306
};

async function backupDatabase() {
    let connection;
    try {
        console.log('🔌 Đang kết nối database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Đã kết nối!\n');

        const [tables] = await connection.query('SHOW TABLES');
        const tableKey = `Tables_in_${dbConfig.database}`;
        
        const backup = {
            metadata: { database: dbConfig.database, backupDate: new Date().toISOString(), tables: [] },
            data: {}
        };

        console.log('📊 Đang backup các tables:\n');

        for (const tableRow of tables) {
            const tableName = tableRow[tableKey];
            console.log(`  📁 ${tableName}...`);
            
            const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
            const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
            
            backup.metadata.tables.push({ name: tableName, rowCount: rows.length });
            backup.data[tableName] = { structure: createTable[0]['Create Table'], rows };
            
            console.log(`     ✅ ${rows.length} rows`);
        }

        const backupDir = './backups';
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.json`;
        const filepath = path.join(backupDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

        console.log('\n' + '='.repeat(50));
        console.log('✅ BACKUP HOÀN TẤT!');
        console.log(`📁 File: ${filepath}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ Backup thất bại:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

backupDatabase();
