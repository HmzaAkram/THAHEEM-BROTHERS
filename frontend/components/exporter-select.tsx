"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
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

export interface ExporterOption {
    id: string
    name: string
}

interface ExporterSelectProps {
    exporters: ExporterOption[]
    value: string // This will be the exporter.name since bills table stores name
    onValueChange: (value: string) => void
    onCreateNew?: (name: string) => void
    placeholder?: string
    className?: string
}

export const ExporterSelect = React.forwardRef<HTMLButtonElement, ExporterSelectProps>(({
    exporters,
    value,
    onValueChange,
    onCreateNew,
    placeholder = "Select exporter...",
    className,
}, ref) => {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

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
                        {value ? value : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command className="w-full">
                    <CommandInput 
                        placeholder={`Search exporters...`} 
                        className="h-9" 
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        <CommandEmpty className="py-2 text-center text-sm">
                            <span className="block mb-2 text-muted-foreground">No exporter found.</span>
                            {onCreateNew && searchQuery.trim().length > 0 && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 gap-1 w-full"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onCreateNew(searchQuery.trim());
                                        setOpen(false);
                                    }}
                                >
                                    <Plus className="h-3 w-3" />
                                    Add "{searchQuery.trim()}"
                                </Button>
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {exporters.map((exporter) => (
                                <CommandItem
                                    key={exporter.id}
                                    value={exporter.name}
                                    onSelect={(currentValue) => {
                                        // command component returns lowercase value if selected by typing, 
                                        // so we use the actual exporter name
                                        onValueChange(exporter.name)
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === exporter.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {exporter.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
})

ExporterSelect.displayName = "ExporterSelect"
