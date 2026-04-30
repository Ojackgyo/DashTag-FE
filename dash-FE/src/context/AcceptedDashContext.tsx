import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AcceptedDash {
  id: string;
  name: string;
  emoji: string;
  requestMsg: string;
}

interface ContextType {
  acceptedDashes: AcceptedDash[];
  addAccepted: (dash: AcceptedDash) => void;
}

const AcceptedDashContext = createContext<ContextType>({ acceptedDashes: [], addAccepted: () => {} });

export function AcceptedDashProvider({ children }: { children: ReactNode }) {
  const [acceptedDashes, setAcceptedDashes] = useState<AcceptedDash[]>([]);
  const addAccepted = (dash: AcceptedDash) =>
    setAcceptedDashes(prev => prev.some(d => d.id === dash.id) ? prev : [...prev, dash]);
  return (
    <AcceptedDashContext.Provider value={{ acceptedDashes, addAccepted }}>
      {children}
    </AcceptedDashContext.Provider>
  );
}

export function useAcceptedDashes() {
  return useContext(AcceptedDashContext);
}
