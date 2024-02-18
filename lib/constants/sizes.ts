export type AspectRatio = {
  id: string;
  name: string;
  width: number;
  height: number;
};

export const aspectRatios: AspectRatio[] = [
  {
    id: "1",
    name: "16:9 - 1920x1080px",
    width: 1920,
    height: 1080,
  },
  {
    id: "2",
    name: "4:3 - 1920x1440px",
    width: 1920,
    height: 1440,
  },
];
