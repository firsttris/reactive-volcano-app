import { FiChevronDown } from "solid-icons/fi";
import { createSignal, type JSX } from "solid-js";
import { styled } from "solid-styled-components";

export const Card = styled("div")`
  max-width: 600px;
  margin: 20px auto;
  padding: 24px;
  background: var(--secondary-bg);
  border-radius: 16px;
  border: 1px solid var(--border-color);

  @media (max-width: 375px) {
    padding: 16px;
  }
`;

export const CardTitle = styled("h2")`
  color: var(--accent-color);
  font-size: 1.5rem;
  margin: 0 0 24px;
  text-align: center;
  font-family: CustomFont;
`;

const Details = styled("details")`
  &[open] > summary svg {
    transform: rotate(180deg);
  }
`;

const Summary = styled("summary")`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  list-style: none;
  color: var(--accent-color);
  font-size: 1.5rem;
  font-family: CustomFont;

  &::-webkit-details-marker {
    display: none;
  }

  svg {
    transition: transform 0.2s ease;
  }
`;

const Body = styled("div")`
  margin-top: 24px;
`;

const readOpen = (key: string, fallback: boolean) => {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored === "true";
  } catch {
    return fallback;
  }
};

interface CollapsibleCardProps {
  title: string;
  /** Remembers whether the card was open between visits */
  storageKey: string;
  defaultOpen?: boolean;
  children: JSX.Element;
}

export const CollapsibleCard = (props: CollapsibleCardProps) => {
  const key = `collapsible:${props.storageKey}`;
  const [open, setOpen] = createSignal(readOpen(key, !!props.defaultOpen));

  const handleToggle = (event: Event) => {
    const isOpen = (event.currentTarget as HTMLDetailsElement).open;
    setOpen(isOpen);
    try {
      localStorage.setItem(key, String(isOpen));
    } catch {
      // Storage can be unavailable (private mode); the card still works
    }
  };

  return (
    <Card>
      <Details open={open()} onToggle={handleToggle}>
        <Summary>
          {props.title}
          <FiChevronDown size={20} />
        </Summary>
        <Body>{props.children}</Body>
      </Details>
    </Card>
  );
};
