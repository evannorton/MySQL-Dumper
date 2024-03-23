const { readFileSync, existsSync, mkdirSync, rmSync } = require('fs');
const { join } = require('path');
const mysqldump = require('mysqldump');

const config = JSON.parse(readFileSync("config.json").toString());

if (existsSync("dumps") === false) {
    mkdirSync("dumps");
}

const dump = ({ host, user, password, database }) => {
    const date = new Date;
    let dateString = "";
    dateString += date.getFullYear();
    dateString += "-";
    dateString += date.getMonth() + 1;
    dateString += "-";
    dateString += date.getDate();
    dateString += " ";
    dateString += String(date.getHours()).padStart(2, "0");
    dateString += "-";
    dateString += String(date.getMinutes()).padStart(2, "0");
    dateString += "-";
    dateString += String(date.getSeconds()).padStart(2, "0");
    console.log(`making ${database} dump @ ${dateString}`);
    const dumpToFile = join("dumps", `${database}-${dateString}.sql`);
    mysqldump({
        connection: {
            host,
            user,
            password,
            database,
        },
        dumpToFile,
    }).then(() => {
        console.log(`removing ${database} dump @ ${dateString}`);
        rmSync(dumpToFile);
    })
};

for (const connection of config.connections) {
    dump(connection);
    setInterval(() => { dump(connection) }, connection.interval);
}