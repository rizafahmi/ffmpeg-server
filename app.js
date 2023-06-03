import express from 'express';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'node:fs/promises';
import { spawn } from 'child_process';
import { Server } from 'socket.io';
import http from 'http';

const UPLOAD_PATH = 'public/uploads'

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });

// Nunjucks view engine
nunjucks.configure(['templates/'], {
  autoescape: true,
  express: app
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
  const ffmpeg = spawn(command, { stdio: ['pipe', 'pipe', process.stderr], shell: true });
  ffmpeg.stdout.on('data', function(data) {
    console.log(data);
  })

  ffmpeg.on('exit', function() {
    // Do something when finish
    console.info("Conversion finished.");
  });

  res.render('index.html')
});

io.on('connection', function(socket) {
  console.log('a user connected');
});

server.listen(3000, function() {
  console.info('Server is running on port 3000');
});
