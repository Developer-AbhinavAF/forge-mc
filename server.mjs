import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = join(process.cwd(), 'dist')
const json = (res, data, status = 200) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)) }

async function getStatus() {
  const invite = process.env.DISCORD_INVITE_CODE
  let community = null
  if (invite) {
    const response = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(invite)}?with_counts=true`)
    if (response.ok) { const data = await response.json(); community = { members: data.approximate_member_count ?? null, online: data.approximate_presence_count ?? null } }
  }
  return { community, minecraft: null, updatedAt: new Date().toISOString() }
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' }
createServer(async (req, res) => {
  if (req.url === '/api/status') { try { return json(res, await getStatus()) } catch { return json(res, { community: null, minecraft: null, updatedAt: new Date().toISOString() }) } }
  if (req.url === '/api/feedback' && req.method === 'POST') {
    let body = ''; for await (const chunk of req) body += chunk
    try {
      const { name, message } = JSON.parse(body)
      if (!name?.trim() || !message?.trim()) return json(res, { error: 'Name and message are required.' }, 400)
      const webhook = process.env.DISCORD_FEEDBACK_WEBHOOK
      if (webhook) await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: `**Forge feedback from ${name.trim()}**\n${message.trim()}` }) })
      return json(res, { ok: true })
    } catch { return json(res, { error: 'Unable to submit feedback.' }, 400) }
  }
  const safePath = normalize(req.url?.split('?')[0] || '/').replace(/^([.][.][/\\])+/, '')
  let file = join(root, safePath === '/' ? 'index.html' : safePath)
  try { await stat(file) } catch { file = join(root, 'index.html') }
  try { const data = await readFile(file); res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' }); res.end(data) } catch { res.writeHead(404); res.end('Not found') }
}).listen(process.env.PORT || 3000, () => console.log('Forge is running on port ' + (process.env.PORT || 3000)))
