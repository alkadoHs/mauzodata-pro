import ReactDOMServer from "react-dom/server";
import { createInertiaApp } from "@inertiajs/react";
import createServer from "@inertiajs/react/server";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { route } from "../../vendor/tightenco/ziggy";

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => `${title} - ${appName}`,
        resolve: (name) =>
            resolvePageComponent(
                `./Pages/${name}.tsx`,
                import.meta.glob("./Pages/**/*.tsx")
            ),
        setup: ({ App, props }) => {
            // Bind the global route() helper to this request's Ziggy config so
            // server-rendered components resolve URLs against the right location.
            const ziggy = page.props.ziggy as {
                location: string;
                [key: string]: unknown;
            };

            global.route = ((
                name?: string,
                params?: unknown,
                absolute?: boolean
            ) =>
                (route as CallableFunction)(name, params, absolute, {
                    ...ziggy,
                    location: new URL(ziggy.location),
                })) as unknown as typeof route;

            return <App {...props} />;
        },
    })
);
