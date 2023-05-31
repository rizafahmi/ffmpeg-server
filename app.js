import express from 'express';
import nunjucks from 'nunjucks';
import bodyParser from 'body-parser';
import multer from 'multer';

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
  res.send({ status: 'OK' })
});

app.listen(3000, function() {
  console.info('Server is running on port 3000');
});
