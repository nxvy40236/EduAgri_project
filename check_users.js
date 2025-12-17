const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'eduagri_final.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error connecting:', err);
});

db.all("SELECT * FROM users", (err, rows) => {
    if (err) {
        console.error('Error querying users:', err);
    } else {
        console.log('User count:', rows.length);
        console.log('Users:', rows);
    }
});
