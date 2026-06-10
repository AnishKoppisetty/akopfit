export function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-pop" onClick={onClose}>
      <img src={src} className="max-h-full max-w-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-4 right-5 text-white/80 text-4xl leading-none">×</button>
    </div>
  )
}
