import { useRef } from 'react'
import { Upload, File, X } from 'lucide-react'

export default function AiEndorsementUpload({ file, onFileSelect }) {
  const fileRef = useRef(null)

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const f = e.dataTransfer.files?.[0]
        if (f) onFileSelect(f)
      }}
      onClick={() => fileRef.current?.click()}
      className={`border-2 border-dashed rounded-xl py-12 px-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
        file ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-300 bg-white hover:border-indigo-300'
      }`}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileSelect(f)
        }}
      />
      {file ? (
        <>
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
            <File size={24} className="text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">{file.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onFileSelect(null)
            }}
            className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
          >
            <X size={12} /> Remove
          </button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
            <Upload size={24} className="text-indigo-500" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Drop your Excel or CSV file here</p>
          <p className="text-xs text-gray-400 mt-1">Any column layout — we will map it to our system fields</p>
        </>
      )}
    </div>
  )
}
