import React from 'react';
import {
  RiArrowRightLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiUserSettingsLine,
  RiCloudLine,
  RiMessage3Line,
  RiSparklingLine,
  RiSmartphoneLine,
  RiComputerLine,
  RiDiscordLine,
  RiTelegramLine,
  RiWhatsappLine,
  RiLightbulbFlashLine,
  RiShieldCheckLine,
  RiArrowDropDownLine,
  RiRefreshLine,
} from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// QR Code component (uses canvas to render)
const QRCodeCanvas = ({ data, size = 200 }: { data: string; size?: number }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    // Simple QR code rendering (fallback - in production use qrcode library)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // For now, create a placeholder - in production would use actual QR library
    canvas.width = size;
    canvas.height = size;

    // Draw a simple placeholder pattern
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw some "QR-like" patterns for visual effect
    ctx.fillStyle = '#000000';

    // Corner patterns
    const drawCorner = (x: number, y: number) => {
      ctx!.fillRect(x, y, 20, 20);
      ctx!.fillRect(x + 3, y + 3, 14, 14);
      ctx!.fillStyle = '#ffffff';
      ctx!.fillRect(x + 6, y + 6, 8, 8);
      ctx!.fillStyle = '#000000';
      ctx!.fillRect(x + 8, y + 8, 4, 4);
    };

    drawCorner(10, 10);
    drawCorner(size - 30, 10);
    drawCorner(10, size - 30);

    // Random data pattern
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * (size - 40) + 20;
      const y = Math.random() * (size - 40) + 20;
      const s = Math.random() * 4 + 2;
      ctx.fillRect(x, y, s, s);
    }
  }, [data, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
};

// Step types
type OnboardingStep = 'welcome' | 'setup-type' | 'provider' | 'channels' | 'mobile-pairing' | 'complete';

interface OnboardingData {
  setupType: 'local' | 'remote' | null;
  provider: string;
  channels: string[];
  mobilePaired: boolean;
}

const STEPS: { id: OnboardingStep; title: string; description: string }[] = [
  { id: 'welcome', title: 'Welcome to kronosChamber', description: 'Your AI-powered desktop assistant' },
  { id: 'setup-type', title: 'Setup Type', description: 'Choose how you want to run kronosChamber' },
  { id: 'provider', title: 'AI Provider', description: 'Select your preferred AI provider' },
  { id: 'channels', title: 'Messaging Channels', description: 'Connect your favorite apps' },
  { id: 'mobile-pairing', title: 'Mobile Pairing', description: 'Control kronosChamber from your phone' },
  { id: 'complete', title: 'All Done!', description: 'You\'re ready to start' },
];

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic Claude', icon: '🧠', description: 'Most capable, best reasoning' },
  { id: 'openai', name: 'OpenAI', icon: '⚡', description: 'Fast, great code generation' },
  { id: 'google', name: 'Google Gemini', icon: '🔮', description: 'Excellent multimodal' },
  { id: 'ollama', name: 'Ollama', icon: '🦙', description: 'Run models locally' },
];

const CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: RiWhatsappLine, color: 'bg-green-500' },
  { id: 'telegram', name: 'Telegram', icon: RiTelegramLine, color: 'bg-blue-500' },
  { id: 'discord', name: 'Discord', icon: RiDiscordLine, color: 'bg-indigo-500' },
];

// Welcome Step
const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
  <div className="flex flex-col items-center text-center py-8">
    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/80 via-primary to-primary/60 flex items-center justify-center mb-6 shadow-2xl shadow-primary/30">
      <span className="text-5xl">🦞</span>
    </div>
    <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
      kronosChamber
    </h2>
    <p className="text-muted-foreground text-lg mb-8 max-w-md">
      Your personal AI assistant that lives on your computer. Control it from anywhere - terminal, phone, or web.
    </p>

    <div className="flex flex-col gap-3 mb-8">
      <div className="flex items-center gap-3 text-sm">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <RiCheckLine className="w-4 h-4 text-green-500" />
        </div>
        <span className="text-muted-foreground">Full desktop control</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <RiCheckLine className="w-4 h-4 text-green-500" />
        </div>
        <span className="text-muted-foreground">Connect via WhatsApp, Telegram, Discord</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <RiCheckLine className="w-4 h-4 text-green-500" />
        </div>
        <span className="text-muted-foreground">Run 24/7 in the background</span>
      </div>
    </div>

    <Button size="lg" onClick={onNext} className="gap-2 px-8">
      Get Started <RiArrowRightLine className="w-5 h-5" />
    </Button>
  </div>
);

// Setup Type Step
const SetupTypeStep = ({ data, onUpdate, onNext, onBack }: {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) => (
  <div className="py-6">
    <h3 className="text-xl font-semibold text-center mb-6">How do you want to run kronosChamber?</h3>

    <div className="grid gap-4 max-w-lg mx-auto">
      <button
        onClick={() => onUpdate({ setupType: 'local' })}
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
          data.setupType === 'local'
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50 hover:bg-primary/5',
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <RiComputerLine className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">Local</h4>
          <p className="text-sm text-muted-foreground">Run on this computer (recommended)</p>
        </div>
        {data.setupType === 'local' && (
          <RiCheckLine className="w-5 h-5 text-primary" />
        )}
      </button>

      <button
        onClick={() => onUpdate({ setupType: 'remote' })}
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
          data.setupType === 'remote'
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50 hover:bg-primary/5',
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <RiCloudLine className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">Remote Server</h4>
          <p className="text-sm text-muted-foreground">Connect to a remote instance</p>
        </div>
        {data.setupType === 'remote' && (
          <RiCheckLine className="w-5 h-5 text-primary" />
        )}
      </button>
    </div>

    <div className="flex justify-between mt-8 max-w-lg mx-auto">
      <Button variant="ghost" onClick={onBack}>
        <RiArrowLeftLine className="w-4 h-4 mr-2" /> Back
      </Button>
      <Button onClick={onNext} disabled={!data.setupType}>
        Continue <RiArrowRightLine className="w-4 h-4 ml-2" />
      </Button>
    </div>
  </div>
);

// Provider Step
const ProviderStep = ({ data, onUpdate, onNext, onBack }: {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) => (
  <div className="py-6">
    <h3 className="text-xl font-semibold text-center mb-2">Choose your AI provider</h3>
    <p className="text-center text-muted-foreground mb-6">This will power your AI assistant</p>

    <div className="grid gap-3 max-w-lg mx-auto">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          onClick={() => onUpdate({ provider: provider.id })}
          className={cn(
            'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
            data.provider === provider.id
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-primary/5',
          )}
        >
          <span className="text-3xl">{provider.icon}</span>
          <div className="flex-1">
            <h4 className="font-medium">{provider.name}</h4>
            <p className="text-sm text-muted-foreground">{provider.description}</p>
          </div>
          {data.provider === provider.id && (
            <RiCheckLine className="w-5 h-5 text-primary" />
          )}
        </button>
      ))}
    </div>

    <div className="flex justify-between mt-8 max-w-lg mx-auto">
      <Button variant="ghost" onClick={onBack}>
        <RiArrowLeftLine className="w-4 h-4 mr-2" /> Back
      </Button>
      <Button onClick={onNext} disabled={!data.provider}>
        Continue <RiArrowRightLine className="w-4 h-4 ml-2" />
      </Button>
    </div>
  </div>
);

// Channels Step
const ChannelsStep = ({ data, onUpdate, onNext, onBack }: {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) => {
  const toggleChannel = (channelId: string) => {
    const channels = data.channels.includes(channelId)
      ? data.channels.filter(c => c !== channelId)
      : [...data.channels, channelId];
    onUpdate({ channels });
  };

  return (
    <div className="py-6">
      <h3 className="text-xl font-semibold text-center mb-2">Connect messaging channels</h3>
      <p className="text-center text-muted-foreground mb-6">
        Control kronosChamber from your favorite apps (optional)
      </p>

      <div className="grid gap-3 max-w-lg mx-auto">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon;
          const isSelected = data.channels.includes(channel.id);

          return (
            <button
              key={channel.id}
              onClick={() => toggleChannel(channel.id)}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5',
              )}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', channel.color)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{channel.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Message kronosChamber from {channel.name}
                </p>
              </div>
              <div className={cn(
                'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
                isSelected ? 'border-primary bg-primary' : 'border-border',
              )}>
                {isSelected && <RiCheckLine className="w-4 h-4 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        You can always add more channels later in Settings
      </p>

      <div className="flex justify-between mt-8 max-w-lg mx-auto">
        <Button variant="ghost" onClick={onBack}>
          <RiArrowLeftLine className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext}>
          Continue <RiArrowRightLine className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Mobile Pairing Step (with QR code)
const MobilePairingStep = ({ data, onUpdate, onNext, onBack }: {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}) => {
  const [setupCode] = React.useState(() =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
  const [pairingUrl] = React.useState(() =>
    `kronoschamber://pair?code=${setupCode}`
  );

  return (
    <div className="py-6">
      <h3 className="text-xl font-semibold text-center mb-2">Pair your phone</h3>
      <p className="text-center text-muted-foreground mb-6">
        Control kronosChamber from your mobile device
      </p>

      <div className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-2xl shadow-xl mb-6">
          <QRCodeCanvas data={pairingUrl} size={200} />
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground mb-2">Or enter this code:</p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-3xl font-mono font-bold tracking-widest">
              {setupCode.match(/.{1,4}/g)?.join('-')}
            </code>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 max-w-sm">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <RiSmartphoneLine className="w-4 h-4" />
            How to pair:
          </h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Download kronosChamber mobile app</li>
            <li>Open the app and tap "Pair"</li>
            <li>Scan the QR code or enter the code</li>
          </ol>
        </div>

        <Button
          variant="outline"
          className="mt-6"
          onClick={() => onUpdate({ mobilePaired: true })}
        >
          <RiRefreshLine className="w-4 h-4 mr-2" />
          Refresh Code
        </Button>
      </div>

      <div className="flex justify-between mt-8 max-w-lg mx-auto">
        <Button variant="ghost" onClick={onBack}>
          <RiArrowLeftLine className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext}>
          Skip for now <RiArrowRightLine className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

// Complete Step
const CompleteStep = ({ onFinish }: { onFinish: () => void }) => (
  <div className="py-8">
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
        <RiCheckLine className="w-10 h-10 text-green-500" />
      </div>

      <h2 className="text-2xl font-bold mb-3">You're all set!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        kronosChamber is ready to use. Start chatting with your AI assistant now.
      </p>

      <div className="grid gap-3 w-full max-w-sm mb-8">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <RiMessage3Line className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm">Use the chat to control your computer</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <RiSparklingLine className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm">AI will help automate tasks</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <RiShieldCheckLine className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm">Your data stays on your machine</span>
        </div>
      </div>

      <Button size="lg" onClick={onFinish} className="px-8">
        Start Using kronosChamber
      </Button>
    </div>
  </div>
  );

// Main Wizard Component
interface VisualOnboardingWizardProps {
  onComplete: () => void;
}

export function VisualOnboardingWizard({ onComplete }: VisualOnboardingWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [data, setData] = React.useState<OnboardingData>({
    setupType: null,
    provider: '',
    channels: [],
    mobilePaired: false,
  });

  const currentStep = STEPS[currentStepIndex];

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Save settings here
    onComplete();
  };

  // Render step content
  const renderStep = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} />;
      case 'setup-type':
        return <SetupTypeStep data={data} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />;
      case 'provider':
        return <ProviderStep data={data} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />;
      case 'channels':
        return <ChannelsStep data={data} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />;
      case 'mobile-pairing':
        return <MobilePairingStep data={data} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />;
      case 'complete':
        return <CompleteStep onFinish={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => index < currentStepIndex && setCurrentStepIndex(index)}
                disabled={index >= currentStepIndex}
                className={cn(
                  'w-3 h-3 rounded-full transition-all',
                  index < currentStepIndex
                    ? 'bg-primary cursor-pointer'
                    : index === currentStepIndex
                      ? 'bg-primary ring-4 ring-primary/30'
                      : 'bg-muted-foreground/30',
                )}
              />
              {index < STEPS.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5',
                  index < currentStepIndex ? 'bg-primary' : 'bg-muted-foreground/20',
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-background/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <h1 className="text-2xl font-bold text-center">{currentStep.title}</h1>
            <p className="text-center text-muted-foreground">{currentStep.description}</p>
          </div>

          {/* Content */}
          <div className="px-8 pb-8">
            {renderStep()}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          kronosChamber • Your AI Desktop Assistant
        </p>
      </div>
    </div>
  );
}

export default VisualOnboardingWizard;
