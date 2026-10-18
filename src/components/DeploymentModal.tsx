import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Server,
  GitBranch,
  Cloud,
  Terminal,
  Activity,
  Layers,
  ShieldCheck,
  Database,
  Cpu,
  Globe,
  ExternalLink
} from 'lucide-react';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'github' | 'cloudflare' | 'kv' | 'diagnostics'>('architecture');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Diagnostics state
  const [apiTesting, setApiTesting] = useState(false);
  const [apiResult, setApiResult] = useState<unknown>(null);
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestApi = async (endpoint: string) => {
    setApiTesting(true);
    setApiResult(null);
    const start = performance.now();
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      const latency = Math.round(performance.now() - start);
      setApiLatency(latency);
      setApiResult({ status: res.status, ok: res.ok, data });
    } catch (err: unknown) {
      const latency = Math.round(performance.now() - start);
      setApiLatency(latency);
      setApiResult({
        status: 'Client / Offline Mode',
        note: '在尚未部署至 Cloudflare 前，系統自動啟用本地記憶體與 localStorage 備援機制，遊戲進度與排行榜依然正常運作！',
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setApiTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-cyan-500/40 bg-slate-900 shadow-2xl shadow-cyan-950/70 overflow-hidden text-slate-200 font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>CLOUDFLARE PAGES & WORKERS // DEPLOYMENT HUB</span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Full-Stack Serverless Architecture · Cloudflare Pages & Functions · Edge KV · CI/CD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/40 px-6 py-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition shrink-0 ${
              activeTab === 'architecture'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. FULL ARCHITECTURE</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition shrink-0 ${
              activeTab === 'github'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>2. PUSH TO GITHUB</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition shrink-0 ${
              activeTab === 'cloudflare'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>3. CLOUDFLARE PAGES SETUP</span>
          </button>

          <button
            onClick={() => setActiveTab('kv')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition shrink-0 ${
              activeTab === 'kv'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>4. WORKERS KV CONFIG</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition shrink-0 ${
              activeTab === 'diagnostics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>5. LIVE API TEST</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-cyan-200 text-xs">
                <span className="font-bold">ARCHITECTURE GOAL:</span> Zero server management cost, ultra-low Anycast edge latency (&lt; 50ms), enterprise DDoS resilience, sub-5ms V8 cold starts, and a decoupled 60 FPS Canvas 2D physics simulation loop.
              </div>

              {/* Visual Architecture Flow Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Layer 1: Client Canvas */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <Cpu className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">1. Client Rendering</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">React 19 + Canvas 2D</h4>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Virtual coordinates, 60 FPS loop, zero-GC particle ring buffer, Web Audio procedural synth, and curve spin deflection.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-cyan-300 font-mono">
                    • src/game/engine.ts<br />
                    • src/game/rules.ts
                  </div>
                </div>

                {/* Layer 2: Cloudflare Edge CDN */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-orange-400 mb-2">
                      <Globe className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">2. Static Edge Hosting</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">Cloudflare Pages</h4>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Global 300+ city Anycast CDN, automatic Brotli compression, HTTP/3, and custom domain SSL management.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-orange-300 font-mono">
                    • wrangler.toml<br />
                    • dist/ static bundle
                  </div>
                </div>

                {/* Layer 3: Serverless Edge Functions */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <Server className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">3. Serverless Compute</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">Pages Functions</h4>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Powered by Cloudflare Workers V8 Isolates with &lt; 5ms cold starts, score payload verification, and anti-cheat filtering.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-emerald-300 font-mono">
                    • functions/api/leaderboard.ts<br />
                    • functions/api/stats.ts
                  </div>
                </div>

                {/* Layer 4: Global KV Database */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <Database className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">4. Distributed Storage</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">Workers KV / D1</h4>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Millisecond edge reads, multi-region replication, persistent high-score leaderboard storage with auto-memory fallback.
                    </p>
                  </div>
                  <div className="mt-3 text-[11px] text-purple-300 font-mono">
                    • env.LEADERBOARD_KV<br />
                    • In-memory fallback
                  </div>
                </div>
              </div>

              {/* Data Flow Summary */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                <h4 className="font-bold text-white text-xs mb-2">DATA FLOW & LIFECYCLE:</h4>
                <div className="text-xs text-slate-300 space-y-1.5 font-sans leading-relaxed">
                  <p>1. <strong>Initial Load</strong>: Browser loads bundle from Cloudflare Pages Anycast edge, requests GET <code className="text-cyan-300 font-mono">/api/leaderboard</code>.</p>
                  <p>2. <strong>Gameplay</strong>: 100% client-side 60 FPS Canvas execution, zero network jitter during arcade action.</p>
                  <p>3. <strong>Run Completion</strong>: On stage clear or game over, client sends POST <code className="text-cyan-300 font-mono">/api/leaderboard</code> to Cloudflare Functions, syncing globally to KV in milliseconds!</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Push to GitHub */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-xs">
                <span className="font-bold text-cyan-300">REPOSITORY READY:</span> Create a new empty repository on GitHub (e.g., <code className="text-amber-300 font-bold">cyber-breakout</code>) and execute the steps below.
              </div>

              {/* Method 1: Helper Script */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-300 text-xs flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <span>Option 1: Use One-Click Push Script (Recommended)</span>
                  </h4>
                  <button
                    onClick={() => copyToClipboard('./push-to-github.sh https://github.com/<YOUR_USER>/cyber-breakout.git', 'script_cmd')}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedKey === 'script_cmd' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'script_cmd' ? 'COPIED' : 'COPY COMMAND'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-cyan-300 text-xs overflow-x-auto">
                  ./push-to-github.sh https://github.com/&lt;YOUR_USERNAME&gt;/cyber-breakout.git
                </pre>
                <p className="text-[11px] text-slate-400 font-sans">
                  * Automatically initializes Git, stages files, creates commit, links remote, and pushes to main.
                </p>
              </div>

              {/* Method 2: Manual Terminal Steps */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyan-400" />
                    <span>Option 2: Standard Git Terminal Commands</span>
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `git init -b main\ngit add .\ngit commit -m "feat: complete cyber breakout game with cloudflare edge deployment"\ngit remote add origin https://github.com/<YOUR_USERNAME>/cyber-breakout.git\ngit push -u origin main`,
                        'all_git'
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedKey === 'all_git' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'all_git' ? 'COPIED ALL' : 'COPY ALL STEPS'}</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-black/50 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]"># 1. Initialize Git & Stage All Files</span>
                    <code className="text-cyan-300">git init -b main && git add .</code>
                  </div>

                  <div className="p-2.5 rounded bg-black/50 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]"># 2. Create Initial Commit</span>
                    <code className="text-cyan-300">git commit -m "feat: complete cyber breakout with cloudflare serverless"</code>
                  </div>

                  <div className="p-2.5 rounded bg-black/50 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]"># 3. Add Remote Origin</span>
                    <code className="text-cyan-300">git remote add origin https://github.com/&lt;YOUR_USERNAME&gt;/cyber-breakout.git</code>
                  </div>

                  <div className="p-2.5 rounded bg-black/50 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]"># 4. Push to Main Branch</span>
                    <code className="text-cyan-300">git push -u origin main</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Cloudflare Deploy */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-950/20 text-xs">
                <span className="font-bold text-orange-300">CLOUDFLARE FULL-STACK INTEGRATION:</span>
                The <code className="text-cyan-300">functions/api/</code> directory contains serverless handlers automatically compiled into V8 edge workers during Pages deployment!
              </div>

              {/* Deployment Option A: Cloudflare Dashboard Git Integration */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <h4 className="font-bold text-cyan-300 text-xs">Method A: Cloudflare Dashboard Git Integration (Zero Config Auto-Deploy)</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 font-sans leading-relaxed">
                  <li>Log in to <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-orange-400 underline inline-flex items-center gap-1">Cloudflare Dashboard <ExternalLink className="w-3 h-3" /></a>.</li>
                  <li>Navigate to <strong>Workers & Pages</strong> &gt; <strong>Create Application</strong> &gt; select the <strong>Pages</strong> tab.</li>
                  <li>Click <strong>Connect to Git</strong>, authorize GitHub, and select your <code className="text-cyan-300 font-mono">cyber-breakout</code> repository.</li>
                  <li>
                    Configure Build Preset:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-slate-400 font-mono text-[11px]">
                      <li>Framework preset: <strong className="text-white">Vite</strong></li>
                      <li>Build command: <code className="text-cyan-300">npm run build</code></li>
                      <li>Build output directory: <code className="text-cyan-300">dist</code></li>
                    </ul>
                  </li>
                  <li>Click <strong>Save and Deploy</strong>. Every subsequent <code className="text-slate-300 font-mono">git push</code> will trigger an automatic preview and production build!</li>
                </ol>
              </div>

              {/* Deployment Option B: Wrangler CLI */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 text-xs">Method B: Direct CLI Deployment via Wrangler</h4>
                  <button
                    onClick={() => copyToClipboard('npm run build\nnpx wrangler pages deploy dist --project-name=cyber-breakout', 'cli_deploy')}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedKey === 'cli_deploy' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'cli_deploy' ? 'COPIED' : 'COPY COMMANDS'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-cyan-300 text-xs overflow-x-auto">
                  npm run build<br />
                  npx wrangler pages deploy dist --project-name=cyber-breakout
                </pre>
              </div>

              {/* Deployment Option C: GitHub Actions CI/CD */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <h4 className="font-bold text-slate-200 text-xs">Method C: Automated GitHub Actions CI/CD</h4>
                <p className="text-xs text-slate-400 font-sans">
                  The preconfigured workflow <code className="text-cyan-300 font-mono">.github/workflows/deploy-cloudflare.yml</code> runs tests and deploys on every push. Add secrets in <strong>Settings &gt; Secrets & Variables &gt; Actions</strong>:
                </p>
                <div className="text-[11px] font-mono text-cyan-300 space-y-1 pl-2">
                  • <code className="text-amber-300">CLOUDFLARE_API_TOKEN</code>: Cloudflare API Token with Pages: Edit permission<br />
                  • <code className="text-amber-300">CLOUDFLARE_ACCOUNT_ID</code>: Cloudflare Account ID from your dashboard overview
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Workers KV Config */}
          {activeTab === 'kv' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 text-xs">
                <span className="font-bold text-purple-300">DISTRIBUTED KV STORAGE:</span>
                The endpoint <code className="text-cyan-300">/functions/api/leaderboard.ts</code> is fault-tolerant: it operates with in-memory fallback during local dev, and seamlessly binds to global multi-region KV in production!
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <h4 className="font-bold text-white text-xs">Step 1: Create KV Namespace via Wrangler</h4>
                <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-cyan-300 text-xs overflow-x-auto">
                  npx wrangler kv namespace create LEADERBOARD_KV
                </pre>
                <p className="text-[11px] text-slate-400 font-sans">
                  Wrangler will generate a unique KV namespace ID (e.g. <code className="text-slate-300 font-mono">id = "49a18d..."</code>).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
                <h4 className="font-bold text-white text-xs">Step 2: Bind KV in Cloudflare Pages</h4>
                <div className="text-xs text-slate-300 font-sans space-y-1.5">
                  <p>• In Cloudflare Dashboard: Pages project &gt; <strong>Settings</strong> &gt; <strong>Functions</strong> &gt; <strong>KV namespace bindings</strong> &gt; <strong>Add binding</strong>:</p>
                  <div className="p-2.5 rounded bg-black/50 border border-slate-800 text-[11px] font-mono text-cyan-300">
                    Variable name: <strong className="text-white">LEADERBOARD_KV</strong><br />
                    KV namespace: select <strong className="text-white">LEADERBOARD_KV</strong>
                  </div>
                  <p>• Or uncomment the <code className="text-slate-400 font-mono">[[kv_namespaces]]</code> block in <code className="text-slate-300 font-mono">wrangler.toml</code>.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Live API Diagnostics */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs">
                <span className="font-bold text-emerald-300">EDGE API HEALTH PROBE:</span>
                Send live HTTP requests to test edge handlers, CORS headers, latency, and JSON serialization.
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTestApi('/api/leaderboard')}
                  disabled={apiTesting}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition flex items-center gap-2"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>TEST GET /api/leaderboard (Leaderboard API)</span>
                </button>

                <button
                  onClick={() => handleTestApi('/api/stats')}
                  disabled={apiTesting}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold transition flex items-center gap-2"
                >
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>TEST GET /api/stats (Edge Health Ping)</span>
                </button>
              </div>

              {apiTesting && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-cyan-400 text-xs flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Sending request to edge endpoint...</span>
                </div>
              )}

              {apiResult !== null && (
                <div className="p-4 rounded-xl border border-slate-800 bg-black/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-800">
                    <span className="text-slate-400">
                      Response Status: <strong className="text-emerald-400">{String((apiResult as { status?: unknown })?.status || 200)}</strong>
                    </span>
                    {apiLatency !== null && (
                      <span className="text-cyan-300 font-mono">Latency: {apiLatency} ms</span>
                    )}
                  </div>
                  <pre className="text-cyan-300 text-[11px] overflow-x-auto max-h-60">
                    {JSON.stringify(apiResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs">
          <span className="text-slate-400">Includes GitHub Actions, wrangler.toml & Pages Functions</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
