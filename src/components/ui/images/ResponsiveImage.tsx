interface props {
  imageUrl: string;
  altText: string;
}
export default function ResponsiveImage({ imageUrl, altText = 'cover' }: props) {
  return (
    <div className="relative">
      <div className="overflow-hidden">
        <img
          src={imageUrl}
          alt={altText}
          className="w-full border border-gray-200 rounded-xl dark:border-gray-800"
        />
      </div>
    </div>
  );
}
