const fs = require('fs');
const glob = require('glob');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove box-shadow entirely from inline styles and CSS
  content = content.replace(/box-shadow:[^;]+;/g, '');
  
  // Replace gradients in inline styles
  content = content.replace(/background:\s*linear-gradient\([^)]+\)/g, 'background: var(--bg-surface)');
  content = content.replace(/background-image:\s*linear-gradient\([^)]+\)/g, 'background: var(--bg-surface)');

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
    content = content.replace(/\.btn-secondary\s*\{[^}]+\}/, `.btn-secondary { background: #F1F5F9; color: var(--text-primary); border: 1px solid #E2E8F0; }`);
    content = content.replace(/\.btn-secondary::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.btn-secondary:hover::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.btn-secondary:hover\s*\{[^}]+\}/, `.btn-secondary:hover { background: #E2E8F0; border-color: #CBD5E1; }`);

    // Glass Card
    content = content.replace(/\.glass-card\s*\{[^}]+\}/, `.glass-card { background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 2.25rem; }`);
    content = content.replace(/\.glass-card::before\s*\{[^}]+\}/, ``);
    content = content.replace(/\.glass-card:hover\s*\{[^}]+\}/, `.glass-card:hover { border-color: #CBD5E1; }`);

    // Header
    content = content.replace(/\.header\s*\{[^}]+\}/, `.header { position: fixed; top: 0; left: 0; width: 100%; z-index: 1000; padding: 1rem 0; background: #FFFFFF; border-bottom: 1px solid var(--border-subtle); }`);
    content = content.replace(/\.header\.scrolled\s*\{[^}]+\}/, `.header.scrolled { padding: 0.75rem 0; background: #FFFFFF; border-bottom: 1px solid var(--border-subtle); }`);

    // Remove backdrop-filters globally
    content = content.replace(/backdrop-filter:[^;]+;/g, '');
    content = content.replace(/-webkit-backdrop-filter:[^;]+;/g, '');
    
    // Remove gradients from gradient-text
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
