const fs = require('fs');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

const playlistId = 'PL010283CD34E96520'; // Replace with your playlist ID
const downloadFolder = './downloads';

// Check if download directory exists, if not, create it
if (!fs.existsSync(downloadFolder)){
    fs.mkdirSync(downloadFolder);
}

// Fetch the list of video URLs in the playlist
ytpl(playlistId).then(res => {
  // For each video in the playlist...
  res.items.forEach(item => {
    const videoUrl = item.shortUrl;
    const videoTitle = item.title.replace(/[\/\?<>\\:\*\|":]/g, '');
    console.log('Downloading: ', videoTitle);

    // Start downloading the video
    ytdl(videoUrl, { quality: 'highestvideo' })
      .on('response', (res) => {
        const totalSize = parseInt(res.headers['content-length'], 10);
        let downloaded = 0;

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          const percentage = downloaded / totalSize;
          process.stdout.write(`${videoTitle} ${(percentage * 100).toFixed(2)}% downloaded \r`);
        });

        res.on('end', () => console.log(`\nCompleted downloading ${videoTitle}`));
      })
      .pipe(fs.createWriteStream(`${downloadFolder}/${videoTitle}_video.mp4`))
      .on('finish', () => {
        ffmpeg()
          .input(`${downloadFolder}/${videoTitle}_video.mp4`)
          .input(ytdl(videoUrl, { quality: 'highestaudio' }))
          .audioCodec('aac')
          .videoCodec('copy')
          .format('mp4')
          .save(`${downloadFolder}/${videoTitle}.mp4`)
          .on('end', () => fs.unlinkSync(`${downloadFolder}/${videoTitle}_video.mp4`));
      });
  });
}).catch(console.error);
