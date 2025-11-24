import { PaperSize } from './types';

export const MM_PER_INCH = 25.4;

export const PAPER_SIZES: PaperSize[] = [
  { name: 'A0', width: 841, height: 1189 },
  { name: 'A1', width: 594, height: 841 },
  { name: 'A2', width: 420, height: 594 },
  { name: 'A3', width: 297, height: 420 },
  { name: 'A4', width: 210, height: 297 },
  { name: 'A5', width: 148, height: 210 },
  { name: 'Letter', width: 215.9, height: 279.4 },
  { name: 'Legal', width: 215.9, height: 355.6 },
  { name: 'Tabloid', width: 279.4, height: 431.8 },
];

export const COMMON_PHOTO_SIZES: PaperSize[] = [
  { name: '4x6"', width: 101.6, height: 152.4 },
  { name: '5x7"', width: 127, height: 177.8 },
  { name: '8x10"', width: 203.2, height: 254 },
  { name: '11x14"', width: 279.4, height: 355.6 },
  { name: '12x16"', width: 304.8, height: 406.4 },
  { name: '16x20"', width: 406.4, height: 508 },
  { name: 'A4', width: 210, height: 297 },
  { name: 'A3', width: 297, height: 420 },
];
