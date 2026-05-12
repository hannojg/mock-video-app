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
  VideoSampleSink,
} from 'mediabunny';
import { Mockup } from '../constants/mockups';

export type RenderMode = 'single' | 'comparison';

type GenerateVideoParams = {
  mode: RenderMode;
  primaryVideoFile: File;
  comparisonVideoFile?: File | null;
  mockup: Mockup;
  backgroundColor: string;
  canvasWidth: number;
  canvasHeight: number;
  phoneSizePercentage: number;
  mockupBackgroundColor: string;
  verticalOffset: number;
  primaryDuration: number;
  comparisonDuration?: number | null;
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
    mode,
    phoneSizePercentage,
    verticalOffset,
    primaryVideoFile,
    comparisonVideoFile,
    canvasWidth,
    canvasHeight,
    primaryDuration,
    comparisonDuration,
    frameRate,
  }: GenerateVideoParams): Promise<void> => {
    setTranspilingStarted(true);
    setTranspilingFinished(false);
    setProgress(0);

    try {
      const mockupScale = phoneSizePercentage / 100;
      const mockupAspectRatio = mockup.width / mockup.height;
      const offsetInPixels = (verticalOffset / 100) * canvasHeight;
      const outputDuration =
        mode === 'comparison'
          ? Math.max(primaryDuration, comparisonDuration ?? 0)
          : primaryDuration;

      const createLayout = (position: { x: number; y: number }, mockupHeight: number, mockupWidth: number) => {
        const mockupInnerHeight = Math.round(
          (mockup.innerHeight / mockup.height) * mockupHeight
        );
        const mockupInnerWidth = Math.round(
          (mockup.innerWidth / mockup.height) * mockupHeight
        );
        const offsetX = (mockupWidth - mockupInnerWidth) / 2;
        const offsetY = (mockupHeight - mockupInnerHeight) / 2;
        const borderRadius = mockup.cornerRadius * (mockupHeight / mockup.height);

        return {
          posX: position.x,
          posY: position.y,
          mockupWidth,
          mockupHeight,
          mockupInnerWidth,
          mockupInnerHeight,
          offsetX,
          offsetY,
          borderRadius,
          coloredSquareWidth: Math.round(mockupInnerWidth * 1.01),
          coloredSquareHeight: Math.round(mockupInnerHeight * 1.01),
        };
      };

      const singleMockupHeight = canvasHeight * mockupScale;
      const singleMockupWidth = mockupAspectRatio * singleMockupHeight;
      const singlePosX = (canvasWidth - singleMockupWidth) / 2;
      const singlePosY = ((canvasHeight - singleMockupHeight) / 2 + offsetInPixels) * 0.9;

      const comparisonGap = canvasWidth * 0.035;
      const comparisonTargetHeight = canvasHeight * mockupScale;
      const comparisonMaxHeightFromWidth =
        (canvasWidth * 0.92 - comparisonGap) / (mockupAspectRatio * 2);
      const comparisonMockupHeight = Math.min(
        comparisonTargetHeight,
        canvasHeight * 0.78,
        comparisonMaxHeightFromWidth
      );
      const comparisonMockupWidth = mockupAspectRatio * comparisonMockupHeight;
      const comparisonRowWidth = comparisonMockupWidth * 2 + comparisonGap;
      const comparisonBaseX = (canvasWidth - comparisonRowWidth) / 2;
      const comparisonBaseY = Math.max(
        0,
        Math.min(
          canvasHeight - comparisonMockupHeight,
          (canvasHeight - comparisonMockupHeight) / 2 + offsetInPixels
        )
      );

      const layouts =
        mode === 'comparison'
          ? {
              left: createLayout(
                { x: comparisonBaseX, y: comparisonBaseY },
                comparisonMockupHeight,
                comparisonMockupWidth
              ),
              right: createLayout(
                { x: comparisonBaseX + comparisonMockupWidth + comparisonGap, y: comparisonBaseY },
                comparisonMockupHeight,
                comparisonMockupWidth
              ),
            }
          : {
              left: createLayout(
                { x: singlePosX, y: singlePosY },
                singleMockupHeight,
                singleMockupWidth
              ),
            };

      const mockupImageResponse = await fetch(mockup.imageRelative);
      const mockupImageBlob = await mockupImageResponse.blob();
      const mockupImage = await createImageBitmap(mockupImageBlob);

      const primarySource = {
        file: primaryVideoFile,
        duration: primaryDuration,
        slot: 'left' as const,
      };
      const comparisonSource =
        mode === 'comparison' && comparisonVideoFile
          ? {
              file: comparisonVideoFile,
              duration: comparisonDuration ?? 0,
              slot: 'right' as const,
            }
          : null;

      const mainSource =
        comparisonSource && comparisonSource.duration > primarySource.duration
          ? comparisonSource
          : primarySource;
      const secondarySource =
        comparisonSource && mainSource.slot === primarySource.slot
          ? comparisonSource
          : comparisonSource && mainSource.slot === comparisonSource.slot
            ? primarySource
            : null;

      const input = new Input({
        source: new BlobSource(mainSource.file),
        formats: ALL_FORMATS,
      });
      const secondaryInput = secondarySource
        ? new Input({
            source: new BlobSource(secondarySource.file),
            formats: ALL_FORMATS,
          })
        : null;
      const secondaryTrack = secondaryInput ? await secondaryInput.getPrimaryVideoTrack() : null;
      const secondarySink = secondaryTrack ? new VideoSampleSink(secondaryTrack) : null;

      const output = new Output({
        format: new Mp4OutputFormat(),
        target: new BufferTarget(),
      });

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

      const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d', {
        alpha: false,
        willReadFrequently: false
      })!;

      const conversion = await Conversion.init({
        input,
        output,
        video: {
          width: canvasWidth,
          height: canvasHeight,
          fit: 'fill',
          frameRate,
          codec: 'avc',
          bitrate: QUALITY_HIGH,
          process: async (sample) => {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            const secondarySample =
              secondarySink ? await secondarySink.getSample(sample.timestamp) : null;
            const slotSamples = {
              [mainSource.slot]: sample,
              ...(secondarySource ? { [secondarySource.slot]: secondarySample } : {}),
            };

            for (const [slot, layout] of Object.entries(layouts)) {
              const currentSample = slotSamples[slot as keyof typeof slotSamples];
              const squareX = Math.round((layout.posX + layout.offsetX) * 0.995);
              const squareY = Math.round((layout.posY + layout.offsetY) * 0.995);
              const videoX = Math.round((layout.posX + layout.offsetX) * 0.9995);
              const videoY = Math.round((layout.posY + layout.offsetY) * 0.9995);

              ctx.save();
              createRoundedRectPath(
                ctx,
                squareX,
                squareY,
                layout.coloredSquareWidth,
                layout.coloredSquareHeight,
                layout.borderRadius
              );
              ctx.fillStyle = mockupBackgroundColor;
              ctx.fill();
              ctx.restore();

              if (currentSample) {
                ctx.save();
                createRoundedRectPath(
                  ctx,
                  videoX,
                  videoY,
                  layout.mockupInnerWidth,
                  layout.mockupInnerHeight,
                  layout.borderRadius
                );
                ctx.clip();
                currentSample.draw(
                  ctx,
                  videoX,
                  videoY,
                  layout.mockupInnerWidth,
                  layout.mockupInnerHeight
                );
                ctx.restore();
              }

              ctx.drawImage(
                mockupImage,
                layout.posX,
                layout.posY,
                layout.mockupWidth,
                layout.mockupHeight
              );
            }

            secondarySample?.close();

            return canvas;
          },
        },
        audio: {
          discard: true,
        },
        trim: {
          start: 0,
          end: outputDuration,
        },
      });

      conversionRef.current = conversion;

      conversion.onProgress = (progressValue: number) => {
        setProgress(progressValue * 100);
      };

      await conversion.execute();

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
