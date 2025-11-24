export type Unit = 'mm' | 'inch';

export interface Dimensions {
  width: number;
  height: number;
}

export interface BorderConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface MountConfig {
  photoWidth: number;
  photoHeight: number;
  photoBorder: number; // Visible white space around photo
  underlap: number; // Hidden part of photo
  mountOffset: number; // Vertical offset
  minBorderWidth: number; // Constraint for advisor
  
  // Board settings
  boardPreset: string;
  customBoardSize: Dimensions;
  
  // Mode: "FixedBoard" calculates borders to fit board. "CustomBorders" calculates board size.
  mode: 'FixedBoard' | 'CustomBorders'; 
  
  // If in CustomBorders mode
  manualBorders: BorderConfig;
  
  // Global orientation
  orientation: 'portrait' | 'landscape';
}

export interface PaperSize {
  name: string;
  width: number; // stored in mm
  height: number; // stored in mm
}

export interface AIAdvice {
  suggestion: string;
  reasoning: string;
  suggestedConfig?: Partial<MountConfig>;
}