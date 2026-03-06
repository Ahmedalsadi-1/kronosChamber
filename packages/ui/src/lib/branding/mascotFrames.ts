// packages/ui/src/lib/branding/mascotFrames.ts

// Assuming a 3x3 grid for the collage images.
// Each frame represents a 1/3rd section of the image (0-2 for x and y).
// We'll export a function that returns the coordinates for a given frame index.

export type MascotFrame = {
  x: number; // 0, 1, 2 for column
  y: number; // 0, 1, 2 for row
  width: number; // typically 1/3rd of image width
  height: number; // typically 1/3rd of image height
};

/**
 * Returns the relative coordinates for a specific frame within a 3x3 collage.
 * @param index The 0-indexed frame number (0-8).
 * @returns {MascotFrame} The x, y, width, and height as percentages/fractions (0-1) for CSS/SVG clipping.
 */
export const getMascotFrameCoords = (index: number): MascotFrame => {
  if (index < 0 || index > 8) {
    console.warn(`Mascot frame index out of bounds: ${index}. Defaulting to index 0.`);
    index = 0;
  }

  const col = index % 3;
  const row = Math.floor(index / 3);

  // Assuming normalized coordinates (0 to 1) for flexibility in rendering
  return {
    x: col / 3,
    y: row / 3,
    width: 1 / 3,
    height: 1 / 3,
  };
};

// You might also want to export the image paths for convenience
export const MASCOT_COLLAGE_A = '/branding/source/gemini-pack-a.png';
export const MASCOT_COLLAGE_B = '/branding/source/gemini-pack-b.png';
export const MASCOT_DEFAULT = '/branding/source/gemini-default.png';
