const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove box-shadow entirely from inline styles and css properties
  content = content.replace(/box-shadow:\s*[^;]+;/g, '');
  
  // Replace background gradients in inline styles
  content = content.replace(/background:\s*linear-gradient\([^;]+\);/g, 'background: var(--bg-surface);');
  content = content.replace(/background-image:\s*linear-gradient\([^;]+\);/g, 'background: var(--bg-surface);');

  // Fix specific CSS blocks in styles.css
  if (filePath.endsWith('styles.css')) {
    // Primary Button
    content = content.replace(/\.btn-primary\s*\{[^}]+\}/, `.btn-primary { background: var(--primary-emerald); color: #FFFFFF !important; border: none; }`);
    content = content.replace(/\.btn-primary::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.btn-primary:hover::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.btn-primary:hover\s*\{[^}]+\}/, `.btn-primary:hover { background: var(--primary-emerald-dark); color: #FFFFFF !important; }`);

    // Playstore Button
    content = content.replace(/\.btn-playstore\s*\{[^}]+\}/, `.btn-playstore { background: #0F172A; color: #FFFFFF !important; font-weight: 800; gap: 0.75rem; border: none; }`);
    content = content.replace(/\.btn-playstore::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.btn-playstore:hover::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.btn-playstore:hover\s*\{[^}]+\}/, `.btn-playstore:hover { background: #1E293B; color: #FFFFFF !important; }`);

    // Secondary Button
    content = content.replace(/\.btn-secondary\s*\{[^}]+\}/, `.btn-secondary { background: #FFFFFF; color: var(--text-primary); border: 1px solid #E2E8F0; }`);
    content = content.replace(/\.btn-secondary::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.btn-secondary:hover::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.btn-secondary:hover\s*\{[^}]+\}/, `.btn-secondary:hover { background: #F1F5F9; border-color: #CBD5E1; }`);

    // Glass Card
    content = content.replace(/\.glass-card\s*\{[^}]+\}/, `.glass-card { background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.5rem; transition: border-color var(--transition-fast); }`);
    content = content.replace(/\.glass-card::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.glass-card:hover\s*\{[^}]+\}/, `.glass-card:hover { border-color: #CBD5E1; background: #F8FAFC; }`);

    // Header
    content = content.replace(/\.header\s*\{[^}]+\}/, `.header { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; padding: 1rem 0; background: #FFFFFF; border-bottom: 1px solid var(--border-subtle); }`);
    content = content.replace(/\.header\.scrolled\s*\{[^}]+\}/, `.header.scrolled { padding: 0.75rem 0; background: #FFFFFF; border-bottom: 1px solid var(--border-subtle); }`);

    // Badges
    content = content.replace(/\.badge-emerald\s*\{[^}]+\}/, `.badge-emerald { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }`);
    content = content.replace(/\.badge-purple\s*\{[^}]+\}/, `.badge-purple { background: #FAF5FF; color: #6B21A8; border: 1px solid #E9D5FF; }`);
    content = content.replace(/\.badge-cyan\s*\{[^}]+\}/, `.badge-cyan { background: #ECFEFF; color: #0369A1; border: 1px solid #CFFAFE; }`);
    content = content.replace(/\.badge-coral\s*\{[^}]+\}/, `.badge-coral { background: #FEF2F2; color: #9F1239; border: 1px solid #FECACA; }`);

    content = content.replace(/\.floating-badge\s*\{[^}]+\}/, `.floating-badge { position: absolute; background: #FFFFFF; border: 1px solid var(--border-subtle); padding: 0.85rem 1.25rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.85rem; z-index: 12; }`);
    
    // Remove backdrop-filters globally
    content = content.replace(/backdrop-filter:[^;]+;/g, '');
    content = content.replace(/-webkit-backdrop-filter:[^;]+;/g, '');
    
    // Gradient text to flat text
    content = content.replace(/\.gradient-text\s*\{[^}]+\}/, `.gradient-text { color: var(--primary-emerald); display: inline-block; }`);
    content = content.replace(/\.gradient-text-purple\s*\{[^}]+\}/, `.gradient-text-purple { color: #7C3AED; display: inline-block; }`);
    content = content.replace(/\.gradient-text-gold\s*\{[^}]+\}/, `.gradient-text-gold { color: #D97706; display: inline-block; }`);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

// Process CSS
processFile('public/css/styles.css');

// Process all EJS
const ejsFiles = fs.readdirSync('views/pages').map(f => path.join('views/pages', f));
ejsFiles.push(...fs.readdirSync('views/partials').map(f => path.join('views/partials', f)));

for (const file of ejsFiles) {
  if (file.endsWith('.ejs')) {
    processFile(file);
  }
}
