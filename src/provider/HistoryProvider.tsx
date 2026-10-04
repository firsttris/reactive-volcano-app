import { type Accessor, createContext, type JSX, useContext } from "solid-js";
import { saveToDB, useIndexedDB } from "../hooks/utils/useIndexedDB";
import { addSession, type Session } from "../utils/sessionHistory";

interface HistoryContextType {
  sessions: Accessor<Session[]>;
  add: (session: Session) => void;
  clear: () => void;
}

const STORAGE_KEY = "sessionHistory";

const HistoryContext = createContext<HistoryContextType>();

/** Recorded heater sessions of all devices, kept in IndexedDB */
export const HistoryProvider = (props: { children: JSX.Element }) => {
  const [sessions, setSessions] = useIndexedDB<Session[]>(STORAGE_KEY, []);
  return (
    <HistoryContext.Provider
      value={{
        sessions,
        add: (session) => setSessions((prev) => addSession(prev, session)),
        clear: () => {
          setSessions([]);
          // useIndexedDB skips saving the default value, so store it here
          saveToDB(STORAGE_KEY, []).catch((error) =>
            console.error("Clearing the session history failed:", error)
          );
        },
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
