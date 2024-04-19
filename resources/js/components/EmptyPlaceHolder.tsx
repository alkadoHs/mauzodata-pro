import { Cable } from "lucide-react";
import React from "react";

const EmptyPlaceHolder = ({ message }: { message: string }) => {
    return (
        <div className="flex justify-center items-center h-52">
            <div className="grid justify-center gap-2">
                <p className="flex justify-center">
                    <Cable className="size-20 text-muted-foreground" />
                </p>
                <p className="text-xl text-muted-foreground">{message}</p>
            </div>
        </div>
    );
};

export default EmptyPlaceHolder;
