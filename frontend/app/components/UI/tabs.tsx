import * as React from "react";

interface TabsContextType {
  currentValue: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (val: string) => {
    setInternalValue(val);
    onValueChange?.(val);
  };

  const ctx: TabsContextType = React.useMemo(
    () => ({ currentValue, onValueChange: handleChange }),
    [currentValue, onValueChange]
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className || ""}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  const ctx = React.useContext(TabsContext);
  return (
    <div className={className || "flex gap-2 border-b"}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        // Only inject props into known tab triggers
        if (child.type === TabsTrigger && ctx) {
          return React.cloneElement(
            child as React.ReactElement<TabsTriggerProps>,
            {
              currentValue: ctx.currentValue,
              onValueChange: ctx.onValueChange,
            }
          );
        }
        return child;
      })}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  className?: string;
  activeClassName?: string;
  currentValue?: string;
}

export function TabsTrigger({
  value,
  children,
  onValueChange,
  className,
  activeClassName,
  currentValue,
}: TabsTriggerProps) {
  // Use currentValue from parent Tabs for active state
  const isActive = currentValue === value;
  return (
    <button
      type="button"
      className={
        (className ||
          "px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer") +
        (isActive
          ? ` ${
              activeClassName || "border-yellow-600 text-yellow-800 bg-white"
            }`
          : " border-transparent text-white hover:text-slate-700 hover:bg-yellow-100")
      }
      aria-selected={isActive}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  currentValue?: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const ctx = React.useContext(TabsContext);
  if (!ctx || ctx.currentValue !== value) return null;
  return <div className={className || "pt-4"}>{children}</div>;
}
