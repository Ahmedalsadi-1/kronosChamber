import type {CSSProperties} from 'react';
import {Audio} from '@remotion/media';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import logoPrimary from '../assets/logo-primary.png';
import logoGridA from '../assets/logo-grid-a.png';
import logoGridB from '../assets/logo-grid-b.png';
import chatExample from '../../../docs/references/chat_example.png';
import settingsExample from '../../../docs/references/settings_example.png';
import terminalExample from '../../../docs/references/pwa_terminal_example.png';
import webExample from '../../../docs/references/web_version_example.png';

const SCENE = {
  intro: 120,
  hook: 180,
  tui: 360,
  desktop: 360,
  features: 240,
  cli: 240,
  proof: 180,
  flow: 180,
  cta: 180,
};

const transitionFrames = 20;

const title: CSSProperties = {
  margin: 0,
  fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
  color: '#f3f3f4',
  fontWeight: 700,
  letterSpacing: -1,
  lineHeight: 1.06,
};

const body: CSSProperties = {
  margin: 0,
  fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
  color: 'rgba(240,240,242,0.83)',
  fontWeight: 500,
  lineHeight: 1.34,
};

const labelStyle: CSSProperties = {
  display: 'inline-flex',
  padding: '9px 14px',
  border: '1px solid rgba(255,255,255,0.22)',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.03)',
  color: '#d8d8db',
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 16,
  letterSpacing: 1,
};

const fadeInOut = (frame: number, duration: number) => {
  const a = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const b = interpolate(frame, [duration - 16, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(a, b);
};

const rise = (frame: number, delay = 0) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps: 30,
    config: {damping: 200},
  });

const shell = (tone = 0.18): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  background: `radial-gradient(circle at 20% 14%, rgba(255,255,255,${tone}) 0%, rgba(25,25,28,0.95) 38%, #060607 100%)`,
});

const vignette: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 34%, rgba(0,0,0,0.62) 100%), linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.5))',
};

const MonoCard: React.FC<{children: React.ReactNode; style?: CSSProperties}> = ({children, style}) => (
  <div
    style={{
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.16)',
      background: 'linear-gradient(165deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
      boxShadow: '0 18px 50px rgba(0,0,0,0.46)',
      ...style,
    }}
  >
    {children}
  </div>
);

// Animated Terminal Component for TUI Scene
const AnimatedTerminal: React.FC<{frame: number}> = ({frame}) => {
  const lines = [
    {text: '$ kronoscode', color: '#888'},
    {text: '🤖 Starting agent session...', color: '#7eb8da'},
    {text: '', color: '#888'},
    {text: '> Create a beautiful landing page', color: '#fff'},
    {text: '', color: '#888'},
    {text: '⚡ Analyzing project structure...', color: '#daa520'},
    {text: '⚡ Found: React + TypeScript + Vite', color: '#90ee90'},
    {text: '', color: '#888'},
    {text: '📝 Planning implementation...', color: '#dda0dd'},
    {text: '', color: '#888'},
    {text: 'Creating components...', color: '#f0f0f0'},
  ];

  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  
  return (
    <div style={{fontFamily: '"IBM Plex Mono", monospace', fontSize: 18, lineHeight: 1.6}}>
      {lines.map((line, i) => {
        const delay = i * 12;
        const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const y = interpolate(frame, [delay, delay + 20], [10, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        
        return (
          <div 
            key={i} 
            style={{
              color: line.color, 
              opacity, 
              transform: `translateY(${y}px)`,
              minHeight: 28,
            }}
          >
            {line.text || '\u00A0'}
            {i === lines.length - 1 && cursorBlink && <span style={{background: '#0f0', color: '#000', padding: '0 4px'}}>█</span>}
          </div>
        );
      })}
    </div>
  );
};

// Desktop UI Animation Component
const AnimatedDesktop: React.FC<{frame: number}> = ({frame}) => {
  // Chat message animation
  const messages = [
    {role: 'user', text: 'Help me build a todo app', delay: 0},
    {role: 'agent', text: 'I\'d be happy to help! Let me set up a React todo app with localStorage persistence.', delay: 30},
    {role: 'agent', text: 'First, let me check your environment...', delay: 60},
  ];

  // Tool activity animation
  const tools = [
    {name: 'Read file', status: 'done', delay: 90},
    {name: 'Write file', status: 'done', delay: 100},
    {name: 'Run terminal', status: 'active', delay: 110},
  ];

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12, height: '100%'}}>
      {/* Chat area */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 8}}>
        {messages.map((msg, i) => {
          const opacity = interpolate(frame, [msg.delay, msg.delay + 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const isUser = msg.role === 'user';
          
          return (
            <div
              key={i}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                opacity,
                transform: `translateY(${interpolate(frame, [msg.delay, msg.delay + 20], [20, 0])})`,
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: isUser ? 'rgba(79, 70, 229, 0.8)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span style={{color: '#fff', fontSize: 16}}>{msg.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tool activity bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingTop: 12,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {tools.map((tool, i) => {
          const opacity = interpolate(frame, [tool.delay, tool.delay + 15], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const isActive = tool.status === 'active';
          const isDone = tool.status === 'done';
          
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                opacity,
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isDone ? '#4ade80' : isActive ? '#facc15' : '#888',
              }} />
              <span style={{color: '#ccc', fontSize: 14, fontFamily: '"IBM Plex Mono", monospace'}}>
                {tool.name}
              </span>
              {isActive && (
                <span style={{color: '#facc15', fontSize: 12}}>⏳</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE.intro);
  const scale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity, backgroundColor: '#050506'}}>
      <div style={shell(0.1)} />
      <div style={vignette} />
      
      <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center'}}>
        <div style={{textAlign: 'center', transform: `scale(${scale})`}}>
          <MonoCard style={{padding: 20, display: 'inline-block', marginBottom: 24}}>
            <Img src={logoPrimary} style={{width: 180, borderRadius: 6}} />
          </MonoCard>
          <h1 style={{...title, fontSize: 72, marginTop: 8}}>Kronos Suite</h1>
          <p style={{...body, fontSize: 28, marginTop: 12, color: 'rgba(255,255,255,0.6)'}}>
            CLI Power + GUI Simplicity
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE.hook);
  const pop = rise(frame);

  return (
    <AbsoluteFill style={{opacity}}>
      <div style={shell(0.14)} />
      <div style={vignette} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '84px 92px',
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          alignItems: 'center',
          gap: 48,
        }}
      >
        <div style={{transform: `translateY(${(1 - pop) * 26}px)`}}>
          <div style={labelStyle}>INTRO</div>
          <h1 style={{...title, fontSize: 82, marginTop: 18}}>Your coding partner, your way.</h1>
          <p style={{...body, fontSize: 30, marginTop: 20, maxWidth: 900}}>
            From terminal power users to visual workflow lovers — KronosCoder and KronosChamber adapt to how you build.
          </p>
        </div>

        <MonoCard style={{padding: 16, transform: `translateY(${(1 - pop) * 44}px) scale(${0.92 + pop * 0.08})`}}>
          <Img src={logoPrimary} style={{width: '100%', borderRadius: 4, filter: 'grayscale(1) contrast(1.07)'}} />
        </MonoCard>
      </div>
    </AbsoluteFill>
  );
};

const TUIScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE.tui);

  return (
    <AbsoluteFill style={{opacity}}>
      <div style={shell(0.17)} />
      <div style={vignette} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '80px 86px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        <div>
          <div style={labelStyle}>KRONOSCODE CLI</div>
          <h2 style={{...title, fontSize: 68, marginTop: 18}}>Terminal that moves at your speed.</h2>
          <p style={{...body, fontSize: 26, marginTop: 14, maxWidth: 700}}>
            Real-time agent interaction, instant file operations, and full context awareness — all without leaving your shell.
          </p>

          <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28}}>
            {[
              {icon: '⚡', text: 'Instant command execution'},
              {icon: '🎯', text: 'Full project context'},
              {icon: '🔄', text: 'Real-time progress updates'},
              {icon: '🎨', text: 'Rich media previews'},
            ].map((item, i) => {
              const p = rise(frame, 20 + i * 10);
              return (
                <div 
                  key={i} 
                  style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    opacity: p, 
                    transform: `translateX(${(1 - p) * 16}px)`
                  }}
                >
                  <span style={{fontSize: 24}}>{item.icon}</span>
                  <span style={{...body, fontSize: 22}}>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <MonoCard 
          style={{
            padding: 24, 
            background: '#0a0a0c', 
            border: '1px solid #2a2a2e',
            minHeight: 420,
          }}
        >
          {/* Terminal header */}
          <div style={{display: 'flex', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #222'}}>
            <div style={{width: 12, height: 12, borderRadius: '50%', background: '#ff5f56'}} />
            <div style={{width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e'}} />
            <div style={{width: 12, height: 12, borderRadius: '50%', background: '#27ca40'}} />
            <span style={{color: '#666', fontSize: 14, marginLeft: 8, fontFamily: '"IBM Plex Mono", monospace'}}>
              kronoscode — zsh
            </span>
          </div>
          <AnimatedTerminal frame={frame} />
        </MonoCard>
      </div>
    </AbsoluteFill>
  );
};

const DesktopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE.desktop);

  return (
    <AbsoluteFill style={{opacity}}>
      <div style={shell(0.16)} />
      <div style={vignette} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '80px 86px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        <MonoCard 
          style={{
            padding: 8, 
            overflow: 'hidden',
            background: '#1a1a1e',
            border: '1px solid #2a2a2e',
            minHeight: 480,
          }}
        >
          {/* Desktop window chrome */}
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '10px 12px',
            borderBottom: '1px solid #2a2a2e',
            background: '#121214',
          }}>
            <div style={{width: 10, height: 10, borderRadius: '50%', background: '#ff5f56'}} />
            <div style={{width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e'}} />
            <div style={{width: 10, height: 10, borderRadius: '50%', background: '#27ca40'}} />
            <span style={{color: '#888', fontSize: 13, marginLeft: 8, fontFamily: '"IBM Plex Mono", monospace'}}>
              KronosChamber
            </span>
          </div>
          
          {/* Chat interface */}
          <div style={{padding: 16, height: '100%'}}>
            <AnimatedDesktop frame={frame} />
          </div>
        </MonoCard>

        <div>
          <div style={labelStyle}>KRONOSCHAMBER (GUI)</div>
          <h2 style={{...title, fontSize: 68, marginTop: 18}}>Visual workflow, serious power.</h2>
          <p style={{...body, fontSize: 26, marginTop: 14, maxWidth: 600}}>
            Rich chat interfaces, diff views, and real-time collaboration — all in a beautiful desktop app.
          </p>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 28}}>
            {[
              {icon: '💬', text: 'Branchable chat'},
              {icon: '📊', text: 'Tool activity'},
              {icon: '🎨', text: 'Rich diffs'},
              {icon: '📱', text: 'Cross-device'},
            ].map((item, i) => {
              const p = rise(frame, 30 + i * 8);
              return (
                <MonoCard 
                  key={i}
                  style={{
                    padding: '16px 14px', 
                    transform: `translateY(${(1 - p) * 20}px)`,
                    opacity: p,
                  }}
                >
                  <span style={{fontSize: 28, display: 'block', marginBottom: 8}}>{item.icon}</span>
                  <span style={{...body, fontSize: 18}}>{item.text}</span>
                </MonoCard>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE.features);

  const features = [
    {title: 'Voice Mode', desc: 'Talk to your code', icon: '🎤'},
    {title: 'Multi-Agent', desc: 'Parallel sessions', icon: '⚔️'},
    {title: 'Git Built-in', desc: 'Commits & PRs', icon: '🔀'},
    {title: 'Skills', desc: 'Custom workflows', icon: '🛠️'},
    {title: 'Remote Access', desc: 'Cloudflare tunnel', icon: '🌐'},
    {title: 'Themes', desc: 'Make it yours', icon: '🎨'},
  ];

  return (
    <AbsoluteFill style={{opacity}}>
      <div style={shell(0.12)} />
      <div style={vignette} />

      <div style={{position: 'absolute', inset: 0, padding: '80px 92px'}}>
        <div style={labelStyle}>FEATURES</div>
        <h2 style={{...title, fontSize: 74, marginTop: 18}}>Everything you need to ship.</h2>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32}}>
          {features.map((f, i) => {
            const p = rise(frame, i * 8);
            return (
              <MonoCard 
                key={i}
                style={{
                  padding: '24px 20px',
                  transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + p * 0.1})`,
                  opacity: p,
                }}
              >
                <span style={{fontSize: 36, display: 'block', marginBottom: 12}}>{f.icon}</span>
                <h3 style={{...title, fontSize: 24, marginBottom: 6}}>{f.title}</h3>
                <p style={{...body, fontSize: 18, color: 'rgba(255,255,255,0.6)'}}>{f.desc}</p>
              </MonoCard>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CLIScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE.cli);

  return (
    <AbsoluteFill style={{opacity}}>
      <div style={shell(0.19)} />
      <div style={vignette} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '84px 92px',
          display: 'grid',
          gridTemplateColumns: '0.9fr 1.1fr',
          alignItems: 'center',
          gap: 64,
        }}
      >
        <div>
          <div style={labelStyle}>FOR DEVELOPERS</div>
          <h2 style={{...title, fontSize: 78, marginTop: 18}}>Script, automate, scale.</h2>
          <p style={{...body, fontSize: 30, marginTop: 22}}>
            Perfect for CI/CD, batch operations, and headless workflows.
          </p>
          <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32}}>
            {['API-first design', 'Custom agent recipes', 'Enterprise-ready'].map((item, i) => {
              const p = rise(frame, 12 + i * 8);
              return (
                <div key={item} style={{display: 'flex', alignItems: 'center', gap: 12, opacity: p, transform: `translateX(${(1 - p) * 16}px)`}}>
                  <div style={{width: 8, height: 8, borderRadius: '50%', background: '#fff'}} />
                  <span style={{...body, fontSize: 24}}>{item}</span>
                </div>
              );
            })}
          </div>
        </div>

        <MonoCard style={{padding: 28, background: '#000', border: '1px solid #333'}}>
          <div style={{fontFamily: '"IBM Plex Mono", monospace', color: '#0f0', fontSize: 20, lineHeight: 1.5}}>
            <div style={{color: '#888'}}># CI/CD pipeline example</div>
            <div style={{marginTop: 8}}>$ kronoscode batch \</div>
            <div style={{paddingLeft: 16}}>--files "src/**/*.ts" \</div>
            <div style={{paddingLeft: 16}}>--command "add-type-docs"</div>
            <div style={{marginTop: 8}}>⚡ Processing 47 files...</div>
            <div>⚡ Generating documentation...</div>
            <div style={{color: '#fff', marginTop: 8}}>✓ Complete in 12.4s</div>
            <div style={{color: '#888', marginTop: 16}}># Or as a GitHub Action</div>
            <div style={{marginTop: 4}}>uses: kronoscode/github-action@v1</div>
          </div>
        </MonoCard>
      </div>
    </AbsoluteFill>
  );
};

const ProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE.proof);

  const claims = [
    'Less context switching. More shipping.',
    'Built by devs, for devs.',
    'Open source + commercial support.',
  ];

  return (
    <AbsoluteFill style={{opacity}}>
      <div style={shell(0.11)} />
      <div style={vignette} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '80px 92px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <div>
          <div style={labelStyle}>WHY KRONOS</div>
          <h2 style={{...title, fontSize: 64, marginTop: 18}}>The workflow upgrade you\'ve been waiting for.</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24}}>
            {claims.map((claim, i) => {
              const p = rise(frame, i * 10);
              return (
                <MonoCard key={claim} style={{padding: '18px 18px', transform: `translateX(${(1 - p) * 20}px)`, opacity: p}}>
                  <p style={{...body, fontSize: 26}}>{claim}</p>
                </MonoCard>
              );
            })}
          </div>
        </div>

        <MonoCard style={{overflow: 'hidden'}}>
          <Img
            src={settingsExample}
            style={{width: '100%', height: 500, objectFit: 'cover', filter: 'grayscale(1) contrast(1.08) brightness(0.84)'}}
          />
        </MonoCard>
      </div>
    </AbsoluteFill>
  );
};

const FlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE.flow);
  const steps = ['THINK', 'BUILD', 'SHIP'];

  return (
    <AbsoluteFill style={{opacity}}>
      <div style={shell(0.15)} />
      <div style={vignette} />

      <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '0 120px'}}>
        <div>
          <div style={labelStyle}>WORKFLOW</div>
          <h2 style={{...title, fontSize: 82, marginTop: 20}}>No fluff. Just motion.</h2>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 24}}>
            {steps.map((s, i) => {
              const p = rise(frame, i * 8);
              return (
                <div key={s} style={{display: 'flex', alignItems: 'center', gap: 14}}>
                  <div
                    style={{
                      border: '1px solid rgba(255,255,255,0.22)',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.02)',
                      color: '#efefef',
                      fontFamily: '"IBM Plex Mono", monospace',
                      letterSpacing: 2,
                      fontSize: 28,
                      padding: '14px 22px',
                      transform: `translateY(${(1 - p) * 18}px)`,
                      opacity: p,
                    }}
                  >
                    {s}
                  </div>
                  {i < steps.length - 1 ? <div style={{color: '#d7d7d7', fontSize: 28, opacity: p}}>→</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, SCENE.cta);
  const swell = interpolate(frame, [0, SCENE.cta - 1], [0.95, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity}}>
      <div style={shell(0.2)} />
      <div style={vignette} />

      <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: '0 140px'}}>
        <div>
          <MonoCard style={{padding: 12, display: 'inline-block', transform: `scale(${swell})`}}>
            <Img src={logoPrimary} style={{width: 180, borderRadius: 4, filter: 'grayscale(1) contrast(1.08)'}} />
          </MonoCard>
          <h2 style={{...title, fontSize: 80, marginTop: 18}}>Start Building</h2>
          <p style={{...body, fontSize: 32, marginTop: 10}}>CLI or GUI — you choose.</p>
          <div style={{...labelStyle, marginTop: 22, fontSize: 20, padding: '12px 24px'}}>GET STARTED →</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const KronosChamberPromo: React.FC = () => {
  const {durationInFrames} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: '#050506'}}>
      <Audio
        src={staticFile('music/dark-ambient-bed.mp3')}
        volume={(f) =>
          interpolate(f, [0, 60, durationInFrames - 90, durationInFrames - 1], [0, 0.42, 0.42, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE.intro}>
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({durationInFrames: transitionFrames})}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE.hook}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({durationInFrames: transitionFrames})}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE.tui}>
          <TUIScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({direction: 'from-left'})}
          timing={linearTiming({durationInFrames: transitionFrames})}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE.desktop}>
          <DesktopScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({direction: 'from-bottom'})}
          timing={linearTiming({durationInFrames: transitionFrames})}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE.features}>
          <FeaturesScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({durationInFrames: transitionFrames})}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE.cli}>
          <CLIScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({direction: 'from-right'})}
          timing={linearTiming({durationInFrames: transitionFrames})}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE.proof}>
          <ProofScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({durationInFrames: transitionFrames})}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE.flow}>
          <FlowScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({direction: 'from-right'})}
          timing={linearTiming({durationInFrames: transitionFrames})}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE.cta}>
          <CtaScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};