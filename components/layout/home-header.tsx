"use client"
import type { FC } from "react";
import { ModeToggle } from "../mode-toggle";
import { Separator } from "../ui/separator";

interface HomerHeaderProps { }

export const HomerHeader: FC<HomerHeaderProps> = () => {

    return (
        <div className="fixed top-0 left-0 right-0 z-50  h-16 flex items-center justify-between container mx-auto px-4">
            <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">Plania</span>
                <Separator orientation="vertical" className="!h-4 bg-muted-foreground" />
                <h1 className="text-md font-medium text-muted-foreground">Planning Poker</h1>
            </div>
            <ModeToggle />
        </div>
    );
}
