"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Bill } from "@/context/data-context"

interface JobNumberSelectProps {
    bills: Bill[]
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    emptyText?: string
    className?: string
}

export const JobNumberSelect = React.forwardRef<HTMLButtonElement, JobNumberSelectProps>(({
    bills,
    value,
    onValueChange,
    placeholder = "Select job number...",
    emptyText = "No job number found.",
    className,
}, ref) => {
    const [open, setOpen] = React.useState(false)

    // Filter out bills without a job number and ensure uniqueness
    const validBills = React.useMemo(() => {
        const unique = new Map<string, Bill>();
        bills.forEach(bill => {
            if (bill.jobNumber && bill.jobNumber.trim() !== '') {
                unique.set(bill.jobNumber, bill);
            }
        });
        return Array.from(unique.values()).sort((a, b) => 
            a.jobNumber!.localeCompare(b.jobNumber!)
        );
    }, [bills]);

    const displayValue = React.useMemo(() => {
        if (!value) return placeholder;
        const selected = validBills.find((b) => b.id === value);
        return selected ? `${selected.jobNumber} - ${selected.companyName}` : placeholder;
    }, [value, validBills, placeholder]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    ref={ref}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between font-normal bg-white dark:bg-slate-950",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <span className="truncate">{displayValue}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search job number..." />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {validBills.map((bill) => (
                                <CommandItem
                                    key={bill.id}
                                    value={bill.jobNumber + ' ' + bill.companyName}
                                    onSelect={() => {
                                        onValueChange(bill.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === bill.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{bill.jobNumber}</span>
                                        <span className="text-xs text-muted-foreground">{bill.companyName}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
})

JobNumberSelect.displayName = "JobNumberSelect"
