import RotateCcw from "lucide-solid/icons/rotate-ccw";
import { m } from "../paraglide/messages";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

/** Destructive button that asks for confirmation before resetting */
export const FactoryReset = (props: { onReset: () => void }) => (
  <div class="px-4 py-3.5">
    <AlertDialog>
      <AlertDialogTrigger
        as={Button}
        variant="outline"
        class="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <RotateCcw />
        {m.settings_factoryReset()}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.settings_factoryReset()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.settings_factoryResetConfirm()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose variant="outline">
            {m.common_cancel()}
          </AlertDialogClose>
          <AlertDialogClose
            variant="destructive"
            onClick={() => props.onReset()}
          >
            {m.common_reset()}
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
