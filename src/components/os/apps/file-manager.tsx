'use client'

import { Fragment, useState } from 'react'
import {
  ArrowRight,
  FileText,
  FileType2,
  Folder,
  FolderOpen,
  Home,
  Image as ImageIcon,
  Music,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  HOME,
  baseName,
  getNode,
  parentOf,
  useFs,
  type FsNode,
} from '@/lib/os/fs'

const KIND_ICON: Record<string, typeof FileText> = {
  txt: FileText,
  img: ImageIcon,
  audio: Music,
  pdf: FileType2,
  exe: FileType2,
}

const KIND_LABEL: Record<string, string> = {
  dir: 'پوشه',
  txt: 'سند متنی',
  img: 'تصویر',
  audio: 'فایل صوتی',
  pdf: 'سند PDF',
  exe: 'برنامه اجرایی',
}

const faNum = (n: number): string => n.toLocaleString('fa-IR')

export default function FileManagerApp() {
  const fs = useFs((s) => s.fs)
  const [rel, setRel] = useState<string[]>([]) // مسیر نسبت به خانه
  const [selected, setSelected] = useState<string | null>(null)

  const absHome = HOME
  const abs = [absHome, ...rel].join('/').replace(/\/+/g, '/')
  const current = (getNode(fs, abs) ?? getNode(fs, absHome)) as FsNode
  const selectedNode =
    selected && current.type === 'dir'
      ? (current.children[selected] ?? null)
      : null

  const items =
    current.type === 'dir'
      ? Object.entries(current.children).sort(([a], [b]) => a.localeCompare(b))
      : []

  const openNode = (name: string, node: FsNode) => {
    if (node.type === 'dir') {
      setSelected(null)
      setRel((p) => [...p, name])
    } else {
      setSelected(name)
    }
  }

  const goUp = () => {
    if (selected) {
      setSelected(null)
      return
    }
    if (rel.length > 0) setRel((p) => p.slice(0, -1))
  }

  const goHome = () => {
    setSelected(null)
    setRel([])
  }

  const jumpTo = (index: number) => {
    setSelected(null)
    setRel(rel.slice(0, index + 1))
  }

  const renderPreview = (node: FsNode) => {
    if (node.type === 'dir') return null
    if (node.kind === 'img' && node.image) {
      return (
        <img
          src={node.image}
          alt={node.content || 'عکس'}
          className="pengo-pop max-h-56 w-auto max-w-full rounded-xl border border-white/10 object-contain shadow-xl"
        />
      )
    }
    return (
      <div className="pengo-pop whitespace-pre-wrap rounded-xl bg-zinc-900 p-4 text-sm leading-7 text-zinc-200">
        {node.content || 'این فایل محتوایی ندارد.'}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* نوار ابزار */}
      <header className="flex shrink-0 items-center gap-1 border-b border-white/10 bg-zinc-900/60 p-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="برگشت به عقب"
          disabled={rel.length === 0 && !selected}
          onClick={goUp}
          className="size-8 shrink-0 text-zinc-300 hover:bg-white/10 hover:text-zinc-100"
        >
          <ArrowRight className="size-4" />
        </Button>
        <nav
          aria-label="مسیر فعلی"
          className="os-scroll flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-xs"
        >
          <button
            type="button"
            onClick={goHome}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 font-bold text-zinc-300 transition hover:bg-white/10 active:scale-95"
          >
            <Home size={13} aria-hidden />
            خانه
          </button>
          {rel.map((name, i) => {
            const isLast = i === rel.length - 1
            return (
              <Fragment key={`${name}-${i}`}>
                <span className="shrink-0 text-zinc-600" aria-hidden>
                  /
                </span>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 transition hover:bg-white/10 active:scale-95 ${
                    isLast ? 'font-bold text-[var(--pengo-accent)]' : 'text-zinc-300'
                  }`}
                >
                  {name}
                </button>
              </Fragment>
            )
          })}
          {selected && (
            <Fragment>
              <span className="shrink-0 text-zinc-600" aria-hidden>
                /
              </span>
              <span className="shrink-0 truncate px-2 py-1 font-bold text-[var(--pengo-accent)]">
                {selected}
              </span>
            </Fragment>
          )}
        </nav>
      </header>

      {/* محتوا */}
      <div className="os-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {selectedNode ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-2xl bg-zinc-800/60"
                aria-hidden
              >
                {selectedNode.type === 'file'
                  ? (() => {
                      const I = KIND_ICON[selectedNode.kind] ?? FileText
                      return <I size={22} className="text-zinc-300" />
                    })()
                  : <Folder size={22} className="text-amber-300" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-100">
                  {selected}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {KIND_LABEL[selectedNode.type === 'dir' ? 'dir' : selectedNode.kind]}
                  {' • '}
                  {selectedNode.type === 'file'
                    ? `${faNum(selectedNode.content.length)} حرف`
                    : `${faNum(Object.keys(selectedNode.children).length)} آیتم`}
                </p>
              </div>
            </div>
            {renderPreview(selectedNode)}
            {selectedNode.type === 'file' && selectedNode.kind === 'audio' && (
              <p className="text-[11px] text-zinc-500">
                پخش با اپ «پخش‌کننده چیپ‌تیون»
              </p>
            )}
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <FolderOpen size={36} className="text-zinc-700" aria-hidden />
            <p className="text-xs text-zinc-500">
              این پوشه خالی است. از ترمینال با mkdir یکی بساز!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {items.map(([name, node]) => {
              const isDir = node.type === 'dir'
              const I = isDir
                ? Folder
                : (KIND_ICON[node.kind] ?? FileText)
              const thumb =
                node.type === 'file' && node.kind === 'img' && node.image
                  ? node.image
                  : null
              return (
                <button
                  key={name}
                  type="button"
                  title={KIND_LABEL[isDir ? 'dir' : node.kind]}
                  onClick={() => openNode(name, node)}
                  className="group flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                >
                  <span
                    className="grid h-14 w-full place-items-center overflow-hidden rounded-xl bg-zinc-800/60 transition group-hover:scale-[1.04] group-hover:bg-zinc-800"
                    aria-hidden
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <I
                        size={26}
                        className={
                          isDir ? 'text-amber-300' : 'text-zinc-300'
                        }
                      />
                    )}
                  </span>
                  <span className="w-full truncate text-center text-[11px] text-zinc-300">
                    {name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* نوار وضعیت */}
      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 px-3 py-1.5 text-[11px] text-zinc-500">
        <span className="truncate">
          {selectedNode && selected
            ? `پیش‌نمایش: ${baseName(selected)}`
            : `${faNum(items.length)} آیتم • فایل‌سیستم مشترک با ترمینال`}
        </span>
        <span className="hidden shrink-0 sm:inline">
          pengo-fs نسخه ۲
        </span>
      </footer>
    </div>
  )
}
