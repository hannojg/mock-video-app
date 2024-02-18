import { useState, useEffect, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Mockup } from "../constants/mockups";
import { mock } from "node:test";
import { AspectRatio } from "../constants/sizes";

type GenerateVideoParams = {
  videoFile: File;
  mockup: Mockup;
  backgroundColor: string;
  canvasWidth: number;
  canvasHeight: number;
  phoneSizePercentage: number;
  mockupBackgroundColor: string;
  verticalOffset: number;
};

interface UseFFmpegHook {
  ffmpeg: FFmpeg | null;
  isLoaded: boolean;
  isLoading: boolean;
  progress: number;
  transpilingStarted: boolean;
  transpilingFinished: boolean;
  finishedVideoUrl: string | null;
  generateVideo: (params: GenerateVideoParams) => Promise<void>;
}

const useFFmpeg = (): UseFFmpegHook => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [transpilingStarted, setTranspilingStarted] = useState(false);
  const [transpilingFinished, setTranspilingFinished] = useState(false);
  const [finishedVideoUrl, setFinishedVideoUrl] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());

  useEffect(() => {
    load();
  }, []);

  const generateVideo = async ({ backgroundColor, mockup, mockupBackgroundColor, phoneSizePercentage, verticalOffset, videoFile, canvasHeight, canvasWidth }: GenerateVideoParams): Promise<void> => {
    if (!ffmpegRef.current || !ffmpegRef.current.loaded) {
      throw new Error("FFmpeg is not loaded yet.");
    }
    const ffmpeg = ffmpegRef.current;
    setTranspilingStarted(true);
    setTranspilingFinished(false);
    setProgress(0);

    try {
      const videoFilename = "input_video.mp4";
      const mockupImageFilename = "mockup_image.png";
      const outputFilename = "output_video.mp4";
      await ffmpeg.writeFile(videoFilename, await fetchFile(videoFile));
      await ffmpeg.writeFile(mockupImageFilename, await fetchFile(mockup.imageRelative));
      ffmpeg.on("progress", ({ progress }) => {
        setProgress(progress * 100);
      });
      const mockupScale = phoneSizePercentage / 100;
      const mockupHeight = canvasHeight * mockupScale;
      const mockupWidth = (mockup.width / mockup.height) * mockupHeight;
      const mockupInnerHeight = Math.round((mockup.innerHeight / mockup.height) * mockupHeight);
      const mockupInnerWidth = Math.round((mockup.innerWidth / mockup.height) * mockupHeight);
      const posX = (canvasWidth - mockupWidth) / 2;
      const posY = (canvasHeight - mockupHeight) / 2;
      const offsetInPixels = (verticalOffset / 100) * canvasHeight;
      const adjustedPosY = posY + offsetInPixels;
      const offsetX = (mockupWidth - mockupInnerWidth) / 2;
      const offsetY = (mockupHeight - mockupInnerHeight) / 2;

      console.table({
        canvasWidth,
        canvasHeight,
        mockupScale,
        mockupHeight,
        mockupWidth,
        mockupInnerHeight,
        mockupInnerWidth,
        posX,
        posY,
        offsetX,
        offsetY,
        verticalOffset,
      });
      const geqFilterExpression = `
      geq=lum='p(X,Y)':a='if(gt(abs(W/2-X),W/2-20)*gt(abs(H/2-Y),H/2-20),
      if(lte(hypot(20-(W/2-abs(W/2-X)),20-(H/2-abs(H/2-Y))),20),255,0),255)'
      `.trim();

      const filterComplex = `
      [1:v]scale=${mockupInnerWidth}:${mockupInnerHeight},format=yuva420p,${geqFilterExpression}[video_scaled];
      color=c=${mockupBackgroundColor}:s=${mockupInnerWidth + 3}x${mockupInnerHeight + 3},format=yuva420p,${geqFilterExpression}[colored_square];
      [0:v][colored_square]overlay=x=${posX + offsetX}:y=${adjustedPosY + offsetY}[bg_with_square];
      [bg_with_square][video_scaled]overlay=x=${posX + offsetX}:y=${adjustedPosY + offsetY}[video_with_bg];
      [2:v]scale=${mockupWidth}:${mockupHeight}[mockup_scaled];
      [video_with_bg][mockup_scaled]overlay=x=${posX}:y=${adjustedPosY}
      `.trim();

      const args = [
        "-f",
        "lavfi",
        "-i",
        `color=c=${backgroundColor}:s=${canvasWidth + "x" + canvasHeight}`,
        "-i",
        videoFilename,
        "-i",
        mockupImageFilename,
        "-filter_complex",
        filterComplex,
        "-t",
        "10",
        "-map",
        "0:v",
        "-c:v",
        "libx264",
        "-crf",
        "28",
        "-preset",
        "ultrafast",
        "-an", // Disable audio
        outputFilename,
      ];

      await ffmpeg.exec(args);
      const data = (await ffmpeg.readFile(outputFilename)) as any;
      const videoBlob = new Blob([data.buffer], { type: "video/mp4" });
      const videoUrl = URL.createObjectURL(videoBlob);
      setFinishedVideoUrl(videoUrl);
    } catch (error) {
      console.error("Error generating video:", error);
      throw error;
    } finally {
      setTranspilingFinished(true);
      setTranspilingStarted(false);
    }
  };

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => console.log(message));
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    setIsLoaded(true);
    setIsLoading(false);
  };

  return {
    ffmpeg: ffmpegRef.current,
    isLoaded,
    isLoading,
    progress,
    transpilingStarted,
    transpilingFinished,
    finishedVideoUrl,
    generateVideo,
  };
};

export default useFFmpeg;
