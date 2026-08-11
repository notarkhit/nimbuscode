const fs = require('fs');

let css = fs.readFileSync('src/App.css', 'utf-8');

// Replace .app-root with .ide-root
css = css.replace(/\.app-root/g, '.ide-root');

// Add new themes CSS variables
const themesCSS = `
/* VS Code Dark */
.ide-root.theme-vs-dark {
	--tn-bg: #1e1e1e;
	--tn-bg-dark: #252526;
	--tn-bg-soft: #2d2d2d;
	--tn-surface: #37373d;
	--tn-surface-2: #3e3e42;
	--tn-border: #454545;
	--tn-text: #cccccc;
	--tn-muted: #858585;
	--tn-comment: #6a9955;
	--tn-blue: #569cd6;
	--tn-cyan: #4ec9b0;
	--tn-purple: #c586c0;
	--tn-green: #b5cea8;
	--tn-yellow: #dcdcaa;
	--tn-red: #f44747;
	--tn-orange: #ce9178;
}

/* VS Code Light */
.ide-root.theme-vs-light {
	--tn-bg: #ffffff;
	--tn-bg-dark: #f3f3f3;
	--tn-bg-soft: #f8f8f8;
	--tn-surface: #e8e8e8;
	--tn-surface-2: #d4d4d4;
	--tn-border: #cccccc;
	--tn-text: #333333;
	--tn-muted: #666666;
	--tn-comment: #008000;
	--tn-blue: #0000ff;
	--tn-cyan: #098658;
	--tn-purple: #af00db;
	--tn-green: #795e26;
	--tn-yellow: #795e26;
	--tn-red: #a31515;
	--tn-orange: #a31515;
}

/* GitHub Dark */
.ide-root.theme-github-dark {
	--tn-bg: #0d1117;
	--tn-bg-dark: #010409;
	--tn-bg-soft: #161b22;
	--tn-surface: #21262d;
	--tn-surface-2: #30363d;
	--tn-border: #30363d;
	--tn-text: #c9d1d9;
	--tn-muted: #8b949e;
	--tn-comment: #8b949e;
	--tn-blue: #58a6ff;
	--tn-cyan: #39c5cf;
	--tn-purple: #d2a8ff;
	--tn-green: #3fb950;
	--tn-yellow: #d29922;
	--tn-red: #ff7b72;
	--tn-orange: #ffa657;
}

/* GitHub Light */
.ide-root.theme-github-light {
	--tn-bg: #ffffff;
	--tn-bg-dark: #f6f8fa;
	--tn-bg-soft: #ffffff;
	--tn-surface: #f3f4f6;
	--tn-surface-2: #ebecf0;
	--tn-border: #d0d7de;
	--tn-text: #24292f;
	--tn-muted: #57606a;
	--tn-comment: #6e7781;
	--tn-blue: #0969da;
	--tn-cyan: #1b7c83;
	--tn-purple: #8250df;
	--tn-green: #1a7f37;
	--tn-yellow: #9a6700;
	--tn-red: #cf222e;
	--tn-orange: #bc4c00;
}

/* Tokyo Night */
.ide-root.theme-tokyo-night {
	--tn-bg: #1a1b26;
	--tn-bg-dark: #16161e;
	--tn-bg-soft: #1f2335;
	--tn-surface: #24283b;
	--tn-surface-2: #292e42;
	--tn-border: #3b4261;
	--tn-text: #c0caf5;
	--tn-muted: #9aa5ce;
	--tn-comment: #565f89;
	--tn-blue: #7aa2f7;
	--tn-cyan: #7dcfff;
	--tn-purple: #bb9af7;
	--tn-green: #9ece6a;
	--tn-yellow: #e0af68;
	--tn-red: #f7768e;
	--tn-orange: #ff9e64;
}

/* Catppuccin Latte */
.ide-root.theme-catppuccin-latte {
	--tn-bg: #eff1f5;
	--tn-bg-dark: #e6e9ef;
	--tn-bg-soft: #dce0e8;
	--tn-surface: #ccd0da;
	--tn-surface-2: #bcc0cc;
	--tn-border: #acb0be;
	--tn-text: #4c4f69;
	--tn-muted: #6c6f85;
	--tn-comment: #8c8fa1;
	--tn-blue: #1e66f5;
	--tn-cyan: #04a5e5;
	--tn-purple: #8839ef;
	--tn-green: #40a02b;
	--tn-yellow: #df8e1d;
	--tn-red: #d20f39;
	--tn-orange: #fe640b;
}
`;

css = css.replace(/:\s*root\s*\{[\s\S]*?\}\s*\.app-root\.theme-light\s*\{[\s\S]*?\}/, ':root { /* fallback */ } ' + themesCSS);

// Add VS Code layout CSS
const layoutCSS = `
/* ───────── VS Code Layout ───────── */

.ide-main {
	display: flex;
	flex: 1;
	min-height: 0;
	background: var(--tn-bg);
}

.title-bar {
	height: 30px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 10px;
	background: var(--tn-bg-dark);
	border-bottom: 1px solid var(--tn-border);
	user-select: none;
	font-size: 13px;
	color: var(--tn-text);
}

.title-bar-left {
	display: flex;
	align-items: center;
	gap: 6px;
}

.activity-bar {
	width: 48px;
	background: var(--tn-bg-dark);
	border-right: 1px solid var(--tn-border);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	padding: 10px 0;
}

.activity-btn {
	background: none;
	border: none;
	color: var(--tn-muted);
	cursor: pointer;
	padding: 8px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.activity-btn:hover {
	color: var(--tn-text);
}

.activity-btn.active {
	color: var(--tn-text);
	border-left: 2px solid var(--tn-blue);
	border-radius: 0;
}

.status-bar {
	height: 22px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 10px;
	background: var(--tn-bg-dark);
	color: var(--tn-text);
	font-size: 12px;
	user-select: none;
}

.status-bar-left, .status-bar-right {
	display: flex;
	align-items: center;
	gap: 16px;
}

.status-item {
	display: flex;
	align-items: center;
	gap: 6px;
}

.status-item.vim-mode.normal {
	color: var(--tn-purple);
	font-weight: bold;
}
.status-item.vim-mode.insert {
	color: var(--tn-blue);
	font-weight: bold;
}

/* ───────── Panel (Console) Tabs ───────── */
.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1px solid var(--tn-border);
	background: var(--tn-bg);
}

.panel-tabs {
	display: flex;
	align-items: center;
}

.panel-tab {
	background: none;
	border: none;
	color: var(--tn-muted);
	padding: 6px 12px;
	font-size: 11px;
	letter-spacing: 1px;
	cursor: pointer;
	text-transform: uppercase;
	font-family: inherit;
}

.panel-tab.active {
	color: var(--tn-text);
	border-bottom: 1px solid var(--tn-blue);
}

.panel-actions {
	display: flex;
	align-items: center;
	padding-right: 8px;
}
.panel-action-btn {
	background: none;
	border: none;
	color: var(--tn-muted);
	cursor: pointer;
	padding: 4px;
	display: flex;
	align-items: center;
	border-radius: 4px;
}
.panel-action-btn:hover {
	color: var(--tn-text);
	background: var(--tn-surface-2);
}
`;

// Replace Navbar stuff with new layout CSS, or just append it and remove navbar.
css = css.replace(/\/\* ───────── Navbar ───────── \*\/[\s\S]*?\/\* ───────── Workspace split ───────── \*\//, layoutCSS + '\n/* ───────── Workspace split ───────── */');

// Remove editor statusbar CSS
css = css.replace(/\.editor-statusbar\s*\{[\s\S]*?\}\s*/g, '');
css = css.replace(/\.editor-status-left\s*\{[\s\S]*?\}\s*/g, '');
css = css.replace(/\.editor-status-right\s*\{[\s\S]*?\}\s*/g, '');

// Adjust .workspace-area
css = css.replace(/\.workspace-area\s*\{[\s\S]*?\}/, '.workspace-area { flex: 1; min-width: 0; min-height: 0; }');

fs.writeFileSync('src/App.css', css);
console.log('App.css updated successfully.');
