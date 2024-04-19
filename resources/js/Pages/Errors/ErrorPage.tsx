import { url } from "inspector";

export default function ErrorPage({ status }: { status: number }) {
    const title = {
        503: "503: Service Unavailable",
        500: "500: Server Error",
        404: "404: Page Not Found",
        403: "403: Forbidden",
    }[status];

    const description = {
        503: "Sorry, we are doing some maintenance. Please check back soon.",
        500: "Sorry it looks like something isn't okay, please try again.",
        404: "Sorry, the page you are looking for could not be found.",
        403: "Sorry, you are forbidden from accessing this page.",
    }[status];

    return (
        <div className="h-dvh flex flex-col items-center content-center justify-center text-center">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                {title}
            </h1>
            <p className="text-xl text-muted-foreground">
                {description}
            </p>
        </div>
    );
}
