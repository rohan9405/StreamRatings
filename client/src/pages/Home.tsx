import { DemoWidget } from "@/components/demo-widget";
import { FeatureCard } from "@/components/ui/feature-card";
import { Section } from "@/components/ui/section";
import { 
  Tv, 
  Settings, 
  Key, 
  Globe, 
  Github, 
  Copy, 
  CheckCircle2, 
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Home() {
  const [copied, setCopied] = useState(false);
  const backendUrl = window.location.origin;

  const copyUrl = () => {
    navigator.clipboard.writeText(backendUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-rose-800 flex items-center justify-center">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">StreamRatings</span>
          </div>
          <a
            href="https://github.com/replit/stream-ratings-extension" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground hover:text-white transition-colors flex items-center gap-2"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">View on GitHub</span>
          </a>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero Section */}
        <Section className="text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 blur-[120px] rounded-full -z-10 opacity-50 pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary-foreground mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Backend is Live & Ready
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            IMDb Ratings for<br />Every Stream
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            See IMDb ratings directly on Netflix, Prime Video, and Hotstar. 
            No more switching tabs to find out if a movie is worth watching.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            <div className="w-full max-w-sm">
              <div className="flex flex-col items-start text-left mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">Your Backend URL</label>
                <div className="w-full flex gap-2">
                  <div className="flex-1 bg-secondary rounded-xl border border-white/5 px-4 py-3 text-sm text-muted-foreground truncate font-mono">
                    {backendUrl}
                  </div>
                  <button
                    onClick={copyUrl}
                    className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl px-4 py-3 flex items-center justify-center transition-all active:scale-95"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 ml-1">
                  Copy this URL to configure the extension.
                </p>
              </div>
            </div>

            {/* Visual Arrow for desktop */}
            <div className="hidden md:block text-muted-foreground/20">
              <ArrowRight className="w-8 h-8" />
            </div>

            <div className="w-full max-w-sm">
              <DemoWidget />
            </div>
          </div>
        </Section>

        {/* Features Grid */}
        <Section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Globe}
            title="Universal Support"
            description="Works seamlessly on Netflix, Prime Video, and Disney+ Hotstar interfaces."
            delay={0.1}
          />
          <FeatureCard
            icon={Key}
            title="Secure & Private"
            description="Your API keys are stored securely. No personal data is ever collected."
            delay={0.2}
          />
          <FeatureCard
            icon={Tv}
            title="Native Feel"
            description="Ratings appear naturally within the platform's UI, looking like they belong there."
            delay={0.3}
          />
        </Section>

        {/* Setup Guide */}
        <Section id="setup" className="max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Setup Guide</h2>
            <p className="text-muted-foreground">Follow these steps to get running in minutes.</p>
          </div>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex gap-6 md:gap-10">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/20 flex items-center justify-center font-bold text-lg">1</div>
                <div className="w-px h-full bg-white/10 my-4" />
              </div>
              <div className="pb-8">
                <h3 className="text-xl font-bold mb-2">Prepare the Environment</h3>
                <p className="text-muted-foreground mb-4">
                  You are already here! This Replit instance serves as your backend. Ensure you have set your Secrets correctly in the Replit Tools pane.
                </p>
                <div className="bg-black/40 rounded-lg border border-white/5 p-4 font-mono text-sm text-muted-foreground">
                  <div>OMDB_API_KEY=your_key_here</div>
                  <div>STREAMRATINGS_SECRET=your_secret_password</div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 md:gap-10">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/20 flex items-center justify-center font-bold text-lg">2</div>
                <div className="w-px h-full bg-white/10 my-4" />
              </div>
              <div className="pb-8">
                <h3 className="text-xl font-bold mb-2">Load the Extension</h3>
                <p className="text-muted-foreground mb-4">
                  Download the <code className="bg-white/10 px-1.5 py-0.5 rounded text-white text-xs">extension/</code> folder from the file tree. Open Chrome and navigate to <code className="text-primary">chrome://extensions</code>.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                  <li>Enable <strong>Developer mode</strong> (top right toggle)</li>
                  <li>Click <strong>Load unpacked</strong></li>
                  <li>Select the downloaded folder</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 md:gap-10">
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/20 flex items-center justify-center font-bold text-lg">3</div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Configure & Enjoy</h3>
                <p className="text-muted-foreground mb-4">
                  Click the extension icon in your browser toolbar. Enter the Backend URL shown above and the secret you configured in Replit secrets.
                </p>
                <div className="flex items-center gap-3 text-sm text-green-400 bg-green-400/10 px-4 py-3 rounded-lg border border-green-400/20 w-fit">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready to stream!</span>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} StreamRatings. Built with Replit.</p>
        </div>
      </footer>
    </div>
  );
}
