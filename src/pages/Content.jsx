// Phase 2 content studio: CRM-driven drafts (gradings, joins, milestones)
// plus a simple scheduler. Publishing goes out via direct Meta Graph / GBP
// APIs in production — no Buffer fees.

import { useState } from 'react'
import { useStore } from '../data/store'
import { generateDrafts } from '../engine/content'
import { PageHeader } from '../components/Layout'
import { Card, Button, Badge, StatusBadge, Modal, Field, inputCls, EmptyState } from '../components/ui'
import { fmtDateTime, isoDate, addDays, timeAgo, cn } from '../lib/utils'

const CHANNEL_META = {
  facebook: { label: 'Facebook', icon: 'f', cls: 'bg-blue-600' },
  instagram: { label: 'Instagram', icon: '📷', cls: 'bg-pink-500' },
  gbp: { label: 'Google Business', icon: 'G', cls: 'bg-emerald-600' },
}

export default function Content() {
  const { db, actions } = useStore()
  const [composing, setComposing] = useState(false)
  const [genResult, setGenResult] = useState(null)

  const drafts = db.posts.filter((p) => p.status === 'draft').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const scheduled = db.posts.filter((p) => p.status === 'scheduled').sort((a, b) => (a.scheduledFor || '').localeCompare(b.scheduledFor || ''))
  const published = db.posts.filter((p) => p.status === 'published').sort((a, b) => (b.scheduledFor || b.createdAt).localeCompare(a.scheduledFor || a.createdAt))

  function generate() {
    const count = generateDrafts(db).length
    actions.generateContentDrafts()
    setGenResult(count)
  }

  return (
    <div>
      <PageHeader
        title="Content studio"
        sub="The CRM drafts posts from real moments — gradings, new members, milestones — in the school's voice (Anthropic API in production). Only students with photo consent are ever named."
        action={
          <div className="flex items-center gap-3">
            {genResult != null && (
              <span className="text-sm text-slate-500">
                {genResult === 0 ? 'Nothing new to draft — all recent moments covered.' : `${genResult} draft${genResult > 1 ? 's' : ''} generated from recent CRM events.`}
              </span>
            )}
            <Button variant="secondary" onClick={() => setComposing(true)}>+ Write post</Button>
            <Button onClick={generate}>✨ Generate from CRM events</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <PostColumn title={`Drafts (${drafts.length})`} posts={drafts} db={db} actions={actions} />
        <PostColumn title={`Scheduled (${scheduled.length})`} posts={scheduled} db={db} actions={actions} />
        <PostColumn title={`Published (${published.length})`} posts={published} db={db} actions={actions} />
      </div>

      <ComposeModal open={composing} onClose={() => setComposing(false)} actions={actions} />
    </div>
  )
}

function PostColumn({ title, posts, actions }) {
  return (
    <Card title={title}>
      <div className="space-y-3">
        {posts.length === 0 && <EmptyState>Nothing here.</EmptyState>}
        {posts.map((p) => <PostCard key={p.id} post={p} actions={actions} />)}
      </div>
    </Card>
  )
}

function PostCard({ post, actions }) {
  const [when, setWhen] = useState(isoDate(addDays(new Date(), 1)) + 'T18:00')
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        {post.channels.map((c) => (
          <span key={c} title={CHANNEL_META[c]?.label} className={cn('h-5 w-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center', CHANNEL_META[c]?.cls)}>
            {CHANNEL_META[c]?.icon}
          </span>
        ))}
        {post.source === 'content-engine' && <Badge color="purple">✨ auto-drafted</Badge>}
        {post.eventType && <Badge color="slate">{post.eventType.replace('.', ' ')}</Badge>}
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.body}</p>
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] text-slate-400">
          {post.status === 'scheduled' && post.scheduledFor ? `Goes out ${fmtDateTime(post.scheduledFor)}`
            : post.status === 'published' ? `Published ${timeAgo(post.scheduledFor || post.createdAt)}`
            : `Drafted ${timeAgo(post.createdAt)}`}
        </span>
        {post.status === 'draft' && (
          <div className="flex items-center gap-1.5">
            <input type="datetime-local" className="rounded border border-slate-200 px-1.5 py-0.5 text-xs" value={when} onChange={(e) => setWhen(e.target.value)} />
            <Button size="sm" onClick={() => actions.updatePost(post.id, { status: 'scheduled', scheduledFor: new Date(when).toISOString() })}>Schedule</Button>
            <Button size="sm" variant="ghost" onClick={() => actions.deletePost(post.id)}>🗑</Button>
          </div>
        )}
        {post.status === 'scheduled' && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="success" onClick={() => actions.updatePost(post.id, { status: 'published', scheduledFor: new Date().toISOString() })}>Publish now</Button>
            <Button size="sm" variant="ghost" onClick={() => actions.updatePost(post.id, { status: 'draft', scheduledFor: null })}>Unschedule</Button>
          </div>
        )}
        {post.status === 'published' && <StatusBadge status="completed" />}
      </div>
    </div>
  )
}

function ComposeModal({ open, onClose, actions }) {
  const [body, setBody] = useState('')
  const [channels, setChannels] = useState(['facebook', 'instagram'])
  const toggle = (c) => setChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))

  return (
    <Modal open={open} onClose={onClose} title="Write post">
      <div className="space-y-3">
        <div className="flex gap-2">
          {Object.entries(CHANNEL_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border', channels.includes(key) ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-500')}
            >
              {meta.label}
            </button>
          ))}
        </div>
        <Field label="Post">
          <textarea className={inputCls + ' min-h-[120px]'} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's happening at the dojo?" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!body.trim() || channels.length === 0}
            onClick={() => { actions.savePost({ body, channels }); setBody(''); onClose() }}
          >
            Save draft
          </Button>
        </div>
      </div>
    </Modal>
  )
}
