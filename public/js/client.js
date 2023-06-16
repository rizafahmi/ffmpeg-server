const { createFFmpeg, fetchFile } = FFmpeg;


const ffmpeg = createFFmpeg({ log: true, corePath: 'https://ffmpeg.rizafahmi.com/js/ffmpeg-core.js' });

const formEl = document.querySelector('form');
const loadingEl = document.querySelector('.loading');
const errorEl = document.querySelector('.error');
const highlightEl = document.querySelector('.highlight');
const finishEl = document.querySelector('.finish');
const convertEl = document.querySelector('button[type="submit"]');

formEl.style = 'display: none';
finishEl.style = 'display: none';
errorEl.style = 'display: none';


async function main() {
  try {
    await ffmpeg.load();
    loadingEl.style = 'display: none;';
    formEl.style = 'display: inline';
  } catch (err) {
    console.error(err);
    loadingEl.style = 'display: none;';
    errorEl.style = 'display: block';
  }
}

main();

formEl.addEventListener('submit', convert, false);


async function convert(event) {
  event.preventDefault();
  loadingEl.style = 'display: block;';
  loadingEl.textContent = 'Melakukan konversi... Buka console browser.';
  formEl.style = 'display: none';

  const fileEl = document.querySelector('#file');
  const video = fileEl.files.item(0);

  const start = Date.now();

  ffmpeg.FS('writeFile', video.name, await fetchFile(video));
  await ffmpeg.run(
    '-i',
    video.name,
    '-c:v',
    'libvpx',
    '-crf',
    '15',
    '-b:v',
    '1M',
    '-c:a',
    'libvorbis',
    'download.webm'
  );
  const data = ffmpeg.FS('readFile', 'download.webm');

  const end = Date.now();

  const result = URL.createObjectURL(
    new Blob([data.buffer], { type: 'video/webm' })
  );

  console.info('Conversion complete');
  // create video element
  const videoEl = document.createElement('video');
  videoEl.id = "video";
  videoEl.controls = true;

  const source = document.createElement('source')
  source.src = result;
  source.type = "video/webm";
  videoEl.appendChild(source);

  document.querySelector('.video-container').appendChild(videoEl);
  const duration = end - start;
  console.info('Time taken: ' + duration + 'ms');

  fetch('/api/record', { method: 'POST', body: JSON.stringify({ time: duration, filesize: video.size }), headers: { 'Content-Type': 'application/json' } });
  highlightEl.textContent = duration;

  resetUI();

}

function resetUI() {

  loadingEl.style = 'display: none;';
  formEl.style = 'display: inline';
  finishEl.style = 'display: block';
  convertEl.disabled = true;

}
