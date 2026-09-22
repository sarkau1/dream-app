// Generates the Obsidian-style vault from src/data/dreamWalk.json — the
// vault is a read-only mirror for browsing/editing the story network; the
// JSON file (not these .md files) is what the live app actually loads.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dataPath = path.join(root, 'src/data/dreamWalk.json')
const vaultDir = path.join(root, 'vault/dream-walk')

const graph = JSON.parse(readFileSync(dataPath, 'utf-8'))
const nodes = Object.values(graph.nodes)

function sanitizeFilename(title) {
  return title.replace(/[\\/:*?"<>|]/g, '').trim()
}

const titleById = Object.fromEntries(nodes.map((n) => [n.id, n.title]))

function wikilink(id) {
  return `[[${sanitizeFilename(titleById[id])}]]`
}

function frontmatter(node) {
  const lines = ['---', `id: ${node.id}`]
  if (node.region) lines.push(`region: ${node.region}`)
  if (node.character) lines.push(`character: ${node.character}`)
  lines.push(`terminal: ${node.terminal}`)
  if (node.tags?.length) {
    lines.push('tags:')
    for (const tag of node.tags) lines.push(`  - ${tag}`)
  }
  lines.push('---', '')
  return lines.join('\n')
}

function choiceLines(node) {
  if (node.terminal || node.choices.length === 0) {
    return [
      '## Ending',
      '',
      'This path ends here for this walk — Dream Essence is kept, and a new walk starts fresh from',
      `${wikilink(graph.startId)}.`,
    ]
  }
  const lines = ['## Choices', '']
  for (const choice of node.choices) {
    if (choice.roll) {
      lines.push(`- **${choice.label}** — \u{1F3B2} roll a d6, DC ${choice.roll.dc}`)
      lines.push(`  - success (≥${choice.roll.dc}) → ${wikilink(choice.roll.success)}`)
      lines.push(`  - failure (<${choice.roll.dc}) → ${wikilink(choice.roll.failure)}`)
    } else {
      lines.push(`- **${choice.label}** → ${wikilink(choice.next)}`)
    }
  }
  return lines
}

function renderNode(node) {
  const parts = [frontmatter(node), `# ${node.title}`, '']
  if (node.character) parts.push(`*A dream character is present: **${node.character}**.*`, '')
  parts.push(node.text, '', ...choiceLines(node), '')
  return parts.join('\n')
}

function renderIndex() {
  const lines = [
    '---',
    'id: dream-walk-index',
    'tags:',
    '  - moc',
    '---',
    '',
    '# Dream Walk — Index',
    '',
    'A branching lucid-dream walkthrough. Every choice either moves the story on for free, or asks',
    'for a d6 roll against a difficulty (DC) — meet or beat it and you get the success branch,',
    'otherwise the failure branch. Both branches keep teaching something; only the ending changes.',
    '',
    'Every path eventually loops back to the opening scene — that loop is the point, not a bug: a',
    'recurring dreamscape you learn to recognise is one of the most reliable dream signs there is.',
    '',
    `Start here: ${wikilink(graph.startId)}`,
    '',
    '## All scenes',
    '',
    ...nodes
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((n) => `- ${wikilink(n.id)}${n.terminal ? ' *(ending)*' : ''}`),
  ]
  return lines.join('\n')
}

mkdirSync(vaultDir, { recursive: true })
for (const existing of readdirSync(vaultDir)) {
  if (existing.endsWith('.md')) unlinkSync(path.join(vaultDir, existing))
}

writeFileSync(path.join(vaultDir, '_Dream Walk Index.md'), renderIndex())
for (const node of nodes) {
  writeFileSync(path.join(vaultDir, `${sanitizeFilename(node.title)}.md`), renderNode(node))
}

console.log(`Wrote ${nodes.length + 1} notes to ${path.relative(root, vaultDir)}`)
