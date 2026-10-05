// Merges generated example sentences into src/data/{n4,n5}/vocabulary.json.
// Usage: node scripts/merge-vocab-examples.mjs <dir of b*.json id -> [{ja,kana,vi,en}]>
// Overwrites `examples` for every id present; reports entries that look wrong
// (kanji left in `kana`, empty fields, missing ids) without failing on them.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const dir = process.argv[2]
if (!dir) throw new Error("usage: merge-vocab-examples.mjs <dir>")
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const generated = {}
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json"))) {
  Object.assign(generated, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
}

const HAS_KANJI = /[一-鿿]/
let merged = 0, missing = 0, bad = 0
for (const level of ["n4", "n5"]) {
  const p = path.join(__dirname, "..", "src/data", level, "vocabulary.json")
  const vocab = JSON.parse(fs.readFileSync(p, "utf8"))
  for (const e of vocab) {
    const ex = generated[e.id]
    if (!Array.isArray(ex) || ex.length === 0) { missing++; console.warn("missing", e.id, e.kanji); continue }
    const clean = ex.slice(0, 2).map(x => ({ ja: x.ja, kana: x.kana, vi: x.vi, en: x.en }))
    for (const x of clean) {
      if (!x.ja || !x.kana || !x.vi || !x.en || HAS_KANJI.test(x.kana)) { bad++; console.warn("bad", e.id, JSON.stringify(x)) }
    }
    e.examples = clean
    merged++
  }
  fs.writeFileSync(p, JSON.stringify(vocab, null, 2) + "\n")
}
console.log(`merged ${merged}, missing ${missing}, flagged ${bad}`)
