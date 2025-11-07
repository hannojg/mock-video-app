"use client";

import { Slider } from "@/components/ui/slider";
import { colors } from "@/lib/constants/colors";
import { mockupsDefs } from "@/lib/constants/mockups";
import { aspectRatios } from "@/lib/constants/sizes";
import useMediabunny from "@/lib/hooks/useMediabunny";
import { cn } from "@/lib/utils";
import { smartTrim } from "@/lib/utils/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import clsx from "clsx";
import Image from "next/image";
import { ChangeEvent, DragEvent, DragEventHandler, useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
  const { isLoaded, isLoading, generateVideo, progress, reset, transpilingFinished, finishedVideoUrl, transpilingStarted } = useMediabunny();
  const [selectedMockup, setSelectedMockup] = useState(mockupsDefs[0]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scale, setScale] = useState(90);
  const [backgroundColor, setBackgroundColor] = useState(colors[0]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFramerate, setSelectedFramerate] = useState(30);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setVideoFile(files[0]);
    }
    setTimeout(() => {
      event.target.value = "";
    }, 50);
  }, []);
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);

      setVideoUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile]);
  useEffect(() => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      const currentTime = (progress / 100) * videoDuration;
      videoRef.current.currentTime = currentTime;
    }
  }, [progress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (transpilingStarted) {
      video.pause();
    }

    if (transpilingFinished) {
      video.play();
    }
  }, [transpilingStarted, transpilingFinished]);

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    console.log("drag over");
    event.preventDefault();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((event: DragEvent<HTMLLabelElement>) => {
    console.log("drag leave");
    event.preventDefault();
    setIsDragOver(false);
  }, []);
  const handleDrop = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    console.log("drag drop");
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setVideoFile(files[0]);
    }
  }, []);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-[5%]"
      style={{ backgroundColor: backgroundColor + "33" }}
    >
      <div className="flex-1 flex flex-col text-center justify-center items-center">
        <span className="text-base text-black/70 font-medium mb-1">Video Mockup Generator</span>
        {/* <span className="text-black/50 text-xs">1. Select video</span>
        <span className="text-black/50 text-xs">2. Adjust settings to your liking</span>
        <span className="text-black/50 text-xs">3. Generate video</span> */}
      </div>
      <div className="w-full h-full justify-center items-center flex relative">
        <div
          className="border border-black/5 rounded-xl shadow-2xl shadow-black/5 group relative flex justify-center items-center transition-all ease-in-out duration-300 overflow-hidden"
          style={{
            height: "100%",
            width: `calc(60vh * ${selectedAspectRatio.width}/${selectedAspectRatio.height})`,
            maxHeight: "60vh",
            backgroundColor: backgroundColor,
            aspectRatio: `${selectedAspectRatio.width}/${selectedAspectRatio.height}`,
          }}
        >
          <div
            className="cursor-pointer absolute flex items-center justify-center group/phone"
            style={{
              height: `${scale}%`,
              marginTop: `${verticalOffset}%`,
              aspectRatio: `${selectedMockup.width}/${selectedMockup.height}`,
            }}
          >
            <div className="h-full w-full flex items-center justify-center cursor-pointer">
              <div className="absolute w-full h-full bg-white/5 rounded-[20%]  flex flex-col items-center justify-center p-[5%] group-hover/phone:bg-white/30 transition-colors transform-gpu">
                <div
                  className="flex flex-col items-center gap-2 "
                  style={{
                    transform: `scale(${Math.max(Math.min(scale / 100, 1), 0.6)})`,
                    width: "90%",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-4 h-4 opacity-20 lg:w-5 lg:h-5"
                  >
                    <path d="M7.25 11.5a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z" />
                    <path
                      fillRule="evenodd"
                      d="M6 1a2.5 2.5 0 0 0-2.5 2.5v9A2.5 2.5 0 0 0 6 15h4a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 10 1H6Zm4 1.5h-.5V3a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5v-.5H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1Z"
                      clipRule="evenodd"
                    />
                  </svg>

                  <p className="text-xs lg:text-sm text-center text-black/50 max-w-full">Click or drag here to add a screen recording of your app</p>
                </div>
                {/* {isDragOver && <div className="w-full h-full absolute bg-white/80 backdrop-blur-lg pointer-events-none flex items-center justify-center text-black/70 text-xs">Drop video here</div>} */}
              </div>
              <div
                className={cn("absolute rounded-[5%] overflow-hidden  transition-all duration-200 group-hover/phone:opacity-30 group-hover/phone:blur-sm")}
                style={{
                  left: `${((selectedMockup.width - selectedMockup.innerWidth) / selectedMockup.width) * 50}%`,
                  top: `${((selectedMockup.height - selectedMockup.innerHeight) / selectedMockup.height) * 40}%`,
                  width: `${(selectedMockup.innerWidth / selectedMockup.width) * 100 * 1.005}%`,
                  height: `${(selectedMockup.innerHeight / selectedMockup.height) * 100 * 1.01}%`,
                }}
              >
                {videoFile && (
                  <video
                    controls={false}
                    muted
                    autoPlay
                    className="w-full h-full "
                    key={videoUrl}
                    loop
                    playsInline
                    unselectable="on"
                    ref={videoRef}
                  >
                    <source src={videoUrl} />
                  </video>
                )}
              </div>

              <Image
                priority
                src={selectedMockup.imageRelative}
                alt={selectedMockup.name + " mockup"}
                width={selectedMockup.width}
                height={selectedMockup.height}
                className="h-full w-full relative object-contain"
              />
              <label
                className="w-full h-full absolute cursor-pointer top-0"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {videoFile && !transpilingStarted && !transpilingFinished && videoRef.current && (
            <button
              className="flex items-center text-black/70 bg-white/90 hover:scale-105 transition-all ease-in-out shadow-md border-white/5 shadow-black/5 border backdrop-blur-3xl px-3.5 gap-1 text-sm font-medium py-1 rounded-md absolute bottom-3 left-4"
              onClick={() => {
                generateVideo({
                  videoFile,
                  mockup: selectedMockup,
                  backgroundColor,
                  canvasWidth: selectedAspectRatio.width,
                  canvasHeight: selectedAspectRatio.height,
                  phoneSizePercentage: scale,
                  mockupBackgroundColor: "black",
                  verticalOffset,
                  duration: videoRef.current?.duration!,
                  frameRate: selectedFramerate,
                });
              }}
            >
              <span>Generate Video</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M9.58 1.077a.75.75 0 0 1 .405.82L9.165 6h4.085a.75.75 0 0 1 .567 1.241l-6.5 7.5a.75.75 0 0 1-1.302-.638L6.835 10H2.75a.75.75 0 0 1-.567-1.241l6.5-7.5a.75.75 0 0 1 .897-.182Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          {!transpilingStarted && !transpilingFinished && (
            <div className="absolute top-4 right-4">
              <Popover>
                <PopoverTrigger>
                  <div className="w-8 h-8 bg-black/5 p-1.5 rounded-full group-hover:scale-125 ease-springy transform-gpu transition-all duration-300 hover:bg-black/10 hover:ease-in-out">
                    <div className="w-full h-full text-black/40">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M9.66852 16.5404L7.67137 19.7958C6.8191 21.185 4.89246 21.4125 3.74002 20.2601C2.58758 19.1076 2.81511 17.181 4.20431 16.3287L7.45968 14.3316C7.73521 14.1625 7.78034 13.7804 7.55177 13.5518L6.41423 12.4143C5.63317 11.6332 5.63317 10.3669 6.41423 9.58586L7.14646 8.85363C7.34173 8.65837 7.65831 8.65837 7.85357 8.85363L15.1465 16.1465C15.3417 16.3418 15.3417 16.6584 15.1465 16.8536L14.4142 17.5859C13.6332 18.3669 12.3669 18.3669 11.5858 17.5859L10.4483 16.4483C10.2197 16.2198 9.83756 16.2649 9.66852 16.5404Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M16.6464 14.6464L9.35348 7.3535C9.15821 7.15823 9.15822 6.84164 9.35349 6.64638L12.1186 3.8814C13.2902 2.70989 15.1896 2.7099 16.3612 3.88142L20.1185 7.63865C21.2901 8.81022 21.2901 10.7097 20.1185 11.8813L17.3535 14.6464C17.1582 14.8416 16.8416 14.8416 16.6464 14.6464Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="px-3 py-2 rounded-lg backdrop-blur-3xl shadow-2xl shadow-black/10 bg-black/5 mt-3 ring-1 ring-black/5 PopoverContent flex flex-col w-52 overflow-hidden">
                  <label className="font-normal mb-0.5 text-black/80 text-xs">Device</label>
                  <div className="flex relative items-center w-full">
                    <select
                      tabIndex={-1}
                      className="appearance-none bg-white/60 rounded-md px-3 py-1 w-full text-xs font-normal text-black/80"
                      value={selectedMockup.name}
                      onChange={(event) => {
                        setSelectedMockup(mockupsDefs.find((mockup) => mockup.name === event.target.value)!);
                      }}
                    >
                      <optgroup label="iPhone">
                        {mockupsDefs.map((mockup) => (
                          <option
                            key={mockup.name}
                            value={mockup.name}
                          >
                            {mockup.name}
                          </option>
                        ))}
                      </optgroup>
                      {/* <optgroup label="Android">
                  <option value="volvo">Volvo</option>
                  <option value="saab">Saab</option>
                </optgroup> */}
                    </select>

                    <div className="absolute right-1 text-black/70">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <hr className="my-1.5 border-none" />
                  <label className="font-normal mb-0.5 text-black/80 text-xs">Aspec Ratio</label>
                  <div className="flex relative items-center w-full">
                    <select
                      value={selectedAspectRatio.name}
                      tabIndex={-1}
                      className="appearance-none bg-white/60 rounded-md px-3 py-1 w-full text-xs font-normal text-black/80"
                      onChange={(event) => {
                        setSelectedAspectRatio(aspectRatios.find((ratio) => ratio.name === event.target.value)!);
                      }}
                    >
                      {aspectRatios.map((ratio) => (
                        <option
                          key={ratio.name}
                          value={ratio.name}
                        >
                          {ratio.name}
                        </option>
                      ))}
                    </select>

                    <div className="absolute right-1 text-black/70">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <hr className="my-1.5 border-none" />
                  <label className="font-normal mb-1 text-black/80 text-xs flex justify-between items-center">
                    Size
                    <button
                      className="text-black/50"
                      onClick={() => {
                        setScale(90);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="w-3 h-3"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </label>
                  <Slider
                    defaultValue={[90]}
                    max={150}
                    step={1}
                    min={30}
                    value={[scale]}
                    onValueChange={(value) => {
                      setScale(value[0]);
                    }}
                  />
                  <hr className="my-1.5 border-none" />
                  <label className="font-normal mb-1 text-black/80 text-xs flex justify-between items-center">
                    Vertical Position
                    <button
                      className="text-black/50"
                      onClick={() => {
                        setVerticalOffset(0);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="w-3 h-3"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </label>
                  <Slider
                    defaultValue={[0]}
                    max={100}
                    step={1}
                    min={-100}
                    value={[verticalOffset]}
                    onValueChange={(value) => {
                      setVerticalOffset(value[0]);
                    }}
                  />
                  <hr className="my-1.5 border-none" />
                  <label className="font-normal mb-1 text-black/80 text-xs flex justify-between items-center">Framerate</label>

                  <div
                    className="bg-stone-900/5 rounded-lg text-black/70"
                    style={{ padding: 2 }}
                  >
                    <div className="relative flex items-center">
                      {/* <div className="absolute w-full">
                        <div className="w-1/2 flex justify-between m-auto">
                          <div className={clsx("h-3 w-px bg-gray-400 rounded-full opacity-0 transition-opacity duration-100 ease-in-out", selectedFramerate === 30 && "opacity-100")}></div>
                          <div className={clsx("h-3 w-px bg-gray-400 rounded-full opacity-0 transition-opacity duration-100 ease-in-out", selectedFramerate === 60 && "opacity-100")}></div>
                        </div>
                      </div> */}

                      <div className={clsx("absolute left-0 inset-y-0 w-1/2 flex bg-white transition-all ease-in-out duration-200 transform rounded-md shadow", selectedFramerate === 30 && "translate-x-0", selectedFramerate === 60 && "translate-x-full")}></div>

                      <button
                        className="relative flex-1 flex text-xs font-semibold capitalize items-center justify-center cursor-pointer m-px p-px"
                        onClick={() => setSelectedFramerate(30)}
                      >
                        30
                      </button>
                      <button
                        className="relative flex-1 flex text-xs font-semibold capitalize items-center justify-center cursor-pointer m-px p-px"
                        onClick={() => setSelectedFramerate(60)}
                      >
                        60
                      </button>
                    </div>
                  </div>

                  <hr className="my-1.5 border-none" />
                  <label className="font-normal mb-1 text-black/80 text-xs">Background Color</label>
                  <div className="flex gap-2 overflow-auto pb-2">
                    {colors.map((color) => (
                      <div
                        key={color}
                        className={cn("w-6 h-6 rounded-full cursor-pointerborder-0 flex items-center justify-center border border-black/10 shadow-sm", color === backgroundColor && "")}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setBackgroundColor(color);
                        }}
                      >
                        {backgroundColor === color && <div className="bg-white shadow-sm  rounded-full h-2.5 w-2.5" />}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {videoFile && !transpilingStarted && !transpilingFinished && <div className="hidden sm:block bottom-3 right-4 absolute text-xs  text-black/50 font-mono">{smartTrim(videoFile?.name, 16) + " | " + Math.fround(videoFile.size / 1000000).toPrecision(3) + "/Mb"}</div>}
          {transpilingStarted && !transpilingFinished && (
            <>
              <div className="absolute transition-all h-full w-full left-0 " />
              <div
                className="absolute transition-all h-full left-0 bg-black/5"
                style={{
                  width: `${progress}%`,
                }}
              />
              <div className="w-full h-full absolute pointer-events-none " />
              <div className="text-xs bottom-3 left-4 text-black/50 font-mono absolute ">
                <span>Generating video... {Math.min(Math.round(progress), 100)}%</span>
              </div>
            </>
          )}
          {transpilingFinished && finishedVideoUrl && (
            <div className="bg-white/20 backdrop-blur-md absolute transition-all h-full flex items-center justify-center w-full left-0">
              <div className="flex flex-col items-center">
                <button
                  className="flex items-center text-black/70 bg-white/90 hover:scale-105 transition-all ease-in-out shadow-md  border-black/10 border backdrop-blur-3xl px-3.5 gap-1 text-sm font-medium py-1 rounded-md "
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = finishedVideoUrl;
                    a.download = "mockup.mp4";
                    a.click();
                  }}
                >
                  <span>Download Video</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
                    <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
                  </svg>
                </button>
                <hr className="my-1 border-none" />
                <button
                  className="flex items-center font-semibold text-black/60 hover:underline underline-offset-2 group/retry drop-shadow-sm  shadow-black gap-1 text-xs hover:scale-105 ease-in-out"
                  onClick={() => {
                    setVideoFile(null);
                    setScale(90);
                    setBackgroundColor(colors[0]);
                    setVerticalOffset(0);
                    setSelectedMockup(mockupsDefs[0]);
                    setSelectedAspectRatio(aspectRatios[0]);
                    reset();
                  }}
                >
                  <span>Start Over</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5 group-hover/retry:rotate-180 ease-in-out transition-all duration-300"
                  >
                    <path
                      fillRule="evenodd"
                      d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between items-center py-3">
        <div className="text-xs flex items-start text-black/50 gap-x-0.5 mx-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4 "
          >
            <path
              fillRule="evenodd"
              d="M8.5 1.709a.75.75 0 0 0-1 0 8.963 8.963 0 0 1-4.84 2.217.75.75 0 0 0-.654.72 10.499 10.499 0 0 0 5.647 9.672.75.75 0 0 0 .694-.001 10.499 10.499 0 0 0 5.647-9.672.75.75 0 0 0-.654-.719A8.963 8.963 0 0 1 8.5 1.71Zm2.34 5.504a.75.75 0 0 0-1.18-.926L7.394 9.17l-1.156-.99a.75.75 0 1 0-.976 1.138l1.75 1.5a.75.75 0 0 0 1.078-.106l2.75-3.5Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1 flex">This app runs 100% locally (using Mediabunny), so your video data never leaves your device.</span>
        </div>
        <div className="text-xs text-black/30">© Laurids Kern {new Date().getFullYear()}</div>
      </div>
    </main>
  );
}
