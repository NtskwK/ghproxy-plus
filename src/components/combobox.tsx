import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { FormControl } from "./ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
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
  field: { value: string };
  options: ComboboxOption[];
  setter: (value: string) => void;
}

const Combobox: React.FC<ComboboxProps> = ({ field, options, setter }) => {
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-[200px] justify-between",
                !field.value && "text-muted-foreground"
              )}
            >
              {field.value
                ? options.find((item) => item.value === field.value)?.label
                : "Select tag"}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
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
                    }}
                  >
                    {item.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        item.value === field.value ? "opacity-100" : "opacity-0"
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
