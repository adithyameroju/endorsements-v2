import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Download, FileSpreadsheet, CheckCircle, X, File, Loader2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'
import { useEndorsements } from '../store/EndorsementStore'

export default function BulkUpload() {
  const navigate = useNavigate()
  const { addEntry } = useEndorsements()
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSubmit = () => {
    setUploading(true)
    addEntry({ action: 'Bulk Upload - Add', count: 0, status: 'In Progress', type: 'bulk' })
    setTimeout(() => {
      setUploading(false)
      setDone(true)
      setTimeout(() => navigate('/'), 2500)
    }, 2000)
  }

  if (uploading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={32} className="text-indigo-600 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Processing Upload</h2>
          <p className="text-sm text-gray-500">Your file is being validated and processed...</p>
          <div className="mt-4 w-48 mx-auto h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Upload Successful</h2>
          <p className="text-sm text-gray-500 mb-1">Your file has been submitted for processing.</p>
          <p className="text-xs text-gray-400">You can track the status in the Endorsement History. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
      <PageHeader
        title="Bulk Upload"
        subtitle="Upload an Excel template to add multiple employees at once"
        breadcrumbs={[{ label: 'Add Employee', path: '/add' }, { label: 'Bulk Upload' }]}
      />
      <Stepper steps={['Download Template', 'Upload File', 'Processing']} currentStep={file ? 2 : 1} />

      <div className="space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">Download the template first</p>
            <p className="text-xs text-blue-700 leading-relaxed mt-0.5">Fill in employee details using the provided template to ensure correct formatting.</p>
            <button className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer">
              <Download size={14} /> Download Template
            </button>
          </div>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl py-12 px-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragging ? 'border-indigo-400 bg-indigo-50' : file ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => setFile(e.target.files[0])} />
          {file ? (
            <>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3"><File size={24} className="text-emerald-600" /></div>
              <p className="text-sm font-semibold text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
              <button onClick={e => { e.stopPropagation(); setFile(null) }} className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"><X size={12} /> Remove</button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3"><Upload size={24} className="text-gray-400" /></div>
              <p className="text-sm font-semibold text-gray-700">Drop your file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => navigate('/add')} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
          <button disabled={!file} onClick={handleSubmit} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer">
            <CheckCircle size={16} /> Upload & Submit
          </button>
        </div>
      </div>
    </div>
  )
}
