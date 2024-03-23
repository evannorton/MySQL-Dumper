require("dotenv").config();

const { readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } = require('fs');
const { join } = require('path');
const mysqldump = require('mysqldump');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const config = JSON.parse(readFileSync("config.json").toString());

if (!existsSync("dumps")) {
    mkdirSync("dumps");
}

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
});

const Bucket = process.env.S3_BUCKET;

const dump = ({ host, user, password, database }) => {
    const date = new Date;
    let dateString = "";
    dateString += date.getFullYear();
    dateString += "-";
    dateString += String(date.getMonth() + 1).padStart(2, "0");
    dateString += "-";
    dateString += String(date.getDate()).padStart(2, "0");
    dateString += "_";
    dateString += String(date.getHours()).padStart(2, "0");
    dateString += "-";
    dateString += String(date.getMinutes()).padStart(2, "0");
    dateString += "-";
    dateString += String(date.getSeconds()).padStart(2, "0");
    const Key = `${database}_${dateString}.sql`;
    console.log(`making dump ${Key}`);
    const dumpToFile = join("dumps", Key);
    mysqldump({
        connection: {
            host,
            user,
            password,
            database,
        },
        dumpToFile
    }).then(() => {
        const Body = readFileSync(dumpToFile);
        s3Client.send(new PutObjectCommand({
            Bucket, Key, Body
        })).then(() => {
            console.log(`completed dump ${Key}`);
        }).catch((error) => {
            console.error(error);
            console.log(`failed to upload dump ${Key}`);
        }).finally(() => {
            rmSync(dumpToFile);
        })
    }).catch((error) => {
        console.error(error);
        console.log(`failed to make dump ${Key}`);
    })
};

for (const connection of config.connections) {
    dump(connection);
    setInterval(() => { dump(connection) }, connection.interval);
}