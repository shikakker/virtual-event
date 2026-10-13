import { spawnSync } from 'node:child_process'

const audit = spawnSync(
  'yarn',
  ['audit', '--groups', 'dependencies', '--json'],
  { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
)

if (audit.error) {
  console.error('Unable to run yarn audit:', audit.error.message)
  process.exit(1)
}

const lines = audit.stdout.split(/\r?\n/).filter(Boolean)
let sawSummary = false
const advisories = []

for (const line of lines) {
  let event
  try {
    event = JSON.parse(line)
  } catch {
    continue
  }

  if (event.type === 'auditAdvisory' && event.data?.advisory) {
    advisories.push(event.data.advisory)
  }

  if (event.type === 'auditSummary') {
    sawSummary = true
  }
}

if (!sawSummary) {
  process.stderr.write(audit.stderr || 'yarn audit did not return an audit summary\n')
  process.exit(1)
}

const blocking = advisories.filter((advisory) =>
  ['high', 'critical'].includes(String(advisory.severity).toLowerCase()),
)

const counts = advisories.reduce((result, advisory) => {
  const severity = String(advisory.severity || 'unknown').toLowerCase()
  result[severity] = (result[severity] || 0) + 1
  return result
}, {})

console.log('Production dependency audit:', counts)

if (blocking.length > 0) {
  for (const advisory of blocking) {
    console.error(
      `[${advisory.severity}] ${advisory.module_name}: ${advisory.title} (${advisory.url})`,
    )
  }
  process.exit(1)
}

console.log('No high or critical production dependency advisories found.')
