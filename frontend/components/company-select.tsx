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

export interface CompanyOption {
    id: string
    name: string
}

interface CompanySelectProps {
    companies: CompanyOption[]
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    emptyText?: string
    className?: string
    showAllOption?: boolean
    allOptionLabel?: string
}

export const CompanySelect = React.forwardRef<HTMLButtonElement, CompanySelectProps>(({
    companies,
    value,
    onValueChange,
    placeholder = "Select company...",
    emptyText = "No company found.",
    className,
    showAllOption = false,
    allOptionLabel = "-- All Companies --"
}, ref) => {
    const [open, setOpen] = React.useState(false)

    const selectedCompany = React.useMemo(() => {
        if (showAllOption && value === "all") return { id: "all", name: allOptionLabel }
        return companies.find((c) => String(c.id) === String(value))
    }, [companies, value, showAllOption, allOptionLabel])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    ref={ref}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-white dark:bg-slate-950 border-border/50 font-normal", className)}
                >
                    <span className="truncate">
                        {selectedCompany ? selectedCompany.name : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command className="w-full">
                    <CommandInput placeholder={`Search...`} className="h-9" />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {showAllOption && (
                                <CommandItem
                                    value="all"
                                    onSelect={() => {
                                        onValueChange("all")
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === "all" ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {allOptionLabel}
                                </CommandItem>
                            )}
                            {companies.map((company) => (
                                <CommandItem
                                    key={company.id}
                                    value={company.name}
                                    onSelect={() => {
                                        onValueChange(String(company.id))
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            String(value) === String(company.id) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {company.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
})

CompanySelect.displayName = "CompanySelect"
