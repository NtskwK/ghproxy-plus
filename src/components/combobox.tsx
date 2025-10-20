import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { FormControl } from "./ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useFormContext } from "react-hook-form";
import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  getter: { value: string };
  options: ComboboxOption[];
  setter: (value: string) => void;
  defaultValue?: string;
}

const Combobox: React.FC<ComboboxProps> = ({
  getter,
  options,
  setter,
  defaultValue = "None",
}) => {
  const [open, setOpen] = React.useState(false);

  let shouldUseFormControl = false;
  try {
    const context = useFormContext();
    shouldUseFormControl = context != null;
  } catch {
    shouldUseFormControl = false;
  }

  const buttonElement = (
    <Button
      variant="outline"
      role="combobox"
      className={cn(
        "w-full justify-between",
        !getter.value && "text-muted-foreground",
      )}
      onClick={() => setOpen(true)}
    >
      {getter.value
        ? options.find((item) => item.value === getter.value)?.label
        : defaultValue}
      <ChevronsUpDown className="opacity-50" />
    </Button>
  );

  return (
    <>
      <Popover open={open}>
        <PopoverTrigger asChild>
          {shouldUseFormControl ? (
            <FormControl>{buttonElement}</FormControl>
          ) : (
            buttonElement
          )}
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tag..." className="h-9" />
            <CommandList>
              <CommandEmpty>No found.</CommandEmpty>
              <CommandGroup>
                {options.map((item) => (
                  <CommandItem
                    value={item.label}
                    key={item.value}
                    onSelect={() => {
                      setter(item.value);
                      setOpen(false);
                    }}
                  >
                    {item.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        item.value === getter.value
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default Combobox;
