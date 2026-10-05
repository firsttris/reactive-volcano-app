import {
  type Accessor,
  createContext,
  createMemo,
  type JSX,
  useContext,
} from "solid-js";
import { useIndexedDB } from "../hooks/utils/useIndexedDB";
import {
  addSession,
  type Session,
  sanitizeSession,
} from "../utils/sessionHistory";

interface HistoryContextType {
  sessions: Accessor<Session[]>;
  add: (session: Session) => void;
  clear: () => void;
}

const STORAGE_KEY = "sessionHistory";

const HistoryContext = createContext<HistoryContextType>();

/** Recorded heater sessions of all devices, kept in IndexedDB */
export const HistoryProvider = (props: { children: JSX.Element }) => {
  const [stored, setSessions] = useIndexedDB<Session[]>(STORAGE_KEY, []);
  const sessions = createMemo(() => stored().map(sanitizeSession));
  return (
    <HistoryContext.Provider
      value={{
        sessions,
        add: (session) => setSessions((prev) => addSession(prev, session)),
        clear: () => setSessions([]),
      }}
    >
      {props.children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context)
    throw new Error("useHistory must be used within HistoryProvider");
  return context;
};
