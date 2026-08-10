import path from "path";
import { promises as fsp } from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

if (ffprobeStatic && ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

export interface AudioProbeResult {
  durationSeconds: number;
  sizeBytes: number;
}

export function probeAudio(filePath: string): Promise<AudioProbeResult> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      const durationSeconds = Number(data?.format?.duration ?? 0) || 0;

      fsp
        .stat(filePath)
        .then((stat) => {
          resolve({ durationSeconds, sizeBytes: stat.size });
        })
        .catch(() => {
          resolve({ durationSeconds, sizeBytes: Number(data?.format?.size ?? 0) || 0 });
        });
    });
  });
}

export function splitAudioIntoChunks(
  inputPath: string,
  outputDir: string,
  segmentSeconds: number,
  extension: string,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const safeExtension = extension.replace(/[^a-z0-9]/gi, "") || "mp3";
    const outputPattern = path.join(outputDir, `chunk-%03d.${safeExtension}`);

    ffmpeg(inputPath)
      .outputOptions([
        "-f",
        "segment",
        "-segment_time",
        String(Math.max(30, Math.round(segmentSeconds))),
        "-reset_timestamps",
        "1",
        "-map",
        "0:a",
        "-c",
        "copy",
      ])
      .output(outputPattern)
      .on("end", () => {
        fsp
          .readdir(outputDir)
          .then((files) => {
            const chunkFiles = files
              .filter((fileName) => fileName.startsWith("chunk-") && fileName.endsWith(`.${safeExtension}`))
              .sort((a, b) => a.localeCompare(b))
              .map((fileName) => path.join(outputDir, fileName));
            resolve(chunkFiles);
          })
          .catch(reject);
      })
      .on("error", (error) => {
        reject(error);
      })
      .run();
  });
}
