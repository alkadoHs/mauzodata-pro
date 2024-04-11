import { ReactNode } from "react";

export function Heading4({ children, ...props }: { children: ReactNode}) {
    return (
        <h4 { ...props}  className="scroll-m-20 text-xl font-semibold tracking-tight">
            {children}
        </h4>
    );
}
