import React from 'react';
import {
  RiCloudLine,
  RiAddLine,
  RiCloseLine,
  RiLoader4Line,
  RiCheckLine,
  RiErrorWarningLine,
  RiTimeLine,
  RiCpuLine,
  RiDeleteBinLine,
  RiRestartLine,
} from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// VM types available
export interface VmType {
  id: string;
  name: string;
  description: string;
  cpu: number;
  memory: number;
  pricePerHour: number;
}

const VM_TYPES: VmType[] = [
  {
    id: 'ubuntu-22.04',
    name: 'Ubuntu 22.04',
    description: 'Standard Ubuntu development environment',
    cpu: 2,
    memory: 4,
    pricePerHour: 0.05,
  },
  {
    id: 'ubuntu-22.04-power',
    name: 'Ubuntu 22.04 (Power)',
    description: 'High performance Ubuntu',
    cpu: 4,
    memory: 8,
    pricePerHour: 0.10,
  },
  {
    id: 'fedora-40',
    name: 'Fedora 40',
    description: 'Fedora Linux development environment',
    cpu: 2,
    memory: 4,
    pricePerHour: 0.05,
  },
  {
    id: 'windows-11',
    name: 'Windows 11',
    description: 'Windows development environment',
    cpu: 2,
    memory: 4,
    pricePerHour: 0.15,
  },
];

// VM instance state
interface VmInstance {
  id: string;
  name: string;
  type: VmType;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  createdAt: number;
  connectionUrl?: string;
  ip?: string;
}

// VM spawning settings
interface VmSpawnerProps {
  className?: string;
}

export function VmSpawner({ className }: VmSpawnerProps) {
  const [instances, setInstances] = React.useState<VmInstance[]>([]);
  const [selectedType, setSelectedType] = React.useState<VmType>(VM_TYPES[0]);
  const [customName, setCustomName] = React.useState('');
  const [isSpawning, setIsSpawning] = React.useState(false);

  // Simulate VM spawning
  const spawnVm = async () => {
    if (!selectedType) return;

    setIsSpawning(true);
    const id = `vm-${Date.now()}`;
    const name = customName || `${selectedType.name}-${id.slice(-4)}`;

    const newInstance: VmInstance = {
      id,
      name,
      type: selectedType,
      status: 'starting',
      createdAt: Date.now(),
    };

    setInstances(prev => [...prev, newInstance]);

    try {
      // Simulate VM startup
      await new Promise(resolve => setTimeout(resolve, 3000));

      setInstances(prev =>
        prev.map(vm =>
          vm.id === id
            ? {
                ...vm,
                status: 'running',
                connectionUrl: `wss://${id}.e2b.dev`,
                ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
              }
            : vm
        )
      );
    } catch (error) {
      setInstances(prev =>
        prev.map(vm =>
          vm.id === id ? { ...vm, status: 'error' } : vm
        )
      );
    } finally {
      setIsSpawning(false);
      setCustomName('');
    }
  };

  const stopVm = async (id: string) => {
    setInstances(prev =>
      prev.map(vm => vm.id === id ? { ...vm, status: 'stopping' } : vm)
    );

    await new Promise(resolve => setTimeout(resolve, 1500));

    setInstances(prev =>
      prev.map(vm => vm.id === id ? { ...vm, status: 'stopped' } : vm)
    );
  };

  const deleteVm = (id: string) => {
    setInstances(prev => prev.filter(vm => vm.id !== id));
  };

  const restartVm = async (id: string) => {
    await stopVm(id);
    await new Promise(resolve => setTimeout(resolve, 500));
    setInstances(prev =>
      prev.map(vm => vm.id === id ? { ...vm, status: 'starting' } : vm)
    );
    await new Promise(resolve => setTimeout(resolve, 2000));
    setInstances(prev =>
      prev.map(vm => vm.id === id ? { ...vm, status: 'running' } : vm)
    );
  };

  const getStatusBadge = (status: VmInstance['status']) => {
    switch (status) {
      case 'starting':
        return <Badge variant="secondary" className="gap-1"><RiLoader4Line className="w-3 h-3 animate-spin" /> Starting</Badge>;
      case 'running':
        return <Badge variant="default" className="gap-1 bg-green-500"><RiCheckLine className="w-3 h-3" /> Running</Badge>;
      case 'stopping':
        return <Badge variant="secondary" className="gap-1"><RiLoader4Line className="w-3 h-3 animate-spin" /> Stopping</Badge>;
      case 'stopped':
        return <Badge variant="outline" className="gap-1"><RiTimeLine className="w-3 h-3" /> Stopped</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><RiErrorWarningLine className="w-3 h-3" /> Error</Badge>;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <RiCloudLine className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold">VM Spawner</h3>
          <p className="text-sm text-muted-foreground">
            Spin up ephemeral development environments
          </p>
        </div>
      </div>

      {/* Spawn form */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-4">
        <h4 className="font-medium text-sm">Launch new VM</h4>

        {/* VM Type selection */}
        <div className="grid gap-2">
          {VM_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type)}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-all text-left',
                selectedType.id === type.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50',
              )}
            >
              <div>
                <div className="font-medium text-sm">{type.name}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RiCpuLine className="w-3 h-3" /> {type.cpu} CPU
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RiCloudLine className="w-3 h-3" /> {type.memory} GB
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Custom name */}
        <Input
          placeholder="VM name (optional)"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
        />

        {/* Price info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estimated cost</span>
          <span>${selectedType.pricePerHour}/hour</span>
        </div>

        {/* Spawn button */}
        <Button
          className="w-full gap-2"
          onClick={spawnVm}
          disabled={isSpawning}
        >
          {isSpawning ? (
            <>
              <RiLoader4Line className="w-4 h-4 animate-spin" />
              Spawning VM...
            </>
          ) : (
            <>
              <RiAddLine className="w-4 h-4" />
              Launch VM
            </>
          )}
        </Button>
      </div>

      {/* Active instances */}
      {instances.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Active Instances</h4>
          {instances.map((vm) => (
            <div
              key={vm.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50"
            >
              <div className="flex items-center gap-3">
                {getStatusBadge(vm.status)}
                <div>
                  <div className="font-medium text-sm">{vm.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {vm.type.name} • {vm.ip || 'Connecting...'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {vm.status === 'running' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => restartVm(vm.id)}>
                      <RiRestartLine className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => stopVm(vm.id)}>
                      <RiCloseLine className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={() => deleteVm(vm.id)}>
                  <RiDeleteBinLine className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VmSpawner;
