const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({ log: true });

async function main() {
  try {
    await ffmpeg.load({ log: true, corePath: 'ffmpeg-core.js' });
  } catch (err) {
    console.error(err);
  }
}

main();

document.querySelector('#file').addEventListener('change', convert, false);


async function convert(event) {
  const video = event.target.files.item(0);

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
  const videoDOM = document.createElement('video');
  videoDOM.id = "video";
  videoDOM.controls = true;

  const source = document.createElement('source')
  source.src = result;
  source.type = "video/webm";
  videoDOM.appendChild(source);

  document.body.appendChild(videoDOM);
  const duration = end - start;
  console.info('Time taken: ' + duration + 'ms');
}
