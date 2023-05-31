import express from 'express';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';
import multer from 'multer';
import fs from 'fs';

const UPLOAD_PATH = 'public/uploads'

const app = express();

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

app.post('/convert', upload.single('file'), function(req, res) {
  console.log(req.file);
  // Save temporary file
  fs.writeFileSync(`${UPLOAD_PATH}/temp/${req.file.originalname}`, req.file.buffer);

  // Convert file

  // Delete temporary file

  // Save converted file
  // const ext = req.file.originalname.split('.').pop();
  // fs.writeFileSync(`${UPLOAD_PATH}/download.${ext}`, req.file.buffer);
  res.send({ status: 'OK' })
});

app.listen(3000, function() {
  console.info('Server is running on port 3000');
});
