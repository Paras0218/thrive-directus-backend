// Removes the contact_page.map_location geometry field from the schema snapshot,
// since PostGIS is not installed. Round-trips through js-yaml for structural safety.
const fs = require('node:fs');
const yaml = require('js-yaml');

const path = 'E:/directus-cms/snapshot.yaml';
const doc = yaml.load(fs.readFileSync(path, 'utf8'));

const before = doc.fields.length;
doc.fields = doc.fields.filter(
  (f) => !(f.collection === 'contact_page' && f.field === 'map_location'),
);
if (Array.isArray(doc.relations)) {
  doc.relations = doc.relations.filter(
    (r) => !(r.collection === 'contact_page' && r.field === 'map_location'),
  );
}
const after = doc.fields.length;

fs.writeFileSync(path, yaml.dump(doc, { lineWidth: -1, noRefs: true }));
console.log(`Removed ${before - after} field(s). fields: ${before} -> ${after}`);
