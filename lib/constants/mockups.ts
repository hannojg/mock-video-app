export type Mockup = {
  id: string;
  name: string;
  imageAbsolute: string;
  imageRelative: string;
  innerWidth: number;
  innerHeight: number;
  width: number;
  height: number;
};

export const mockupsDefs = [
  {
    id: "1",
    name: "iPhone 14 Pro",
    imageAbsolute: "/public/images/mockups/iphone/14/pro.png",
    imageRelative: "/images/mockups/iphone/14/pro.png",
    innerWidth: 1179,
    innerHeight: 2556,
    width: 1312,
    height: 2672,
  },
];
