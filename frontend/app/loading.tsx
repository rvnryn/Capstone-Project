export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-[9999]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-400"></div>
    </div>
  );
}
