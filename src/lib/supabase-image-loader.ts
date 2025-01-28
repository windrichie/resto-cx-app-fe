interface ImageLoaderProps {
    src: string;
    width: number;
    quality?: number;
  }
  
  export default function supabaseLoader({ src, width, quality }: ImageLoaderProps): string {
    return `https://khvjopmkzkuueacepepi.supabase.co/storage/v1/render/image/public/${src}?width=${width}&quality=${quality || 75}`;
  }
  