type ProgressBarProps = {
  progress: number;
};

const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-sm">Progress</span>

        <span className="text-sm">{progress}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="
            h-full
            bg-blue-600
            rounded-full
            transition-all
            duration-300
          "
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
