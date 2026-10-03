// The @types/wordpress__block-editor package (DefinitelyTyped, v15) lags
// behind the @wordpress/block-editor version this project uses (v18): it's
// missing the `BlockCanvas` component and the `mediaUpload` editor setting,
// both present and documented in the installed package's own README/source.
// This augments the module rather than re-typing it wholesale.
import type { ComponentType, ReactNode } from 'react';

declare module '@wordpress/block-editor' {
  interface BlockCanvasProps {
    height?: string;
    styles?: { css: string }[];
    children?: ReactNode;
  }
  export const BlockCanvas: ComponentType<BlockCanvasProps>;

  interface EditorSettings {
    mediaUpload?: (args: {
      filesList: File[];
      allowedTypes?: string[];
      onFileChange: (media: { id?: number; url: string; alt?: string }[]) => void;
      onError?: (message: string) => void;
    }) => void;
    __experimentalFeatures?: {
      color?: {
        palette?: { theme?: { slug: string; name: string; color: string }[] };
        gradients?: { theme?: { slug: string; name: string; gradient: string }[] };
        custom?: boolean;
        customGradient?: boolean;
      };
      typography?: {
        fontSizes?: { theme?: { slug: string; name: string; size: string }[] };
        customFontSize?: boolean;
      };
    };
  }
}
