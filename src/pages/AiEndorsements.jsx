import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Upload, FileText, FileSpreadsheet, File,
  Trash2, CheckCircle, AlertTriangle, AlertCircle,
  UserPlus, UserCog, UserMinus, ChevronDown, ChevronRight,
  Pencil, X, Check, RotateCcw, Send, Info,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'

// ─── Mock AI-parsed data ───────────────────────────────────────────────────────
const SEED_ADDITIONS = [
  { id: 'a1', name: 'Vikram Anand',  empId: 'EMP-1101', email: 'vikram.anand@acme.com', dob: '1990-04-12', doj: '2026-07-01', gender: 'Male',   plan: 'GMC + GPA', confidence: 'high'   },
  { id: 'a2', name: 'Sneha Pillai',  empId: 'EMP-1102', email: 'sneha.p@acme.com',      dob: '1995-08-23', doj: '2026-07-01', gender: 'Female', plan: 'GMC',       confidence: 'high'   },
  { id: 'a3', name: 'Arun Krishnan', empId: 'EMP-1103', email: '',                       dob: '1988-11-30', doj: '2026-07-15', gender: 'Male',   plan: 'GMC + GPA', confidence: 'medium' },
  { id: 'a4', name: '',              empId: 'EMP-1104', email: 'user.1104@acme.com',     dob: '',           doj: '2026-07-15', gender: 'Female', plan: 'GMC',       confidence: 'low'    },
  { id: 'a5', name: 'Ritu Sharma',   empId: 'EMP-1105', email: 'ritu.s@acme.com',        dob: '1993-02-14', doj: '2026-08-01', gender: 'Female', plan: 'GMC + GPA', confidence: 'high'   },
]

const SEED_UPDATIONS = [
  { id: 'u1', name: 'Aditi Mehta',  empId: 'EMP-0822', field: 'Plan',   from: 'GMC',           to: 'GMC + GPA',         confidence: 'high'   },
  { id: 'u2', name: 'Rohan Das',    empId: 'EMP-0741', field: 'Email',  from: 'rohan@old.com', to: 'rohan.das@acme.com', confidence: 'high'   },
  { id: 'u3', name: 'Kavya Nair',   empId: 'EMP-0655', field: 'DOB',   from: '1991-03-10',    to: '1991-03-01',         confidence: 'medium' },
  { id: 'u4', name: 'Suresh Babu',  empId: 'EMP-0512', field: 'Gender', from: 'Male',          to: 'Female',            confidence: 'low'    },
]

const SEED_DELETIONS = [
  { id: 'd1', name: 'Priya Ghosh',   empId: 'EMP-0331', lwd: '2026-06-30', reason: 'Resignation',   confidence: 'high' },
  { id: 'd2', name: 'Manoj Tiwari',  empId: 'EMP-0289', lwd: '2026-07-15', reason: 'Contract end',  confidence: 'high' },
  { id: 'd3', name: 'Ananya Bose',   empId: 'EMP-0401', lwd: '',            reason: '',              confidence: 'low'  },
]

// ─── AI processing steps ──────────────────────────────────────────────────────
const PROCESSING_STEPS = [
  'Parsing document structure…',
  'Extracting employee records…',
  'Classifying changes (add / update / delete)…',
  'Validating fields and cross-referencing policy…',
  'Review ready.',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase()
  if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet size={20} className="text-emerald-600" />
  if (['pdf'].includes(ext)) return <FileText size={20} className="text-rose-600" />
  return <File size={20} className="text-gray-500" />
}

const CONFIDENCE_META = {
  high:   { label: 'High',   dot: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Review', dot: 'bg-amber-500',   text: 'text-amber-700',   badge: 'bg-amber-50 text-amber-700 border-amber-200'       },
  low:    { label: 'Fix',    dot: 'bg-rose-500',    text: 'text-rose-700',    badge: 'bg-rose-50 text-rose-700 border-rose-200'           },
}

function ConfidenceBadge({ level }) {
  const m = CONFIDENCE_META[level] ?? CONFIDENCE_META.medium
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${m.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dot}`} />
      {m.label}
    </span>
  )
}

function EditableCell({ value, onChange, type = 'text', options }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const inputRef = useRef(null)

  const start = () => {
    setDraft(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }
  const commit = () => { onChange(draft); setEditing(false) }
  const cancel = () => setEditing(false)

  if (editing) {
    return (
      <span className="flex items-center gap-1 min-w-0">
        {options ? (
          <select
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            className="text-xs border border-indigo-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }}
            onBlur={commit}
            className="text-xs border border-indigo-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0 w-28"
          />
        )}
        <button onClick={commit} className="text-emerald-600 hover:text-emerald-700 flex-shrink-0"><Check size={12} /></button>
        <button onClick={cancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={12} /></button>
      </span>
    )
  }

  return (
    <button
      onClick={start}
      title="Click to edit"
      className={`group/cell flex items-center gap-1 text-left min-w-0 rounded px-1 -mx-1 hover:bg-indigo-50 transition-colors ${value ? '' : 'italic text-rose-400'}`}
    >
      <span className="truncate text-xs">{value || 'Missing'}</span>
      <Pencil size={10} className="flex-shrink-0 opacity-0 group-hover/cell:opacity-50 text-indigo-500 transition-opacity" />
    </button>
  )
}

// ─── Tab strip ────────────────────────────────────────────────────────────────
const TAB_META = {
  addition:  { label: 'Addition',  icon: UserPlus,  color: 'text-emerald-700', activeBg: 'bg-emerald-50',  activeText: 'text-emerald-700', activeBorder: 'border-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  updation:  { label: 'Updation',  icon: UserCog,   color: 'text-blue-700',    activeBg: 'bg-blue-50',     activeText: 'text-blue-700',    activeBorder: 'border-blue-500',    badge: 'bg-blue-100 text-blue-700'    },
  deletion:  { label: 'Deletion',  icon: UserMinus, color: 'text-rose-700',    activeBg: 'bg-rose-50',     activeText: 'text-rose-700',    activeBorder: 'border-rose-500',    badge: 'bg-rose-100 text-rose-700'    },
}

function TabStrip({ active, counts, onSelect }) {
  return (
    <div className="flex gap-0 border-b border-gray-200">
      {Object.entries(TAB_META).map(([key, meta]) => {
        const Icon = meta.icon
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer
              ${isActive
                ? `${meta.activeText} ${meta.activeBg}`
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Icon size={15} />
            {meta.label}
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isActive ? meta.badge : 'bg-gray-100 text-gray-600'}`}>
              {counts[key]}
            </span>
            {isActive && (
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t ${meta.activeBorder.replace('border-', 'bg-')}`} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Addition table ────────────────────────────────────────────────────────────
const ADD_PLANS = ['GMC', 'GMC + GPA', 'GPA', 'GTL']
const GENDERS   = ['Male', 'Female', 'Other']

function AdditionTable({ rows, onUpdate, onDelete }) {
  if (!rows.length) return <EmptyTabState label="No additions extracted." />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-[#f1f3f5]">
            <Th w="w-40">Name</Th>
            <Th w="w-28">Emp ID</Th>
            <Th w="w-44">Email</Th>
            <Th w="w-24">DOB</Th>
            <Th w="w-24">DOJ</Th>
            <Th w="w-20">Gender</Th>
            <Th w="w-28">Plan</Th>
            <Th w="w-20">AI</Th>
            <Th w="w-12" className="text-right pr-4">Act.</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-indigo-50/30 transition-colors`}>
              <Td><EditableCell value={row.name}   onChange={v => onUpdate(row.id, 'name', v)} /></Td>
              <Td><EditableCell value={row.empId}  onChange={v => onUpdate(row.id, 'empId', v)} /></Td>
              <Td><EditableCell value={row.email}  onChange={v => onUpdate(row.id, 'email', v)} type="email" /></Td>
              <Td><EditableCell value={row.dob}    onChange={v => onUpdate(row.id, 'dob', v)} type="date" /></Td>
              <Td><EditableCell value={row.doj}    onChange={v => onUpdate(row.id, 'doj', v)} type="date" /></Td>
              <Td><EditableCell value={row.gender} onChange={v => onUpdate(row.id, 'gender', v)} options={GENDERS} /></Td>
              <Td><EditableCell value={row.plan}   onChange={v => onUpdate(row.id, 'plan', v)} options={ADD_PLANS} /></Td>
              <Td><ConfidenceBadge level={row.confidence} /></Td>
              <Td className="text-right pr-4">
                <button onClick={() => onDelete(row.id)} className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"><Trash2 size={14} /></button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Updation table ────────────────────────────────────────────────────────────
function UpdationTable({ rows, onUpdate, onDelete }) {
  if (!rows.length) return <EmptyTabState label="No updates extracted." />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-[#f1f3f5]">
            <Th w="w-40">Name</Th>
            <Th w="w-28">Emp ID</Th>
            <Th w="w-28">Field</Th>
            <Th w="w-36">Current value</Th>
            <Th w="w-36">New value</Th>
            <Th w="w-20">AI</Th>
            <Th w="w-12" className="text-right pr-4">Act.</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-indigo-50/30 transition-colors`}>
              <Td><EditableCell value={row.name}  onChange={v => onUpdate(row.id, 'name', v)} /></Td>
              <Td><EditableCell value={row.empId} onChange={v => onUpdate(row.id, 'empId', v)} /></Td>
              <Td><span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">{row.field}</span></Td>
              <Td><span className="text-gray-400 line-through">{row.from}</span></Td>
              <Td><EditableCell value={row.to} onChange={v => onUpdate(row.id, 'to', v)} /></Td>
              <Td><ConfidenceBadge level={row.confidence} /></Td>
              <Td className="text-right pr-4">
                <button onClick={() => onDelete(row.id)} className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"><Trash2 size={14} /></button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Deletion table ────────────────────────────────────────────────────────────
const DELETION_REASONS = ['Resignation', 'Contract end', 'Retirement', 'Termination', 'Other']

function DeletionTable({ rows, onUpdate, onDelete }) {
  if (!rows.length) return <EmptyTabState label="No deletions extracted." />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-[#f1f3f5]">
            <Th w="w-40">Name</Th>
            <Th w="w-28">Emp ID</Th>
            <Th w="w-28">Last working day</Th>
            <Th w="w-40">Reason</Th>
            <Th w="w-20">AI</Th>
            <Th w="w-12" className="text-right pr-4">Act.</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-indigo-50/30 transition-colors`}>
              <Td><EditableCell value={row.name}   onChange={v => onUpdate(row.id, 'name', v)} /></Td>
              <Td><EditableCell value={row.empId}  onChange={v => onUpdate(row.id, 'empId', v)} /></Td>
              <Td><EditableCell value={row.lwd}    onChange={v => onUpdate(row.id, 'lwd', v)} type="date" /></Td>
              <Td><EditableCell value={row.reason} onChange={v => onUpdate(row.id, 'reason', v)} options={DELETION_REASONS} /></Td>
              <Td><ConfidenceBadge level={row.confidence} /></Td>
              <Td className="text-right pr-4">
                <button onClick={() => onDelete(row.id)} className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"><Trash2 size={14} /></button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Table primitives ─────────────────────────────────────────────────────────
function Th({ children, w = '', className = '' }) {
  return (
    <th className={`${w} px-3 py-2.5 text-left font-semibold text-[11px] tracking-wide text-[#495057] normal-case ${className}`}>
      {children}
    </th>
  )
}
function Td({ children, className = '' }) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>
}

function EmptyTabState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CheckCircle size={36} className="text-emerald-300 mb-3" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

// ─── Summary stat pills ───────────────────────────────────────────────────────
function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${color} bg-white`}>
      <Icon size={14} className="flex-shrink-0" />
      <span className="text-xs font-medium">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

// ─── AI Issues banner ─────────────────────────────────────────────────────────
function IssuesBanner({ additions, updations, deletions }) {
  const lowAll = [
    ...additions.filter(r => r.confidence === 'low').map(r => ({ tab: 'Addition', name: r.name || r.empId, reason: 'Missing name or DOB' })),
    ...additions.filter(r => r.confidence === 'medium').map(r => ({ tab: 'Addition', name: r.name || r.empId, reason: 'Email missing — review before submit' })),
    ...updations.filter(r => r.confidence === 'low').map(r => ({ tab: 'Updation', name: r.name || r.empId, reason: `Field "${r.field}" change looks unusual` })),
    ...deletions.filter(r => r.confidence === 'low').map(r => ({ tab: 'Deletion', name: r.name || r.empId, reason: 'Last working day not found in document' })),
  ]
  const [open, setOpen] = useState(true)
  if (!lowAll.length) return null
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-amber-100/60 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-amber-900">
            {lowAll.length} AI {lowAll.length === 1 ? 'item needs' : 'items need'} your review before submitting
          </span>
        </div>
        <ChevronDown size={16} className={`text-amber-600 flex-shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <ul className="divide-y divide-amber-100 border-t border-amber-200">
          {lowAll.map((item, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-2.5 text-xs">
              <span className={`mt-0.5 inline-block px-1.5 py-0.5 rounded-full font-medium text-[10px] shrink-0
                ${item.tab === 'Addition' ? 'bg-emerald-100 text-emerald-700'
                  : item.tab === 'Updation' ? 'bg-blue-100 text-blue-700'
                  : 'bg-rose-100 text-rose-700'}`}>
                {item.tab}
              </span>
              <div className="min-w-0">
                <span className="font-semibold text-amber-900">{item.name || '—'}</span>
                <span className="text-amber-700 ml-1.5">{item.reason}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const PHASE = { UPLOAD: 'upload', PROCESSING: 'processing', REVIEW: 'review', SUBMITTED: 'submitted' }

export default function AiEndorsements() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  // File upload state
  const [phase,    setPhase]    = useState(PHASE.UPLOAD)
  const [file,     setFile]     = useState(null)
  const [dragging, setDragging] = useState(false)

  // Processing animation
  const [stepIdx,    setStepIdx]    = useState(0)
  const [stepsDone,  setStepsDone]  = useState([])
  const [progress,   setProgress]   = useState(0)

  // Review data
  const [additions,  setAdditions]  = useState(SEED_ADDITIONS)
  const [updations,  setUpdations]  = useState(SEED_UPDATIONS)
  const [deletions,  setDeletions]  = useState(SEED_DELETIONS)
  const [activeTab,  setActiveTab]  = useState('addition')

  // ── File selection ────────────────────────────────────────────────────────
  const pickFile = (f) => {
    if (!f) return
    setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files[0])
  }

  // ── Process ───────────────────────────────────────────────────────────────
  const startProcessing = useCallback(() => {
    setPhase(PHASE.PROCESSING)
    setStepIdx(0)
    setStepsDone([])
    setProgress(0)

    let step = 0
    const total = PROCESSING_STEPS.length
    const tick = () => {
      step += 1
      const pct = Math.round((step / total) * 100)
      setProgress(pct)
      setStepsDone(prev => [...prev, PROCESSING_STEPS[step - 1]])
      setStepIdx(step)
      if (step < total) {
        setTimeout(tick, 900)
      } else {
        setTimeout(() => {
          setAdditions([...SEED_ADDITIONS])
          setUpdations([...SEED_UPDATIONS])
          setDeletions([...SEED_DELETIONS])
          setPhase(PHASE.REVIEW)
        }, 500)
      }
    }
    setTimeout(tick, 700)
  }, [])

  // ── Data mutation helpers ─────────────────────────────────────────────────
  const updateRow = (setter) => (id, field, value) =>
    setter(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r))

  const deleteRow = (setter) => (id) =>
    setter(rows => rows.filter(r => r.id !== id))

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = () => setPhase(PHASE.SUBMITTED)

  // ── Render: Upload ────────────────────────────────────────────────────────
  if (phase === PHASE.UPLOAD) {
    return (
      <div className="h-full overflow-y-auto px-6 lg:px-8 py-6">
        <PageHeader
          title="AI Endorsements"
          subtitle="Upload any file — Excel, PDF, CSV, Word — and let AI extract and classify employee changes for you."
          breadcrumbs={[{ label: 'AI Endorsements' }]}
        />

        {/* AI accent banner */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-px">
          <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 px-5 py-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-indigo-900 mb-0.5">Powered by AI document parsing</p>
              <p className="text-xs text-indigo-700 leading-relaxed">
                Our model reads your HR document and automatically separates records into <strong>additions</strong>, <strong>updations</strong>, and <strong>deletions</strong>.
                You review and edit the output before it's submitted.
              </p>
            </div>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer
            ${file ? 'border-indigo-300 bg-indigo-50/60 cursor-default' : dragging ? 'border-violet-500 bg-violet-50' : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/40'}`}
        >
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.txt"
            onChange={e => pickFile(e.target.files?.[0])}
          />

          {file ? (
            <div className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0">
                  {fileIcon(file.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setFile(null) }}
                className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                <Upload size={26} className="text-indigo-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">Drop your file here, or click to browse</p>
              <p className="text-xs text-gray-500">Supports Excel, CSV, PDF, Word, and plain text</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['.xlsx', '.xls', '.csv', '.pdf', '.docx', '.txt'].map(ext => (
                  <span key={ext} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 font-mono">{ext}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              onClick={() => setFile(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={startProcessing}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Sparkles size={16} />
              Refine with AI
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Render: Processing ────────────────────────────────────────────────────
  if (phase === PHASE.PROCESSING) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-20 h-20 mb-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl">
                <Sparkles size={32} className="text-white animate-pulse" />
              </div>
              <span className="absolute inset-0 rounded-full border-4 border-indigo-300 opacity-50 animate-ping" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">AI is refining your document</h2>
            <p className="text-sm text-gray-500 text-center">This usually takes a few seconds.</p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step list */}
          <ul className="space-y-2">
            {PROCESSING_STEPS.map((step, i) => {
              const done = i < stepIdx
              const active = i === stepIdx - 1 && stepIdx < PROCESSING_STEPS.length
              return (
                <li key={i} className={`flex items-center gap-3 text-sm transition-colors ${done ? 'text-gray-800' : 'text-gray-400'}`}>
                  {done ? (
                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={active ? 'font-medium text-indigo-600' : ''}>{step}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    )
  }

  // ── Render: Submitted ─────────────────────────────────────────────────────
  if (phase === PHASE.SUBMITTED) {
    const total = additions.length + updations.length + deletions.length
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Endorsements submitted</h2>
          <p className="text-sm text-gray-500 mb-2">
            <strong>{total} changes</strong> — {additions.length} additions, {updations.length} updations, {deletions.length} deletions — have been queued for processing.
          </p>
          <p className="text-xs text-gray-400 mb-6">You can track progress in Endorsement History.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Back to Endorsements
            </button>
            <button
              onClick={() => { setPhase(PHASE.UPLOAD); setFile(null) }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              Upload another
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Review ────────────────────────────────────────────────────────
  const counts = { addition: additions.length, updation: updations.length, deletion: deletions.length }
  const total  = additions.length + updations.length + deletions.length
  const hasIssues = [...additions, ...updations, ...deletions].some(r => r.confidence !== 'high')

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Page header area */}
      <div className="flex-shrink-0 px-6 lg:px-8 pt-7 pb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
                <Sparkles size={14} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI Endorsements</h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">AI Parsed</span>
            </div>
            <p className="text-sm text-gray-500">
              Review and edit the AI-extracted records below, then submit when ready.
              <span className="ml-1.5 text-gray-400 text-xs">· {file?.name}</span>
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={() => { setPhase(PHASE.UPLOAD); setFile(null) }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              Re-upload
            </button>
            <button
              onClick={handleSubmit}
              disabled={total === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              Submit {total} changes
            </button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <StatPill icon={UserPlus}  label="to add"    value={additions.length} color="border-emerald-200 text-emerald-700" />
          <StatPill icon={UserCog}   label="to update" value={updations.length} color="border-blue-200 text-blue-700"      />
          <StatPill icon={UserMinus} label="to delete" value={deletions.length} color="border-rose-200 text-rose-700"      />
          {hasIssues && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium">
              <AlertTriangle size={13} />
              Some rows need review
            </div>
          )}
        </div>

        {/* Issues banner */}
        <IssuesBanner additions={additions} updations={updations} deletions={deletions} />
      </div>

      {/* Tabbed grid (scrollable) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col mx-6 lg:mx-8 mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Info note */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
          <Info size={12} className="flex-shrink-0 text-indigo-400" />
          Click any cell to edit inline. Use the <Trash2 size={10} className="inline mx-0.5" /> icon to remove a row. AI confidence badges flag entries that need attention.
        </div>

        <TabStrip active={activeTab} counts={counts} onSelect={setActiveTab} />

        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === 'addition' && (
            <AdditionTable
              rows={additions}
              onUpdate={updateRow(setAdditions)}
              onDelete={deleteRow(setAdditions)}
            />
          )}
          {activeTab === 'updation' && (
            <UpdationTable
              rows={updations}
              onUpdate={updateRow(setUpdations)}
              onDelete={deleteRow(setUpdations)}
            />
          )}
          {activeTab === 'deletion' && (
            <DeletionTable
              rows={deletions}
              onUpdate={updateRow(setDeletions)}
              onDelete={deleteRow(setDeletions)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
