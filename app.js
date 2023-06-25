import express from 'express';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';
import multer from 'multer';
import cors from 'cors';
import sqlite from 'better-sqlite3';
import fs from 'node:fs/promises';
import { spawn } from 'child_process';
import path from 'path';

const db = new sqlite(path.resolve('stats.db'), { fileMustExist: false });
try {
  console.info("Initializing database...");

  db.exec(`CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time INTEGER NOT NULL,
    user_agent TEXT,
    filesize INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);
  console.info("Database initialized.");

} catch(err) {
  console.error(err);
}

const UPLOAD_PATH = 'public/uploads';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.static('node_modules/open-props'));

const upload = multer({ storage: multer.memoryStorage() });

// Nunjucks view engine
nunjucks.configure(['templates/'], {
  autoescape: true,
  express: app,
});

app.set('view engine', 'html');

app.get('/', function(req, res) {
  res.render('index.html');
});

app.post('/', upload.single('file'), async function(req, res) {
  // console.log(req.file);

  // Check file destination exsist, if exist, delete it
  try {
    await fs.access(`${UPLOAD_PATH}/download.webm`, fs.F_OK);
    await fs.unlink(`${UPLOAD_PATH}/download.webm`);
  } catch (err) {
    console.log(err);
  }

  // Save temporary file
  const fullpath = `${UPLOAD_PATH}/temp/${req.file.originalname}`;
  try {
    await fs.writeFile(fullpath, req.file.buffer);
  } catch (err) {
    console.log(err);
  }

  // Convert file
  const command = `ffmpeg -i "${fullpath}" -c:v libvpx -crf 15 -b:v 1M -c:a libvorbis ${UPLOAD_PATH}/download.webm`;
  const start = Date.now();
  const ffmpeg = spawn(command, {
    stdio: ['pipe', 'pipe', process.stderr],
    shell: true,
  });
  ffmpeg.stdout.on('data', function(data) {
    console.log(data);
  });

  ffmpeg.on('exit', function() {
    // Do something when finish
    console.info('Conversion finished.');
    const end = Date.now();
    res.render('finish.html', { time: end - start });
  });
});

app.get('/client', function(req, res) {

  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')

  res.render('client.html');
});

app.get('/report', function(req, res) {
  const data = db.prepare(`SELECT * FROM stats ORDER BY created_at DESC;`).all();

  res.render('report.html', { data });
});

app.use(express.json());
app.post('/api/record', function(req, res) {
  console.info('Save stat to database...');
  const { filesize, time } = req.body;
  const stmt = db.prepare(`INSERT INTO stats (time, user_agent, filesize) VALUES (?, ?, ?);`);
  stmt.run(parseInt(time), req.headers['user-agent'], parseInt(filesize));
  res.json({ status: 'OK' });
});

app.listen(3000, function() {
  console.info('Server is running on port 3000');
});
