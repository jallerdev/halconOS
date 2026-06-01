'use client';

import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import * as React from 'react';

import { cn } from '~/lib/utils';

// Atrevida customizado — Command Palette wrapper. CommandPalette container
// vive en _components/CommandPalette.tsx (con DialogPrimitive). Aquí solo
// estilamos los building blocks (Command, Input, List, Group, Item, Empty)
// con la estética del handoff: input grande sin border, items con hover
// accent + selected violet/14.
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex h-full w-full flex-col overflow-hidden text-foreground', className)}
    {...props}
  />
));
Command.displayName = 'Command';

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-[11px] border-b border-border px-[18px] py-[15px]">
    <Search className="size-[18px] shrink-0 text-muted-foreground" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-6 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
    <kbd className="rounded-md border border-border bg-card-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      ESC
    </kbd>
  </div>
));
CommandInput.displayName = 'CommandInput';

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-[60vh] overflow-y-auto overflow-x-hidden p-2', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-[13px] text-muted-foreground" {...props} />
));
CommandEmpty.displayName = 'CommandEmpty';

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden text-foreground [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-muted-foreground',
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-[11px] rounded-[8px] px-2.5 py-2 text-[13.5px] outline-none transition-colors',
      'data-[selected=true]:bg-[hsl(var(--violet))]/14 data-[selected=true]:text-foreground data-[selected=true]:[&_svg]:text-[hsl(var(--violet))]',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };
