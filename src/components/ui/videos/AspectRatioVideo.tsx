type AspectRatioVideoProps = {
  videoUrl: string; 
  aspectRatio?: string; 
  title?: string;
  className?: string
};

const AspectRatioVideo = ({
  videoUrl,
  aspectRatio = 'video',
  title = 'Embedded Video',
  className
}: AspectRatioVideoProps) => {
  return (
    <div className={`aspect-${aspectRatio} overflow-hidden rounded-lg ${className}`}>
      <video
      controls
      width="100%"
      preload="metadata"
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
    </div>
  );
};

export default AspectRatioVideo;
