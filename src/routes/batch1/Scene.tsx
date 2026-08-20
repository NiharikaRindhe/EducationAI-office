import React from 'react';
import { artUrl } from './art';

/**
 * The world the Batch 1 portal sits in.
 *
 * This used to hand-draw the sky, sun, clouds, hills, school and trees as SVG
 * and CSS shapes. That is vector illustration, which was ruled out for this
 * redesign — the portal is claymorphism, raster art only. It is now a single
 * delivered background image (`scene-backdrop`), which paints its own sky,
 * clouds, sun and flowering grass band, so nothing here draws anything.
 *
 * The plain colour fill underneath is not a fallback illustration — it is the
 * page's ground colour, so the screen is never bare white while the image
 * loads, and it still reads as sky if the image is ever missing.
 *
 * Deliberately BEHIND the app frame, and never intercepts a tap.
 */
export const Scene: React.FC = () => {
  const backdrop = artUrl('scene-backdrop');

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#9BD9FB 0%,#CFEEFF 62%,#E9F8FF 100%)' }} />

      {backdrop && (
        // `object-bottom` so the grass band and its flowers stay anchored to
        // the foot of the page on every screen height; a tall narrow window
        // crops sky off the top rather than eating the ground the content
        // visually stands on.
        <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom" />
      )}
    </div>
  );
};
