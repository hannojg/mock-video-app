"use client";

import { Slider } from "@/components/ui/slider";
import { colors } from "@/lib/constants/colors";
import { mockupsDefs } from "@/lib/constants/mockups";
import { aspectRatios } from "@/lib/constants/sizes";
import useFFmpeg from "@/lib/hooks/useFFmpeg";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";

import Image from "next/image";
import { ChangeEvent, useCallback, useState } from "react";

export default function Home() {
  const { ffmpeg, isLoaded, isLoading, generateVideo, progress, transpilingFinished, finishedVideoUrl, transpilingStarted } = useFFmpeg();
  const [selectedMockup, setSelectedMockup] = useState(mockupsDefs[0]);
  const [scale, setScale] = useState(90);
  const [backgroundColor, setBackgroundColor] = useState(colors[0]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0]);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setVideoFile(files[0]);
      console.log("Video file:", files[0]);
    }
  }, []);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24" style={{ backgroundColor: backgroundColor + "33" }}>
      <div
        className="border border-black/5 rounded-xl shadow-2xlshadow-black/15 min-w-[70%] group max-w-[80%] relative flex justify-center items-center overflow-hidden transition-all ease-in-out duration-300"
        style={{
          backgroundColor: backgroundColor,
          aspectRatio: `${selectedAspectRatio.width}/${selectedAspectRatio.height}`,
        }}
      >
        <div
          className="absolute flex items-center justify-center group/phone"
          style={{
            height: `${scale}%`,
            marginTop: `${verticalOffset}%`,
          }}
        >
          <div className="h-full w-full flex items-center justify-center ">
            <div className="absolute w-full h-full bg-white/5 rounded-[20%]  flex flex-col items-center justify-center p-[5%]  group-hover/phone:bg-white/30 transition-colors transform-gpu">
              <div
                className="flex flex-col items-center gap-2"
                style={{
                  transform: `scale(${scale / 100})`,
                  width: `${selectedMockup.innerWidth * 0.1}px`,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-50 ">
                  <path d="M7.25 11.5a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z" />
                  <path
                    fillRule="evenodd"
                    d="M6 1a2.5 2.5 0 0 0-2.5 2.5v9A2.5 2.5 0 0 0 6 15h4a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 10 1H6Zm4 1.5h-.5V3a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5v-.5H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1Z"
                    clipRule="evenodd"
                  />
                </svg>

                <p className="text-xs text-center text-black/70 max-w-full">Click here to upload a screen recording of your app</p>
              </div>
            </div>
            <div
              className="absolute rounded-[5%] overflow-hidden"
              style={{
                left: `${((selectedMockup.width - selectedMockup.innerWidth) / selectedMockup.width) * 50}%`,
                top: `${((selectedMockup.height - selectedMockup.innerHeight) / selectedMockup.height) * 40}%`,
                width: `${(selectedMockup.innerWidth / selectedMockup.width) * 100 * 1.005}%`,
                height: `${(selectedMockup.innerHeight / selectedMockup.height) * 100 * 1.01}%`,
              }}
            >
              {videoFile && (
                <video controls={false} autoPlay className="w-full h-full" loop>
                  <source src={URL.createObjectURL(videoFile)} />
                </video>
              )}
            </div>

            <Image priority src={selectedMockup.imageRelative} alt={selectedMockup.name + " mockup"} width={selectedMockup.width} height={selectedMockup.height} className="h-full w-full relative" />
            <label className="w-full h-full absolute cursor-pointer top-0">
              <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
            </label>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <Popover>
            <PopoverTrigger>
              <div className="w-8 h-8 bg-black/5 p-1.5 rounded-full group-hover:scale-125 ease-springy transform-gpu transition-all duration-300 hover:bg-black/10 hover:ease-in-out">
                <div className="w-full h-full text-black/40">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
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
                  className="appearance-none bg-white/60 rounded-md px-3 py-1 w-full text-xs font-normal text-black/80"
                  onChange={(event) => {
                    setSelectedMockup(mockupsDefs.find((mockup) => mockup.name === event.target.value)!);
                  }}
                >
                  <optgroup label="iPhone">
                    {mockupsDefs.map((mockup) => (
                      <option key={mockup.name} value={mockup.name}>
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
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
                  className="appearance-none bg-white/60 rounded-md px-3 py-1 w-full text-xs font-normal text-black/80"
                  onChange={(event) => {
                    setSelectedAspectRatio(aspectRatios.find((ratio) => ratio.name === event.target.value)!);
                  }}
                >
                  <optgroup label="iPhone">
                    {aspectRatios.map((ratio) => (
                      <option key={ratio.name} value={ratio.name}>
                        {ratio.name}
                      </option>
                    ))}
                  </optgroup>
                  {/* <optgroup label="Android">
                  <option value="volvo">Volvo</option>
                  <option value="saab">Saab</option>
                </optgroup> */}
                </select>

                <div className="absolute right-1 text-black/70">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <hr className="my-1.5 border-none" />
              <label className="font-normal mb-1 text-black/80 text-xs">Size</label>
              <Slider
                defaultValue={[90]}
                max={150}
                step={1}
                min={30}
                onValueChange={(value) => {
                  setScale(value[0]);
                }}
              />
              <hr className="my-1.5 border-none" />
              <label className="font-normal mb-1 text-black/80 text-xs">Vertical Position</label>
              <Slider
                defaultValue={[0]}
                max={100}
                step={1}
                min={-100}
                onValueChange={(value) => {
                  setVerticalOffset(value[0]);
                }}
              />
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
      </div>
      {videoFile && (
        <button
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
            });
          }}
        >
          generate
        </button>
      )}

      {transpilingStarted && !transpilingFinished && <progress className="w-full" value={progress} max={100} />}
      {transpilingFinished && finishedVideoUrl && <button onClick={() => window.open(finishedVideoUrl, "_blank")}>Download</button>}
    </main>
  );
}
