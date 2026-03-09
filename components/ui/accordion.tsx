'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItemProps {
  value: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
}

interface AccordionContextType {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(
  undefined
);

export function Accordion({
  children,
  type = 'single',
}: AccordionProps) {
  // Initialize with defaultOpen items from children
  const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
    const initialOpen = new Set<string>();
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props.defaultOpen) {
        initialOpen.add(child.props.value);
      }
    });
    return initialOpen;
  });

  const toggleItem = React.useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(value)) {
          newSet.delete(value);
        } else {
          if (type === 'single') {
            newSet.clear();
          }
          newSet.add(value);
        }
        return newSet;
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className="space-y-2">{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  title,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const context = React.useContext(AccordionContext);

  if (!context) {
    throw new Error('AccordionItem must be used within Accordion');
  }

  const { openItems, toggleItem } = context;
  const isOpen = openItems.has(value);

  return (
    <div className="border rounded-md">
      <button
        onClick={() => toggleItem(value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-sm hover:bg-muted transition-colors cursor-pointer"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="border-t px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
