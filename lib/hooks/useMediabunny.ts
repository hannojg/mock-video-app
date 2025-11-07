import { useState, useRef, useCallback } from 'react';
import {
  Input,
  Output,
  Mp4OutputFormat,
  BufferTarget,
  BlobSource,
  Conversion,
  ALL_FORMATS,
  QUALITY_HIGH,
} from 'mediabunny';
import { Mockup } from '../constants/mockups';

type GenerateVideoParams = {
  videoFile: File;
  mockup: Mockup;
  backgroundColor: string;
  canvasWidth: number;
  canvasHeight: number;
  phoneSizePercentage: number;
  mockupBackgroundColor: string;
  verticalOffset: number;
  duration: number;
  frameRate: number;
};

interface UseMediabunnyHook {
  isLoaded: boolean;
  isLoading: boolean;
  progress: number;
  reset: () => void;
  transpilingStarted: boolean;
  transpilingFinished: boolean;
  finishedVideoUrl: string | null;
  generateVideo: (params: GenerateVideoParams) => Promise<void>;
}

const useMediabunny = (): UseMediabunnyHook => {
  const [isLoaded] = useState(true); // Mediabunny doesn't need loading
  const [isLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transpilingStarted, setTranspilingStarted] = useState(false);
  const [transpilingFinished, setTranspilingFinished] = useState(false);
  const [finishedVideoUrl, setFinishedVideoUrl] = useState<string | null>(null);
  const conversionRef = useRef<Conversion | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setTranspilingStarted(false);
    setTranspilingFinished(false);
    setFinishedVideoUrl(null);
    conversionRef.current = null;
  }, []);

  const generateVideo = async ({
    backgroundColor,
    mockup,
    mockupBackgroundColor,
    phoneSizePercentage,
    verticalOffset,
    videoFile,
    canvasWidth,
    canvasHeight,
    duration,
    frameRate,
  }: GenerateVideoParams): Promise<void> => {
    setTranspilingStarted(true);
    setTranspilingFinished(false);
    setProgress(0);

    try {
      // Calculate mockup dimensions
      const mockupScale = phoneSizePercentage / 100;
      const mockupHeight = canvasHeight * mockupScale;
      const mockupWidth = (mockup.width / mockup.height) * mockupHeight;
      const mockupInnerHeight = Math.round(
        (mockup.innerHeight / mockup.height) * mockupHeight
      );
      const mockupInnerWidth = Math.round(
        (mockup.innerWidth / mockup.height) * mockupHeight
      );
      const posX = (canvasWidth - mockupWidth) / 2;
      const posY = (canvasHeight - mockupHeight) / 2;
      const offsetInPixels = (verticalOffset / 100) * canvasHeight;
      const adjustedPosY = (posY + offsetInPixels) * 0.9;
      const offsetX = (mockupWidth - mockupInnerWidth) / 2;
      const offsetY = (mockupHeight - mockupInnerHeight) / 2;
      const borderRadius = mockup.cornerRadius * (mockupHeight / mockup.height);

      const coloredSquareWidth = Math.round(mockupInnerWidth * 1.01);
      const coloredSquareHeight = Math.round(mockupInnerHeight * 1.01);

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
        adjustedPosY,
        borderRadius,
      });

      // Load the mockup image
      const mockupImageResponse = await fetch(mockup.imageRelative);
      const mockupImageBlob = await mockupImageResponse.blob();
      const mockupImage = await createImageBitmap(mockupImageBlob);

      // Create input from video file
      const input = new Input({
        source: new BlobSource(videoFile),
        formats: ALL_FORMATS,
      });

      // Create output
      const output = new Output({
        format: new Mp4OutputFormat(),
        target: new BufferTarget(),
      });

      // Helper function to create rounded rectangle path
      const createRoundedRectPath = (
        ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
      ) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      };

      // Create reusable canvas and context outside the process loop for better performance
      const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d', {
        alpha: false, // No alpha channel needed, improves performance
        willReadFrequently: false
      })!;

      // Create conversion with video processing
      const conversion = await Conversion.init({
        input,
        output,
        video: {
          width: canvasWidth,
          height: canvasHeight,
          fit: 'fill', // We handle scaling/fitting manually in the process function
          frameRate,
          codec: 'avc',
          bitrate: QUALITY_HIGH,
          process: (sample) => {
            // Clear canvas for this frame (faster than creating new canvas each time)
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // 1. Draw background color
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // 2. Draw black rounded rectangle (behind video for border effect)
            const squareX = Math.round((posX + offsetX) * 0.995);
            const squareY = Math.round((adjustedPosY + offsetY) * 0.995);

            ctx.save();
            createRoundedRectPath(
              ctx,
              squareX,
              squareY,
              coloredSquareWidth,
              coloredSquareHeight,
              borderRadius
            );
            ctx.fillStyle = mockupBackgroundColor;
            ctx.fill();
            ctx.restore();

            // 3. Draw video scaled and rounded to fit device screen
            const videoX = Math.round((posX + offsetX) * 0.9995);
            const videoY = Math.round((adjustedPosY + offsetY) * 0.9995);

            ctx.save();
            createRoundedRectPath(
              ctx,
              videoX,
              videoY,
              mockupInnerWidth,
              mockupInnerHeight,
              borderRadius
            );
            ctx.clip();

            // Draw the video frame
            sample.draw(ctx, videoX, videoY, mockupInnerWidth, mockupInnerHeight);
            ctx.restore();

            // 4. Draw device mockup PNG overlay
            ctx.drawImage(
              mockupImage,
              posX,
              adjustedPosY,
              mockupWidth,
              mockupHeight
            );

            return canvas;
          },
        },
        audio: {
          discard: true, // Disable audio as in the original implementation
        },
        trim: {
          start: 0,
          end: duration,
        },
      });

      conversionRef.current = conversion;

      // Set up progress tracking
      conversion.onProgress = (progressValue: number) => {
        setProgress(progressValue * 100);
      };

      // Execute the conversion
      await conversion.execute();

      // Get the output buffer and create a blob URL
      const outputBuffer = output.target.buffer;
      if (outputBuffer) {
        const videoBlob = new Blob([outputBuffer], { type: 'video/mp4' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setFinishedVideoUrl(videoUrl);
      }
    } catch (error) {
      console.error('Error generating video:', error);
      throw error;
    } finally {
      setTranspilingFinished(true);
      setTranspilingStarted(false);
    }
  };

  return {
    isLoaded,
    isLoading,
    progress,
    transpilingStarted,
    transpilingFinished,
    finishedVideoUrl,
    generateVideo,
    reset,
  };
};

export default useMediabunny;
