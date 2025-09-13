export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black/40 via-black/60 to-black/80 backdrop-blur-sm z-[9999]">
      <div className="flex flex-col items-center gap-6">
        {/* Main Loading Animation */}
        <div className="relative">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400/20 w-20 h-20"></div>

          {/* Spinning Ring */}
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-yellow-400 border-r-yellow-400"></div>

          {/* Inner Pulsing Dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>

          {/* Glowing Effect */}
          <div className="absolute inset-0 rounded-full bg-yellow-400/10 blur-xl animate-pulse"></div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h3 className="text-white font-semibold text-lg mb-2 animate-pulse">
            Loading...
          </h3>
          <p className="text-gray-300 text-sm">
            Please wait while we prepare your content
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2">
          <div
            className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
